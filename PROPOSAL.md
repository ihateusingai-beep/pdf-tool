# 產品設計與優化提案 — PDF Workstation

> **日期**: 2026-06-29
> **對象**: ~/workspace/vs code/pdf/ — 純前端 SEN 教師 PDF 工具
> **寫作原則**: Grounded in 現有 code(讀咗 index.html) + AGENTS.md scope 鎖定
> **重要**: 每個 feature 都標 status,唔代表 Mavis endorse。User-confirm 先做。

---

## Status 分層定義

| Status | 意思 | Mavis 行為 |
|---|---|---|
| 🟢 **已實作** | 對齊 AGENTS.md 嘅 3 個 P0 scope | 唔使做,只係 point out 已有 |
| 🟡 **Small Enhancement** | Scope 入面,單檔 fix,風險低,可隨時做 | 唔會自動做,要 user 開口先做 |
| 🟠 **Medium Feature** | 仍在 client-side scope 入面,但要 confirm scope + 可能要小 refactor | **要 user 明確 confirm 邊個先** |
| 🔴 **Scope Expansion** | 違反 AGENTS.md 嘅 hard constraint(零後端 / 純 client-side / 學生私隱),或者 major architecture 改動 | **必須 user 推翻 AGENTS.md 先** |

> ⚠️ **本提案係 reference doc,唔係 sprint plan**。Mavis 唔會自己做任何項目。User 想加邊個就 specify 邊個,再逐個 confirm scope。

---

## 1. 新功能開發

### 🟢 已實作(對齊 locked scope)

以下 3 項已喺 codebase 入面,document 化確認就夠:

1. **Hybrid OCR(80% 數位 PDF / 20% scan)** — 已用 PDF.js text layer + Tesseract.js WASM fallback
2. **Keyword Redaction** — 已支援用戶 upload `.txt` keyword list
3. **Watermark** — 已內建 5 個 generic placeholder + 校徽 upload,支援中文(NotoSansTC 子集 + IndexedDB 緩存)

### 🟡 Small Enhancement — Scope 入面,可隨時做

#### F1. **Redaction Preview Diff View** — 改動量 ~1 檔 ~80 行
讓用戶 upload keyword list 之後,**render 一個 side-by-side preview**:原文 vs 脫敏後,keyword 位置用紅色 highlight,confirm 先 download。避免「脫錯咗要重頭嚟」嘅 pain point(generic,而非有 user feedback 證實)。
- **Scope check**: 純前端 preview,唔涉及任何 backend / OCR API
- **Risk**: 低;只係 render 多一個 canvas,唔影響 export 邏輯

#### F2. **OCR 進度條 + 取消按鈕** — 改動量 ~1 檔 ~50 行
20% scan PDF 觸發 Tesseract.js WASM 時,大檔可能跑幾分鐘而 UI 冇 feedback。
- 加 Web Worker cancellation flag
- 顯示「已處理 N / M 頁,預估剩餘時間」
- **Scope check**: 純前端,唔涉及任何 external service
- **Risk**: 低;Tesseract.js 已支援 terminate,但要寫 flag 邏輯

#### F3. **搜尋結果匯出 CSV** — 改動量 ~1 檔 ~40 行
搜尋模式已有 match row list,但冇 export。讓老師將搜尋結果(page / context / keyword)匯出成 CSV 做後續記錄 / 評估。
- **Scope check**: 純前端 Blob + download anchor
- **Risk**: 極低

#### F4. **Keyword list 範本下載** — 改動量 ~1 檔 ~30 行
首次用 keyword redaction 嘅老師未必知格式。提供 `.txt` 範本(一行一個 keyword,UTF-8 BOM optional)做 in-browser download。
- **Scope check**: 純前端
- **Risk**: 極低

### 🟠 Medium Feature — 要 confirm scope 先

