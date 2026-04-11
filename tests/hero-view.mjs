import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
// Capture at multiple timestamps so we see during + after animation
await p.waitForTimeout(800);
await p.screenshot({ path: 'playwright-screenshots/hero-view-t0800.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await p.waitForTimeout(700);
await p.screenshot({ path: 'playwright-screenshots/hero-view-t1500.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await p.waitForTimeout(1500);
await p.screenshot({ path: 'playwright-screenshots/hero-view-t3000.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await p.waitForTimeout(2000);
await p.screenshot({ path: 'playwright-screenshots/hero-view-t5000.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
// Get bounding box info for h1 vs subheading
const layout = await p.evaluate(() => {
  const h1 = document.querySelector('h1');
  const sub = document.querySelector('[data-framer-appear-id="1qozna1"]');
  const quodSpan = Array.from(h1.querySelectorAll('span')).find(s => s.innerText && s.innerText.includes('Quod'));
  return {
    h1: h1?.getBoundingClientRect(),
    sub: sub?.getBoundingClientRect(),
    quod: quodSpan?.getBoundingClientRect(),
    h1Bottom: h1?.getBoundingClientRect().bottom,
    subTop: sub?.getBoundingClientRect().top,
    gap: (sub?.getBoundingClientRect().top ?? 0) - (h1?.getBoundingClientRect().bottom ?? 0),
  };
});
console.log(JSON.stringify(layout, null, 2));
await b.close();
