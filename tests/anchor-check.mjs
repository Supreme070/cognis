import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);

const info = await p.evaluate(() => {
  const check = id => {
    const el = document.getElementById(id);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return { found: true, y: Math.round(r.top + window.scrollY), tag: el.tagName, name: el.dataset.framerName || '' };
  };
  return {
    about: check('about'),
    services: check('services'),
    insights: check('insights'),
    contact: check('contact'),
    // Framer link visibility
    framerLink: (() => {
      const a = document.querySelector('a[href="https://www.framer.com"]');
      if (!a) return { exists: false };
      const cs = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      return {
        exists: true,
        visible: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.01,
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
      };
    })(),
    // Pricing link visibility
    pricingLink: (() => {
      const a = Array.from(document.querySelectorAll('a[href]')).find(x => /pricing/i.test(x.getAttribute('href')));
      if (!a) return { exists: false };
      const cs = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      return {
        exists: true,
        href: a.getAttribute('href'),
        visible: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.01,
        display: cs.display,
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
      };
    })(),
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
