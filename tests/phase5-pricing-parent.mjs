import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:3001/our-services?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);
const info = await p.evaluate(() => {
  const front = document.querySelector('[data-framer-name="front"] .framer-1pm8nw4');
  if (!front) return 'front not found';
  let el = front;
  const chain = [];
  for (let i = 0; i < 8 && el; i++) {
    chain.push({
      tag: el.tagName,
      name: el.getAttribute('data-framer-name'),
      cls: Array.from(el.classList).filter(c => c.startsWith('framer-')).slice(0, 2).join(' '),
      id: el.id || ''
    });
    el = el.parentElement;
  }
  return chain;
});
console.log(JSON.stringify(info, null, 2));
await b.close();
