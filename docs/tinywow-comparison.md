# TinyWow.com 對標研究 — pdf-tool 學習文件

**研究日期：** 2026-07-21
**目的：** 對標 TinyWow 嘅 multi-tool platform pattern,評估對 pdf-tool 嘅 learning 機會
**作者：** Mavis
**狀態：** Phase 1 Research,文件導向(non-code deliverable)

---

## 0. 摘要 (TL;DR)

TinyWow 係一個 **250+ online tools** 嘅 multi-tool platform,server-side 處理,freemium + ads + paywall 混合 model。對標 pdf-tool 嘅 niche(零外流/純前端 SEN 教職員站),TinyWow **唔係直接 competitor**,而係一個 **UX pattern + tool discovery 嘅 reference**。

**3 個最值得學習嘅 pattern**:
1. **Tool discovery by suite** (PDF / Image / Video / AI Write / File) — 解決咗「50+ tools 點樣 discover」嘅 scaling 問題
2. **Free-first 入口** (150+ tools 完全免費,no signup) — onboarding friction 0
3. **Featured 7 個 tool 嘅 social proof** (1M+ users, 7-Day Free Trial) — 轉化 funnel 清晰

**3 個唔啱我哋 niche 嘅 pattern**:
1. Server-side processing (我哋 stance 係零外流/純前端)
2. Freemium paywall (我哋完全免費,內網部署)
3. AI Write suite (49 個 tool,需要 cloud LLM,我哋 niche 唔包 AI)

**Phase 2 candidates** (1 個 quick win 對 SEN 老師最 relevant):
- HTML 轉 PDF (URL 輸入) — v3.0.6 候選
- 比較 PDF (diff) — v3.1 候選
- QR Code generator — v3.1 候選 (low-hanging)

---

## 1. TinyWow 公司面

### 1.1 基本資料
- **網址：** https://tinywow.com
- **Tagline：** "Free AI Writing, PDF, Image, and other Online Tools"
- **註冊：** 美國 Delaware
- **Owner 背景：** 母公司運作 Alphr + TechJunkie 兩個 tech website
- **Server：** 美國 (PostHog analytics 用 `us.i.posthog.com`)
- **市場：** 國際,但定價頁有 ¥129/月(人民幣),亞洲用戶 subset 重要

### 1.2 規模
- **250+ tools** (5 個 suite)
- **1M+ users** (per paywall 截圖)
- **Server-side processing** — 用戶 upload 1 小時後自動刪除

### 1.3 商業模式
| Plan | 價錢 (USD) | 價錢 (RMB) | 包乜 |
|------|-------------|------------|------|
| Free | $0 | ¥0 | 150+ tools, 有 ads + CAPTCHA,no signup |
| Supporter | $5.99/mo 或 $49.99/yr | ~¥40/mo | 移除 ads + CAPTCHA |
| Unlimited (Premium) | $15/mo 或 $125/yr (~$10.42/mo) | ¥129/mo 或 ¥999/yr | 250+ tools, 0 upload limit |
| Content Machine | $89/mo 或 $749/yr | - | 30 blog post/月 + WordPress/Webflow auto-publish |

**Hidden cost:** Premium 取消後立刻斷服務(無 grace period),「Once your month is done, you're empty-handed unless you pay up again」 — 設計上有 churn 風險。

### 1.4 Tech stack 推斷
從 homepage HTML source 推斷:
- **Frontend framework:** Tailwind CSS v3 + Bootstrap v4 (混合使用!)
- **JS:** jQuery 3.5.1 + Lucide icons (vanilla JS)
- **Payment:** Stripe v3
- **Analytics:** Google Analytics (UA-2458138-50) + PostHog (open-source product analytics)
- **Server:** Laravel/PHP 似 (CSRF token + `/main/send-suggestion` endpoint pattern)
- **File processing:** Server-side workers (Python / Node / FFmpeg? — 推斷)
- **Feature flags:** PostHog feature flags

**觀察：** TinyWow 嘅 tech stack 唔算 modern(2026 年仍然 jQuery + Bootstrap v4),證明 content 比起 tech freshness 重要。對我哋 single-file HTML 嘅 6-mode pdf-tool 嚟講,TinyWow 嘅 simplicity 反而係 reference 嘅一面鏡。

