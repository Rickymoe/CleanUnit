// Rasteriserer bilder/_kilde/hero-stavanger*.svg til bilder/hero-stavanger*.jpg i 2172x724 med Chromium (Playwright).
// Kjør: node verktoy/hero-stavanger-raster.mjs (etter python3 verktoy/hero-stavanger.py). webp lages av verktoy/hero-stavanger-webp.py.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const nettleser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const side = await nettleser.newPage({ viewport: { width: 2172, height: 724 } });
for (const navn of ['hero-stavanger', 'hero-stavanger-vinter']) {
  await side.setContent(`<body style="margin:0">${readFileSync(`bilder/_kilde/${navn}.svg`, 'utf8')}</body>`);
  await side.screenshot({ path: `bilder/${navn}.jpg`, type: 'jpeg', quality: 88 });
  console.log('skrev', navn);
}
await nettleser.close();
