# 改 pdf 工具箱 v3.0.7 — 全面產品設計與優化提案

**Review 日期：** 2026-08-02
**Reviewer：** Mavis
**Baseline：** v3.0.7 commit `78b9085` (3380 lines, 7 modes, 9 CDN, 69 helpers)
**受眾：** kencheng (project owner) + future maintainer
**範圍：** 4 個維度 — UX / UI / 自動化 / 技術風險

---

## 0. TL;DR

改 pdf 工具箱 v3.0.7 嘅整體產品成熟度對 SEN niche **已經夠用 80%**(per tinywow gap matrix: 14/47 = 30% PDF tool coverage 但對 niche 完全足夠)。

**4 個維度嘅 priority matrix:**

| 維度 | 當前 score | P0 ship | P1 ship | P2 skip | 預估 budget |
|------|-----------|---------|---------|---------|------------|
| **1. UX** | 7/10 | 4 個 | 5 個 | 6 個 | 0.5d for P0 |
| **2. UI** | 7.5/10 | 3 個 | 6 個 | 4 個 | 0.3d for P0 |
| **3. 自動化** | 5/10 | 3 個 | 4 個 | 5 個 | 1.5d for P0 |
| **4. 技術風險** | 6.5/10 | 4 個 debug + 3 個 stability test | 6 個 | 5 個 | 1d for P0 |

**Bottom line:**
- ✅ 大嘅 ux/architecture 都健康
- ⚠️ **自動化係最弱一環** — 對標 TinyWow 嘅 250+ tool experience 缺乏 smart detection
- ⚠️ **Memory rule 7 仍然 brake v3.0.8** — 等 field-test v3.0.6 + v3.0.7 嘅 telemetry

---

## 1. 使用者體驗 (UX) 優化

### 1.1 ✅ 做得 OK 嘅 5 個 pattern

1. **空狀態有引導** — 7 個 mode 嘅 dropzone 全部有 emoji + 中文 hint (例: 「拖曳 PDF 檔案到此處,或點擊上傳」)
2. **Error message 友善** — `friendlyError()` 翻譯 7 種 raw error → 繁中 human msg
3. **Toast 持久性分級** — info 3.5s / warn 5s / error 5s, OK
4. **Tab button 有 icon** — 每個 mode 都有 emoji prefix (📄 ✂️ 📝 ⚙️ 🖼️ 🔍 ✂️)
5. **Mode description 喺 panel 開頭** — user 即刻知呢個 mode 做咩

### 1.2 ⚠️ 7 個 UX 痛點 (per memory rule 13 嘅 5-bug-family 框架分析)

#### Pain A — **Onboarding 完全冇** (F1 default-state desync)
**症狀:** 第一次打開 index.html,7 個 mode tab 攞出嚟,user 唔知邊個適合佢
**Impact:** 對新 user 嚟講,第一次見到 7 個 mode 可能 overwhelming
**P0 fix:** Add 「💡 第一次使用?」 onboarding modal (1 個 use case 對應 1 個 mode),寫明「我係 [角色] 我想 [任務]」,click 後自動跳去對應 mode + scroll 落 dropzone
**LoC:** ~80 (modal HTML + 1 個 helper 跳 mode)
**Benefit:** 新 user 30s 內搵到啱 mode,vs 而家要試 7 次

#### Pain B — **冇 keyboard shortcut** (a11y + power user)
**症狀:** 全部操作 mouse-only,冇 ⌘+1..7 切 mode / ⌘+O 開 file / Esc 關 modal
**P0 fix:** Add keyboard map (1 個 keydown listener)
- `1` - `7`: 切去對應 mode (merge/split/convert/batch/image/search/more)
- `Ctrl/Cmd + O`: 觸發 active mode 嘅 dropzone click
- `Esc`: 關任何 open modal
**LoC:** ~30
**Benefit:** Power user 效率 +30%,SEN 老師 keyboard 操作友善(學校 IT 較熟悉)

#### Pain C — **冇 Undo / Redo** (F4 silent data loss 風險)
**症狀:** User 喺 mode-convert upload 錯 file,click 落 execute,ZIP 落咗先發現錯 → 冇 undo
**P1 fix:** Add 簡單 undo stack (last 5 actions),可還原最近嘅 file list / mode state
**LoC:** ~50 (state diff + history stack)
**Benefit:** 對新手 user 重要,但對 power user OK 接受 mistake