---

## 2. Tool Inventory 完整分類

### 2.1 5 個 Suite 嘅 function 數
| Suite | Function 數 | 主要 domain |
|-------|-------------|-------------|
| **PDF Tools** | 47 | 文件管理 (PDF 入 + 出) |
| **Image Tools** | 71 | 圖片處理 (最大) |
| **Video Tools** | 56 | 影片轉檔/下載/編輯 |
| **AI Write** | 49 | LLM text generation |
| **File Tools** | 8 | 一般 file conversion |
| **總計** | **~250** | |

### 2.2 PDF Tools 完整 47 個 list (對標最重要)
**PDF 入面 / 編輯 (25 個):**
1. Merge PDF
2. Split PDF
3. Compress PDF
4. Edit PDF (full editor)
5. Create PDF
6. eSign PDF
7. Protect PDF (encrypt)
8. Unlock PDF (decrypt)
9. Rotate PDF
10. Rearrange PDF
11. Delete PDF Pages
12. Crop PDF
13. Resize PDF
14. Add Watermark
15. Add Numbers to PDF (page numbers)
16. Annotate PDF
17. Add Text to PDF
18. Change Background
19. Extract Images from PDF
20. Extract Text from PDF
21. PDF Watermark Remover
22. Translate PDF
23. PDF Translator
24. PDF Forms
25. Fill PDF Forms

**PDF 出面 — 轉做其他 format (15 個):**
26. PDF to Word
27. Word to PDF
28. PDF to Excel
29. Excel to PDF
30. PDF to PowerPoint
31. PowerPoint to PDF
32. PDF to JPG
33. JPG to PDF
34. PDF to PNG
35. PNG to PDF
36. PDF to TIFF
37. TIFF to PDF
38. PDF to EPUB
39. EPUB to PDF
40. PDF to MOBI / AZW3
41. MOBI to PDF
42. PDF to CSV (table extract)
43. PDF to Text (plain)
44. PDF to HTML
45. URL to PDF (網址 → PDF)

**其他 (2 個):**
46. WebP to PDF
47. HEIC to PDF + GIF to PDF + EPS to PDF

### 2.3 Image Tools 71 個 (highlights)
- Remove background / Blur background
- Upscale image (AI)
- Photo cleanup (AI object removal)
- Image generator (AI text-to-image)
- Profile photo maker
- Chart creator
- Meme maker
- Pixelate / Unblur image
- HEIC / WebP / SVG / PNG / JPG conversion
- URL to JPG/PNG (screenshot)
- Image to text (OCR)

### 2.4 Video Tools 56 個 (highlights)
- Compress video / Video to GIF
- MP4 to MP3 / Trim video / Mute video
- Facebook / Instagram / Twitter video download
- Video to WebP

### 2.5 AI Write 49 個
- Paragraph writer / Essay writer / Sentence rewriter
- YouTube script / Cold email / Content planner
- Grammar checker
- Lorem ipsum / Epoch converter

---

## 3. UX Pattern 分析

### 3.1 Homepage layout
- **Hero:** Title + 搜尋 box (top of fold) — 即刻可用
- **Suite 分類:** 5 個 suite 嘅 card 入口
- **Featured tools:** 7 個 (PDF Creator / Background Remover / Photo Cleanup / Image Generator / PDF Editor / Profile Photo Maker / Chart Creator)
- **"Latest tools" 區**
- **Pricing CTA** 喺中段

### 3.2 Tool page pattern
每個 tool 嘅 page 結構統一:
1. Tool name + 1-line description
2. Upload dropzone (大、簡潔、單一 call-to-action)
3. Optional settings (進階選項 collapsed)
4. Big execute button
5. 結果 preview + download

**冇 multi-step wizard。** 1 個 tool = 1 個 page = 1 個 action。對 SEN 老師嚟講呢個 pattern 容易理解。

### 3.3 PDF Editor 嘅例外
`https://tinywow.com/pdf/edit` 係少數 multi-tool page 嘅例外:
- 上傳後直接見到 PDF preview canvas
- Text/image/shape annotation toolbar
- 1-click save

