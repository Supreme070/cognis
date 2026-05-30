import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const EXE = 'C:\\Users\\supre\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/ux-a11y';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE });
const result = {};

async function settle(page){ for(let i=0;i<6;i++){ try{ await page.evaluate(()=>1); return; }catch{ await page.waitForTimeout(600);} } }

// Service page testimonial: scroll to it, let settle, screenshot, measure geometry repeatedly
{
  const ctx = await browser.newContext({ viewport:{width:1440,height:900} });
  const page = await ctx.newPage();
  await page.goto(BASE+'/our-services/ai-strategy-advisory/', { waitUntil:'load', timeout:60000 }).catch(()=>{});
  await page.waitForTimeout(5000); await settle(page);
  await page.evaluate(() => { const h=[...document.querySelectorAll('h2')].find(x=>/clients say/i.test(x.textContent)); if(h) h.scrollIntoView({block:'center'}); }).catch(()=>{});
  await page.waitForTimeout(2500); await settle(page);
  await page.screenshot({ path:`${OUT}/testimonial-service-settled.png` }).catch(()=>{});
  // sample geometry 4 times over 3s to see motion + whitespace
  const samples=[];
  for(let i=0;i<5;i++){
    const g = await page.evaluate(() => {
      const ss=document.querySelector('.framer-slideshow'); if(!ss) return {found:false};
      const track=ss.querySelector('.framer-slideshow-axis-x')||ss.firstElementChild;
      const ul = track ? track.querySelector('ul') : null;
      const slides = ul ? [...ul.children] : (track?[...track.children]:[]);
      const vw=window.innerWidth;
      const boxes=slides.map(s=>{const b=s.getBoundingClientRect();return{x:Math.round(b.x),w:Math.round(b.w||b.width),vis:b.x<vw&&b.x+b.width>0};});
      const visible=boxes.filter(b=>b.vis).length;
      const ssR=ss.getBoundingClientRect();
      // how much of the container width is covered by visible slides?
      let coveredMin=vw,coveredMax=0; for(const b of boxes){ if(b.vis){ coveredMin=Math.min(coveredMin,b.x); coveredMax=Math.max(coveredMax,b.x+b.w);} }
      const coverage = visible? Math.round((Math.min(coveredMax,vw)-Math.max(coveredMin,0))) : 0;
      return { found:true, slideCount:slides.length, visibleSlides:visible, containerW:Math.round(ssR.width), coverageW:coverage, ulTransform: ul?getComputedStyle(ul).transform:null, firstX: boxes[0]?boxes[0].x:null };
    }).catch(e=>({err:String(e).slice(0,80)}));
    samples.push(g);
    await page.waitForTimeout(750);
  }
  result.serviceTestimonial = samples;
  await ctx.close();
}

// reduced-motion service: load with domcontentloaded, settle long, then sample once
{
  const ctx = await browser.newContext({ viewport:{width:1440,height:900}, reducedMotion:'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE+'/our-services/ai-strategy-advisory/', { waitUntil:'load', timeout:60000 }).catch(()=>{});
  await page.waitForTimeout(6000); await settle(page);
  result.reducedMotionService = await page.evaluate(async () => {
    const tickers=[...document.querySelectorAll('.ticker-item')];
    const ul = tickers[0] ? tickers[0].closest('ul') : null;
    const s=[]; for(let i=0;i<5;i++){ s.push(ul?getComputedStyle(ul).transform:null); await new Promise(r=>setTimeout(r,400)); }
    return { tickerFound:!!ul, tickerMoving:new Set(s).size>1, samples:s.slice(0,3), prm:matchMedia('(prefers-reduced-motion: reduce)').matches };
  }).catch(e=>({err:String(e).slice(0,80)}));
  await ctx.close();
}

writeFileSync(`${OUT}/a11y-testimonial.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