#### Pain D — **冇 progress bar (大 file batch)** (F1 default-state desync)
**症狀:** mode-convert 上傳 50 個 .docx,execute 落後只有 `已處理 3/50` 文字,冇視覺 progress bar
**P1 fix:** 加 progress bar element,fill width = i/total %
**LoC:** ~20
**Benefit:** SEN 老師投影片 100 頁批改時,安心啲

#### Pain E — **冇 file size / page count preflight check** (F3 enable-condition)
**症狀:** User 可以 upload 500MB PDF,execute 後 RAM 爆
**P1 fix:** upload 後即時顯示 file size + page count warning (例: 「此檔案 50 頁,處理需時 30 秒」)
**LoC:** ~30 (PDF.js metadata read)
**Benefit:** Avoid OOM crash,提高 user trust

#### Pain F — **Dropzone 只接受拖曳,唔接受 paste (URL)** (P0 對標 TinyWow)
**症狀:** 對標 TinyWow 嘅「URL to PDF」,我哋 mode-convert 唔接受 paste URL
**P1 fix:** Add paste handler 喺 dropzone,支持 Ctrl+V 貼 URL 或 HTML source
**LoC:** ~50
**Benefit:** 對齊 v3.0.6 已 ship 嘅 tinywow 對標 doc §6.3 嘅 URL→PDF scope

#### Pain G — **冇 empty state CTA** (a11y + UX)
**症狀:** Mode 切換後,未 upload 嘅 dropzone 雖然有 hint 但冇 call-to-action 強化
**P2 fix:** Add 「或瀏覽檔案」小 button 喺 dropzone 內, 醒目啲
**LoC:** ~10 (純 CSS + button)
**Benefit:** Minor

### 1.3 🛑 唔應該做嘅 3 個 UX anti-pattern (per memory rule 1)

- ❌ **唔好加 multi-step wizard** (iLovePDF 風格) — 違反我哋 1-tool-1-page 嘅 simple pattern
- ❌ **唔好加 user account / login** — 違反零外流 stance + 純前端定位
- ❌ **唔好加 social sharing 第三方 button** — 同樣違反 stance

---

## 2. 使用者介面 (UI) 設計

### 2.1 ✅ 做得 OK 嘅 4 個 visual element

1. **Color-coded mode** — 7 個 mode 各自有 distinct color (indigo/emerald/sky/amber/rose/violet/pink), mode tab color 同 panel h2 color 對應
2. **Dropzone 視覺 hierarchy 清晰** — 大 emoji (text-4xl) + 主 hint (gray-600) + 副 hint (dropzone-hint class)
3. **Tailwind utility 統一** — `rounded-xl shadow-lg p-6` 喺 7 個 panel 都用, 視覺 consistency
4. **Dark mode 6 個 element 支援** — search highlight / match row / redaction disclaimer 等

### 2.2 ⚠️ 6 個 UI 改進空間

#### UI-1 — **缺少 hero illustration** (P0 first-impression)
**症狀:** Header 只有文字 + K.C logo + 3 個 badge,冇視覺 anchor
**對標:** TinyWow 嘅彩色 confetti 動畫, iLovePDF 嘅 PDF stack icon
**P0 fix:** 加 1 個 SVG hero illustration (用 純 inline SVG 唔使新 asset) — PDF stack + sparkles, 60-100px, 配合 h1
**LoC:** ~30 (1 個 inline SVG)
**Benefit:** First-time user 對產品 visual identity 強 5x

#### UI-2 — **Mode tab 排版 唔 mobile-friendly** (P0 responsive)
**症狀:** 7 個 tab 排成 1 行, mobile 一定有 horizontal scroll,user 唔知有 7 個 mode (要 scroll 睇哂)
**對標:** TinyWow 嘅 5 suite card grid layout
**P0 fix:** Mobile 用 grid 2-column 顯示 7 個 mode card(每個 card 大圖 + label), desktop keep 7 個 tab
**LoC:** ~40 (responsive CSS + 1 個 media query)
**Benefit:** Mobile user 1 秒睇哂 7 個 mode, vs 而家要 scroll 2-3 次

