import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const CHROME = `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe`;
const OUT = 'test-results/site-audit/evidence/perf-load/testimonials';
mkdirSync(OUT, { recursive: true });
const BASE = 'https://www.cognis.group';
const pages = [['home','/'],['about','/about-us/'],['services','/our-services/']];
for (const [name,url] of pages) {
  const b = await chromium.launch({ executablePath: CHROME });
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const page = await ctx.newPage();
  await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:60000}).catch(()=>{});
  await page.waitForTimeout(5000);
  // find testimonials section
  let info; try { info = await page.evaluate(() => {
    const sec = document.querySelector('#testimonials') || [...document.querySelectorAll('*')].find(e=>/testimonial/i.test(e.id||'')||/testimonial/i.test(e.getAttribute?.('data-framer-name')||''));
    if (!sec) return {found:false};
    sec.scrollIntoView({block:'center'});
    const r = sec.getBoundingClientRect();
    // measure carousel animation duration if any
    const ul = sec.querySelector('ul');
    let transition='', anim='';
    if (ul){ const cs=getComputedStyle(ul); transition=cs.transition; anim=cs.animation; }
    return {found:true, top:Math.round(r.top), height:Math.round(r.height), id:sec.id, transition, anim};
  }); } catch(e){ await page.waitForTimeout(2000); try{ info = await page.evaluate(()=>{const sec=document.querySelector('#testimonials');if(!sec)return{found:false};sec.scrollIntoView({block:'center'});return{found:true,id:sec.id};});}catch{info={found:false,err:String(e).slice(0,80)};} }
  await page.waitForTimeout(1500);
  await page.screenshot({ path:`${OUT}/${name}.png` });
  console.log(name, JSON.stringify(info));
  await b.close();
}
