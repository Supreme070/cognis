import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/e2e-scatter-repro';
mkdirSync(out, { recursive: true });
const vp = { width: 1440, height: 900 };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: vp });
const p = await ctx.newPage();
const errs = [];
let navCount = 0;
p.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') errs.push(`[${t}] ${m.text().slice(0,180)}`); });
p.on('pageerror', (e) => errs.push(`[pageerror] ${String(e).slice(0,180)}`));
p.on('framenavigated', (f) => { if (f === p.mainFrame()) navCount++; });

async function m(label) {
  return await p.evaluate((label) => ({
    label, url: location.pathname, scrollH: document.body.scrollHeight,
    h1t: (document.querySelector('h1')?.textContent||'').trim().slice(0,35),
    h1pos: (() => { const h=document.querySelector('h1'); if(!h) return null; const r=h.getBoundingClientRect(); return {t:Math.round(r.top),l:Math.round(r.left)};})(),
    bodyClass: document.body.className.slice(0,60),
    framerRoot: !!document.querySelector('#main, [data-framer-name]'),
    productShell: !!document.querySelector('header.site-nav'),
  }), label);
}
const rows = [];
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(3500);
rows.push({ ...(await m('home')), navCount });

// Click Products from Framer home header - is it SPA or hard nav?
let n0 = navCount;
await p.locator('a[href="/products"]').first().click({ timeout: 8000 });
await p.waitForTimeout(2800);
rows.push({ ...(await m('after-click-products')), navCount, didFullNav: navCount > n0 });
await p.screenshot({ path: `${out}/spa-1-products.png` });

// Now use browser BACK (this is the classic Framer SPA scatter trigger)
n0 = navCount;
await p.goBack({ timeout: 20000 });
await p.waitForTimeout(3000);
rows.push({ ...(await m('after-back-to-home')), navCount, didFullNav: navCount > n0 });
await p.screenshot({ path: `${out}/spa-2-back-home.png` });

// forward again
await p.goForward({ timeout: 20000 }); await p.waitForTimeout(2500);
rows.push({ ...(await m('after-forward-products')), navCount });
await p.screenshot({ path: `${out}/spa-3-fwd-products.png` });
await p.goBack({ timeout: 20000 }); await p.waitForTimeout(2500);
rows.push({ ...(await m('after-back2-home')), navCount });
await p.screenshot({ path: `${out}/spa-4-back2-home.png` });

console.log(JSON.stringify({ rows, errs: [...new Set(errs)].slice(0,20) }, null, 2));
await b.close();
