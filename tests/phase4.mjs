import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'http://127.0.0.1:8765/index.html';
const OUT = 'playwright-screenshots';
fs.mkdirSync(OUT, { recursive: true });

const breakpoints = [
  { name: '1440', width: 1440, height: 900 },
  { name: '768',  width: 768,  height: 1024 },
  { name: '375',  width: 375,  height: 812 },
];

const browser = await chromium.launch();

const report = {};
for (const bp of breakpoints) {
  const ctx = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('requestfailed', r => {
    const u = r.url();
    if (!u.startsWith('file://')) failed.push(u);
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Assertions
  const result = {};
  result.h1 = ((await page.locator('h1').first().textContent()) || '').replace(/\s+/g, ' ').trim();
  result.h1Count = await page.locator('h1').count();
  result.hasAeline = await page.locator('text=Aeline').count();
  result.hasTemlis = await page.locator('text=temlis').count();
  result.hasCognis = await page.locator('text=Cognis').count();
  result.formActionWeb3 = await page.locator('form[action*="web3forms"]').count();
  result.jsonLd = await page.locator('script[type="application/ld+json"]').count();
  result.nav = await page.locator('nav a, header a').count();
  result.anchors = {};
  for (const a of ['about', 'services', 'insights']) {
    result.anchors[a] = await page.locator(`#${a}`).count();
  }
  result.hiddenPromo = await page.locator('#__framer-badge-container').isHidden().catch(() => 'missing');
  result.externalRequests = failed.length;
  result.errors = errors.slice(0, 3);

  // Full-page screenshot
  const shotPath = `${OUT}/final-${bp.name}-full.png`;
  await page.screenshot({ path: shotPath, fullPage: true });
  result.screenshot = shotPath;

  report[bp.name] = result;
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
