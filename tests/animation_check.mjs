import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[err] ${String(e).slice(0,150)}`));

await page.goto('http://localhost:8765/cognis_base.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);

const info = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('[data-framer-appear-id]'));
  const invis = els.filter(el => {
    const cs = window.getComputedStyle(el);
    return parseFloat(cs.opacity) < 0.1;
  });
  return {
    total: els.length,
    invisible: invis.length,
    samples: invis.slice(0, 15).map(el => ({
      id: el.getAttribute('data-framer-appear-id'),
      tag: el.tagName,
      name: el.getAttribute('data-framer-name'),
      opacity: window.getComputedStyle(el).opacity,
      text: el.innerText?.slice(0, 50)
    })),
    animatorDefined: typeof window.animator,
    appearContent: !!document.getElementById('__framer__appearAnimationsContent'),
  };
});
console.log(JSON.stringify(info, null, 2));
logs.forEach(l => console.log(l));
await browser.close();
