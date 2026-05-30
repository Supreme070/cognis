import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/e2e-scatter-repro';
mkdirSync(out, { recursive: true });
const vp = process.argv[2] === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const tag = process.argv[2] || 'desktop';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: vp });
const p = await ctx.newPage();
const console_errs = [];
p.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') console_errs.push(`[${t}] ${m.text().slice(0,200)}`); });
p.on('pageerror', (e) => console_errs.push(`[pageerror] ${String(e).slice(0,200)}`));

async function metrics(label) {
  return await p.evaluate((label) => {
    const r = {};
    r.label = label;
    r.url = location.pathname;
    r.scrollH = document.body.scrollHeight;
    r.innerW = window.innerWidth;
    // horizontal overflow
    r.docW = document.documentElement.scrollWidth;
    r.overflowX = document.documentElement.scrollWidth - window.innerWidth;
    // hero / first big section position - detect "scatter": elements stacked at 0,0 or overlapping
    const header = document.querySelector('header, [data-framer-name*="Header" i], nav');
    r.headerRect = header ? (() => { const x = header.getBoundingClientRect(); return { t: Math.round(x.top), h: Math.round(x.height), w: Math.round(x.width) }; })() : null;
    // count elements positioned at exactly (0,0) with size>0 that look stacked (a scatter symptom)
    let zeroStack = 0, offscreenLeft = 0;
    const all = document.querySelectorAll('div,section,img,h1,h2,p');
    for (const el of all) {
      const x = el.getBoundingClientRect();
      if (x.width > 50 && x.height > 30) {
        if (x.left < -100) offscreenLeft++;
      }
    }
    r.offscreenLeft = offscreenLeft;
    // first h1 text + position
    const h1 = document.querySelector('h1');
    r.h1 = h1 ? { txt: (h1.textContent||'').trim().slice(0,40), t: Math.round(h1.getBoundingClientRect().top), l: Math.round(h1.getBoundingClientRect().left) } : null;
    return r;
  }, label);
}

const log = [];
async function shot(name) { await p.screenshot({ path: `${out}/${tag}-${name}.png`, fullPage: false }); }

await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(3500);
log.push(await metrics('home-initial'));
await shot('00-home-initial');

for (let cycle = 1; cycle <= 6; cycle++) {
  // Click Products nav (absolute /products link in framer header)
  const prod = p.locator('a[href="/products"]').first();
  try {
    await prod.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
    await prod.click({ timeout: 8000 });
  } catch (e) { log.push({ label: `cycle${cycle}-click-products-FAIL`, err: String(e).slice(0,120) }); }
  await p.waitForTimeout(2500);
  log.push(await metrics(`cycle${cycle}-on-products`));
  await shot(`c${cycle}-1-products`);

  // Go Home from products page. Products header has NO Home link -> only brand logo href="/".
  // Try a "Home" text link first (to prove it fails), then fall back to brand logo.
  let homeVia = '';
  const homeText = p.getByRole('link', { name: /^home$/i }).first();
  const hasHomeText = await homeText.count().then(c => c > 0).catch(() => false);
  if (hasHomeText && await homeText.isVisible().catch(() => false)) {
    try { await homeText.click({ timeout: 4000 }); homeVia = 'home-text-link'; } catch (e) { homeVia = 'home-text-FAIL'; }
  }
  if (!homeVia || homeVia.endsWith('FAIL')) {
    // brand logo
    const brand = p.locator('a.brand, header.site-nav a[href="/"]').first();
    try { await brand.click({ timeout: 6000 }); homeVia = (homeVia ? homeVia + '+' : '') + 'brand-logo'; }
    catch (e) {
      // last resort any href="/" or "./"
      const any = p.locator('a[href="/"], a[href="./"]').first();
      try { await any.click({ timeout: 6000 }); homeVia = 'fallback-root-link'; }
      catch (e2) { homeVia = 'NO-HOME-LINK-FOUND'; }
    }
  }
  await p.waitForTimeout(3000);
  const m = await metrics(`cycle${cycle}-back-home`);
  m.homeVia = homeVia;
  log.push(m);
  await shot(`c${cycle}-2-home`);
}

console.log(JSON.stringify({ tag, vp, log, console_errs: [...new Set(console_errs)].slice(0, 25) }, null, 2));
await b.close();
