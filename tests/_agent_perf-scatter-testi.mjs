import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/perf-mobile';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,200)));
page.on('console',m=>{if(m.type()==='error')errs.push('[console]'+m.text().slice(0,160));});

// ---- SCATTER: SPA nav. Land on home, click footer link to a Framer page, then browser back to home ----
console.log('=== SPA NAV SCATTER (mobile) ===');
await page.goto(BASE+'/', { waitUntil:'load', timeout:60000 });
await page.waitForTimeout(2500);
// open hamburger, click About Us (SPA nav)
await page.mouse.click(330,52);
await page.waitForTimeout(900);
try { await page.getByText('About Us', { exact:false }).first().click({timeout:6000}); } catch(e){ console.log('about click fail', e.message); }
await page.waitForTimeout(2500);
console.log('after About nav url:', page.url());
await page.screenshot({ path: OUT+'/sc-about.png' });
// browser back to home (SPA) -> watch for scatter
await page.goBack({ timeout:20000 });
await page.waitForTimeout(1800);
await page.screenshot({ path: OUT+'/sc-back-home.png' });
// check for layout overflow / scatter signature
const layout = await page.evaluate(() => {
  const b=document.body;
  return { scrollW: b.scrollWidth, clientW: document.documentElement.clientWidth, scrollH: b.scrollHeight,
    overflowX: b.scrollWidth - document.documentElement.clientWidth,
    absElems: [...document.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e); const r=e.getBoundingClientRect(); return r.left<-50||r.right>window.innerWidth+50;}).length };
});
console.log('back-home layout:', JSON.stringify(layout));

// forward again then back rapidly (thrash)
await page.goForward({timeout:20000}); await page.waitForTimeout(1200);
await page.goBack({timeout:20000}); await page.waitForTimeout(1500);
await page.screenshot({ path: OUT+'/sc-thrash.png' });

// ---- TESTIMONIALS on about-us mobile ----
console.log('\n=== TESTIMONIALS (about-us, mobile) ===');
await page.goto(BASE+'/about-us/', { waitUntil:'load', timeout:60000 });
await page.waitForTimeout(2500);
// find a testimonial/quote region; scroll through page capturing
const testiInfo = await page.evaluate(() => {
  // look for elements with role or text containing quotes / "testimonial"
  const cands=[...document.querySelectorAll('*')].filter(e=>{
    const c=(e.className||'').toString().toLowerCase();
    const dn=(e.getAttribute&&e.getAttribute('data-framer-name')||'').toLowerCase();
    return c.includes('testimon')||dn.includes('testimon')||c.includes('carousel')||dn.includes('carousel')||c.includes('ticker')||dn.includes('ticker');
  });
  return cands.slice(0,8).map(e=>({tag:e.tagName, cls:(e.className||'').toString().slice(0,50), dn:e.getAttribute&&e.getAttribute('data-framer-name'), h:Math.round(e.getBoundingClientRect().height)}));
});
console.log('testimonial-ish elements:', JSON.stringify(testiInfo, null, 1));
// scroll to find testimonial section, snap multiple
for (let i=0;i<6;i++){
  await page.evaluate(y=>window.scrollTo(0,y), 500+i*700);
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT+`/testi-scroll-${i}.png` });
}
// detect a marquee/auto-scroll: measure transform change of a ticker over time
const drift = await page.evaluate(async () => {
  const find=()=>[...document.querySelectorAll('*')].find(e=>{const t=getComputedStyle(e).transform; const dn=(e.getAttribute&&e.getAttribute('data-framer-name')||'').toLowerCase(); return (dn.includes('testimon')||dn.includes('ticker')) && t&&t!=='none';});
  const el=find(); if(!el) return 'no-animated-ticker-found';
  const t1=getComputedStyle(el).transform; await new Promise(r=>setTimeout(r,400)); const t2=getComputedStyle(el).transform;
  return { changed: t1!==t2, t1:t1.slice(0,40), t2:t2.slice(0,40) };
});
console.log('ticker drift over 400ms:', JSON.stringify(drift));

console.log('\nERRORS captured:', JSON.stringify(errs.slice(0,10),null,1));
await browser.close();
