import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

p.on('console', m => { if (m.type() === 'error') console.log('[error]', m.text().slice(0, 200)); });
p.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 200)));

await p.goto('http://127.0.0.1:3001/?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);

const before = await p.evaluate(() => ({
  path: location.pathname,
  aboutLinks: document.querySelectorAll('a[href="./about-us"]').length,
  servicesLinks: document.querySelectorAll('a[href="./our-services"]').length,
  blogLinks: document.querySelectorAll('a[href="./blog"]').length,
  contactLinks: document.querySelectorAll('a[href="./contact"]').length,
  bodyLen: document.body.innerText.length,
}));
console.log('HOMEPAGE LOADED:', JSON.stringify(before));

const link = await p.$('a[href="./about-us"]');
if (!link) {
  console.log('NO /about-us LINK FOUND — bailing');
  await p.close(); await b.close();
  process.exit(1);
}
console.log('Clicking /about-us link...');
await link.click();
await p.waitForTimeout(4000);

const after = await p.evaluate(() => ({
  path: location.pathname,
  h1: document.querySelector('h1')?.innerText?.slice(0, 80),
  bodyLen: document.body.innerText.length,
}));
console.log('AFTER CLICK:', JSON.stringify(after, null, 2));

await p.close(); await b.close();
