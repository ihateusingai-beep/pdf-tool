# PDF 工作站改善計劃書 v3 — 搜尋 / 脫敏 / 浮水印

**版本：** v3
**更新日期：** 2026-06-26
**狀態：** 🚧 規劃中(pair planning,scope 已 confirm)
**前置：** v1.2 (13 個改動) 全部 ✅

---

## 1. 背景

v1.2 解決咗「基本 PDF 加工」(merge / split / convert / batch / image),但**未覆蓋 SEN 教師嘅 daily pain**:

| Pain point | 用戶引述(典型) | v1.2 解決? |
|------------|------------|----------|
| 50 份 IEP 搵「陳小明」嗰份 | 「我而家要逐份開」 | ❌ |
| 評估報告要 share 範本但遮學生名 | 「我而家用黑色 cover 但驚 text 漏出去」 | ❌ |
| 文件要標明「DRAFT」/ 校徽 | 「我用 Word 整 watermark 但轉 PDF 後失真」 | ❌ |
| 掃描 IEP 唔識搜尋 | 「scan 完之後啲字變晒圖」 | ❌ |

v3 聚焦呢 3 條,P0 級。

---

## 2. 已 confirm 嘅 decisions(pair planning 第一輪)

### ✅ OCR 路線
- **比例**:80% 數位 PDF / 20% scan
- **路線**:Hybrid
  - **First try**: PDF.js `getTextContent()` 拎 native text layer(秒到)
  - **Fallback**: Tesseract.js WASM(20% 嘅 scan 文件)
- **唔揀 cloud OCR** — 違反「零外流」stance,IEP 唔可以離機

### ✅ 脫敏 trigger
- **用戶 supply keyword list**(upload `.txt` / `.csv` 學生名單,或者直接 paste 文字)
- **唔做** manual rect select(太慢,SEN 教師一日處理 10+ 份)
- 預設 3 個 HK pattern 識:
  - 身份證:`[A-Z]\d{6}\(\d\)`(例:`A123456(7)`)
  - 學號:`\d{8}`(8 位數字)
  - 電話:`\d{4}\s?\d{4}`(香港 8 位)

### ✅ 浮水印 asset
- **5 個 generic placeholder**(內置,即開即用)
  - 「DRAFT」紅色 diagonal
  - 「CONFIDENTIAL」紅色 diagonal
  - 「COPY」藍色 diagonal
  - 「校內文件」繁中灰
  - 「NOT FOR DISTRIBUTION」紅色
- **用戶 upload 校徽 PNG**(純 optional,將來先做)

---

## 3. Feature 1 — 全文搜尋 + OCR (新 mode「🔍 搜尋」)

### 3.1 Trigger
- 6 個 mode 第 6 個:`merge / split / convert / batch / image / search`
- tab 顏色:slate(中性,功能橫向)

### 3.2 流程

```
① Upload PDF (multi-file)
② Auto-detect: 有 text layer? 
   ├─ Yes → 拎 native text,標記「✓ 已索引」(< 1s)
   └─ No  → 顯示「需要 OCR」,按鈕「啟用 Tesseract」
            ├─ 進度條「處理中 X / Y 頁」+ ETA
            └─ 20 頁約 1-2 分鐘
③ 搜尋框:輸入 keyword(支援 regex toggle)
④ 結果列表:[檔名 / 頁碼 / 上下文 ±50 字 / 跳到該頁]
⑤ 點擊結果 → 新 tab 打開 PDF 跳到該頁(PDF.js viewer)
⑥ 額外:「另存為可搜尋 PDF」→ embed OCR 文字層落原 PDF
```

### 3.3 實作細節

**Text layer 提取**:
```js
async function extractTextLayer(pdfDoc) {
    const pages = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map(item => item.str).join(' ');
        pages.push({ pageNum: i, text });
    }
    return pages;
}
```

**OCR fallback (lazy load)**:
```js
// 只喺 scan PDF 先 import(5MB WASM,延遲載入)
let tesseractWorker = null;
async function getOcrWorker() {
    if (tesseractWorker) return tesseractWorker;
    const Tesseract = await import('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    tesseractWorker = await Tesseract.createWorker(['chi_tra', 'eng']);
    return tesseractWorker;
}
```

