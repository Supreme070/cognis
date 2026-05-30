import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/fe-network';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(BASE + '/our-services/ai-strategy-advisory/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
await p.waitForTimeout(2500);
// locate the slideshow / testimonial section
const info = await p.evaluate(() => {
  const ss = document.querySelector('.framer-slideshow-axis-x');
  if (!ss) return { found: false };
  let el = ss; while (el && el.getBoundingClientRect().height < 200) el = el.parentElement;
  const r = (el||ss).getBoundingClientRect();
  // does an unfixed white quote box exist? (no data-cognis-quote)
  const qboxes = [...document.querySelectorAll('[data-framer-name="tdesign:quote-filled"]')];
  const unfixed = qboxes.filter(q => !q.getAttribute('data-cognis-quote')).length;
  const hasInjector = !!document.querySelector('[data-cognis-testimonials]');
  return { found:true, y: Math.round(r.top + window.scrollY), h: Math.round(r.height), qboxes: qboxes.length, unfixed, hasInjector };
});
console.log('SVC testimonial info:', JSON.stringify(info));
if (info.found) {
  await p.evaluate(y => window.scrollTo(0, Math.max(0, y - 100)), info.y);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/svc-testimonial.png` });
  // sample carousel speed: measure ul transform over 1s
  const t0 = await p.evaluate(()=>{ const ul=document.querySelector('.framer-slideshow-axis-x ul'); return ul?getComputedStyle(ul).transform:''; });
  await p.waitForTimeout(1000);
  const t1 = await p.evaluate(()=>{ const ul=document.querySelector('.framer-slideshow-axis-x ul'); return ul?getComputedStyle(ul).transform:''; });
  console.log('carousel transform t0:', t0, ' t1:', t1);
}
await b.close();
