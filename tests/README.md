# PDF Workstation — Test Harness

Pure-frontend E2E tests for the single-file SPA at `../index.html`. **Zero backend**, **zero network** during test run (all deps vendored via `node_modules`, no CDN calls during test).

## What it covers

| Test ID | What it verifies | Status |
|---------|------------------|--------|
| **T1** | `index.html` loads without console errors; PDF.js / pdf-lib / Tesseract.js / html2pdf.js all resolve via CDN (only at test setup, not at test time) | ✅ implemented |
| **T2** | Each of the 6 modes (merge / split / convert / batch / image / search) produces a non-empty, valid PDF output | 🟡 minimal — only merge + split covered so far |
| **T11** | **A5 PDF metadata auto-strip** — when `state.metaStripEnabled === true` (default), exported PDF has `Author === "Anonymous"`, `Creator === ""`, `Producer === ""`, fresh `CreationDate` | ✅ implemented |

## Run

```bash
# First time only — install in this isolated dir
cd tests
npm install

# Run everything
npm test

# Run individual test
npm run test:t11   # fastest (~10s, just A5 verify)
npm run test:t2    # ~30s, runs merge + split
npm run test:t1    # ~5s, just loads page
```

## Architecture

- **`puppeteer-core`** (not `puppeteer`) — connects to **system Chrome** at `/Applications/Google Chrome.app`. Avoids downloading the 280MB bundled Chromium. Confirmed in `run.mjs` via `executablePath`.
- **No `package.json` at repo root** — keeps the PDF Workstation single-file SPA truly zero-dep at the user-facing level. Test deps live entirely under `tests/`.
- **Fixtures**: minimal PDFs generated on first run by `fixtures/build-fixtures.mjs` using `pdf-lib`. Avoids committing binary blobs to git.
- **No network during test** — Puppeteer blocks all non-`localhost` / non-`file://` requests once the page is loaded (see `run.mjs` `await page.setRequestInterception(true)`).

## What's NOT covered yet

- T3 (memory leak — 10 PDF merge heap < 500MB)
- T4 (browser matrix — only system Chrome is tested; Firefox/Safari are user-verified)
- T5 (edge cases — encrypted, 0-page, 1000-page, CJK-mix PDFs)
- T6 (network off — requires special puppeteer config)
- T7 (a11y — needs axe-core integration)
- T8/T9/T10 (perf benchmarks, IndexedDB diff, 50-PDF stress)

These are deferred. The T1/T2/T11 trio is the **minimal regression net** for sprint work.

## Why this exists

PROPOSAL.md flagged 15 small enhancements + 5 medium features over the v3.0 cycle. Each `git commit` could silently break a mode (proven by the v3.0 `html2pdf.js` blank-output bug → iframe-srcdoc workaround). Without a test harness, every change is a coin flip.

T11 specifically protects the **A5 stance fix** — if someone accidentally wires `state.metaStripEnabled = false` as default, students' metadata would leak. This test fails fast.