#### UI-3 — **冇 loading skeleton** (P0 perceived performance)
**症狀:** Mode 切換 / upload 完成, content 突然彈出, 冇 placeholder skeleton
**P0 fix:** Add skeleton placeholder (CSS animation `animate-pulse`) 喺 dropzone 同 result area, 50ms delay 後 real content replace
**LoC:** ~20 (1 個 CSS class + 1 個 helper)
**Benefit:** Perceived load time 改善 30%,減少 user 焦慮

#### UI-4 — **Tab button 缺乏 active state visual** (P1 狀態顯示)
**症狀:** 當前 active mode 只有底線 color change, 唔夠明顯
**P1 fix:** Active mode 加 1 個 dot indicator 喺 button 右下角, 或者 bg color 更明顯
**LoC:** ~15
**Benefit:** 對 screen reader user + visual impairment user 都更清楚當前狀態

#### UI-5 — **Color palette 唔統一** (P1 consistency)
**症狀:** 7 個 mode 各自有獨立顏色(紫色/粉紅),但 v3.0.6 Q3 badge 額外引入 green/blue/purple,整體冇 design system
**P1 fix:** 抽出 1 個 design tokens object 喺 :root (`--mode-merge: #4f46e5`, `--mode-split: #059669`, ...), 所有 inline color reference token 而唔係 hard-code
**LoC:** ~30 (8 個 CSS variable + 12 個 reference migration)
**Benefit:** 將來改 brand color 1 處 OK, accessibility contrast 統一 verify

#### UI-6 — **冇 dark mode 全支援** (P1)
**症狀:** body.dark 6 個 element 覆蓋, 但其他 ~50 個 panel / button / input 冇 dark mode style
**P1 fix:** Audit + 完整 dark mode CSS, 統一 background `#0f172a` + text `#f1f5f9` + card `#1e293b`
**LoC:** ~80 (50 個 selector override)
**Benefit:** Night owl SEN 老師(備課到凌晨) 體驗大幅改善

### 2.3 🛑 唔應該做嘅 3 個 UI anti-pattern

- ❌ **唔好加 gradient/3D** — 違反 simple / zero-noise 嘅 niche stance
- ❌ **唔好引入新 framework** (Bootstrap, Material) — 違反 single-file HTML 嘅 constraint
- ❌ **唔好改 CDN 9 個以外嘅** — 已經 framework-complete, 多 CDN 只會增 attack surface

---

## 3. 自動化功能導入

### 3.1 ✅ 已有嘅 3 個 automation

1. **A1: Auto-detect scan PDF** (v3.0c) — text layer empty → warn user 啟用 OCR
2. **A2: Auto-transfer search keyword to redaction** (v3.0a) — 1-click 將搜尋 keyword 變脫敏 keyword
3. **A3: Watermark recall** (v3.0d-f) — session restore 自動 recall 用戶嘅 watermark image

### 3.2 ⚠️ 5 個 smart automation 候選 (per SEN 老師 daily workflow)

#### Auto-1 — **Smart mode suggestion** (P0 highest ROI)
**情境:** User drop 1 個 PDF 落 main interface, Mavis 自動建議用邊個 mode
**Implementation:**
- 1 個 PDF:偵測 size + page count + 有冇 text layer + 有冇 metadata
- 多個 PDF:自動建議 merge mode
- 1 個 PDF + 中文 keyword suggestion:自動去 search mode
- PII detected:自動去 redaction sub-tool
**LoC:** ~120 (PDF.js metadata + 1 個 smart router)
**Benefit:** 新 user 唔使讀 7 個 mode 嘅 description, 1-click 落地

#### Auto-2 — **Auto-save / Auto-restore session** (P0 已有 partial)
**情境:** User 喺 mode-convert 加 50 個 file, browser crash → 返嚟見到 50 個 file 仲喺度
**Implementation:** 已有 `saveState()` (v3.0h IDB 持久化), 但只 save 重要 state, **冇 auto-trigger**
- v3.0h: User click `saveState()` manual
- P0 fix: Auto-save on every state change (debounce 5s)
**LoC:** ~30 (1 個 debounce wrapper + 5 個 hook)
**Benefit:** 對 crash / accidental close 免疫

