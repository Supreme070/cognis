import { chromium } from 'playwright';
const b = await chromium.launch();
const routes = ['/', '/about-us', '/our-services', '/contact', '/blog'];
for (const path of routes) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.goto('http://127.0.0.1:3001' + path + '?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(4000);
  const info = await p.evaluate(() => ({
    path: location.pathname,
    title: document.title,
    h1: document.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 80),
    bodyLen: document.body.innerText.length,
  }));
  console.log(`${path.padEnd(18)} -> ${info.path.padEnd(18)} h1="${info.h1}" title="${info.title.slice(0,50)}" body=${info.bodyLen} errs=${errs.length}`);
  if (errs.length) errs.forEach(e => console.log('    ERR:', e));
  await p.close();
}
await b.close();
