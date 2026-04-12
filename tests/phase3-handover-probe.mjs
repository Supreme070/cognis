import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'domcontentloaded' });
const info = await p.evaluate(() => {
  const el = document.getElementById('__framer__handoverData');
  if (!el) return { found: false };
  const text = el.text || el.textContent;
  return {
    found: true,
    firstChars: text.slice(0, 150),
    hasEntity: text.includes('&#34;'),
    hasQuote: text.includes('"'),
    length: text.length,
    tryParse: (() => {
      try { JSON.parse(text); return 'OK'; }
      catch (e) { return 'ERR: ' + e.message.slice(0, 100); }
    })(),
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