#### F5. **批次脫敏(多 PDF 一次過 redact 同一份 keyword list)** — 改動量 1-2 檔 ~150 行
宜家 keyword redaction 似係 single-file flow。加個 batch mode:用戶 upload N 個 PDF + 1 個 keyword list,出 ZIP 入面 N 個已 redact 嘅 PDF(JSZIP 已經喺 dependency)。
- **Scope check**: 純 client-side,符合硬性 constraint
- **要 confirm 點**:
  - 真係 user-confirmed 痛點,定 generic 推測?(AGENTS.md 反 ungrounded pain point pitch)
  - 要唔要保留 original filename 結構 / 加 suffix `_redacted`?
  - 進度 UX 點做(success 全部 / 部分失敗提示)?

#### F6. **Watermark 浮水印 template 儲存(IndexedDB)** — 改動量 1-2 檔 ~200 行
宜家 watermark 設定行 session 即失。用戶(尤其成日處理同一批文件嘅 SEN teacher)想儲「校徽 A 25% opacity」之類 template 落 IndexedDB,下次直接 recall。
- **Scope check**: 純 client-side IndexedDB(zero-leak),符合 constraint
- **要 confirm 點**:
  - 真有呢個 use case 還係推測?(SEN teacher 一年換幾次校徽?)
  - 校徽 file(PNG/JPG binary)又儲唔儲落 IndexedDB?size 影響 quota

### 🔴 Scope Expansion — 必須推翻 AGENTS.md 先

以下全部違反 locked constraint,**唔做**,只係列出嚟等 user 確認「係要 change scope」先再傾:

- ❌ **OCR API(Google Vision / MiniMax)** — 違反零外流 stance(就算更準)
- ❌ **Backend proxy / server endpoint** — 違反零後端
- ❌ **Cloud watermark template sync(跨 device)** — 違反零外流
- ❌ **Online collaboration / 即時 sharing link** — 違反零後端 + 私隱
- ❌ **AI 文件摘要 / 翻譯** — 要 LLM API,違反零外流

---

## 2. 使用者體驗 (UX) 優化

### 🟡 Small Enhancement

#### UX1. **First-time tooltips — 3 個核心功能** — 改動量 1 檔 ~60 行
3 個 P0(OCR / redaction / watermark)各自有 2-3 個關鍵 step,首次用對應 mode 時 pop 一個 brief tooltip(只 show 一次,用 localStorage flag):
- OCR:「scan PDF 會自動 fallback 去 Tesseract.js,首次會 download ~10MB WASM」
- Redaction:「upload `.txt` keyword list,一行一個」
- Watermark:「中文浮水印首次需下載 NotoSansTC 子集(~120KB)」
- **Scope check**: 純前端 localStorage flag
- **Risk**: 低;要做好 dismiss 邏輯避免彈完又彈

#### UX2. **錯誤訊息 human-readable 化** — 改動量 1 檔 ~80 行
依家 error 訊息似係 raw exception 漏出嚟(`Cannot read property of undefined` 之類)。包一層 user-friendly message + 一句「可能原因」+ 一句「建議做法」:
- 例: PDF 加密 → 「此 PDF 已被加密。請先解密或輸入密碼。」
- 例: Tesseract WASM load fail → 「瀏覽器阻擋了 OCR 引擎。請檢查網絡或用 Chrome。」
- **Scope check**: 純前端 message wrapping
- **Risk**: 低

#### UX3. **「最近檔案」session restore(IndexedDB Blob)** — 改動量 1-2 檔 ~120 行
宜家 reload 個 page 所有 file 都冇咗。對 SEN teacher(每週處理同一批學生 file)嚟講,**re-open 自動 restore 上次嘅 file list**(只儲 Blob reference,唔上傳)係一個明顯好用嘅 improvement。已喺 memory topic `pdf-pattern.md` 提過 PDF.js hybrid text-layer search + IndexedDB Blob session restore 嘅 pattern,可以 reuse。
- **Scope check**: IndexedDB Blob,**純 client-side,零 leak**
- **Risk**: 中;要做 quota handling(用戶可能 upload 100MB file × 5)

#### UX4. **Dark mode auto-follow system** — 改動量 1 檔 ~20 行
宜家 dark mode 係手動 toggle。加 `prefers-color-scheme` media query auto-detect(首次 visit)。
- **Scope check**: 純 CSS + JS
- **Risk**: 極低

