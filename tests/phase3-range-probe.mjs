import { chromium } from 'playwright';
const b = await chromium.launch();
for (const slug of ['why-enterprise-ai-deployments-fail', 'ai-agents-new-operating-system', 'ai-ready-workforce-training']) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const reqs = [];
  p.on('request', r => {
    const u = r.url();
    if (u.includes('framercms')) reqs.push(u.replace('http://127.0.0.1:3001', ''));
  });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:3001/?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const a = await p.$('a.framer-1kqwkg9[href$="/blog/' + slug + '"]');
  if (a) await a.click();
  await p.waitForTimeout(4500);
  const h1 = await p.evaluate(() => document.querySelector('h1')?.innerText?.slice(0, 60));
  console.log('SLUG:', slug);
  console.log('  H1:', h1);
  reqs.forEach(r => console.log('  REQ:', r));
  errs.forEach(e => console.log('  ERR:', e));
  console.log('---');
  await p.close();
}
await b.close();