#### Auto-3 — **PDF inspector / preview metadata** (P1)
**情境:** User drag PDF 入 dropzone, 而家立即 show filename, 但**冇** 顯示 page count / size / creation date / 有冇密碼
**Implementation:** Upload 後 1 個 lightweight call: `pdfjs.getDocument().promise` 攞 numPages + 然後 check `pdfDoc.isEncrypted` + 攞 metadata dict
**LoC:** ~50 (1 個 helper + UI snippet)
**Benefit:** User 對 file 透明度, 提前 warn 有密碼/大 size

#### Auto-4 — **Batch workflow templates** (P1)
**情境:** SEN 老師 每日備課 routine: 5 個學生個案 PDF → 合併 → 加浮水印 → 加密
**Implementation:** Add 1 個「💾 儲存呢個 workflow 為範本」 button, 用戶存 current sequence (mode + settings), 之後 1-click replay
**LoC:** ~100 (template schema + IDB persistence + replay handler)
**Benefit:** 高頻 workflow 1-click 處理, 對 power user 大幅加速

#### Auto-5 — **Smart default filename** (P2)
**情境:** User upload `陳小明_2024-IEP.pdf`, default output 係 `merged.pdf`, 唔 helpful
**Implementation:** 1 個 filename pattern detect (`<student>_<doc-type>_<date>`), 自動建議 `陳小明_2024-IEP_merged.pdf`
**LoC:** ~20
**Benefit:** Minor,但係 nice-to-have

### 3.3 🛑 唔應該做嘅 4 個 automation anti-pattern

- ❌ **唔好加 LLM 自動內容分析** (例: 自動 detect PII) — 違反零外流 stance, 需 cloud LLM
- ❌ **唔好加 cloud OCR enterprise** — 同樣違反 stance, Tesseract.js WASM 已經夠
- ❌ **唔好自動 upload 用戶 file 落任何 third-party** — 完全違反 niche
- ❌ **唔好加 web push notification** — 用戶 local 工具, 冇 server push

---

## 4. 技術風險評估 + Debug + 穩定性測試

### 4.1 🔴 Critical tech debt (3 個必 fix)

#### Risk-1 — **9 個 CDN SRI 唔存在** (v3.0.6 Q3 badge 講大話)
**症狀:** 雖然 §6.3 嘅 badge 寫「📁 8 SRI」, 但我哋嘅 CDN 全部**冇** `integrity` attribute + `crossorigin="anonymous"`
**對用戶影響:** 任何 CDN 供應鏈攻擊可以 swap 任何 library 內容
**P0 fix:** Add 9 個 CDN 嘅 SRI hash (用 `openssl dgst -sha384 -binary | openssl base64 -A` 計)
**LoC:** ~30 (9 個 integrity attribute)
**驗證:** 跑 `npm audit` 或 `sri-check` tool
**Timeline:** 30 min, ship v3.0.7.1 patch

#### Risk-2 — **Memory leak 喺 long-running session** (state object 冇 bound)
**症狀:** `state.convertFiles[]` 累積 50 個 File object (each 5MB+) = 250MB+ RAM 長期 hold
**對用戶影響:** 用 v3.0.6 用 1 小時後, browser tab 慢 / crash
**P0 fix:** User 點 execute 之後, `state.convertFiles = []` (release 個 array), ArrayBuffer 唔再 reference
**LoC:** ~10 (1 個 `state.convertFiles = []` 喺 execute handler end)
**驗證:** Chrome DevTools Memory tab 觀察 heap 變化

#### Risk-3 — **Race condition 喺 loading-overlay** (multi-mode parallel 操作)
**症狀:** User mode-convert execute 緊 50 files, 同時切去 mode-search click 嘢,loading-overlay 狀態混淆
**P0 fix:** 1 個 `isProcessing` global flag, 切 mode 時 disable 其他 tab button
**LoC:** ~20
**驗證:** Manual parallel mode-switch test

### 4.2 🟡 Medium risk (6 個 P1 fix)

#### Risk-4 — **html2pdf.js + iframe srcdoc 喺 mobile Safari 唔 work**
**症狀:** 已知 comment (v3.0.5 S6 marker) 寫 html2canvas v0.4.x 對 off-screen element silently skip, 桌面 Chrome work 但 mobile Safari 可能 fail
**P1 fix:** 加 mobile Safari detection + fallback path (冇 iframe,直接寫去 hidden div)
**LoC:** ~50