但佢 server-side,client-side 真做唔到(annotation 要 track 改動 history)。

### 3.4 Pricing UX
- 4 個 plan 但**預設隱藏** paywall (用戶必須 hit limit 先見到)
- 「Start 7-Day Free Trial」 — 信用卡 capture 但 7 日後先 charge
- 移除 ads + CAPTCHA 嘅 $5.99 tier 係 **max-conversion tier**(用戶主要痛點)

### 3.5 Onboarding
- **No signup required** — 用戶即刻用
- Email collection **deferred to first paid action**
- 「Suggest a Tool」modal 喺用戶 idle 一段時間後先 trigger(engagement play)

---

## 4. 對標 pdf-tool 嘅 Gap Matrix

### 4.1 pdf-tool 嘅 niche 確認
- **Stack:** Single-file HTML + 6 個 PDF mode + 純前端 pdf-lib/pdf.js (CDN)
- **Niche:** 零外流/純前端/SEN 教職員/FERPA compliant
- **Mode count:** 6 + 1 (v3.0.5 更多工具) = 7
- **Plan:** 完全免費,內網部署,無 ads

### 4.2 Gap matrix (TinyWow 有, 我哋有/冇)

| TinyWow tool | 我哋有冇 | 技術難度 | SEN 適用? | 建議 |
|--------------|----------|----------|----------|------|
| **Merge PDF** | ✅ v3.0h | - | ✅ 常用 | ship 咗 |
| **Split PDF** | ✅ v3.0h | - | ✅ 常用 | ship 咗 |
| **Compress PDF** | ✅ v3.0h | - | ✅ 偶用 | ship 咗 |
| **Edit PDF** | ❌ | 高(annotation state mgmt) | ⚠️ 偶用 | v3.1+ |
| **Create PDF** (blank) | ❌ | 低 | ⚠️ 罕用 | 唔 ship |
| **eSign PDF** | ❌ | 中(canvas overlay) | ⚠️ 偶用 | v3.2+ |
| **Protect PDF (encrypt)** | ✅ v3.0h | - | ✅ 必需 | ship 咗 |
| **Unlock PDF (decrypt)** | ✅ v3.0.5 | - | ✅ 必需 | ship 咗 |
| **Rotate PDF** | ❌ | 低 | ⚠️ 偶用 | v3.1 candidate |
| **Rearrange PDF** | ✅ v3.0.2 (partial via edit) | - | ✅ 偶用 | ship 咗 |
| **Delete PDF Pages** | ✅ v3.0.5 | - | ✅ 偶用 | ship 咗 |
| **Crop PDF** | ❌ | 中 | ⚠️ 罕用 | v3.2+ |
| **Add Watermark** | ✅ v3.0b | - | ✅ 常用 | ship 咗 |
| **Add Numbers (page nums)** | ✅ v3.0h (batch) | - | ✅ 常用 | ship 咗 |
| **Annotate PDF** | ❌ | 高 | ❌ 罕用 | **唔 ship** |
| **Add Text to PDF** | ❌ | 中(字型 subset) | ⚠️ 偶用 | v3.2+ |
| **Change Background** | ❌ | 中 | ❌ 罕用 | **唔 ship** |
| **Extract Images from PDF** | ❌ | 低 | ⚠️ 偶用 | v3.1 candidate |
| **Extract Text from PDF** | ✅ v3.0a (search) | - | ✅ 必需 | ship 咗 |
| **PDF Watermark Remover** | ❌ | 中(可能 server-side) | ❌ 罕用 | **唔 ship** |
| **Translate PDF** | ❌ | 高(需要 LLM) | ❌ 唔啱 niche | **唔 ship** |
| **PDF Forms / Fill** | ❌ | 高 | ⚠️ 偶用 | v3.2+ |
| **PDF to Word** | ❌ | 高(server-side) | ❌ 唔啱 | **唔 ship** |
| **Word to PDF** | ✅ v3.0h (mammoth) | - | ✅ 偶用 | ship 咗 |
| **PDF to Excel** | ❌ | 高 | ❌ 罕用 | **唔 ship** |
| **Excel to PDF** | ❌ | 中 | ❌ 罕用 | **唔 ship** |
| **PDF to PowerPoint** | ❌ | 高 | ❌ 罕用 | **唔 ship** |
| **PowerPoint to PDF** | ❌ | 中 | ❌ 罕用 | **唔 ship** |
| **PDF to JPG/PNG** | ❌ | 低 (canvas render) | ⚠️ 偶用 | **v3.0.6 candidate** |
| **JPG/PNG to PDF** | ✅ v3.0h (image mode) | - | ✅ 常用 | ship 咗 |
| **PDF to TIFF** | ❌ | 低 | ❌ 罕用 | **唔 ship** |
| **PDF to EPUB** | ❌ | 中 | ❌ 罕用 | **唔 ship** |
| **PDF to MOBI/AZW3** | ❌ | 中 | ❌ 罕用 | **唔 ship** |
| **PDF to CSV** | ❌ | 中(table extract) | ⚠️ 偶用 | v3.1+ |
| **PDF to Text (plain)** | ✅ (search 內部 use) | - | ✅ 常用 | ship 咗 |
| **PDF to HTML** | ❌ | 中 | ❌ 罕用 | **唔 ship** |
| **URL to PDF (網址)** | ❌ | 高(iframe + html2pdf) | ✅ **常用** | **v3.0.6 P0** |
| **PDF/A Export** | ✅ v3.0.5 | - | ✅ 偶用 | ship 咗 |

