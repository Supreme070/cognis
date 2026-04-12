import { chromium } from 'playwright';
const b = await chromium.launch();
for (const slug of ['why-enterprise-ai-deployments-fail', 'ai-ready-workforce-training']) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const cmsReqs = [];
  p.on('request', r => {
    const u = r.url();
    if (u.includes('framercms') || u.includes('blog-chunk') || u.includes('blog-indexes')) {
      cmsReqs.push(u.replace('http://127.0.0.1:3001', ''));
    }
  });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:3001/?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const a = await p.$('a.framer-1kqwkg9[href$="/blog/' + slug + '"]');
  if (a) await a.click();
  await p.waitForTimeout(4500);
  const h1 = await p.evaluate(() => document.querySelector('h1')?.innerText?.slice(0, 80));
  console.log('SLUG:', slug, 'H1:', h1);
  console.log('  requests:');
  cmsReqs.forEach(r => console.log('    ', r));
  console.log('  errors:');
  errs.forEach(e => console.log('    ', e));
  console.log('---');
  await p.close();
}
await b.close();
