import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/perf-jank-seize';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
for (const path of ['/our-services/', '/about-us/', '/how-we-work/', '/contact/']) {
  let navs = [];
  const handler = f => { if (f === page.mainFrame()) navs.push(f.url()); };
  page.on('framenavigated', handler);
  navs = [];
  const t0 = Date.now();
  try { await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch(e){ console.log(path,'goto err',String(e).slice(0,80)); }
  await page.waitForTimeout(7000);
  const finalUrl = page.url();
  page.off('framenavigated', handler);
  // dedupe consecutive
  const uniq = navs.filter((u,i)=> i===0 || u!==navs[i-1]);
  console.log(`REQ ${path} -> final ${finalUrl} | navEvents=${navs.length} uniqueTrail=${JSON.stringify(uniq.map(u=>u.replace(BASE,'')))} ms=${Date.now()-t0}`);
}
await browser.close();
