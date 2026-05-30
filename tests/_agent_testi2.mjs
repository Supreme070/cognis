import { chromium } from 'playwright';
const OUT = 'test-results/site-audit/evidence/e2e-contact-funnel';
const BASE = 'https://www.cognis.group';
const browser = await chromium.launch({ channel: 'chromium' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const log = (...a) => console.log(...a);

async function probeTesti(path, tag) {
  const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForTimeout(6000);
  // find heading that anchors the testimonials section
  const found = await p.evaluate(() => {
    const heads = [...document.querySelectorAll('h1,h2,h3,p')];
    const h = heads.find(e => /clients say|testimonial|what our clients|operating principles/i.test(e.textContent||''));
    if (h) { h.scrollIntoView({ block: 'center' }); return { text: h.textContent.trim().slice(0,60), top: Math.round(h.getBoundingClientRect().top) }; }
    return null;
  });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/ti-${tag}-a.png` });
  // sample any slideshow ul transform over time to gauge speed + look for empty white quote boxes
  const info = await p.evaluate(() => {
    // empty white quote icon: tdesign:quote-filled with white bg and no svg
    const quoteBoxes = [...document.querySelectorAll('[data-framer-name="tdesign:quote-filled"], [data-framer-name*="quote" i]')].map(q => {
      const cs = getComputedStyle(q);
      return { bg: cs.backgroundColor, hasSvg: !!q.querySelector('svg'), w: q.getBoundingClientRect().width };
    });
    const uls = [...document.querySelectorAll('[data-framer-name="slideshow"] ul, .framer-slideshow-axis-x ul, ul')].filter(u => getComputedStyle(u).transitionDuration !== '0s').map(u => ({ td: getComputedStyle(u).transitionDuration, tf: getComputedStyle(u).transitionTimingFunction }));
    const hasPolish = !!document.querySelector('[data-cognis-testimonials], .cgt-track');
    return { quoteBoxes, ulTransitions: uls.slice(0,4), hasPolish };
  });
  log(`[${tag}] heading:`, JSON.stringify(found), '| info:', JSON.stringify(info));
  return p;
}

await probeTesti('/about-us/', 'about');
await probeTesti('/our-services/ai-strategy-advisory/', 'svc');
await probeTesti('/', 'home');

await browser.close();
log('DONE');