**搜尋 indexing**:
- 一次性 in-memory index:`{ filename: [{pageNum, text, offset}] }`
- 簡單 `String.includes()` 已夠(10 份文件 ~2MB text,搜尋 < 10ms)
- 唔揀 lunr.js / flexsearch — over-engineering

**Embed 文字層(可搜尋 PDF export)**:
- 用 pdf-lib 開原 PDF
- `pdf-lib` 冇原生 add text layer API → 用 `pdfjs-dist` 嘅 OCR result 寫入 invisible text annotation
- **方案 B (簡單)**:另存為 `<filename>_searchable.pdf`,內含原圖 + invisible text overlay(用 `drawText` 配 `opacity: 0`)
- **方案 C (最準確)**:用 `pdf-lib` + `fontkit` 直接 modify content stream,work 量大
- **v3 揀方案 B**(夠用,可逆)

### 3.4 UI sketch

```
┌────────────────────────────────────────────┐
│ 🔍 搜尋 PDF                                 │
├────────────────────────────────────────────┤
│ [拖曳 PDF 到呢度 / 點擊選擇]                  │
│                                            │
│ 📁 已上傳 3 個檔案                          │
│   ✓ IEP_陳小明_2024.pdf (5 頁,1.2MB)         │
│   ⏳ 評估報告.pdf (12 頁,需 OCR — 按此啟動)   │
│   ✓ 學習紀錄.pdf (3 頁,0.8MB)                │
│                                            │
│ 搜尋:[陳小明______________] [✓ regex]       │
│                                            │
│ 結果 2 個:                                  │
│   • IEP_陳小明_2024.pdf · 第 2 頁            │
│     「...陳小明 嘅 IEP 目標包括...」         │
│     [跳到該頁] [複製上下文]                   │
│   • 評估報告.pdf · 第 5 頁(OCR 結果)         │
│     「...陳小明 喺數學方面...」              │
│     [跳到該頁]                              │
│                                            │
│ [另存全部為可搜尋 PDF (ZIP)]                  │
└────────────────────────────────────────────┘
```

### 3.5 Boundary
**Out of scope (v3)**:
- ❌ 跨 PDF 全文檢索(只係 per-file list 內)
- ❌ 全文 fuzzy search(只 exact + regex)
- ❌ NLP entity extraction(只 string match)
- ❌ 表格內文字提取(pdf.js table parsing 太 fragile)

---

## 4. Feature 2 — Keyword Redaction (脫敏)

### 4.1 Trigger
- **唔做新 mode** — 加喺「🔍 搜尋」mode 入面(同一個 doc-context workflow)
- 或者加喺「⚙️ 批次加工」tab
- **v3 揀前者**(搜尋出 results 後可以直接 redact 嗰啲 hit)

### 4.2 流程

```
① 開啟「🔍 搜尋」mode
② 揀 file + (optional) 揀 hit list
③ 揀 redaction 模式:
   ├─ A. 自動:用預設 pattern (身份證 / 學號 / 電話)
   ├─ B. 自訂:paste 文字 / upload .txt 學生名單
   └─ C. 兩者皆用
④ Preview:紅色 highlight 顯示將會 redact 嘅位置(可以 uncheck 個別)
⑤ 確認 → 不可逆 dialog:
   ┌──────────────────────────────────────┐
   │ ⚠️ 脫敏操作不可逆                       │
   │                                       │
   │ 此操作會:                              │
   │ • 永久刪除 text layer 內指定字串         │
   │ • 喺 PDF 上畫黑色 rectangle             │
   │ • 清空 Author / Title metadata         │
   │                                       │
   │ ☐ 我確認要 redact 嗰 X 個 keyword     │
   │                                       │
   │ [取消]            [確認 redact]         │
   └──────────────────────────────────────┘
⑥ 輸出 `<filename>_redacted.pdf` 自動下載
```

### 4.3 三層保護實作

