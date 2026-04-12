import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
const failed = [];
p.on('response', r => {
  if (r.status() === 404) failed.push({ url: r.url(), status: r.status() });
});
p.on('console', m => { if (m.type() === 'error') console.log('[err]', m.text().slice(0, 200)); });
await p.goto('http://127.0.0.1:3001/blog?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);
console.log('404s on /blog:');
failed.forEach(f => console.log('  ', f.url));
await b.close();