### 4.3 計數
- **已 ship:** 14 個 (對齊 TinyWow 嘅 47 個 PDF tool)
- **P0 candidates (high ROI):** 2 個 (URL to PDF, PDF to JPG)
- **P1 candidates (medium ROI):** 4 個 (Rotate, Extract Images, Add Text, PDF to CSV)
- **唔 ship:** 25 個 (server-side 需要, 或 niche 唔啱)

### 4.4 Coverage
- 我哋 v3.0.5 覆蓋 14 / 47 = **30%** of TinyWow 嘅 PDF suite
- 加 v3.0.6 candidates 後 16 / 47 = **34%**
- 對 SEN niche 嚟講,呢個 coverage **已經夠用** — 我哋唔需要 chase 100% parity

---

## 5. 對標 Image / Video / AI / File Suites

### 5.1 我哋 0 個 coverage 嘅 4 個 suite

| Suite | TinyWow 數 | 我哋 status | 學習機會 |
|-------|-----------|------------|---------|
| **Image (71 個)** | ✅ 已有 (image→PDF mode) | 7 個 image→PDF 變奏 | ❌ niche 唔啱 (SEN 唔做 image editing) |
| **Video (56 個)** | ❌ 0 個 | 0 個 | ❌ 完全唔啱 niche, server-side 必要 |
| **AI Write (49 個)** | ❌ 0 個 | 0 個 | ❌ 需要 LLM API, 違反零外流 stance |
| **File (8 個)** | ⚠️ 部分 (PDF/image 跨 format) | 部分 | ⚠️ v3.1+ 考慮 |

**結論:** 對 SEN 教職員 niche 嚟講,Image/Video/AI Write 3 個 suite **完全唔啱**,**唔應該 chase**。File suite 嘅 generic file conversion 對 SEN niche 嚟講**有 1 個 case (HEIC→PDF) 值得做**(iPhone 用戶 SEN 老師常見痛點)。

---

## 6. UX Pattern 嘅 3 個 Learning 機會

### 6.1 Tool discovery by suite
**TinyWow pattern:** 5 個 suite 嘅 card 入口
**我哋現在:** 7 個 tab 嘅 flat nav
**我哋 v3.0+ 考慮:** 如果 mode 數 > 12 個,加 suite 概念。但暫時 7 個 mode 唔需要。

**Decision:** **唔 ship suite nav**。保持 7 個 flat tab。等 > 12 個 mode 先 re-evaluate。