### 🟠 Medium Feature

#### UX5. **Undo/Redo for merge & split reorder** — 改動量 1-2 檔 ~150 行
Merge mode 已有 SortableJS drag reorder,但錯手 drag 錯咗冇 undo。
- **Scope check**: 純前端 state stack
- **要 confirm 點**: 真有呢個 use case?(SEN teacher merge 嘅 file 通常 5-10 個,錯手 drag 易唔易發生?)

---

## 3. 使用者介面 (UI) 設計

### 🟡 Small Enhancement

#### UI1. **Tab icon 一致化 + active state 強化** — 改動量 1 檔 CSS ~30 行
6 個 tab 已有 emoji,但 active state 用 `border-bottom: 3px solid currentColor`,喺 small screen(<640px)睇唔清。
- 加 active tab 嘅 background fill + slight elevation
- 統一 tab 高度,避免 wrap 時 jump
- **Scope check**: 純 CSS
- **Risk**: 極低

#### UI2. **Processing state 用 Sonner-style toast 而非 alert()** — 改動量 1 檔 ~50 行
宜家 processing 完用 `alert()` / inline text。加 toast component(bottom-right, 3s auto-dismiss):
- 「✅ 已合併 3 個 PDF → merged.pdf」
- 「⚠️ 第 2 個 PDF 加密,已跳過」
- 「❌ OCR 失敗: WASM load timeout」
- **Scope check**: 純前端 DOM + CSS animation
- **Risk**: 低;但要確保 toast 唔阻擋 main flow(尤其 accessibility - screen reader)

#### UI3. **Empty state illustration + 引導文案** — 改動量 1 檔 ~40 行
6 個 mode 嘅 dropzone 都係「拖曳檔案到此處」,文字生硬。
- 加 1-2 句「呢個 mode 做咩 / 適合咩情境 / 預期花幾耐」
- **Scope check**: 純 copy + icon
- **Risk**: 極低

### 🟠 Medium Feature

#### UI4. **Page-level preview pane(split mode)** — 改動量 1-2 檔 ~200 行
Split mode 宜家要 extract 先見到結果。加一個 live preview pane:用戶選 page range 嗰陣即時 render 該 range 嘅 thumbnail(用 PDF.js render API,已經喺 codebase)。
- **Scope check**: 純前端 PDF.js render
- **要 confirm 點**: 真有呢個 use case?(SEN teacher 對 page range 通常 well-defined)

---

## 4. 自動化功能導入

### 🟡 Small Enhancement

#### A1. **Auto-detect scan PDF 並提示 OCR fallback** — 改動量 1 檔 ~30 行
宜家 hybrid OCR 係 silent fallback(行咗唔知)。加 detect:當 PDF.js text layer 0 result 時,header 出現「🔍 偵測到 scan PDF,建議啟用 OCR?」+ 一鍵 toggle。
- **Scope check**: 純前端 detection
- **Risk**: 低

#### A2. **Keyword list auto-suggest 從搜尋結果** — 改動量 1 檔 ~60 行
喺搜尋 mode 做完 search 之後,「將呢啲 keyword 加入 redaction list?」按鈕 → 直接 accumulate 落 keyword list,唔使再人手寫 `.txt`。
- **Scope check**: 純前端 state transfer
- **Risk**: 低

#### A3. **Auto-watermark 同校徽 recall** — 改動量 1 檔 ~40 行
Global watermark 啟用後,如果用戶上次 upload 過校徽,今次自動 recall(file binary 喺 session scope,可能要 IndexedDB 配合 F6)。
- **Scope check**: 純前端,session 內 OK;跨 session 要 IndexedDB(配合 F6)
- **Risk**: 中(跨 session 嗰陣)

### 🟠 Medium Feature