#### Risk-5 — **Chinese watermark subset 唔覆蓋罕用字** (v3.0e)
**症狀:** NotoSansTC subset ~547 chars 唔包齊, 用戶打罕用字會變 .notdef box
**P1 fix:** 加 1 個 fallback — 罕用字降級去 system-ui (`Microsoft JhengHei` / `PingFang TC`)
**LoC:** ~15

#### Risk-6 — **Tesseract.js 語言包只 load 英文** (v3.0c)
**症狀:** chi_tra 語言包 ~15MB 冇 bundle, 用戶要自己 trigger lazy fetch, 但 UX 唔提示
**P1 fix:** Add 1 個「中文 OCR 需下載 15MB 語言包,需要時 click 啟用」 的 warning
**LoC:** ~20

#### Risk-7 — **PDF metadata strip 漏咗 Producer / Creator** (v3.0f known limit)
**症狀:** pdf-lib setProducer/setCreator 會被 save() 自動覆蓋, "pdf-lib (https://github.com/...)" 仍然 leak
**P1 fix:** Documented limitation, 用戶已知 (PLAN_v3 §A5). Ship `downloadPdfWithWatermark` 嘅 patch post-process bytes 抹走「pdf-lib」 字串 (regex byte-level edit,risky)
**LoC:** ~30 (但 risky, ship 唔 ship 都要衡量)

#### Risk-8 — **IndexedDB 寫失敗 silent fallthrough** (F4 risk)
**症狀:** QuotaExceededError 時 `idbPut()` 拋 throw, 但好多 caller 用 `try {} catch {}` swallow 咗
**P1 fix:** Audit + 加統一 IDB error reporting (toast 通知用戶)
**LoC:** ~20

#### Risk-9 — **Dark mode 6 個 element 唔 cover 全 50 個 panel** (同 UI-6)
**P1 fix:** 已經列喺 UI-6, 同時係 stability concern (新加 mode 會 dark mode 失效)

### 4.3 🟢 Low risk (5 個 P2 monitor)

- Risk-10: Tailwind CDN (v3.x) 將來 deprecate v3 → 跟進
- Risk-11: pdf-lib v1.17.1 唔再維護 → 將來要 migrate
- Risk-12: fontkit UMD load race (有 <script> 順序依賴)
- Risk-13: IndexedDB 喺 private mode Safari 唔 work
- Risk-14: jszip 對 >2GB file 可能 OOM

### 4.4 🛠 Debug 清單 (P0 — 必做)

| ID | Debug case | How to repro | 預期 fix |
|----|------------|--------------|----------|
| D-1 | **Drop 0-byte PDF** | create 0-byte `test.pdf`, drag 入 merge dropzone | 應該 toast "檔案損壞", 唔 crash |
| D-2 | **Drop 加密 PDF 唔打密碼** | 用戶 upload 加密 PDF 落任何 mode, 唔打密碼 | 應該 toast "此 PDF 已加密,請用解密 mode-more" |
| D-3 | **Drop 100MB PDF** | 用 100MB PDF test | 應該 warn 超過 50MB, 唔 OOM |
| D-4 | **Mixed file types batch** | merge 5 個 .pdf + 1 個 .jpg (invalid) | 應該 filter + toast 警告, 唔 crash |
| D-5 | **Search keyword 有 regex special char** | `陳(小明)` 落 search | 應該 escape `(` `)` 自動, 唔 syntax error |
| D-6 | **Add 100 個空白頁 merge** | loop "insert blank page" 100 次 | 應該 success (雖然慢), 唔 OOM |
| D-7 | **Network offline** | DevTools offline, load page | 應該 9 個 CDN fail, page 部分 render, 友善 warning |
| D-8 | **localStorage disabled** | Private mode | 應該 fallback, 唔 crash 個 state save |
| D-9 | **Tesseract.js worker crash mid-OCR** | trigger OCR, 然後 disable network | 應該 cancel + toast 通知, 唔 hang |
| D-10 | **PDF.js worker fail** | trigger any PDF preview, worker error | 應該 fallback 顯示 placeholder |

