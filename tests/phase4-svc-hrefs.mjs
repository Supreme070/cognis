import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:3001/?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
// Click /our-services
const nav = await p.$('a[href="./our-services"]');
console.log('nav link found:', !!nav);
if (nav) await nav.click();
await p.waitForTimeout(5000);
const hrefs = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href') || '';
    if (h.includes('our-services') || h.includes('strategy') || h.includes('training') || h.includes('agent')) {
      out.push(h);
    }
  });
  return out;
});
console.log('path:', await p.evaluate(() => location.pathname));
console.log('h1:', await p.evaluate(() => document.querySelector('h1')?.innerText?.slice(0, 60)));
console.log('relevant hrefs:');
hrefs.forEach(h => console.log('  ', h));
await b.close();
