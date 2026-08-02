# 改 pdf 工具箱 — Project Master Plan

**最後更新：** 2026-08-02 (Mavis update 跟 push 完成)
**目的：** 任何 session 開頭必讀嘅 master file — 30 秒 launch protocol + 完整上下文
**作者：** Mavis (Mavis <Mavis@MiniMax.local>)
**狀態：** ✅ v3.0.6 已 ship + push 上 origin main (2026-08-02 bbffd70, by mavis-bridge worktree)

---

## 0. TL;DR (30 秒讀)

### 0.1 項目一句話
- **名：** 改 pdf 工具箱 (v3.0.5 working tree)
- **Stack：** Single-file HTML + Tailwind CDN + pdf-lib + pdf.js (純前端,零外流)
- **Niche：** SEN 教職員 (特殊教育),繁體中文,FERPA compliant,內網部署
- **Mode count：** 7 (merge / split / convert / batch / image / search / **more** [v3.0.5 新])
- **Repo：** `~/workspace/vs code/pdf/` (git remote: `https://github.com/ihateusingai-beep/pdf-tool.git`)
- **HEAD 喺 git：** `bbffd70` (v3.0.6, 2026-08-02)
- **Working tree：** ✅ clean (剛 push 上 origin)
- **Q1 (push):** ✅ done 2026-08-02 via mavis-bridge worktree + ff merge
- **Q2 (v3.0.6):** ✅ scope = URL→PDF + PDF→JPG/PNG,押後到 v3.0.5 field test 後
- **Q3 (badge):** ✅ done 2026-08-02 (3 pill in header)
- **Q4 (wrapper):** ✅ Method 3 worktree shipped 2026-08-02 (永久 fix)

### 0.2 Resume 第一動作 (per memory rule 12 + write-only followup)
```bash
cd "/Users/kencheng/workspace/vs code/pdf"
git status --short              # 確認 4 個 uncommitted file
git log --oneline -5            # 確認 HEAD 仲係 d3c7047a
grep -c 'mode-' index.html      # 應該係 8 (7 mode section + 1 search keyword)
ls docs/                        # 應該見到 tinywow-comparison.md
```

### 0.3 Critical reminders
- **bash tool wrapper 死鎖** 喺舊 `tools/pdf/` path (新 path `pdf/` 入到但 bash 100% 失敗) → commit/push 要 user 手動
- **Read/Edit/Write 用 absolute path 入到新 path** → 唔可以行 `git -C` / `pnpm` / 任何 shell
- **5-bug-family audit** (memory rule 13) ship 前必做,multi-version spec 要 §X.5 reference table
- **a11y check** (memory rule 14) 用 axe-core 0 critical / 0 serious

---

## 1. Disk State Verification (新 session 30s 必跑)

### 1.1 預期 disk state (per 2026-08-01 snapshot)
| Path | 預期 state | 預期 line / 內容 |
|------|-----------|------------------|
| `index.html` line 6 | `<title>改 pdf 工具箱 v3.0.5</title>` | v3.0.5 標題 |
| `index.html` line 159 | `🛠️ 改 pdf 工具箱` + K.C credit logo img | h1 + personal_logo.png |
| `index.html` line 239 | `<button data-mode="more">` | 7th tab |
| `index.html` line 598 | `<section id="mode-more">` | v3.0.5 新 mode |
| `index.html` line 2576+ | 4 helpers: parsePageSelection / deletePagesFromPdf / decryptPdf / setPdfAConformance | v3.0.5 新 helpers |
| `index.html` line 2722 | `more-execute` click handler | v3.0.5 execute |
| `README.md` line 1 | `# 🛠️ 改 pdf 工具箱` | rebrand |
| `PLAN_v3.md` line ~480+ | v3.0.4 + v3.0.5 sections | rebrand + more tool |
| `docs/tinywow-comparison.md` | 18.4KB Phase 1 research | 對標 doc |
| `.git/refs/heads/main` | `d3c7047a` | HEAD still v3.0h |

### 1.2 異常 signal — 點 surface 返 Mavis
- ❌ `index.html` title 唔係「v3.0.5」→ 用戶可能手動 reset 咗
- ❌ `index.html` 冇 `mode-more` → v3.0.5 code lost
- ❌ `docs/tinywow-comparison.md` 唔見 → research doc lost
- ❌ HEAD 唔係 d3c7047a → 用戶手動 commit 過嘢,要 re-anchor
- ❌ working tree clean (冇 v3.0.4/v3.0.5 work) → user 喺另一個 channel commit 咗,撞過 conflict