### 6.2 Tool page pattern (1 tool = 1 action)
**TinyWow pattern:** 每個 tool 一個 page, 1 個 upload + 1 個 execute
**我哋現在:** Multi-tool per mode (search mode 入面包 search + redaction + watermark 3 個 sub-tool)
**我哋 v3.0+ 考慮:** 隨 mode 數增長,可能需要拆 sub-tool 做獨立 mode。

**Decision:** **暫時維持 multi-tool-per-mode**。Multi-tool-per-mode 對 desktop 用戶嚟講 density 好,SEN 老師 desktop 係 primary (記憶: Gundam-design constraint 唔適用呢度,但 SEN 老師 desktop first 係 common sense)。

### 6.3 Featured tool 嘅 social proof
**TinyWow pattern:** 7 個 featured tool + 「1M+ users」+ 7-day free trial CTA
**我哋現在:** 簡單 footer 「所有檔案均在本地端處理」
**我哋 v3.0+ 考慮:** Footer 加 K.C credit (✅ 已 v3.0.4 ship) + 「100% 零外流/純前端」badge + 「內網部署 ready」 trust signal

**Decision:** **部分 ship — v3.0.4 已加 K.C credit**。再加 trust signal 喺 footer:
- 🛡️ **100% 純前端** — 學生敏感資料不外流
- 🌐 **內網部署 ready** — 學校 IT 可自行 host
- 📁 **8 個 CDN SRI pinned** — 防止供應鏈攻擊

呢 3 個 trust signal **係我哋對 TinyWow 嘅 unique value prop** (memory: 「Open-source 中文 PDF 工具 niche」entry)。要 highlight 喺 header badge 而唔係 footer。

---

## 7. Phase 2 Feature 候選清單

### 7.1 P0 (high ROI, easy to ship)
| Feature | 對標 | 技術 | 預估 LoC | v3.0.6 scope? |
|---------|------|------|----------|---------------|
| **URL → PDF** | TinyWow URL to PDF | iframe sandbox + html2pdf.js (✅ 已喺 v3.0h CDN) | ~150 LoC | ✅ **建議 ship** |
| **PDF → JPG/PNG** | TinyWow PDF to JPG | pdfjs render canvas → blob → download | ~80 LoC | ✅ **建議 ship** |

### 7.2 P1 (medium ROI, longer)
| Feature | 對標 | 技術 | 預估 LoC | v3.1 scope? |
|---------|------|------|----------|-------------|
| **Rotate PDF** | TinyWow Rotate PDF | pdf-lib rotate | ~50 LoC | ✅ |
| **Extract Images from PDF** | TinyWow Extract Images | pdfjs image extraction | ~100 LoC | ✅ |
| **PDF → CSV** | TinyWow PDF to CSV | table detection (text position based) | ~200 LoC | ⚠️ |
| **HEIC → PDF** | TinyWow HEIC to PDF | heic2any (CDN) + image→PDF | ~50 LoC | ✅ |
| **eSign PDF** | TinyWow eSign PDF | canvas overlay | ~300 LoC | ⚠️ |

### 7.3 P2 (skip for SEN niche)
- PDF to Word / Excel / PowerPoint (server-side, 違反 stance)
- Translate PDF (需要 LLM)
- PDF Forms / Fill (高複雜度, SEN niche 罕用)
- Annotate PDF (高複雜度, SEN niche 罕用)

---

## 8. 對標 Positioning Statement

### 8.1 TinyWow positioning
> "Free AI Writing, PDF, Image, and other Online Tools"
> — 國際化、quantitative、category 寬

### 8.2 pdf-tool positioning (建議更新)
> "🛠️ 改 pdf 工具箱 — 100% 純前端、零外流、FERPA compliant 嘅 SEN 教職員 PDF 工作站。支援合併/分割/搜尋/脫敏/浮水印/解密/PDF-A,內網部署 ready,中文原生介面。"

**差異化 (vs TinyWow):**
- ✅ **零外流** — TinyWow 係 server-side,敏感資料要 upload
- ✅ **FERPA compliant** — 學校 IT 可自行 host
- ✅ **中文原生** — TinyWow 全部英文
- ✅ **完全免費, 0 ads, 0 paywall** — TinyWow 4 個 tier 嘅 paywall
- ❌ **Coverage 30%** — TinyWow 47 個 PDF tool vs 我哋 14 個 (但 niche 唔 chase 100%)

