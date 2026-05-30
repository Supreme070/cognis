import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/perf-jank-seize';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0,160)));
page.on('console', m => { if (m.type()==='error') errs.push('console: ' + m.text().slice(0,160)); });

await page.goto(BASE + '/products/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: out + '/scatter-0-products.png', fullPage: false });

// Find the products header "home" / brand link and click it
const links = await page.evaluate(() => Array.from(document.querySelectorAll('header a, nav a')).map(a => ({ t: (a.textContent||'').trim().slice(0,30), href: a.getAttribute('href') })));
console.log('PRODUCTS HEADER LINKS', JSON.stringify(links));

// Click whatever navigates home
let clicked = false;
for (const sel of ['header a.brand', 'a[href="/"]', 'a[href="https://www.cognis.group/"]']) {
  const el = page.locator(sel).first();
  if (await el.count()) { await el.click().catch(()=>{}); clicked = true; console.log('clicked', sel); break; }
}
if (!clicked) console.log('no home link found via selectors');
await page.waitForTimeout(3500);
console.log('URL after home nav:', page.url());
await page.screenshot({ path: out + '/scatter-1-after-home.png', fullPage: false });
// full page to see scatter below fold
await page.screenshot({ path: out + '/scatter-2-home-full.png', fullPage: true });

// Check for layout anomalies: elements at opacity 0 / overlapping / off-screen hero
const diag = await page.evaluate(() => {
  const hidden = document.querySelectorAll('[style*="opacity:0.001"],[style*="opacity: 0.001"]').length;
  const appearLow = Array.from(document.querySelectorAll('[data-framer-appear-id]')).filter(el => parseFloat(getComputedStyle(el).opacity) < 0.5).length;
  const bodyH = document.body.scrollHeight;
  const heroImgs = document.querySelectorAll('img[style*="visibility: hidden"]').length;
  return { hidden, appearLow, bodyH, heroImgs, title: document.title };
});
console.log('DIAG', JSON.stringify(diag));
console.log('ERRORS', JSON.stringify(errs.slice(0,12), null, 2));
await browser.close();