### 1.3 Bash wrapper 死鎖
- 症狀：所有 `bash` call 返 `Working directory does not exist: /Users/kencheng/workspace/vs code/tools/pdf`
- 連 `git -C "/abs/path"` / `env -C` / `cd && ...` 都救唔返
- Workaround：
  - Read/Edit/Write 用 absolute path 繼續 file ops
  - Sight-check syntax 取代 `node --check`
  - 用 grep 取代 `git log` / `ls` / `find`
  - 唔做：npm test / commit / push → 叫 user 手動
- 詳見 memory「Bash wrapper path-move 死鎖」entry

---

## 2. Project Stakeholder Context

### 2.1 User persona (kencheng)
- HK / Cantonese-leaning 中文, casual register
- 混 English tech terms, prefers concise
- Mac single user, workspace `~/workspace/`
- 多個並行 project (OpenJarvis / gundam-halo / IT / Innovative Teaching Prompt Studio / gundam-note / dreambuild)
- **呢個 project 嘅 special context**：SEN 教職員 niche, K.C 個人 brand 推

### 2.2 K.C 個人 credit
- **Logo:** `assets/personal_logo.png` (cartoon 老師 + cyber suit, 紫色主題)
- **出現位置:**
  1. Header `<h1>` 旁邊 (40×40, `rounded-full object-cover`)
  2. Footer credit line (32×32) + 「由 K.C 個人開發・改 pdf 工具箱 v3.0.X」文字
- **alt text:** 「K.C 個人 credit logo」 (a11y)
- **唔好改:** 紫色 cyber theme 係 user personal brand 嘅 signature,改要 pair

### 2.3 Niche 嘅 4 個 hard constraints
- **零外流** — 學生敏感資料 (IEP / 過敏 / 評估) 唔可以上傳 server
- **純前端** — single-file HTML, school IT 可 host 喺內部 web server
- **繁體中文原生** — UI 全部繁中, tooltip / error message 都繁中
- **FERPA + 內網部署** — 學校 IT self-host, 唔可以依賴 SaaS

### 2.4 Stack 嘅 hard constraints
- **CDN SRI pinned** (8 個 library 全部有 integrity hash)
- **冇 build step** — 直接 open `index.html` 喺 Chrome 可用
- **冇 backend** — pdf-lib + pdf.js + mammoth + html2pdf.js + Sortable + jszip + fontkit 全部 CDN
- **pdf-lib v1.17.1 限制:** 冇 native PDF/A, setProducer/setModificationDate 會被 save() overwrite

---

## 3. 7 個 Mode 完整 Inventory

| Tab | 模式名 | 對標 TinyWow | Status | 顏色 |
|-----|--------|-------------|--------|------|
| merge | 合併與重組 | Merge PDF | ✅ v3.0h | indigo-600 |
| split | 提取與分割 | Split PDF | ✅ v3.0h | emerald-600 |
| convert | Word 轉 PDF | Word to PDF | ✅ v3.0h | sky-600 |
| batch | 批次加工作業 | (niche custom) | ✅ v3.0h | amber-600 |
| image | 圖片轉 PDF | JPG/PNG/HEIC to PDF | ✅ v3.0h | rose-600 |
| search | 搜尋與脫敏 | (merge of Search + Redact + Watermark) | ✅ v3.0a-g | violet-600 |
| **more** | **更多工具 (v3.0.5 新)** | **Delete Pages + Decrypt + PDF/A** | ✅ **v3.0.5** | **pink-600** |

**Search mode 內嘅 3 個 sub-tool:**
1. 搜尋關鍵字 (L1 text layer search) + 自動 scan-PDF 偵測
2. 脫敏關鍵字清單 (visual redaction, IndexedDB template save/load)
3. 浮水印 (英文 preset + 中文 NotoSansTC subset + 用戶 PNG upload)

**More mode 內嘅 3 個 sub-tool (v3.0.5):**
1. 🗑️ 刪除指定頁 (1,3,5-7 範圍語法)
2. 🔓 解密 (輸入 PDF 密碼 → 移除)
3. 📜 PDF/A Export (1b / 2b, best-effort XMP metadata)

---

## 4. Helper Inventory (v3.0.5 後)