**Trade-off acceptance:**
- Coverage 30% < 100% (放棄 niche-irrelevant tools)
- UX depth < TinyWow (放棄 eSign / Forms / Annotation)
- Tech freshness 相似 (jQuery vs vanilla JS 都唔算 modern)

---

## 9. Phase 2 Recommendation

**優先順序:**
1. **v3.0.6 — URL to PDF + PDF to JPG/PNG (1 batch, 1.5d)** — 補齊我哋對標 TinyWow 嘅 2 個 P0
2. **v3.0.7 — Header trust signal badge** (zero-code 嘅 marketing move)
3. **v3.1 — Rotate PDF + Extract Images + HEIC to PDF (1 batch, 2d)** — 補 P1
4. **v3.2+ — eSign / Forms / CSV extract** (per user demand)

**唔做嘅:**
- ❌ Image suite expansion (SEN niche 唔啱)
- ❌ Video suite (server-side 必要)
- ❌ AI Write suite (違反 zero-exfil stance)
- ❌ 50+ tool 嘅 scope chase (memory rule 7 講 routing-layer change cadence, generic 工具 race 我哋 niche 唔 match)

---

## 10. 學習點 (cross-project)

呢個 research 嘅 4 個 cross-project 學習:

### 10.1 Single-purpose tool vs multi-tool platform
- TinyWow 嘅 250+ tools 係 **breadth play**, 我哋 14 個 PDF tool 係 **depth play**
- Breadth 贏 SEO, depth 贏 niche trust
- SEN niche 已經 validate 過 depth play (memory: 「中文 + FERPA + 內網」三件)
- **唔好 chase breadth 除非 user 明確 demand** (memory rule 1)

### 10.2 Server-side vs client-side 嘅 stance trade-off
- TinyWow 嘅 250+ tools **冇可能全 client-side** (video conversion, AI write, OCR enterprise-grade 都係 server)
- 我哋 stance: **client-side only** 換 niche trust + 內網 deployability
- Trade-off: 放棄 breadth 換 depth

### 10.3 Freemium 嘅 hidden cost
- TinyWow 嘅 Premium 取消即刻斷服務,**呢個 design 對 B2C casual user OK, 但對 B2B/學校 IT 唔 OK**
- 我哋 0-paywall stance 對 SEN 學校 IT 嚟講係 **殺手鐧 feature** (deployment 唔需要擔心 license 過期)

### 10.4 Tech stack 唔等於 product quality
- TinyWow 2026 年仍然 jQuery + Bootstrap v4
- 我哋 single-file HTML + Tailwind CDN
- 兩者都 **content-first, tech 唔係重點**
- 學到嘢:**唔好 optimize 緊 tech stack 而忽略 content**

---

## 11. Reference Sources

1. **TinyWow homepage** — https://tinywow.com
2. **TinyWow about page** — https://tinywow.com/about
3. **TinyWow tools index** — https://tinywow.com/tools
4. **TinyWow PDF tools** — https://tinywow.com/tools/pdf
5. **TinyWow PDF editor** — https://tinywow.com/pdf/edit
6. **Pricing review (aidetectplus.com)** — https://aidetectplus.com/blog/tinywow-review
7. **TinyWow review (thedatascientist.com)** — https://thedatascientist.com/tinywow-a-free-all-in-one-toolkit-for-pdfs-image/
8. **TinyWow support hub PDF list** — https://eview.freshdesk.com/support/solutions/articles/48001211690-tinywow-edits-to-pdfs-videos-images-more
9. **Indie hackers revenue discussion** — https://www.indiehackers.com/post/how-does-this-site-makes-revenue-any-more-examples-like-this-c5abac37d4

---

**Status:** Phase 1 Research COMPLETE
**Next:** 等 user 揀 Phase 2 scope (建議 v3.0.6: URL→PDF + PDF→JPG/PNG)
**Blockers:** Bash wrapper 死鎖 (舊 path 死,新 path 入到) — 影響 git commit/push
