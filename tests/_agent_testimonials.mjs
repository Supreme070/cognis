import { chromium } from 'playwright';
const OUT = 'test-results/site-audit/evidence/e2e-contact-funnel';
const BASE = 'https://www.cognis.group';
const browser = await chromium.launch({ channel: 'chromium' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const log = (...a) => console.log(...a);
const p = await ctx.newPage();
await p.goto(BASE + '/about-us/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(7000); // long settle

// locate testimonial slideshow container and scroll it into view
const loc = await p.evaluate(() => {
  const c = document.querySelector('.framer-1rfzgaf-container, [data-framer-name*="estimon" i]');
  if (!c) return { found: false };
  c.scrollIntoView({ block: 'center' });
  return { found: true };
});
log('testimonial loc:', JSON.stringify(loc));
await p.waitForTimeout(3000);
await p.screenshot({ path: OUT + '/t1-about-testi-settled.png' });

// Inspect the testimonial section geometry: look for big white gaps / fast autoplay
const geo = await p.evaluate(() => {
  const c = document.querySelector('.framer-1rfzgaf-container, [data-framer-name*="estimon" i]');
  if (!c) return null;
  const r = c.getBoundingClientRect();
  // find the inner scrolling track and quotes
  const quotes = [...c.querySelectorAll('[data-framer-name], p')].slice(0, 6).map(q => {
    const qr = q.getBoundingClientRect();
    return { name: q.getAttribute('data-framer-name'), top: Math.round(qr.top), h: Math.round(qr.height), txt: (q.textContent||'').slice(0,40) };
  });
  return { containerH: Math.round(r.height), top: Math.round(r.top), quotes };
});
log('TESTIMONIAL GEO:', JSON.stringify(geo, null, 2));

// Detect autoplay speed: sample transform/scrollLeft of inner track over 3s
const speed = await p.evaluate(() => new Promise(res => {
  const c = document.querySelector('.framer-1rfzgaf-container, [data-framer-name*="estimon" i]');
  if (!c) return res(null);
  const track = c.querySelector('[style*="transform"]') || c;
  const samples = [];
  let n = 0;
  const id = setInterval(() => {
    const cs = getComputedStyle(track);
    samples.push(cs.transform);
    if (++n >= 6) { clearInterval(id); res(samples); }
  }, 500);
}));
log('TRACK TRANSFORM SAMPLES (0.5s apart):', JSON.stringify(speed));

await browser.close();
log('DONE');