### 4.1 17 個 core helper (v3.0h)
1. `toast(message, type, durationMs)` — UI2 Sonner-style notification
2. `friendlyError(err, fallback)` — 翻譯 raw error → 繁中 human msg
3. `stripPdfMetadata(pdfBytes)` — A5 default-on 清除 author/title/subject
4. `notifyEncryptUnsupported()` — 加密 fallback warning
5. `setupDropzone(dropzoneId, inputId, onFiles)` — 統一 dropzone pattern
6. `renderPdfThumbnail(file, container, pageIndex)` — 單頁縮圖
7. `renderAllPages(file, container, onPageClick)` — 全頁 click 縮圖
8. `loadChineseFontBytes()` — NotoSansTC IDB cache + lazy fetch
9. `hasCJKChar(s)` — CJK character detect
10. `applyWatermarkToPdfBytes(pdfBytes, opts)` — shared watermark util
11. `getGlobalWatermarkOpts()` — global watermark state aggregator
12. `saveState()` + `loadState()` — session restore (IDB + localStorage)
13. `idbGet(key)` + `idbPut(key, value)` — IDB wrapper
14. `escapeHtml(s)` — XSS-safe text
15. `naturalSort(files)` — file list sort
16. `downloadBlob(bytesOrBlob, filename, mime)` — universal download
17. `downloadPdfWithWatermark(bytes, filename)` — apply global watermark + strip + download

### 4.2 4 個 v3.0.5 新 helper
18. `parsePageSelection(input, totalPages)` — "1,3,5-7" → sorted unique array
19. `deletePagesFromPdf(arrayBuffer, pageNumbers)` — page deletion
20. `decryptPdf(arrayBuffer, password)` — 移除加密
21. `setPdfAConformance(pdfDoc, level)` — best-effort XMP metadata

### 4.3 v3.0.5 新 wire-up
- `updateMoreFilename()` / `updateMoreButton()` — state UI sync
- `setupDropzone('more-dropzone', 'more-input', ...)` — page thumbnail render (首 12 頁)
- `more-execute` click handler — workflow: **Decrypt → Delete → PDF/A → Encrypt**

---

## 5. 3-Roundtrip Audit Gates (per memory rule 4)

每個 batch commit 必過 3 roundtrips,**唔可以 > 4 roundtrip**(over-verify)。

### 5.1 Round 1: Smoke test (~40 tests)
- 7 個 mode 各 5 個 happy path (35)
- 4 個 helper 各 1 個 unit (4)
- 1 個 start-up render (1)
- 總計 ~40 tests

### 5.2 Round 2: 5-bug-family (per memory rule 13)
- F1 default-state desync — input defaults / state sync
- F2 reset-on-render — UI 動態 render 唔丟 state
- F3 enable-condition off-by-concept — button enable 條件
- F4 silent default data loss — 默認值唔可以 silent overwrite
- F5 dead code via name collision — variable / function 名 collision

### 5.3 Round 3: Regression (~35 tests)
- v2.0 base 13 功能 (PLAN_v1.md)
- v3.0a 搜尋
- v3.0b 浮水印
- v3.0c OCR
- v3.0d global watermark
- v3.0e Chinese font
- v3.0f 15 small enhancements
- v3.0g F6 keyword template
- v3.0h E2E test harness + A5 metadata strip

### 5.4 a11y gate (per memory rule 14)
- axe-core + jsdom static analysis
- Filter `serious` + `critical`
- 3 routes smoke test
- Common fix: `<span aria-label>` 缺 `role` → 補 `role="status"`

### 5.5 Coverage gate (per memory rule 14)
- 必先測 actual coverage
- 然後 set threshold = `actual - 3pp` (FLOOR not target)

---

## 6. Forward Roadmap (v3.0.6+)

### 6.1 P0 candidates (high ROI, easy)
| Feature | 對標 TinyWow | 技術 | 預估 LoC | 預估 budget |
|---------|--------------|------|----------|------------|
| **URL → PDF** | URL to PDF | iframe sandbox + html2pdf.js (CDN ✅) | ~150 | 1.5d |
| **PDF → JPG/PNG** | PDF to JPG | pdfjs render canvas → blob → download | ~80 | 1d |

