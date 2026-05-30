import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/perf-nav-thrash';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Detect hard navigation vs SPA: set a sentinel that survives only SPA swaps.
let frameNavs = 0;
page.on('framenavigated', (f) => { if (f === page.mainFrame()) frameNavs++; });

const warnings = [];
page.on('console', (m) => { if (m.type()==='warning' && /recoverable error/.test(m.text())) warnings.push(1); });

console.log('--- nav type test: Home -> click internal links ---');
await page.goto(BASE + '/', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(3500);
await page.evaluate(() => { window.__sentinel = 'ALIVE_' + Date.now(); });
const startNavs = frameNavs;

// Click "Services" nav link
const tests = [];
for (const label of ['Services','About','Contact']) {
  await page.evaluate(() => { window.__sentinel = 'ALIVE'; });
  const before = frameNavs;
  try {
    await page.getByRole('link', { name: new RegExp('^'+label+'$','i') }).first().click({ timeout: 6000 });
  } catch(e) { console.log('click fail', label, e.message.slice(0,60)); }
  await page.waitForTimeout(2500);
  const survived = await page.evaluate(() => window.__sentinel).catch(()=>null);
  tests.push({ label, url: page.url(), frameNavsDelta: frameNavs - before, sentinelSurvived: survived === 'ALIVE' });
  await page.goto(BASE + '/', { waitUntil:'domcontentloaded' }); await page.waitForTimeout(2500);
}
console.log('SPA test results (sentinelSurvived=true means true SPA swap; false=hard reload):');
for (const t of tests) console.log(JSON.stringify(t));

console.log('\n--- SCATTER REPRO: products -> home, capture transient frames ---');
await page.goto(BASE + '/products', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(2000);
await page.screenshot({ path: OUT + '/scatter-0-products.png' });
// Click the brand logo (href="/") to go home
const t0 = Date.now();
await page.locator('a.brand, a[href="/"]').first().click({ timeout: 6000 }).catch(async (e)=>{
  console.log('brand click fail, using goto', e.message.slice(0,50));
  await page.goto(BASE + '/', { waitUntil:'domcontentloaded' });
});
// Capture transient frames during settle to catch scatter/reflow
for (const ms of [150, 400, 800, 1500, 3000]) {
  await page.waitForTimeout(ms === 150 ? 150 : ms - (Date.now()-t0 - 0));
  await page.screenshot({ path: `${OUT}/scatter-home-${ms}ms.png` });
}
console.log('warnings(recoverable hydration errors) total:', warnings.length);

console.log('\n--- LCP/paint timing on Home cold load ---');
const p2 = await ctx.newPage();
await p2.goto(BASE + '/', { waitUntil:'load', timeout:45000 });
await p2.waitForTimeout(3000);
const timing = await p2.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const paints = performance.getEntriesByType('paint').map(p=>({name:p.name, t:Math.round(p.startTime)}));
  const lt = performance.getEntriesByType('longtask') ? performance.getEntriesByType('longtask').length : 'n/a';
  const res = performance.getEntriesByType('resource');
  const totalKB = Math.round(res.reduce((s,r)=>s+(r.transferSize||0),0)/1024);
  const big = res.map(r=>({u:r.name.split('/').pop().slice(0,40), kb:Math.round((r.transferSize||0)/1024)})).filter(r=>r.kb>50).sort((a,b)=>b.kb-a.kb).slice(0,12);
  return { domContentLoaded: Math.round(nav.domContentLoadedEventEnd), loadEvent: Math.round(nav.loadEventEnd), paints, totalKB, resourceCount: res.length, big };
});
console.log(JSON.stringify(timing, null, 2));

await browser.close();
