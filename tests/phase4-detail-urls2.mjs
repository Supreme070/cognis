import { chromium } from 'playwright';
const b = await chromium.launch();
for (const slug of ['ai-training-workforce-development','ai-agent-automation-engineering']) {
  const p = await (await b.newContext()).newPage();
  const failed = [];
  p.on('response', r => { if (r.status() === 404) failed.push(r.url()); });
  await p.goto('http://127.0.0.1:3001/our-services/' + slug + '?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(4000);
  console.log(slug + ':');
  failed.forEach(u => console.log('  ', u));
  await p.close();
}
await b.close();