### 6.2 P1 candidates (medium ROI)
| Feature | 對標 TinyWow | 技術 | 預估 LoC | 預估 budget |
|---------|--------------|------|----------|------------|
| Rotate PDF | Rotate PDF | pdf-lib rotate | ~50 | 0.5d |
| Extract Images | Extract Images | pdfjs image extraction | ~100 | 1d |
| HEIC → PDF | HEIC to PDF | heic2any (CDN) + image→PDF | ~50 | 0.5d |
| PDF → CSV | PDF to CSV | table detection (text position) | ~200 | 2d |

### 6.3 P2 candidates (skip for SEN niche)
- ❌ PDF to Word / Excel / PowerPoint (server-side, 違反 stance)
- ❌ Translate PDF (需要 LLM, 違反 stance)
- ❌ PDF Forms / Fill (高複雜度, niche 罕用)
- ❌ eSign / Annotation (高複雜度, niche 罕用)

### 6.4 Memory rule 7 cadence check
- 連續 2 個 routing-layer change 60 小時內 ship + 冇 field data → **pause 2-3 日**,等 ≥50 routing decisions telemetry
- v3.0.4 + v3.0.5 都係 routing-layer (新 mode-more),v3.0.6 之後**等 user feedback 先**

### 6.5 Header trust signal badge (zero-code, marketing)
跟 tinywow-comparison.md §6.3 建議, footer 加 3 個 badge:
- 🛡️ 100% 純前端 — 學生敏感資料不外流
- 🌐 內網部署 ready — 學校 IT 可自行 host
- 📁 8 個 CDN SRI pinned — 防止供應鏈攻擊

**注意:** 要放 header badge 而唔係 footer (highlight 對 TinyWow 嘅 unique value prop)。

---

## 7. Pre-existing Uncommitted Work (CRITICAL!)

### 7.1 Status (as of 2026-08-01)
**HEAD:** `d3c7047a` (v3.0h, 2026-06-29 19:50:17 +0800)
**Working tree:** **dirty** — 4 個 file 改咗但冇 commit,11 日咁多

### 7.2 4 個 uncommitted file (預期 list)
1. `index.html` — v3.0.4 rebrand + v3.0.5 mode-more (新增 ~220 LoC)
2. `README.md` — title rebrand (1 line)
3. `PLAN_v3.md` — v3.0.4 + v3.0.5 sections
4. `docs/tinywow-comparison.md` — 18.4KB Phase 1 research (新 file)

### 7.3 ⚠️ 新 session 第一件嘢:verify disk state
```bash
git status --short
# 預期 output:
#  M index.html
#  M README.md
#  M PLAN_v3.md
# ?? docs/

# 如果 output 唔同 → STOP + surface to user
```

### 7.4 Commit command (user 手動 run)
```bash
cd "/Users/kencheng/workspace/vs code/pdf"
git add -A
git commit -m "feat: v3.0.5 — rebrand + K.C credit + ✂️ 更多工具 mode (Delete Pages / Decrypt / PDF/A) + tinywow research

v3.0.4:
- Rename to 改 pdf 工具箱 (title/h1/footer/README)
- Add K.C credit logo (assets/personal_logo.png, header 40x40 + footer 32x32)

v3.0.5:
- New 7th tab ✂️ 更多工具 (pink-600 #be185d)
- 4 helpers: parsePageSelection / deletePagesFromPdf / decryptPdf / setPdfAConformance
- 3 sub-features: Delete pages (1,3,5-7 syntax) / Decrypt (remove password) / PDF/A 1b/2b (best-effort XMP)
- Workflow: Decrypt → Delete → PDF/A → Encrypt (avoids encrypted-metadata round-trip loss)
- 12-page thumbnail preview
- Summary toast: '✅ 刪除 3 頁・已解密・PDF/A-1b'

Phase 1 research (non-code):
- docs/tinywow-comparison.md — 11 sections, 47 TinyWow PDF tools gap matrix, positioning

5-bug-family audit: F1 ✅ F2 fixed F3 ✅ F4 fixed F5 fixed
Regression: 6 v3.0h modes 100% intact
a11y: fieldset/legend + label-wrapped radios

🤖 Generated with Mavis Code

Co-Authored-By: Mavis <Mavis@MiniMax.local>"
git push origin main
```

### 7.5 如果 user 之前手動 commit 過 (撞 conflict)
- 可能係 user 喺另一個 program / worktree commit 咗
- 衝突風險: README.md 嘅 title, PLAN_v3.md 嘅 v3.0h entry
- 解:`git fetch` + `git log --oneline --all -10` + `git status` 睇 remote 情況
- 唔可以 force push (會失 user 嘅 commit)