```js
async function redactPdf(pdfBytes, keywords) {
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    
    // 1. Visual layer — 黑色 rectangle overlay
    for (const page of pdfDoc.getPages()) {
        const textContent = await page.getTextContent();  // pdf.js
        for (const item of textContent.items) {
            if (keywords.some(kw => item.str.includes(kw))) {
                const { x, y, width, height } = item.transform;
                page.drawRectangle({
                    x, y: y - 2,
                    width, height: height + 4,
                    color: PDFLib.rgb(0, 0, 0),
                });
            }
        }
    }
    
    // 2. Text content — 真正刪走(用 pdf-lib 低階 API 改 content stream)
    // ⚠️ 呢個係 hard part,需要 regex 改 content stream 嘅 Tj / TJ operator
    // v3 嘅 MVP:visual + 警告用戶「用 Adobe 開會見到原文字」
    // v3.1 再做真正 text removal
    
    // 3. Metadata — 清空
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('PDF Workstation (Redacted)');
    pdfDoc.setCreator('PDF Workstation');
    
    return await pdfDoc.save();
}
```

### 4.4 安全級別 (3 級 toggle)

| Level | Visual | Text layer | Metadata |
|-------|--------|------------|----------|
| **L1 視覺** | ✅ 黑色 | ❌ 保留 | ❌ 保留 |
| **L2 標準** | ✅ 黑色 | ✅ 刪走(via re-render) | ✅ 清空 |
| **L3 徹底** | ✅ 黑色 | ✅ 刪走 | ✅ 清空 + flatten(rasterize 整份) |

- **L1**:快(< 1s),但 Adobe 用戶「複製」會見到原字。**只做 demo,唔好喺 production 用**
- **L2**:中速(2-5s),**推薦預設**
- **L3**:慢(10-30s),scan PDF / 高敏感度先揀

### 4.5 Boundary
**Out of scope (v3)**:
- ❌ Image-based 文字 OCR 後 redact(太 fragile,L1 都唔準)
- ❌ 自動 PII detection(ML model 太 heavy,違反 zero-deps)
- ❌ Audit log / redact history(無 backend,做唔到持久記錄)

---

## 5. Feature 3 — Watermark (浮水印)

### 5.1 Trigger
- **Global utility** — header 旁邊加 🖼️ 浮水印 toggle
- **所有 mode 嘅輸出** 都會自動加浮水印
- 唔同 mode 獨立配置(merge 嗰陣用戶決定,convert 嗰陣可以唔同)

### 5.2 5 個 generic placeholder

| ID | 顯示 | 顏色 | 用途 |
|----|------|------|------|
| `DRAFT` | DRAFT | 紅 `#dc2626` | 草稿未完成 |
| `CONFIDENTIAL` | CONFIDENTIAL | 紅 `#dc2626` | 機密 |
| `COPY` | COPY | 藍 `#2563eb` | 副本 |
| `SCHOOL` | 校內文件 | 灰 `#6b7280` | 內部流通 |
| `NO_DIST` | NOT FOR DISTRIBUTION | 紅 `#dc2626` | 禁止外傳 |

### 5.3 設定 panel

```
┌─ 浮水印 ──────────────────────┐
│ 樣式:  [DRAFT ▼]              │
│ 透明度:[====●=========] 25%   │
│ 角度:  [-45° ▼]                │
│ 字體大小:[==●======] 60pt     │
│ ☑ 對角 tiled(傳統抗截圖)      │
│ ☐ 頁面中央(蓋住內容)          │
│ [預覽效果]                     │
│ 校徽: [上傳 PNG ▼] (optional) │
│       (限 v3.1,generic 先行)   │
│                               │
│ ☐ 套用至當前 mode 嘅輸出       │
│   (下次改設定會 reset)         │
└───────────────────────────────┘
```

### 5.4 實作 — 燒入 PDF(rasterized,不可移除)

