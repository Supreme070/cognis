import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = 'file://' + path.join(root, 'cognis_base.original.html');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => pageErrors.push('goto: ' + e.message));
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(root, 'playwright-screenshots', 'baseline-original-1440.png'), fullPage: true });

const checks = await page.evaluate(() => {
  return {
    title: document.title,
    h1: document.querySelector('h1')?.innerText.trim(),
    aeline: (document.body.innerText.match(/Aeline|Ailine/g) || []).length,
    cognis: (document.body.innerText.match(/Cognis/g) || []).length,
  };
});

console.log(JSON.stringify({ checks, pageErrors }, null, 2));
await browser.close();