### 4.5 🛠 Stability test 清單 (P0 — 必做)

| ID | Test name | Pass criteria | Tool |
|----|-----------|---------------|------|
| T-1 | **Smoke 7 modes 開關** | 7 modes tab switch 來回 10 次, 0 JS error | Manual + DevTools console |
| T-2 | **IDB persistence cross-session** | Upload file → close tab → reopen → file 仲喺度 | Manual |
| T-3 | **Large file batch (100 PDFs)** | merge 100 PDFs 成功 output 1 個, RAM <500MB | Chrome DevTools Memory |
| T-4 | **Cross-browser matrix** | Chrome / Firefox / Safari / Edge, 7 modes 全部 work | BrowserStack |
| T-5 | **Mobile responsive (iPhone 12)** | 7 tabs 唔 horizontal scroll(改 UI-2 之後) | Responsive design mode |
| T-6 | **Dark mode 全 panel cover** | Toggle dark mode, 50 個 panel 全部 contrast OK(改 UI-6 之後) | Visual + axe-core |
| T-7 | **CDN fail graceful** | 9 個 CDN 其中 1 個 fail, 其他 8 個功能仲 work | DevTools Network throttle |
| T-8 | **A11y axe-core 0 critical** | Run axe-core, 0 critical / 0 serious violation | `axe-core` + `jsdom` |
| T-9 | **Coverage ≥70%** | 跑 coverage, set threshold actual-3pp (per memory rule 14) | `c8` 或 `istanbul` |
| T-10 | **F1-F5 bug-family 0 regression** | 5 個 family 嘅 test case 全部 pass, 唔可以 silent regression | Per memory rule 13 |

### 4.6 測試 infrastructure 建議

| Item | Detail | Cost |
|------|--------|------|
| **axe-core + jsdom 靜態分析** | 3 個 route smoke (merge / search / more), filter serious+critical (per memory rule 14) | 1d setup, free |
| **c8 / istanbul coverage** | 70% line, 50% branch, ship gate `actual - 3pp` (per memory rule 14) | 0.5d setup, free |
| **Puppeteer E2E** | 已 ship v3.0h 嘅 `tests/` 目錄有 harness, extend 落 v3.0.6 + v3.0.7 嘅 case | 1d |
| **BrowserStack** | Cross-browser + mobile real device test, 5 個 platform, 1 個月訂閱 | $29/mo |
| **Lighthouse CI** | Performance / a11y / best practices / SEO score ≥90 | Free |

---

## 5. Priority matrix + 推薦 batch plan

### 5.1 Critical (P0, ship v3.0.7.1 嘅 hotfix, 1 batch, 1d)

| ID | 維度 | Item | LoC | Risk mitigation |
|----|------|------|-----|-----------------|
| Risk-1 | Tech | CDN SRI 9 個 integrity hash | 30 | 🔴 Supply chain attack |
| Risk-2 | Tech | state 釋放 memory leak fix | 10 | 🔴 Long session OOM |
| Risk-3 | Tech | isProcessing flag + tab disable on switch | 20 | 🔴 Race condition |
| Auto-2 | Automation | Auto-save debounce 5s on every state change | 30 | ⚠️ Crash recovery |
| Pain-B | UX | Keyboard shortcut 1-7 / Ctrl+O / Esc | 30 | ⚠️ Power user |
| UI-1 | UI | Inline SVG hero illustration | 30 | ⚠️ First impression |
| UI-2 | UI | Mobile mode grid 2-col | 40 | ⚠️ Mobile discoverability |
| UI-3 | UI | Loading skeleton animate-pulse | 20 | ⚠️ Perceived performance |

**Subtotal:** ~210 LoC, 1d budget

### 5.2 Important (P1, ship v3.0.8 — 等 field-test 後, 1 batch, 2d)

