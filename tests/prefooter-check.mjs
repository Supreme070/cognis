import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
const info = await p.evaluate(() => {
  // Look for pre-footer section
  const sections = Array.from(document.querySelectorAll('section[data-framer-name]'));
  const names = sections.map(s => s.dataset.framerName);
  // Find h2s with text
  const h2s = Array.from(document.querySelectorAll('h2')).map(h => ({
    text: h.innerText.replace(/\s+/g,' ').trim().slice(0, 100),
    y: Math.round(h.getBoundingClientRect().top + window.scrollY),
  })).filter(h => h.text);
  return { sections: names, h2s };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
