import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
const bad = [];
page.on('response', async (r) => {
  if (r.status() >= 400) {
    bad.push({ url: r.url(), status: r.status() });
  }
});
page.on('pageerror', (e) => console.log('PAGEERR:', String(e).slice(0,120)));
await page.goto('http://localhost:8765/cognis_base.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);
console.log('BAD:', bad.length);
bad.forEach(b => console.log(` ${b.status} ${b.url}`));
await browser.close();
