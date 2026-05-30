import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const CHROME = `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe`;
const OUT = 'test-results/site-audit/evidence/perf-load/testimonials';
mkdirSync(OUT, { recursive: true });
const BASE='https://www.cognis.group';
const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const page = await ctx.newPage();
await page.goto(BASE+'/',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(4000);
// SPA nav to services
await page.getByText('SERVICES',{exact:false}).first().click().catch(()=>{});
await page.waitForTimeout(4000);
console.log('url', page.url());
// locate any slideshow / testimonial
const found = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('[data-framer-name]')].filter(e=>/slideshow|testimon/i.test(e.getAttribute('data-framer-name')||''));
  const res=[];
  for(const c of cands){ const r=c.getBoundingClientRect(); res.push({name:c.getAttribute('data-framer-name'),top:Math.round(r.top+window.scrollY),h:Math.round(r.height)}); }
  return res;
});
console.log('slideshows', JSON.stringify(found));
// scroll to first slideshow
if (found.length){
  await page.evaluate((y)=>window.scrollTo(0,y-120), found[0].top);
  await page.waitForTimeout(1500);
  await page.screenshot({ path:`${OUT}/services-testimonial.png` });
  // capture transition + measure white-box presence
  const detail = await page.evaluate(()=>{
    const sec=[...document.querySelectorAll('[data-framer-name]')].find(e=>/slideshow|testimon/i.test(e.getAttribute('data-framer-name')||''));
    if(!sec) return {};
    const ul=sec.querySelector('ul'); const cs=ul?getComputedStyle(ul):null;
    // detect empty white icon boxes (the broken quote icon)
    const whiteBoxes=[...sec.querySelectorAll('div')].filter(d=>{const s=getComputedStyle(d);const r=d.getBoundingClientRect();return r.width>10&&r.width<60&&r.height>10&&r.height<60&&/rgb\(255, 255, 255\)|rgb\(248/.test(s.backgroundColor)&&d.children.length===0;}).length;
    return {transition:cs?cs.transition:'', anim:cs?cs.animation:'', whiteBoxes};
  });
  console.log('detail', JSON.stringify(detail));
  // measure scroll speed: track transform over 3s
  const positions = [];
  for(let i=0;i<6;i++){ positions.push(await page.evaluate(()=>{const sec=[...document.querySelectorAll('[data-framer-name]')].find(e=>/slideshow/i.test(e.getAttribute('data-framer-name')||''));const ul=sec&&sec.querySelector('ul');return ul?getComputedStyle(ul).transform:'none';})); await page.waitForTimeout(500); }
  console.log('transforms', JSON.stringify(positions));
}
await b.close();
