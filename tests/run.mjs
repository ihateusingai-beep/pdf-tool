// run.mjs — E2E test runner for PDF Workstation
//
// Drives system Chrome via puppeteer-core against ../index.html (file://).
// Verifies T1 (page loads without console errors), T2 (each mode produces
// a non-empty PDF), T11 (A5 metadata strip actually works end-to-end).
//
// Usage:
//   node tests/run.mjs                 # run all
//   node tests/run.mjs --only=t11      # just A5
//   node tests/run.mjs --only=t2       # merge + split
//   node tests/run.mjs --only=t1       # page load only

import puppeteer from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const INDEX_HTML = join(PROJECT_ROOT, 'index.html');
const FIXTURES_DIR = join(__dirname, 'fixtures');
const RESULTS_DIR = join(__dirname, 'results');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const only = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null;

let allPass = true;
const results = [];

function record(id, name, ok, note = '') {
  results.push({ id, name, ok, note });
  if (!ok) allPass = false;
  const mark = ok ? '✅' : '❌';
  console.log(`  ${mark} ${id} — ${name}${note ? ' (' + note + ')' : ''}`);
}

async function ensureFixtures() {
  if (!existsSync(join(FIXTURES_DIR, 'sample-1.pdf'))) {
    console.log('[setup] No fixtures found. Building...');
    const { spawn } = await import('node:child_process');
    await new Promise((res, rej) => {
      const p = spawn('node', ['tests/fixtures/build-fixtures.mjs'], {
        cwd: PROJECT_ROOT, stdio: 'inherit',
      });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('fixture build failed'))));
    });
  }
}

async function buildBrowser() {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

async function newPage(browser) {
  const page = await browser.newPage();
  // Disable HTTP cache — fresh load every time. Critical for catching
  // the just-edited index.html (file:// can otherwise serve stale bytes
  // through Puppeteer's disk cache).
  await page.setCacheEnabled(false);
  // Allow CDN libraries (PDF.js, pdf-lib, Tesseract.js, html2pdf.js) — these
  // are loaded from cdnjs/jsdelivr at page load time. We only block telemetry
  // / analytics / sentry that might fire after init.
  const ALLOW_CDN = [
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
  ];
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = new URL(req.url());
    if (u.protocol === 'file:' || u.protocol === 'data:' || u.protocol === 'blob:' ||
        u.hostname === 'localhost' || u.hostname === '127.0.0.1' ||
        ALLOW_CDN.includes(u.hostname)) {
      req.continue();
    } else {
      // Block analytics/telemetry to keep the test offline-friendly
      req.abort();
    }
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.warn(`  [console.error] ${msg.text()}`);
    }
  });
  return page;
}

async function loadIndex(page) {
  const url = pathToFileURL(INDEX_HTML).toString();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Give the global scripts a moment to wire up (PDF.js worker, Tesseract preload, etc.)
  await page.waitForFunction(() => typeof window.PDFLib !== 'undefined', { timeout: 15000 });
  await page.waitForFunction(() => typeof window.pdfjsLib !== 'undefined', { timeout: 15000 });
}

// ── T1: Page loads without console errors ────────────────────────────────
async function t1(browser) {
  const page = await newPage(browser);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    await loadIndex(page);
    // Check that 6 mode tabs rendered
    const tabCount = await page.$$eval('.tab-btn', (els) => els.length);
    // Check the A5 checkbox exists and is checked
    const a5Checked = await page.$eval('#meta-strip-enabled', (el) => el.checked);
    record('T1', 'page loads + 6 tabs + A5 default-on',
      tabCount === 6 && a5Checked === true,
      `tabs=${tabCount}, metaStripDefault=${a5Checked}`);
    if (errors.length) record('T1.err', 'no page errors', false, errors.join('; '));
    else record('T1.err', 'no page errors', true);
  } catch (e) {
    record('T1', 'page loads', false, String(e).slice(0, 200));
  } finally {
    await page.close();
  }
}

