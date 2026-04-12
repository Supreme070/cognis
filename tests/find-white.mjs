import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'load' });
await p.waitForTimeout(3000);

const r = await p.evaluate(() => {
  // Walk from body down; report any element with an opaque background color
  // positioned in the hero area (top 900px).
  const out = [];
  function walk(el, depth) {
    if (depth > 10) return;
    if (el === document.body) { for (const c of el.children) walk(c, depth + 1); return; }
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const r = el.getBoundingClientRect();
    if (r.top < 900 && r.bottom > 0 && r.width > 200 && r.height > 200) {
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        out.push({
          depth,
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 60),
          name: el.getAttribute('data-framer-name'),
          bg,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        });
      }
    }
    for (const c of el.children) walk(c, depth + 1);
  }
  walk(document.body, 0);
  return out;
});
console.log(JSON.stringify(r, null, 2));
await b.close();
