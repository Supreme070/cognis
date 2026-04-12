import { chromium } from 'playwright';
const b = await chromium.launch();
const slugs = ['ai-strategy-advisory', 'ai-training-workforce-development', 'ai-agent-automation-engineering'];
for (const slug of slugs) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  const path = '/our-services/' + slug;
  await p.goto('http://127.0.0.1:3001' + path + '?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(6000);
  const info = await p.evaluate(() => ({
    path: location.pathname,
    h1: document.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 80),
    bodyLen: document.body.innerText.length,
    title: document.title,
  }));
  console.log(`${slug.padEnd(40)} -> ${info.path.padEnd(45)} h1="${info.h1}" body=${info.bodyLen} errs=${errs.length}`);
  if (errs.length) errs.forEach(e => console.log('    ERR:', e));
  await p.close();
}
await b.close();