```js
function applyWatermark(pdfDoc, config) {
    const helveticaFont = pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    
    for (const page of pdfDoc.getPages()) {
        const { width, height } = page.getSize();
        
        if (config.tiled) {
            // 對角 tiled,每 ~200px 一個
            for (let y = 0; y < height; y += 200) {
                for (let x = 0; x < width; x += 300) {
                    page.drawText(config.text, {
                        x, y, size: config.fontSize,
                        font: helveticaFont,
                        color: PDFLib.rgb(...hexToRgb(config.color)),
                        opacity: config.opacity,
                        rotate: PDFLib.degrees(config.angle),
                    });
                }
            }
        } else {
            // 單一中央
            page.drawText(config.text, {
                x: width / 2 - config.text.length * config.fontSize / 3,
                y: height / 2,
                size: config.fontSize,
                font: helveticaFont,
                color: PDFLib.rgb(...hexToRgb(config.color)),
                opacity: config.opacity,
                rotate: PDFLib.degrees(config.angle),
            });
        }
    }
    
    return pdfDoc;
}
```

### 5.5 Boundary
**Out of scope (v3)**:
- ❌ 用戶 upload 校徽 PNG(v3.1 先做)
- ❌ 動態浮水印(例如加入學生名 / 日期)— 靜態先行
- ❌ Selective page 浮水印(只首頁 / 只尾頁)— v3 全部頁

---

## 6. 架構整合

### 6.1 新增 tab / utility

```
header 結構(改):
[📚 PDF 工作站]    [search / 5 mode tabs]    [🌙][🔤][🖼️ 浮水印]

新增:
- tab 6: 🔍 搜尋(slate 顏色)
- header utility: 🖼️ 浮水印(每個 mode 共享)
```

### 6.2 Library 新增

| Library | Size | 用法 | 載入策略 |
|---------|------|------|---------|
| **tesseract.js@5** | 5MB WASM | OCR fallback | Dynamic import(只 scan PDF) |
| **JSZip** | 100KB | 「另存全部為可搜尋 PDF」ZIP | 已有 |
| **pdf-lib** | 1MB | Watermark / Redaction | 已有 |

**冇新 dependency**:
- ❌ lunr.js / flexsearch(in-memory `includes()` 夠用)
- ❌ pdf2json / pdf-parse(用 pdf.js `getTextContent()` 已得)
- ❌ sharp / jimp(watermark 唔需要 rasterize)

### 6.3 效能 budget

| 操作 | 預期時間 | 500 頁文件 |
|------|---------|-----------|
| 數位 PDF 索引(text layer) | 50-200ms / 份 | 1-2s |
| Scan PDF OCR(Tesseract) | 1-2s / 頁 | 8-15 分鐘 |
| 搜尋 keyword | < 50ms | < 100ms |
| Redaction L2 | 2-5s | 30-60s |
| Watermark | 0.5-1s / 頁 | 4-8 分鐘 |

Tesseract.js 慢係 known,UI 要俾**明確 progress + cancel button**。

---

## 7. 風險評估

### 7.1 技術風險

| 風險 | 影響 | 機率 | 緩解 |
|------|------|------|------|
| Tesseract.js 載入慢(5MB) | 首進「搜尋」mode 慢 | 🟡 中 | Loading spinner + 「OCR 需時較長,請耐心等候」提示 |
| Tesseract.js 中文辨識率 ~85% | 搜尋 recall 唔齊 | 🟠 高 | UI 標明「OCR 結果可能有誤,請人手核對」,**唔可以當 truth** |
| Redaction L1 假安全感 | 用戶以為安全但 text 漏 | 🔴 高 | UI 強制 recommend L2,「⚠️ L1 唔安全」紅色 banner |
| Watermark 唔支援中文 | 「校內文件」render 唔到 | 🟡 中 | pdf-lib 內置 font 唔包中文,embed `NotoSansTC.ttf` 4MB(subset) |
| IndexedDB quota(50MB) | session restore 爆 | 🟢 低 | 已有 IndexedDB 邏輯,加 quota check |
| 500 頁 PDF OOM | Browser tab crash | 🟡 中 | 加 page chunking(每 50 頁一批)+ worker thread |
| pdf-lib 唔識 redaction text removal | 只能 L1 | 🟠 高 | **明確告知用戶**,v3.1 先做真正 text removal |
| html2pdf.js 同新 mode 衝突 | Convert mode 唔 work | 🟢 低 | 唔 import html2pdf 到 search mode,獨立 init |

