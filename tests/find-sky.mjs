import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);

const result = await p.evaluate(() => {
  const hero = document.querySelector('section[data-framer-name="hero"]');
  if (!hero) return { error: 'no hero section' };

  // Walk the hero and collect elements with background images or img children
  const out = [];
  const walk = (el, depth) => {
    if (depth > 4) return;
    const cs = getComputedStyle(el);
    const bg = cs.backgroundImage;
    if (bg && bg !== 'none') {
      out.push({
        tag: el.tagName.toLowerCase(),
        className: (el.className || '').toString().slice(0, 80),
        name: el.getAttribute('data-framer-name'),
        bg: bg.slice(0, 200),
        w: el.offsetWidth,
        h: el.offsetHeight,
      });
    }
    for (const child of el.children) walk(child, depth + 1);
  };
  walk(hero, 0);

  // Also check for <img> inside hero
  const imgs = Array.from(hero.querySelectorAll('img')).slice(0, 10).map(img => ({
    src: (img.src || '').slice(-80),
    name: img.getAttribute('data-framer-name'),
    alt: img.alt,
    w: img.naturalWidth,
    h: img.naturalHeight,
    offsetW: img.offsetWidth,
    offsetH: img.offsetHeight,
    parent: img.parentElement?.className?.toString?.().slice(0, 60),
  }));

  return { backgrounds: out.slice(0, 8), imgs };
});

console.log(JSON.stringify(result, null, 2));
await b.close();