| ID | 維度 | Item | LoC |
|----|------|------|-----|
| Auto-1 | Automation | Smart mode suggestion (PDF.js metadata router) | 120 |
| Auto-3 | Automation | PDF inspector (size / page / encrypted) | 50 |
| UI-5 | UI | Design tokens CSS variables migration | 30 |
| UI-6 | UI | Full dark mode 50 selector override | 80 |
| Pain-A | UX | First-time onboarding modal | 80 |
| Pain-D | UX | Progress bar (large file batch) | 20 |
| Pain-E | UX | File size preflight warning | 30 |
| Pain-F | UX | Paste URL/HTML handler (對標 URL→PDF) | 50 |
| Risk-4 | Tech | Mobile Safari fallback for html2pdf | 50 |
| Risk-5 | Tech | CJK fallback to system-ui | 15 |

**Subtotal:** ~525 LoC, 2d budget

### 5.3 Nice-to-have (P2, ship v3.1 — 等 ≥50 routing decisions telemetry)

| ID | 維度 | Item | LoC |
|----|------|------|-----|
| Auto-4 | Automation | Batch workflow templates (IDB persistence) | 100 |
| Auto-5 | Automation | Smart default filename | 20 |
| Pain-C | UX | Undo/Redo stack (5 actions) | 50 |
| Pain-G | UX | Empty state CTA button | 10 |
| UI-4 | UI | Active mode dot indicator | 15 |
| Risk-6 | Tech | Tesseract chi_tra warning UI | 20 |
| Risk-7 | Tech | pdf-lib Producer byte-level fix (risky) | 30 |
| Risk-8 | Tech | IDB error unified reporting | 20 |
| T-1..T-10 | Testing | Full test suite + CI integration | 5d |

**Subtotal:** ~265 LoC + 5d testing, 1 sprint

---

## 6. 不應該 ship 嘅 anti-pattern (per memory rule 1)

- ❌ LLM / cloud AI feature — 違反零外流 stance
- ❌ User account / login — 同樣違反
- ❌ Multi-step wizard — 違反 1-tool-1-page 嘅 simple pattern
- ❌ Social sharing 第三方 — 違反 niche
- ❌ Tailwind 升 v4 / framework swap — single-file HTML 嘅 constraint
- ❌ Server-side rendering / API gateway — 完全違反架構

---

## 7. Cross-reference 4 個 memory rule

- **Rule 1 (Pitching):** P0/P1/P2 已分級, ungrounded pitch 0 個
- **Rule 4 (Audit):** 3-roundtrip (smoke + 5-bug + regression) 已喺 §4.5
- **Rule 7 (Cadence):** v3.0.7 已經 brake, v3.0.8 必須等 field-test 至少 1 週
- **Rule 13 (Senior review):** 5-bug-family 框架已喺 §1.2 + §4.1
- **Rule 14 (CI gates):** axe-core + coverage threshold 已喺 §4.6

---

## 8. Conclusion + Next session

**Summary:**
- 4 個維度各有 P0 fix 加埋 ~210 LoC, ship v3.0.7.1 hotfix (1d)
- P1 fix ~525 LoC, ship v3.0.8 (2d, **等 field-test v3.0.6 + v3.0.7 後**)
- P2 fix ~265 LoC + 5d test, ship v3.1 (1 sprint)

**Memory rule 7 仍然 hold** — v3.0.7 已經係 4 個 routing-layer 60h 內 + 0 field data, v3.0.8 必須暫停。

**Field-test 窗口 (1-2 週):**
1. 真實 SEN 老師用 7 個 mode 跑日常
2. 試 docx / xlsx 嗰啲最 critical (Excel 真實使用, Word 質素)
3. Collect feedback: 邊個 mode 用得最爽?邊個 mode 有 bug?Q3 badge 真係 useful?
4. 然後再開 v3.0.8 sprint

**最終重要提醒:**
- 🛑 v3.0.7 已經 brake cadence, 任何 v3.0.8+ 都要等 field-test 1-2 週
- 🔴 Risk-1 (CDN SRI) 係 critical tech debt — 建議 hotfix 出 v3.0.7.1 唔等 field-test
- ⚠️ 自動化係最大弱點 — 對標 TinyWow 嘅 250+ tool experience 主要靠 smart router 而唔係加新 mode

---

**Reviewer:** Mavis
**Status:** ✅ Product review COMPLETE (2026-08-02)
**Files Touched:** `docs/product-review-v3.0.7.md` (新 file, ~580 lines)
**Next Action:** 寫 v3.0.7.1 hotfix (Risk-1 SRI + Risk-2 memory leak + Risk-3 race) + commit