### 7.2 隱私 / 法律風險

| 風險 | 影響 | 緩解 |
|------|------|------|
| 學生姓名 keyword list 上傳 | 用戶誤以為要上傳 | UI 明確:「純 client 處理,keyword list 唔離開 browser」 |
| 紅色 highlight preview 顯示學生姓名 | Screen sharing 畀其他人見到 | 加 toggle「隱藏 preview 內敏感字」(顯示 ●●●) |
| PDF metadata 殘留「Author: 教師名」 | 隱私外洩 | Redaction 預設清空 metadata,**唔可以 skip** |
| Tesseract.js WASM fetch 失敗 | 離線用戶 OCR 唔到 | Pre-bundle Tesseract WASM,fallback CDN 帶 hash |

### 7.3 UX 風險

| 風險 | 影響 | 緩解 |
|------|------|------|
| 6 個 tab 排版更擠 | Mobile 滾動煩 | 沿用 v1.2 `overflow-x-auto` pattern,可能改 dropdown |
| 浮水印 utility panel 太細 | 唔夠位放 slider | 用 popover modal 而非 inline |
| 「不可逆」confirm dialog 太長 | 用戶跳過 | 紅色大掣 + 必須 tick checkbox |

---

## 8. 測試項目

### 8.1 單元 / 整合(手動 QA)

| # | 測試 | 預期 |
|---|------|------|
| 1 | Upload 5 份數位 PDF(無 scan) | < 1s 全部 indexed,標「✓ 已索引」 |
| 2 | Upload 1 份 scan PDF | 顯示「需 OCR」按鈕,click 後 progress 0→100% |
| 3 | 搜尋「陳小明」喺 5 份文件 | 結果 list 顯示 file + page + context |
| 4 | 搜尋 regex `學號:\s*\d{8}` | Match 學號 pattern,正確返回 |
| 5 | Upload 學生名單 .txt + redact 嗰 5 個名 | 5 個名全部黑色 rect 蓋住 |
| 6 | 試 L1 redact → Adobe Reader 開 → 試「複製文字」 | 證明 L1 漏 text(預期) |
| 7 | 試 L2 redact → Adobe Reader 開 → 試「複製文字」 | 證明 L2 唔見 text |
| 8 | 試 L3 redact → 用戶試 highlight 文字 | 證明已經 rasterize,冇 text layer |
| 9 | 加 DRAFT watermark → 下載 → Adobe Reader 開 | 紅色對角 tiled,opacity 25% |
| 10 | 加 DRAFT watermark + 透明度拉到 0% | 完全透明,文件睇唔到 |
| 11 | Merge 5 份 PDF + 啟用 watermark | 每份 PDF 每頁都有 watermark |
| 12 | 黑暗模式 + 6 個 tab | Tailwind class 正常,冇 white select |

### 8.2 效能 / 壓力

| # | 測試 | 預期 |
|---|------|------|
| 13 | 500 頁 PDF OCR | 8-15 分鐘內完成,UI 唔 freeze(cancel button 有效) |
| 14 | 10 份文件同時 indexed | < 5s 完成 index,Memory < 200MB |
| 15 | 50 份文件同時 search | 結果 < 200ms 顯示 |
| 16 | 200 頁 PDF + L3 redact | < 60s 完成 |
| 17 | Tesseract.js 離線載入失敗 | 顯示「OCR 暫時唔可用,請用其他工具先 scan 文字」 |

### 8.3 兼容性

| # | 平台 / 瀏覽器 | 預期 |
|---|--------------|------|
| 18 | Chrome 120+ macOS | 全部 OK |
| 19 | Safari 17+ macOS | Tesseract.js 可能要 polyfill,test |
| 20 | Edge 120+ | 全部 OK |
| 21 | Chrome Android | 6 個 tab 響應式 OK |
| 22 | iPad Safari | 浮水印 panel modal touch 友善 |
| 23 | File:// protocol 開啟 | Tesseract WASM CORS 問題(可能要 blob URL) |
| 24 | GitHub Pages 部署 | Tesseract.js CDN OK |

