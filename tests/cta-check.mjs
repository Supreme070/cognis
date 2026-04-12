import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'load' });
await p.waitForTimeout(4000);

const info = await p.evaluate(() => {
  const find = text => {
    const hits = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.toLowerCase().includes(text.toLowerCase())) {
        let el = n.parentElement;
        while (el && el.tagName !== 'A' && el.tagName !== 'BUTTON' && el !== document.body) el = el.parentElement;
        if (!el || el === document.body) el = n.parentElement;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        hits.push({
          text: n.nodeValue.trim(),
          tag: el.tagName,
          visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.01,
          opacity: cs.opacity,
          visibility: cs.visibility,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        });
      }
    }
    return hits.slice(0, 5);
  };
  return {
    book: find('Book a consultation'),
    talk: find('Talk to us'),
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
