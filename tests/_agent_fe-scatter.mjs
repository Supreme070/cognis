import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/fe-console-hydration';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type()==='error'||m.type()==='warning') errs.push(m.text().slice(0,140)); });
page.on('pageerror', e => errs.push('PAGEERR '+(e.message||e)));

// 1. Products page header screenshot
await page.goto(BASE+'/products/', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(2500);
await page.screenshot({ path: OUT+'/products-header.png', clip:{x:0,y:0,width:1440,height:120} });
const prodHdr = await page.evaluate(() => {
  const h = document.querySelector('header.site-nav');
  if (!h) return null;
  const cs = getComputedStyle(h);
  return { tag:h.className, height:h.getBoundingClientRect().height, bg:cs.backgroundColor, position:cs.position, links:[...h.querySelectorAll('a')].map(a=>a.textContent.trim()).filter(Boolean) };
});
console.log('PRODUCTS HEADER:', JSON.stringify(prodHdr));

// 2. Home header (global Framer header)
await page.goto(BASE+'/', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: OUT+'/home-header.png', clip:{x:0,y:0,width:1440,height:120} });
const homeHdr = await page.evaluate(() => {
  // Framer header is usually a <nav> or fixed top bar
  const nav = document.querySelector('#main nav, header, [data-framer-name*="nav" i], [data-framer-name*="header" i]');
  if (!nav) return null;
  const cs = getComputedStyle(nav);
  return { tag:nav.tagName+'.'+nav.className.slice(0,40), height:nav.getBoundingClientRect().height, bg:cs.backgroundColor, position:cs.position };
});
console.log('HOME HEADER:', JSON.stringify(homeHdr));

// 3. Count injected MutationObservers / scripts on home
const injected = await page.evaluate(() => {
  const names = ['data-cognis-testimonials','data-cognis-quotefix','data-cognis-journey','data-cognis-copy','data-cognis-products','data-cognis-site-links'];
  const found = {};
  names.forEach(n => found[n] = document.querySelectorAll('['+n+']').length);
  return { found, cgtTrack: document.querySelectorAll('#testimonials .cgt-track').length };
});
console.log('INJECTED ON HOME:', JSON.stringify(injected));

// 4. Scatter repro: from products, click brand -> home (full nav), capture layout health after
await page.goto(BASE+'/products/', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(2000);
// capture pre-nav home layout baseline already taken. Now SPA-style: products has plain <a> so it's a full load.
// Try the reported scatter: navigate Products -> Home and watch for overlapping/zero-size sections.
await page.click('a.brand');
await page.waitForTimeout(800);
await page.screenshot({ path: OUT+'/scatter-t800ms.png' });
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT+'/scatter-t2300ms.png' });
await page.waitForTimeout(2500);
await page.screenshot({ path: OUT+'/scatter-settled.png' });

// 5. Now the real SPA scatter: home is Framer SPA. Click a Framer nav link then Back to home, watch layout.
const layoutHealth = await page.evaluate(() => {
  const secs = [...document.querySelectorAll('#main section, #main [data-framer-name]')].slice(0,40);
  let zero=0, neg=0;
  for (const s of secs){ const r=s.getBoundingClientRect(); if (r.width===0||r.height===0) zero++; if (r.top<-2000) neg++; }
  return { sampled: secs.length, zeroBox: zero, farOffscreen: neg, bodyScrollH: document.body.scrollHeight };
});
console.log('HOME LAYOUT AFTER NAV:', JSON.stringify(layoutHealth));
console.log('ERRORS:', JSON.stringify([...new Set(errs)].slice(0,10), null, 1));
await browser.close();
