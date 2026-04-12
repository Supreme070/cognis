import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:3001/our-services?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);
const info = await p.evaluate(() => {
  const results = [];
  document.querySelectorAll('[data-framer-name]').forEach(el => {
    const name = el.getAttribute('data-framer-name');
    const text = el.innerText.trim().slice(0, 80);
    if (text.includes('Enterprise') || text.includes('Ongoing') || text.includes('Adoption') || text.includes('/ —') || name.toLowerCase().includes('pric')) {
      results.push({ name, classes: el.className.split(' ').filter(c => c.startsWith('framer-')).slice(0, 3), text: text.slice(0, 60) });
    }
  });
  return results;
});
console.log('Pricing-related elements:');
info.forEach(i => console.log(`  name="${i.name}" classes=${i.classes.join(',')} text="${i.text}"`));
await b.close();