#### A4. **Smart 批次 rule — 「呢個 folder 嘅 PDF 全部 redact + 加 watermark」** — 改動量 2-3 檔 ~300 行
用戶 setup 一條 rule(例: 「folder A 入面所有 PDF → redact keyword list B + 加 watermark C」),之後 drag folder 入嚟就 auto-apply。
- **Scope check**: 純 client-side,符合 constraint;但要用 File System Access API(`window.showDirectoryPicker`)— Safari/older browser 唔支援,要做 feature detect + fallback 提示
- **要 confirm 點**:
  - 真有呢個 use case?(SEN teacher 通常一個一個 file 處理,定真有 batch folder scenario?)
  - File System Access API browser support 是否 acceptable(Chrome/Edge ✅,Firefox ❌,Safari 16.4+ partial)

#### A5. **PDF metadata auto-strip** — 改動量 1 檔 ~50 行
宜家 export 嘅 PDF 可能保留 metadata(author / creator / producer / creation date)— 對 SEN 文件嚟講係 potential 私隱 leak。Export 前自動 strip:
- Author → "Anonymous"
- Creator / Producer → empty
- CreationDate / ModDate → export time only
- **Scope check**: 純前端 pdf-lib metadata mutation
- **Risk**: 低;要確保 strip 唔影響 document 本身 content

> ⚠️ **A5 嘅重要性**: 雖然係 Small Enhancement 級,但對「零外流」stance 嚟講呢個應該 default-on。**Mavis 強烈建議 confirm**呢個做唔做(自動,定 opt-in?)。

> **🟢 v3.0f 已實作 + v3.0h 強化** — A5 helper `stripPdfMetadata` 喺 v3.0f 已經 commit 落 `index.html:686-705`,Settings 入面有 `#meta-strip-enabled` checkbox(預設 checked)。但 **v3.0f 嘅版本有個 pdf-lib v1.17.1 silent bug**:`setProducer('Anonymous')` / `setModificationDate()` 等 setter 喺 save 嘅時候會被 pdf-lib 嘅 `updateInfoDict()` 無條件覆蓋返 default(Producer 變返 `pdf-lib (https://github.com/Hopding/pdf-lib)`,ModDate 變返 save time)。**v3.0h 用 T11 test harness 發現 + fix**:只 strip 真正可 strip 嘅欄位(Author/Title/Subject/Keywords/CreationDate),Producer/Creator/ModDate 標為已知 library fingerprint limitation(AGENTS.md stance 仍 satisfied — library fingerprint 唔係學生私隱 leak)。Detail 喺 `stripPdfMetadata` 嘅 comment block。

---

## 5. 技術風險評估

### 5.1 Dependency Risk

| Dependency | 現有版本 | Risk | Mitigation |
|---|---|---|---|
| `pdf.js` | 3.4.120(2022) | ⚠️ **EOL 接近**,4.x 已 stable 多年 | 短期:lock 版本;中期:評估升 4.x breaking changes |
| `pdf-lib` | 1.17.1 | 🟢 仍 maintained | 留意 v2.x release notes |
| `html2pdf.js` | 0.10.1 | 🔴 **已 EOL,2021 最後 release**;我哋已經撞過佢嘅 off-screen render bug | **建議 migrate 走**:直接用 `html2canvas + jsPDF` 兩件式 stack,自己 orchestrate,control higher |
| `Tesseract.js` | (待確認) | 🟢 WASM stable | 留意 worker 兼容性更新 |
| `tailwindcss` | CDN runtime | ⚠️ CDN runtime 喺 production 有 CWT(cold-start warning) + bundle size 問題 | 考慮改 build-time tailwind CLI |
| `mammoth.js` | 1.5.1 | 🟢 stable | - |

> ⚠️ **html2pdf.js migration 係最 critical 嘅 tech debt**。之前 commit 嘅 fix(`<iframe srcdoc>` 沙箱)只係 workaround,underlying bug 仲喺度。下次依賴升級可能再撞。

### 5.2 Browser Compatibility Risk

| Capability | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| File System Access API(A4) | ✅ | ❌ | ⚠️ 16.4+ partial |
| `fontkit` UMD + pdf-lib CJK | ✅ | ✅ | ⚠️ Known issues with subset embedding |
| Tesseract.js WASM | ✅ | ✅ | ✅ |
| IndexedDB Blob(session restore) | ✅ | ✅ | ⚠️ Quota 較細 |
| `prefers-color-scheme`(UX4) | ✅ | ✅ | ✅ |

