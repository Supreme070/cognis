import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);

const info = await p.evaluate(() => {
  const sections = Array.from(document.querySelectorAll('section'));
  return sections.map(s => ({
    name: s.getAttribute('data-framer-name'),
    id: s.id,
    opacity: getComputedStyle(s).opacity,
    visible: s.offsetHeight > 0 && s.offsetWidth > 0,
    h: s.offsetHeight,
    text: (s.textContent || '').replace(/\s+/g, ' ').slice(0, 120)
  }));
});

const hiddenOpacity = await p.evaluate(() => {
  const all = document.querySelectorAll('[style*="opacity:0.001"], [style*="opacity: 0.001"]');
  return all.length;
});

console.log('Sections:');
console.log(JSON.stringify(info, null, 2));
console.log('\nElements still at opacity:0.001:', hiddenOpacity);
await b.close();