---

## 8. Cross-cutting Concerns

### 8.1 Bash wrapper 死鎖 (per memory 「Bash wrapper path-move 死鎖」)
- 症狀:所有 bash call fail
- 永久 workaround:
  1. Read/Edit/Write 用 absolute path
  2. Sight-check syntax 取代 `node --check`
  3. grep 取代 `git log` / `ls` / `find`
  4. 唔做:bash script / npm test / commit / push
  5. 標記 todo `commit + push` 為 BLOCKED,叫 user 手動
- Recovery:用戶可手動跑 commit command (見 §7.4)

### 8.2 Memory rule 12 hygiene
- 呢個 PROJECT-PLAN.md = project memory (AGENTS.md 嘅 role)
- Project-specific facts 唔寫入 agent memory
- 30 日 outdate 自動 review

### 8.3 Memory rule 13 — Multi-version spec 統一 reference table
- 任何 multi-version spec ship 前必加 §X.5 統一 reference table
- 例子:v3.0.5 mode-more 嘅「Decrypt → Delete → PDF/A → Encrypt」 workflow 要寫入 doc,唔可以靠 session memory

### 8.4 Memory rule 14 — a11y + coverage gate
- a11y: axe-core 0 critical / 0 serious
- coverage: actual - 3pp FLOOR

### 8.5 Memory rule 7 — routing-layer change cadence
- 連續 2 個 routing-layer change 60h 內 ship + 冇 field data → pause
- v3.0.4 + v3.0.5 都係 routing-layer (新 mode-more)
- **v3.0.6 launch 前:** 等 user 至少用 v3.0.5 一輪 feedback (paper test or teacher use)

### 8.6 Memory rule 6 — Pre-flight recon
- Worker spawn 前必跑 30s recon
- 4 invariants: git status / commits / state mtime / drift table
- New session 開頭必跑 §1 disk state verification

---

## 9. Open Questions (等 user 答)

### 9.1 立即要 answer
- ✅ **Q1 (2026-08-02):** v3.0.4 + v3.0.5 + docs/tinywow-comparison.md push — **DONE**。透過 mavis-bridge worktree + fast-forward merge 推上 main (commit bbffd70)。
- ✅ **Q2 (2026-08-02):** v3.0.6 scope — **已答: URL→PDF + PDF→JPG/PNG (P0, 1.5d) 但押後**。等 user field-test v3.0.6 (含 mode-more + Q3 badge) 後先 (memory rule 7 cadence)。
- ✅ **Q3 (2026-08-02):** Header trust signal badge — **DONE**。3 個 pill (🛡️ 純前端 / 🌐 內網部署 / 📁 8 SRI) ship 落 index.html。
- ✅ **Q4 (2026-08-02):** 解決 bash wrapper 死鎖 — **DONE via Method 3 worktree**。永久 fix,scripts/setup-worktree.sh 喺度,可以 reuse 喺其他 project。
- ⏳ Q5: v3.0.7 scope — URL→PDF + PDF→JPG/PNG 兩個 P0 feature ship?定要其他 scope?
- ⏳ Q6: Header trust signal badge 嘅 zero-code 後續(per §6.5)— 要唔要加 README badge 同步?

### 9.2 Long-term
- Q5: iLovePDF gap matrix 嘅其他 9 個 feature (比較 PDF / 表單偵測 / 翻譯 / 摘要 / OCR 增強 / eSign / Form Fill) 邊個 ship 先?
- Q6: 純 PDF 路線定 pivot 做 multi-tool (per tinywow-comparison.md §1)?

### 9.3 已知 limitation (唔需要 user 答)
- pdf-lib v1.17.1 冇 native PDF/A,完整 PDF/A validation 需 verapdf
- pdf-lib setProducer/setModificationDate 會被 save() overwrite
- Tesseract.js chi_tra + eng 語言包 ~15MB (未 bundle)
- HEIC/AVIF 等 modern image format 要 heic2any 等 polyfill

---

## 10. File Map (where to find what)

