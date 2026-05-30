import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/perf-nav-thrash';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Instrument timers/observers/listeners created over the page lifetime.
await page.addInitScript(() => {
  window.__c = { si: 0, st: 0, raf: 0, mo: 0, io: 0, ro: 0, listen: 0, clearedI: 0, clearedT: 0 };
  const _si = window.setInterval, _ci = window.clearInterval;
  window.setInterval = function (...a) { window.__c.si++; return _si.apply(this, a); };
  window.clearInterval = function (...a) { window.__c.clearedI++; return _ci.apply(this, a); };
  const _st = window.setTimeout, _ct = window.clearTimeout;
  window.setTimeout = function (...a) { window.__c.st++; return _st.apply(this, a); };
  window.clearTimeout = function (...a) { window.__c.clearedT++; return _ct.apply(this, a); };
  const _raf = window.requestAnimationFrame;
  window.requestAnimationFrame = function (...a) { window.__c.raf++; return _raf.apply(this, a); };
  const _MO = window.MutationObserver;
  window.MutationObserver = class extends _MO { constructor(cb){ super(cb); window.__c.mo++; } };
  const _IO = window.IntersectionObserver;
  if (_IO) window.IntersectionObserver = class extends _IO { constructor(...a){ super(...a); window.__c.io++; } };
  const _RO = window.ResizeObserver;
  if (_RO) window.ResizeObserver = class extends _RO { constructor(...a){ super(...a); window.__c.ro++; } };
  const _add = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (...a) { window.__c.listen++; return _add.apply(this, a); };
});

const log = [];
page.on('console', (m) => { const t = m.type(); if (t==='error'||t==='warning') log.push(`[${t}] ${m.text().slice(0,200)}`); });
page.on('pageerror', (e) => log.push(`[pageerror] ${String(e).slice(0,200)}`));

async function metrics() {
  const m = await page.evaluate(() => {
    const mem = performance.memory ? performance.memory.usedJSHeapSize : null;
    const nodes = document.getElementsByTagName('*').length;
    const listeners = document.querySelectorAll('*').length; // placeholder
    return { mem, nodes, c: JSON.parse(JSON.stringify(window.__c || {})) };
  }).catch(() => null);
  return m;
}

console.log('=== LOAD HOME ===');
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(4000);
let base = await metrics();
console.log('after home settle:', JSON.stringify(base));

// 15+ SPA navigations cycling internal pages via Framer client router (click nav links).
const cycle = ['Services','How We Work','Insights','About','Contact'];
const samples = [];
samples.push({ nav: 0, ...(await metrics()) });
let navCount = 0;
for (let round = 0; round < 4; round++) {
  for (const label of cycle) {
    try {
      const link = page.getByRole('link', { name: new RegExp('^'+label+'$','i') }).first();
      await link.click({ timeout: 6000 });
      navCount++;
      await page.waitForTimeout(1400);
    } catch (e) {
      // fall back to goto
      const map = {'Services':'/our-services','How We Work':'/how-we-work','Insights':'/blog','About':'/about-us','Contact':'/contact'};
      await page.goto(BASE + (map[label]||'/'), { waitUntil:'domcontentloaded' }).catch(()=>{});
      navCount++;
      await page.waitForTimeout(1400);
    }
    if (navCount % 3 === 0) samples.push({ nav: navCount, url: page.url(), ...(await metrics()) });
  }
}
samples.push({ nav: navCount, url: page.url(), ...(await metrics()) });
console.log('=== MEMORY/TIMER SAMPLES ('+navCount+' navs) ===');
for (const s of samples) console.log(`nav=${s.nav} mem=${s.mem? (s.mem/1048576).toFixed(1)+'MB':'n/a'} nodes=${s.nodes} timers[si=${s.c?.si} st=${s.c?.st} raf=${s.c?.raf} mo=${s.c?.mo} io=${s.c?.io} ro=${s.c?.ro} listen=${s.c?.listen} clrI=${s.c?.clearedI} clrT=${s.c?.clearedT}]`);

console.log('=== CONSOLE ===');
console.log(log.slice(0,15).join('\n') || '(none)');

await browser.close();
