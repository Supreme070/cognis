import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:3001/blog?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);
const cards = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('a[href*="/blog/"]').forEach(a => {
    const visible = a.offsetParent !== null && getComputedStyle(a).display !== 'none';
    const parent = a.closest('[data-framer-name]') || a.parentElement;
    const parentVisible = parent ? (parent.offsetParent !== null && getComputedStyle(parent).display !== 'none') : true;
    out.push({ href: a.getAttribute('href'), visible, parentVisible });
  });
  return out;
});
console.log('Blog cards:');
cards.forEach(c => console.log(`  ${c.href.padEnd(60)} visible=${c.visible} parent=${c.parentVisible}`));
const hidden = ['future-of-automation', 'how-consultants-can-leverage', 'missing-piece'];
const templateVisible = cards.filter(c => hidden.some(h => c.href.includes(h)) && c.parentVisible);
console.log(`\nTemplate cards still visible: ${templateVisible.length}`);
if (templateVisible.length > 0) templateVisible.forEach(c => console.log('  VISIBLE:', c.href));
await b.close();
