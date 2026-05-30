import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/perf-jank-seize';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__lt = 0; window.__ltMax = 0; window.__ltTotal = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 50) { window.__lt++; window.__ltTotal += e.duration; if (e.duration > window.__ltMax) window.__ltMax = e.duration; } }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
});
const t0 = Date.now();
let domContentLoadedAt = null, loadAt = null;
page.on('domcontentloaded', () => { if (!domContentLoadedAt) domContentLoadedAt = Date.now() - t0; });
page.on('load', () => { if (!loadAt) loadAt = Date.now() - t0; });
try {
  await page.goto(BASE + '/', { waitUntil: 'commit', timeout: 60000 });
} catch (e) { console.log('goto err', String(e).slice(0,120)); }
// Sample longtasks at intervals to see when the busy period ends
const samples = [];
for (const t of [1000, 2000, 3000, 4000, 6000, 8000, 11000, 14000]) {
  const now = Date.now() - t0;
  if (now < t) await page.waitForTimeout(t - now);
  const m = await page.evaluate(() => ({ lt: window.__lt, max: Math.round(window.__ltMax), total: Math.round(window.__ltTotal) })).catch(() => null);
  // responsiveness probe: how long does a trivial eval take?
  const p0 = Date.now();
  await page.evaluate(() => 1).catch(() => {});
  samples.push({ at: t, ...(m || {}), evalMs: Date.now() - p0 });
}
console.log(JSON.stringify({ domContentLoadedAt, loadAt, samples }, null, 2));
await page.screenshot({ path: out + '/home-loaded.png' });
// Now measure scroll jank: rapid scroll and count longtasks generated
const ltStart = await page.evaluate(() => window.__lt);
await page.evaluate(async () => { for (let k=0;k<6;k++){ for (let y=0;y<document.body.scrollHeight;y+=400){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,16)); } window.scrollTo(0,0);} });
await page.waitForTimeout(500);
const ltAfterScroll = await page.evaluate(() => window.__lt);
console.log('scrollLongtaskDelta', ltAfterScroll - ltStart);
await browser.close();
