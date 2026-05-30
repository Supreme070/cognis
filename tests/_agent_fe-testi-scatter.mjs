import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/fe-network';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const aborts = [];
p.on('requestfailed', r => { if(/framer-runtime/.test(r.url())) aborts.push(r.url().split('/').pop()); });

// --- Testimonials on about-us ---
await p.goto(BASE + '/about-us/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
await p.waitForTimeout(2500);
// find a testimonial / quote region by text
// scroll down looking for testimonials, take a few shots
for (let i=0;i<7;i++){
  await p.evaluate(y=>window.scrollTo(0,y), 700*i + 800).catch(()=>{});
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/about-scroll-${i}.png` }).catch(()=>{});
}

// --- Scatter repro: home -> products -> back to home via browser ---
await p.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
await p.waitForTimeout(2000);
await p.screenshot({ path: `${out}/scatter-0-home-fresh.png` });
// click Products in global nav
await p.getByRole('link', { name: /products/i }).first().click({ timeout: 8000 }).catch(e=>console.log('click products err', String(e).slice(0,80)));
await p.waitForTimeout(2500);
await p.screenshot({ path: `${out}/scatter-1-on-products.png` });
// now go back to Home
await p.getByRole('link', { name: /^home$/i }).first().click({ timeout: 8000 }).catch(async e=>{ console.log('click home err', String(e).slice(0,80)); await p.goBack().catch(()=>{}); });
await p.waitForTimeout(2500);
await p.screenshot({ path: `${out}/scatter-2-back-home.png` });
// measure layout integrity: does hero text overlap?
const layout = await p.evaluate(()=>({ scrollH: document.body.scrollHeight, w: window.innerWidth }));
console.log('AFTER scatter layout:', JSON.stringify(layout));
console.log('framer aborts during run:', aborts.length, [...new Set(aborts)].slice(0,10));
await b.close();
