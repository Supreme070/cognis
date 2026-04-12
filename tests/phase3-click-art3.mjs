import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('console', m => { if (m.type()==='error') console.log('[err]', m.text().slice(0,200)); });
await p.goto('http://127.0.0.1:3001/?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
const handle = await p.$('a.framer-1kqwkg9[href$="/blog/ai-ready-workforce-training"]');
console.log('anchor found:', !!handle);
if (handle) {
  await handle.click();
  await p.waitForTimeout(4500);
}
const info = await p.evaluate(() => ({
  path: location.pathname,
  h1: document.querySelector('h1')?.innerText?.slice(0, 100),
  title: document.title,
  bodyLen: document.body.innerText.length,
}));
console.log('AFTER CLICK:', JSON.stringify(info, null, 2));
await b.close();
