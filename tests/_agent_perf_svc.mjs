import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/perf-jank-seize';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
let navCount = 0;
page.on('framenavigated', f => { if (f === page.mainFrame()) navCount++; });
await page.goto(BASE + '/our-services/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(()=>{});
await page.waitForTimeout(1500);
console.log('mainFrame navigations during load:', navCount, 'finalURL:', page.url());
async function ev(fn){ for(let k=0;k<5;k++){ try { return await page.evaluate(fn); } catch(e){ await page.waitForTimeout(1500);} } return null; }
const slides = await ev(() => {
  return Array.from(document.querySelectorAll('.framer-slideshow-axis-x')).map((sx, idx) => {
    const ul = sx.querySelector('ul');
    const sec = sx.closest('section') || sx.closest('div[id]');
    const r = sx.getBoundingClientRect();
    return {
      idx,
      ulOpacity: ul ? getComputedStyle(ul).opacity : null,
      ulPos: ul ? getComputedStyle(ul).position : null,
      ulAriaHidden: ul ? ul.getAttribute('aria-hidden') : null,
      hasCgtTrack: !!sx.parentElement?.querySelector?.('.cgt-track') || !!sx.closest('section')?.querySelector?.('.cgt-track'),
      childCount: ul ? ul.children.length : 0,
      boxH: Math.round(r.height),
      nearbyHeading: (() => { let n = sx; for (let k=0;k<6 && n;k++){ n=n.parentElement; const h=n&&n.querySelector&&n.querySelector('h2,h3'); if(h) return h.textContent.trim().slice(0,60);} return null; })()
    };
  });
});
console.log('SLIDESHOWS', JSON.stringify(slides, null, 2));
// is there a #testimonials on this page at all?
const hasTesti = await ev(() => !!document.getElementById('testimonials'));
console.log('hasTestimonialsId', hasTesti);
// find any large empty vertical gaps in viewport scan
await page.evaluate(() => { const sx = document.querySelectorAll('.framer-slideshow-axis-x'); if (sx[0]) sx[0].scrollIntoView({block:'center'}); });
await page.waitForTimeout(800);
await page.screenshot({ path: out + '/svc-slideshow0.png' });
await browser.close();