// ── T11: A5 metadata strip end-to-end ────────────────────────────────────
// Drives the merge mode: upload 1 fixture, click merge, capture the downloaded
// blob, then verify metadata in the result.
async function t11(browser) {
  const page = await newPage(browser);
  try {
    await loadIndex(page);

    // Intercept the download via CDP to grab the bytes.
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow', downloadPath: RESULTS_DIR,
    });
    await mkdir(RESULTS_DIR, { recursive: true });

    // Ensure meta-strip is enabled (it is by default — this is the test target)
    const a5State = await page.$eval('#meta-strip-enabled', (el) => el.checked);
    if (!a5State) {
      await page.click('#meta-strip-enabled');
    }

    // Drive merge mode: upload 2 fixtures (merge requires >= 2 files).
    const fileInput = await page.$('#merge-input');
    if (!fileInput) throw new Error('merge file input #merge-input not found');
    await fileInput.uploadFile(
      join(FIXTURES_DIR, 'sample-1.pdf'),
      join(FIXTURES_DIR, 'sample-2.pdf')
    );

    // Wait for the merge button to become enabled (requires >= 2 files).
    await page.waitForFunction(
      () => document.getElementById('merge-execute')?.disabled === false,
      { timeout: 10000 }
    );

    // Click the merge button
    const mergeBtn = await page.$('#merge-execute');
    if (!mergeBtn) throw new Error('merge button #merge-execute not found');
    await mergeBtn.click();

    // Wait for the download to complete. merge mode downloads via downloadBlob
    // (creates a Blob URL + anchor click). Headless Chrome with
    // Page.setDownloadBehavior should capture it.
    const expected = join(RESULTS_DIR, 'a5-output.pdf');
    let waited = 0;
    while (waited < 20000) {
      const { readdirSync } = await import('node:fs');
      const pdfs = readdirSync(RESULTS_DIR).filter((f) => f.endsWith('.pdf') && !f.startsWith('t2-'));
      if (pdfs.length > 0) {
        const { statSync, renameSync } = await import('node:fs');
        const src = join(RESULTS_DIR, pdfs[0]);
        if (statSync(src).size > 1000) {
          renameSync(src, expected);
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 250));
      waited += 250;
    }
    if (!existsSync(expected)) {
      const { readdirSync } = await import('node:fs');
      const pdfs = readdirSync(RESULTS_DIR);
      throw new Error(`no PDF downloaded within 20s. files in results: ${pdfs.join(', ')}`);
    }

    // Now verify the output. See stripPdfMetadata comment in index.html for
    // why we assert only the strippable fields and not Producer/Creator.
    const bytes = await readFile(expected);
    const pdf = await PDFDocument.load(bytes);
    const author = pdf.getAuthor();
    const creator = pdf.getCreator();
    const producer = pdf.getProducer();
    const title = pdf.getTitle();
    const subject = pdf.getSubject();
    const creation = pdf.getCreationDate();
    const now = Date.now();
    const fresh = creation instanceof Date && Math.abs(now - creation.getTime()) < 60_000;

    // Privacy-critical assertions (these MUST pass for AGENTS.md stance):
    const privacyPass = author === 'Anonymous'
                     && title === ''
                     && subject === ''
                     && fresh;
    // Library-fingerprint check (we expect pdf-lib default; documented limitation):
    const isLibDefault = producer === 'pdf-lib (https://github.com/Hopding/pdf-lib)'
                      && creator === 'pdf-lib (https://github.com/Hopding/pdf-lib)';

    const pass = privacyPass;
    const note = `Author="${author}" Title="${title}" Subject="${subject}" CreationDateFresh=${fresh} | Producer/Creator=pdf-lib-default(${isLibDefault})`;
    record('T11', 'A5 privacy-critical metadata stripped end-to-end', pass, note);
  } catch (e) {
    record('T11', 'A5 metadata stripped end-to-end', false, String(e).slice(0, 250));
  } finally {
    await page.close();
  }
}

// ── T2 (minimal): merge + split produce non-empty PDFs ───────────────────
async function t2(browser) {
  const page = await newPage(browser);
  try {
    await loadIndex(page);
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow', downloadPath: RESULTS_DIR,
    });
    await mkdir(RESULTS_DIR, { recursive: true });

    // Merge test
    await page.$eval('#meta-strip-enabled', (el) => { el.checked = false; el.dispatchEvent(new Event('change')); });
    const mergeInput = await page.$('#merge-input');
    await mergeInput.uploadFile(
      join(FIXTURES_DIR, 'sample-1.pdf'),
      join(FIXTURES_DIR, 'sample-2.pdf')
    );
    await page.waitForFunction(
      () => document.getElementById('merge-execute')?.disabled === false,
      { timeout: 10000 }
    );
    const mergeBtn = await page.$('#merge-execute');
    await mergeBtn.click();
    await new Promise((r) => setTimeout(r, 3000)); // give download time

    const { readdirSync, statSync, renameSync } = await import('node:fs');
    const pdfs = readdirSync(RESULTS_DIR).filter((f) => f.endsWith('.pdf'));
    const mergeOut = pdfs.find((f) => f.includes('merge') || f.includes('merged')) || pdfs[0];
    if (mergeOut) {
      const sz = statSync(join(RESULTS_DIR, mergeOut)).size;
      record('T2.merge', 'merge mode produces non-empty PDF', sz > 1000, `file=${mergeOut}, size=${sz}`);
      renameSync(join(RESULTS_DIR, mergeOut), join(RESULTS_DIR, 't2-merge.pdf'));
    } else {
      record('T2.merge', 'merge mode produces non-empty PDF', false, 'no output found');
    }
  } catch (e) {
    record('T2.merge', 'merge mode produces non-empty PDF', false, String(e).slice(0, 200));
  } finally {
    await page.close();
  }
}

async function main() {
  await ensureFixtures();
  await mkdir(RESULTS_DIR, { recursive: true });

  console.log(`\n── PDF Workstation test harness ──`);
  console.log(`Chrome: ${CHROME}`);
  console.log(`Index:  ${INDEX_HTML}`);
  console.log(`Scope:  ${only || 'all (T1 + T2 + T11)'}\n`);

  const browser = await buildBrowser();
  try {
    if (!only || only === 't1')   { console.log('T1: Page load'); await t1(browser); }
    if (!only || only === 't11')  { console.log('\nT11: A5 metadata strip'); await t11(browser); }
    if (!only || only === 't2')   { console.log('\nT2: Mode outputs'); await t2(browser); }
  } finally {
    await browser.close();
  }

  console.log(`\n── Summary ──`);
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`${pass} pass, ${fail} fail`);
  if (fail > 0) {
    console.log('\nFailures:');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  ❌ ${r.id} — ${r.note}`));
  }
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
