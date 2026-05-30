import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/perf-jank-seize';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const navs = [];
page.on('framenavigated', f => { if (f === page.mainFrame()) navs.push({ t: Date.now(), url: f.url().replace(BASE,'') }); });
const t0 = Date.now();
try { await page.goto(BASE + '/our-services/', { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch(e){}
// take shots at intervals during the oscillation
for (const ms of [600, 1400, 2200, 3200, 4500, 6500]) {
  const now = Date.now() - t0; if (now < ms) await page.waitForTimeout(ms - now);
  await page.screenshot({ path: `${out}/storm-${ms}.png` }).catch(()=>{});
}
console.log('nav timeline (ms from start -> url):');
navs.forEach(n => console.log(`  +${n.t - t0}ms  ${n.url || '/'}`));
console.log('total nav events:', navs.length, 'final:', page.url().replace(BASE,''));
await browser.close();
