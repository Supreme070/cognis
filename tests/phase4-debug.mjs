import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

p.on('console', m => console.log(`[${m.type()}]`, m.text().slice(0, 250)));
p.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 250)));

const path = process.argv[2] || '/about-us';
console.log('NAVIGATING TO', path);
await p.goto('http://127.0.0.1:3001' + path + '?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);

const diag = await p.evaluate(() => ({
  path: location.pathname,
  deferred: window.__cognisDeferred,
  deferredHop2: window.__cognisDeferredHop2,
  hasAboutLink: document.querySelectorAll('a[href="/about-us"]').length,
  hasServicesLink: document.querySelectorAll('a[href="/our-services"]').length,
  hasBlogLink: document.querySelectorAll('a[href="/blog"]').length,
  hasContactLink: document.querySelectorAll('a[href="/contact"]').length,
}));
console.log('DIAG after 2s:', JSON.stringify(diag, null, 2));

await p.waitForTimeout(4000);
const diag2 = await p.evaluate(() => ({
  path: location.pathname,
  h1: document.querySelector('h1')?.innerText?.slice(0, 60),
  bodyLen: document.body.innerText.length,
}));
console.log('DIAG after 6s:', JSON.stringify(diag2, null, 2));

await p.close();
await b.close();