### 5.3 Privacy Risk

| Risk | Severity | Mitigation |
|---|---|---|
| PDF metadata leak(A5) | 🟠 中 | Auto-strip by default(待 confirm) |
| Filename 顯示喺 UI | 🟢 低 | 已係 client-side display,唔出網 |
| OCR 時 WASM download | 🟢 低 | 一次性 download + IndexedDB cache,已實作 |
| IndexedDB 跨用戶(device 共享) | 🟡 中(若 user 共享電腦) | 加「清除本機 cache」button(已有?) |

### 5.4 Performance Risk

| Scenario | Risk | Mitigation |
|---|---|---|
| 100MB+ PDF render 慢 | 🟠 中 | 加 progress indicator + chunked processing |
| Tesseract.js 大 scan PDF 跑 5+ 分鐘 | 🟠 中 | F2 進度條 + cancel button |
| 100+ 頁 PDF merge OOM | 🟡 中 | Streaming load + page-by-page append |
| html2pdf.js iframe srcdoc 大量 CSS | 🟡 中 | 限制 scale + 監測 memory |

### 5.5 Maintainability Risk

- **130KB 單檔 `index.html`**:2413 行,所有 mode / handler / state 喺一齊
  - **建議**(非 endorse):長遠拆做 module(ES module import),短期可接受
  - 但要 confirm 唔好 default 推 refactor(AGENTS.md「fixes only」)

---

## 6. Debug & 系統穩定性測試項目

### 6.1 P0 — 必修

| # | Test | 預期 result |
|---|---|---|
| T1 | **Dependency 版本 regression test** | lock `package.json` 等價(目前冇;CDN 直接拉)— 撞過 `html2pdf.js` off-screen bug,要 E2E verify 每個 mode 仍 work |
| T2 | **E2E: 全部 6 個 mode 各跑 1 個 sample** | merge / split / convert / batch / image / search 各 1 個 fixture,verify output size + content 唔空白 |
| T3 | **Memory leak test** — 跑 10 個 PDF merge 連續,monitor heap | 唔應該 >500MB 持續 retention |

### 6.2 P1 — 強烈建議

| # | Test |
|---|---|
| T4 | **Browser matrix**:Chrome / Edge / Firefox / Safari 各跑 T2 |
| T5 | **Edge case**: 加密 PDF / 0-page PDF / 1000-page PDF / 純圖片 PDF / 中日韓 mix PDF |
| T6 | **Error path**:network off(CDN fail)→ 應 graceful fallback 唔 crash |
| T7 | **Accessibility**: keyboard-only navigation(冇 mouse 能否用晒 6 個 mode?) |

### 6.3 P2 — Nice-to-have

| # | Test |
|---|---|
| T8 | **Performance benchmark**: 10MB / 50MB / 100MB PDF 各 mode render time log |
| T9 | **Memory snapshot diff**: F3(IndexedDB session restore)開關前後 memory usage |
| T10 | **Stress**:50 個 PDF 同時 batch,verify 唔 OOM + UI responsive |

---

## 7. Mavis 嘅實際建議(只講立場)

### 我會 push 你做嘅

1. **A5 — PDF metadata auto-strip** — 對齊「零外流」stance,係 stance 嘅 consistency fix,唔係 feature addition。**建議 default-on**,user-confirm 先做。
2. **T1 / T2 — Dependency regression + E2E** — 之前 commit 嘅 `html2pdf.js` fix 證明呢類 silent failure 真係會發生。**建議起個 minimal test harness**(可能係 Node.js script + headless Chrome),避免日後改嘢又 silently break。

### 我唔會 push 你做嘅

1. **A4(Smart 批次 rule)— File System Access API** — browser compatibility 太 fragmented,對 SEN teacher 真有冇用 ungrounded。
2. **F5(批次脫敏)— 真有冇 user-confirmed need** — AGENTS.md 反 ungrounded pain pitch。
3. **html2pdf.js migration** — 係 right call 但係 big lift。**應該同 user-discuss 過先做**,唔好自己 sprint。

