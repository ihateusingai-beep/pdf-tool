// fixtures/build-fixtures.mjs
//
// Generates minimal valid PDF fixtures into tests/fixtures/ on first run.
// Uses pdf-lib (vendored under tests/node_modules). No binary blobs in git.
//
// Each fixture is a 2-page A4 PDF with author "Ken Cheng" + producer "PDFKit"
// + creation date "2020-01-01" — to verify A5 metadata strip actually
// overwrites these to Anonymous / "" / fresh date.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;  // write alongside the script

const FIXTURES = [
  { name: 'sample-1.pdf', label: 'Fixture 1', author: 'Ken Cheng' },
  { name: 'sample-2.pdf', label: 'Fixture 2', author: 'Ken Cheng' },
  { name: 'sample-encrypted-marker.pdf', label: 'Encrypted Marker', author: 'Sensitive' },
];

async function makeFixture({ name, label, author }) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setAuthor(author);
  pdfDoc.setCreator('PDFKit Test Source');
  pdfDoc.setProducer('PDFKit Test Producer');
  pdfDoc.setCreationDate(new Date('2020-01-01T00:00:00Z'));
  pdfDoc.setModificationDate(new Date('2020-01-01T00:00:00Z'));
  pdfDoc.setTitle(`${label} (fixture for tests)`);
  pdfDoc.setSubject('PDF Workstation test fixture — verifies A5 metadata strip');

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = [pdfDoc.addPage(), pdfDoc.addPage()];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    page.drawText(`${label} — page ${i + 1} of ${pages.length}`, {
      x: 50, y: height - 80, size: 24, font, color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText('This is a test fixture for the PDF Workstation.', {
      x: 50, y: height - 120, size: 14, font, color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText('Author before A5: ' + author, {
      x: 50, y: 50, size: 10, font, color: rgb(0.5, 0.5, 0.5),
    });
  }
  const bytes = await pdfDoc.save();
  await writeFile(join(OUT_DIR, name), bytes);
  return { name, bytes: bytes.length };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`[fixtures] Generating ${FIXTURES.length} PDFs into ${OUT_DIR}`);
  for (const spec of FIXTURES) {
    const { name, bytes } = await makeFixture(spec);
    console.log(`  ✓ ${name} (${bytes} bytes)`);
  }
  console.log('[fixtures] Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
