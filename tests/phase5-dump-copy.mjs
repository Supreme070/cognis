import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch();
const routes = [
  { path: '/about-us', name: 'about-us' },
  { path: '/our-services', name: 'our-services' },
  { path: '/contact', name: 'contact' },
  { path: '/blog', name: 'blog' },
  { path: '/our-services/ai-strategy-advisory', name: 'svc-strategy' },
  { path: '/our-services/ai-training-workforce-development', name: 'svc-training' },
  { path: '/our-services/ai-agent-automation-engineering', name: 'svc-agent' },
];
fs.mkdirSync('tests/phase5-out', { recursive: true });
for (const r of routes) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:3001' + r.path + '?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(4000);
  const text = await p.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    return main.innerText;
  });
  fs.writeFileSync(`tests/phase5-out/${r.name}.txt`, text);
  console.log(`${r.path.padEnd(50)} ${text.length} chars`);
  await p.close();
}
await b.close();
