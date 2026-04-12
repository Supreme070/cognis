import { chromium } from 'playwright';
const errors = [];
const netFails = [];
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
p.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 200)));
p.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
p.on('requestfailed', r => netFails.push(r.url() + ' :: ' + r.failure()?.errorText));
p.on('response', async r => { if (r.status() >= 400) netFails.push(r.status() + ' ' + r.url()); });
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);
// Scroll full page to trigger lazy-loaded CMS reads
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(2000);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1000);
const info = await p.evaluate(() => ({
  h1: document.querySelector('h1')?.innerText?.replace(/\s+/g,' ').trim(),
  pricingCount: (document.body.innerText.match(/pricing/gi) || []).length,
}));
console.log('INFO:', JSON.stringify(info));
console.log('ERRORS:', errors.length);
errors.forEach(e => console.log('  ' + e));
console.log('NETWORK FAILS:', netFails.length);
netFails.forEach(f => console.log('  ' + f));
await b.close();