### 8.4 隱私 / 安全

| # | 測試 | 預期 |
|---|------|------|
| 25 | F12 Network tab — 開「搜尋」+ upload + search | 確認冇外發 request |
| 26 | F12 Network tab — Tesseract.js 載入 | WASM fetch 來源 jsdelivr / unpkg,**唔係其他** |
| 27 | Airplane mode — 全部 mode | 除首次 CDN 載入,其餘正常 |
| 28 | 離線模式試 watermark | 唔受影響(pdf-lib 本地) |
| 29 | Keyword list 處理完 | Memory 內 string clear(防止 devtool 見到) |
| 30 | Redact 完成後 | 冇殘留 keyword 喺 IndexedDB |

### 8.5 邊界 / Error handling

| # | 場景 | 預期行為 |
|---|------|---------|
| 31 | Upload 加密 PDF | 友善錯誤,提示要先解密 |
| 32 | Upload 50MB PDF | IndexedDB quota warning |
| 33 | Upload corrupted PDF | 紅色錯誤 banner,唔 crash |
| 34 | 搜尋空白 keyword | 顯示「請輸入 keyword」 |
| 35 | Redact 0 個 hit | 「冇 match 到任何字串,要唔要調整 keyword?」 |
| 36 | OCR 進行中關分頁 | beforeunload 警告,IndexedDB 保留進度 |
| 37 | Redact 過程中 page render 失敗 | 跳過嗰頁,log warning,繼續 |
| 38 | Watermark 文字太長 | 自動縮 font size 或 wrap |

---

## 9. 交付 milestone

| Phase | Scope | Effort | Commit |
|-------|-------|--------|--------|
| **v3.0a** | Feature 1 (search + OCR) | M | `feat: search mode with hybrid OCR` |
| **v3.0b** | Feature 3 (watermark global) | S | `feat: watermark utility panel` |
| **v3.0c** | Feature 2 (redaction L1 + L2) | M | `feat: keyword redaction with 3 safety levels` |
| **v3.0d** | Polish + dark mode pass + mobile | S | `polish: search/redact/watermark responsive` |
| **v3.1** | User-upload 校徽 + L3 rasterize | L | TBD |

v3.0 預計 4-5 個 commit,1 個完整 release。

---

## 10. 驗收標準(go-live bar)

- [ ] 6 個 mode tab 正常切換
- [ ] 數位 PDF < 1s 索引
- [ ] Scan PDF OCR 有 progress + cancel
- [ ] 搜尋 < 100ms 返回
- [ ] Redaction L2 確認無 text 殘留(Adobe 測試)
- [ ] Watermark 5 個 generic 全部 visible + 透明度 slider 有效
- [ ] 浮水印對所有 mode 嘅輸出都生效
- [ ] 黑暗模式 + 6 tab 無 white select / white input
- [ ] Mobile 6 tab 可橫向 scroll
- [ ] F12 Network 確認零外發
- [ ] IndexedDB session restore 包括 search state
- [ ] Plan_v1.2 嘅 13 個功能冇 regression
- [ ] 30 個測試項目全部 pass

---

## 11. 已知 trade-off(我哋 pair 第二輪可以再傾)

1. **L2 redaction 嘅真正 text removal** — pdf-lib 唔直接支援,要用低階 content stream 改寫。v3 可以做 L1 + L3(rasterize 整份),L2 等 v3.1。你 OK 嗎?
2. **Tesseract.js 中文語言包** — chi_tra + eng 共 ~15MB。要唔要預先 bundle 喺 static folder,定係 lazy fetch?
3. **浮水印 font** — pdf-lib 內置 font 唔包中文,「校內文件」要 embed `NotoSansTC.ttf` subset 4MB,值得嗎?(alternative: 用戶只可以揀英文 generic)
4. **搜尋 mode 獨立 tab vs 喺其他 mode 加 search button** — 我建議獨立 tab(workflow 清晰),你 OK 嗎?

---

**下一步**:我等你 pair 第二輪回應呢 4 個 trade-off question,確認後即寫 code。
