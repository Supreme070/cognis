import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/perf-mobile';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const client = await ctx.newCDPSession(page);
// Throttle: 4x CPU + Fast 3G-ish
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await client.send('Network.enable');
await client.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6*1024*1024/8, uploadThroughput: 750*1024/8 });

const reqs = [];
let totalBytes = 0; let imgBytes = 0; let scriptBytes = 0; let fontBytes = 0;
page.on('response', async (r) => {
  try {
    const h = r.headers();
    const len = parseInt(h['content-length']||'0',10);
    const ct = h['content-type']||'';
    const url = r.url();
    let size = len;
    if (!size) { try { const b = await r.body(); size = b.length; } catch {} }
    totalBytes += size;
    if (/image|\.(png|jpe?g|webp|gif|svg|avif)/i.test(ct+url)) imgBytes += size;
    if (/javascript|\.js(\?|$)/i.test(ct+url)) scriptBytes += size;
    if (/font|\.(woff2?|ttf|otf)/i.test(ct+url)) fontBytes += size;
    reqs.push({ url, size, ct: ct.split(';')[0] });
  } catch {}
});

const t0 = Date.now();
await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
const loadMs = Date.now() - t0;
await page.waitForTimeout(3000);

const metrics = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const paints = {}; performance.getEntriesByType('paint').forEach(p => paints[p.name] = Math.round(p.startTime));
  let lcp = 0;
  // approximate via resource count
  return {
    domContentLoaded: Math.round(nav.domContentLoadedEventEnd||0),
    loadEvent: Math.round(nav.loadEventEnd||0),
    transferSize: nav.transferSize||0,
    decodedBodySize: nav.decodedBodySize||0,
    firstPaint: paints['first-paint']||0,
    firstContentfulPaint: paints['first-contentful-paint']||0,
    resourceCount: performance.getEntriesByType('resource').length,
    domNodes: document.querySelectorAll('*').length,
  };
});

// LCP via PerformanceObserver injected fresh reload
console.log('=== HOME LOAD (4x CPU, ~1.6Mbps) ===');
console.log('wall load ms:', loadMs);
console.log('metrics:', JSON.stringify(metrics, null, 2));
console.log('totalBytes:', (totalBytes/1024).toFixed(0)+'KB', 'img:', (imgBytes/1024).toFixed(0)+'KB', 'script:', (scriptBytes/1024).toFixed(0)+'KB', 'font:', (fontBytes/1024).toFixed(0)+'KB');
const big = reqs.filter(r=>r.size>80000).sort((a,b)=>b.size-a.size).slice(0,15);
console.log('LARGEST RESOURCES:');
big.forEach(r=>console.log(' ', (r.size/1024).toFixed(0)+'KB', r.ct, r.url.slice(0,110)));

// === HAMBURGER ===
console.log('\n=== HAMBURGER MENU ===');
await page.screenshot({ path: OUT+'/m-home-loaded.png' });
// find hamburger
const burger = page.locator('[aria-label*="menu" i], button:has-text("Menu"), [class*="hamburger" i]').first();
let burgerInfo = 'not-found';
try {
  // Framer nav toggle is often a div; try clicking top-right region
  const found = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button,div,a')];
    const cand = els.find(e => {
      const r = e.getBoundingClientRect();
      return r.top<100 && r.right>320 && r.width<70 && r.width>20 && r.height<70 && r.height>20;
    });
    return cand ? {tag:cand.tagName, cls:cand.className?.toString().slice(0,60), aria:cand.getAttribute('aria-label')} : null;
  });
  burgerInfo = JSON.stringify(found);
} catch(e){ burgerInfo = 'err '+e.message; }
console.log('top-right control:', burgerInfo);

// Click hamburger by coordinate (top-right green box ~ x330 y52)
const tBurger = Date.now();
await page.mouse.click(330, 52);
await page.waitForTimeout(1200);
const burgerOpenMs = Date.now()-tBurger;
await page.screenshot({ path: OUT+'/m-menu-open.png' });
console.log('hamburger click->settle ms:', burgerOpenMs);
const menuVisible = await page.evaluate(() => {
  // count visible nav links
  const links = [...document.querySelectorAll('a')].filter(a=>{const r=a.getBoundingClientRect(); return r.width>0&&r.height>0&&r.top>=0&&r.top<window.innerHeight;});
  return links.map(a=>a.textContent.trim()).filter(Boolean).slice(0,20);
});
console.log('visible links after click:', JSON.stringify(menuVisible));

await browser.close();