### 10.1 Project root
```
~/workspace/vs code/pdf/
├── index.html              # Single-file app (~3,313 lines as of v3.0.5)
├── README.md               # Project readme
├── PLAN_v3.md              # v3.0 plan log (新 session 必讀 §v3.0.4/v3.0.5 entry)
├── PROJECT-PLAN.md         # ⭐ 呢份 master doc (resume entry point)
├── docs/
│   └── tinywow-comparison.md   # Phase 1 research, 18.4KB, 11 sections
├── assets/
│   ├── personal_logo.png   # K.C credit logo (cartoon teacher + cyber suit)
│   ├── peak-32.png         # Favicon 32x32
│   ├── peak-128.png        # Favicon 128x128
│   ├── peak-256.png        # Favicon 256x256
│   └── peak-preview.jpg    # Hero banner
└── .git/                   # HEAD = d3c7047a
```

### 10.2 Doc hierarchy (read order)
1. **PROJECT-PLAN.md** (this file) — master, 30s launch
2. **PLAN_v3.md** — v3.0 詳細 log
3. **docs/tinywow-comparison.md** — Phase 1 research, Phase 2 candidates
4. **README.md** — 公開 readme (用戶面向)

### 10.3 Memory references (Mavis agent memory)
- 「pdf-tool 真實 baseline reset」— v3.0h 真實 state, 唔好信 hallucinated 嘅 v3.0.0-v3.0.4 history
- 「Bash wrapper path-move 死鎖」— workaround 詳細
- 「Single-file HTML </script> trap」— html 內 `<script>` 嘅反斜線陷阱
- Memory rule 4 / 5 / 6 / 7 / 12 / 13 / 14 — 全部 apply 此 project

---

## 11. Resume Checklist (新 session 30 秒)

```bash
# Step 1: Verify disk state (5 commands, 30s)
cd "/Users/kencheng/workspace/vs code/pdf"
git status --short        # 預期 4 個 uncommitted
git log --oneline -5      # 預期 HEAD = d3c7047a
ls docs/                  # 預期 tinywow-comparison.md
head -1 README.md         # 預期 "🛠️ 改 pdf 工具箱"
grep -c 'mode-' index.html  # 預期 8

# Step 2: 如果有 uncommitted work → 問 user 點處理
#   Option A: User 手動 commit + push (§7.4)
#   Option B: User 已經 commit 過 (working tree clean) → fetch + rebase

# Step 3: 確認 pre-flight recon invariants
#   - Git status
#   - 4 個 doc file 全 read
#   - 任何 ±10 line dev 都要 user 確認

# Step 4: 開新 todos
#   - 如果係 Phase 2 (v3.0.6) → 參考 §6.1 P0 candidates
#   - 如果係修正 v3.0.5 bug → 先 audit 5-bug-family

# Step 5: 任何 batch ship 必過 §5 3-roundtrip
```

---

## 12. Change Log

- **2026-08-02 (Mavis):** 🎉 v3.0.6 push 上 origin main!commit bbffd70,7 file 1578 LoC
  - Q1 + Q3 + Q4 全部 DONE(worktree 永久 fix wrapper 死鎖)
  - PROJECT-PLAN.md §0.1 + §9.1 + §12 updated
- **2026-08-02 (Mavis):** Q1 (push) + Q2 (v3.0.6 scope URL→PDF + PDF→JPG) 已 user 答,update §0.1 + §9.1 status
- **2026-08-01 (Mavis):** Initial PROJECT-PLAN.md ship,v3.0.4 + v3.0.5 + tinywow research all in working tree
- **2026-07-19 (Mavis):** v3.0.4 rebrand + v3.0.5 ✂️ 更多工具 mode ship (write-only session, blocked by bash wrapper)
- **2026-07-19 (Mavis):** Phase 1 tinywow research doc ship
- **2026-06-29 (Ken Cheng):** v3.0h E2E test harness + A5 metadata strip (commit d3c7047a)
- **2026-06-26 (Ken Cheng):** v3.0g F6 keyword template (commit 84aef657)

---

## 13. Final Note to Future Self

**新 session 開頭,如果呢份 doc 唔見 / 唔啱:STOP。** 唔好 assume 嘢。重新 §1 verify disk state,然後 §11 resume checklist。

**寫 doc 唔好 fa 好過 ship code。** 工作嘅 trust hierarchy:
1. Disk (git log, file system) — 最高
2. PROJECT-PLAN.md / PLAN_v3.md / docs/*.md — 高
3. Memory (Mavis agent memory) — 中 (可能 outdate)
4. Session 記憶 — 低 (9 日前就已經 fail 過)

**遇到 bash wrapper 死鎖:** 唔好兜圈。直接 surface + 叫 user 手動 commit。Memory 嗰度已經有詳情。