### 我建議延後做嘅

1. **拆 `index.html` 2413 行做 modules** — 係 right call 但唔急。**Trigger**:當單一 mode 嘅 handler 超過 ~400 行,或新加 feature 開始撞 existing global state。

---

## 8. 總結

- **真正 small enhancement 可以隨時做嘅**:F1, F2, F3, F4, UX1, UX2, UX3, UX4, UI1, UI2, UI3, A1, A2, A3, A5 — 共 **15 個**
- **要 confirm scope 先做嘅**:F5, F6, UX5, UI4, A4 — 共 **5 個**
- **Scope expansion(違反 AGENTS.md)**:5 個 — **唔做**
- **Tech debt 最 critical**:html2pdf.js 0.10.1 migration
- **建議 default-on 嘅 stance fix**:PDF metadata auto-strip(A5)

> **下一步**:User 想做邊個就 specify 邊個。我會逐個 confirm scope + 寫 implementation plan + estimate effort。**唔會自己 sprint**。

---

## 9. Test Harness(v3.0h 新增)

**`tests/` 目錄**有完整 E2E test harness。`puppeteer-core` + system Chrome + `pdf-lib`,**零 backend,零 production build pollution**。

### 9.1 範圍

| Test ID | Verify | Status |
|---------|--------|--------|
| **T1** | page loads, 6 tabs render, `#meta-strip-enabled` default checked | ✅ |
| **T2.merge** | merge mode 2 個 fixture → non-empty output | ✅ |
| **T2.split** | split mode → non-empty output | 🟡 next sprint |
| **T2.convert** | convert mode docx → PDF | 🟡 next sprint |
| **T2.batch** | batch mode → multi-file output | 🟡 next sprint |
| **T2.image** | image → PDF | 🟡 next sprint |
| **T2.search** | search mode → results table | 🟡 next sprint |
| **T3** | 10x merge memory < 500MB | 🟡 next sprint |
| **T4** | Firefox / Safari matrix | 🟡 next sprint |
| **T5** | 加密 / 0-page / 1000-page / CJK-mix edge cases | 🟡 next sprint |
| **T6** | network off → graceful fallback | 🟡 next sprint |
| **T7** | keyboard-only a11y | 🟡 next sprint |
| **T11** | A5 metadata strip(privacy-critical fields only)| ✅ |

### 9.2 跑法

```bash
cd tests
npm install
npm test                  # T1 + T2.merge + T11
npm run test:t11          # fastest
npm run test:t2
npm run test:t1
npm run verify-a5 path/to/output.pdf   # standalone A5 verifier
```

### 9.3 設計 philosophy

- **不污染 root `package.json`** — tests 係 dev-only dependency,SPA 嘅 production single-file deployment 唔應該知道 tests 嘅存在
- **Vendored deps 喺 `tests/node_modules/`** — 唔影響 PDF Workstation 嘅「零依賴」姿態
- **CDN 訪問(cdnjs/jsdelivr)喺 test 期間允許** — 因為 index.html 嘅 PDF.js / pdf-lib / Tesseract.js 都由 CDN 嚟。Telemetry/analytics 攔截
- **Fixtures 即時生成**(`fixtures/build-fixtures.mjs` 用 pdf-lib) — 唔 commit binary blobs,fixtures 細可控

### 9.4 v3.0h 嘅 catch

**T11 喺 v3.0h 第一次 run 嘅時候 fail 咗,expose 咗 v3.0f A5 helper 嘅 silent bug**:`setProducer()` / `setModificationDate()` 喺 pdf-lib v1.17.1 save 嘅時候被無條件覆蓋。**呢個正係 test harness 存在嘅理由** — 唔係 testing 嘅趣味,而係 silent regression 嘅 detector。

---

*本提案由 Mavis 寫,grounded in index.html 嘅 6 個 mode + AGENTS.md locked scope。冇 endorse 任何項目。*