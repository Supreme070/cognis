import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
p.on('console', m => { if (m.type() === 'error') console.log('[err]', m.text().slice(0, 120)); });
await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'load' });
await p.waitForTimeout(4000);

const s = await p.evaluate(() => {
  const v = document.querySelector('video[data-cognis-hero-portal]');
  const img = document.querySelector('img[src*="Yz08gMSk8HCg9OI0jQXkoDm7t7Y"]');
  const main = document.querySelector('#main');
  const hero = document.querySelector('section[data-framer-name="hero"]');
  const pick = el => el ? {
    tag: el.tagName,
    rect: (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
    cs: (() => { const c = getComputedStyle(el); return { position: c.position, zIndex: c.zIndex, transform: c.transform, opacity: c.opacity, visibility: c.visibility, background: c.backgroundColor, overflow: c.overflow }; })(),
    parent: el.parentElement?.tagName + '.' + (el.parentElement?.className?.toString?.().slice(0, 40) || ''),
  } : null;
  return { video: pick(v), img: pick(img), main: pick(main), hero: pick(hero), bodyFirstChild: document.body.firstElementChild?.tagName };
});
console.log(JSON.stringify(s, null, 2));

await p.screenshot({ path: 'playwright-screenshots/state-check.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
console.log('screenshot saved');
await b.close();
