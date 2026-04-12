import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto('http://127.0.0.1:3001/?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const hrefs = await p.evaluate(() => {
  const map = {};
  document.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    map[h] = (map[h] || 0) + 1;
  });
  return map;
});
console.log('HREFS ON HYDRATED HOMEPAGE:');
for (const [h, c] of Object.entries(hrefs).sort()) console.log(`  ${c}x  ${h}`);
await b.close();
