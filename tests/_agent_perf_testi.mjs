import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/perf-jank-seize';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const path of ['/', '/about-us/', '/our-services/']) {
  const tag = path.replace(/\W+/g,'_') || 'home';
  try { await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch(e){ console.log(path,'goto err'); continue; }
  await page.waitForTimeout(2500);
  // locate testimonials section
  const info = await page.evaluate(() => {
    const sec = document.getElementById('testimonials') || Array.from(document.querySelectorAll('section,div')).find(s => /what our clients say|operating principles/i.test(s.textContent||'') && s.querySelector('.framer-slideshow-axis-x'));
    if (!sec) return { found: false };
    sec.scrollIntoView({ block: 'center' });
    const track = sec.querySelector('.cgt-track');
    const ul = sec.querySelector('.framer-slideshow-axis-x ul');
    const r = sec.getBoundingClientRect();
    return { found: true, hasTrack: !!track, hasOrigUl: !!ul, ulHidden: ul ? getComputedStyle(ul).opacity : null, secH: Math.round(r.height), heading: (sec.querySelector('h2')||{}).textContent };
  });
  console.log(path, 'TESTI', JSON.stringify(info));
  if (info.found) {
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/testi-${tag}-a.png` });
    // measure marquee speed: sample transform twice 1s apart
    const speed = await page.evaluate(async () => {
      const t = document.querySelector('#testimonials .cgt-track');
      if (!t) return null;
      const x1 = new DOMMatrix(getComputedStyle(t).transform).m41;
      await new Promise(r=>setTimeout(r,1000));
      const x2 = new DOMMatrix(getComputedStyle(t).transform).m41;
      return { x1: Math.round(x1), x2: Math.round(x2), pxPerSec: Math.round(Math.abs(x2-x1)) };
    });
    console.log(path, 'MARQUEE_SPEED', JSON.stringify(speed));
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/testi-${tag}-b.png` });
  }
}
await browser.close();
