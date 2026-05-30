import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/perf-mobile';
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await ctx.newPage();
let navCount=0; page.on('framenavigated',f=>{if(f===page.mainFrame())navCount++;});
await page.goto(BASE+'/about-us/',{waitUntil:'load',timeout:60000});
await page.waitForLoadState('networkidle',{timeout:30000}).catch(()=>{});
await page.waitForTimeout(4000);
console.log('about-us mainframe navigations after goto:',navCount,'final url:',page.url());
async function ev(fn){for(let i=0;i<4;i++){try{return await page.evaluate(fn);}catch(e){await page.waitForTimeout(1500);}}return{__err:'context-kept-destroying'};}
// locate testimonials section
const found=await ev(()=>{
  const sec=document.getElementById('testimonials');
  if(!sec) return {hasSection:false};
  const r=sec.getBoundingClientRect();
  const ul=sec.querySelector('.framer-slideshow-axis-x ul')||sec.querySelector('[data-framer-name="slideshow"] ul');
  const cgt=!!sec.querySelector('.cgt-track');
  const quoteIcon=sec.querySelector('[data-framer-name="tdesign:quote-filled"]');
  let quoteBg=null,quoteHasSvg=null;
  if(quoteIcon){quoteBg=getComputedStyle(quoteIcon).backgroundColor;quoteHasSvg=!!quoteIcon.querySelector('svg');}
  const logos=sec.querySelectorAll('[data-framer-name="logo"]');
  const trans=ul?getComputedStyle(ul).transitionDuration:null;
  return {hasSection:true,top:Math.round(r.top+window.scrollY),height:Math.round(r.height),hasCgtTrack:cgt,quoteBg,quoteHasSvg,placeholderLogos:logos.length,ulTransition:trans};
});
console.log('ABOUT-US testimonials:', JSON.stringify(found,null,1));
if(found.hasSection){
  await page.evaluate(t=>window.scrollTo(0,t-120),found.top);
  await page.waitForTimeout(1200);
  await page.screenshot({path:OUT+'/testi-about-clean.png'});
  // measure auto-advance speed: sample inner ul transform/scrollLeft over 4s
  const samples=await ev(async()=>{
    const sec=document.getElementById('testimonials');
    const ul=sec.querySelector('.framer-slideshow-axis-x ul')||sec.querySelector('ul');
    const out=[];
    for(let i=0;i<8;i++){ out.push(getComputedStyle(ul).transform.replace('matrix','').slice(0,46)); await new Promise(r=>setTimeout(r,500)); }
    return out;
  });
  console.log('ul transform samples over 4s (500ms each):');
  samples.forEach((s,i)=>console.log(' ',i*500+'ms',s));
}
// also a service page
await page.goto(BASE+'/our-services/ai-strategy-advisory/',{waitUntil:'load',timeout:60000});
await page.waitForTimeout(2500);
const svc=await page.evaluate(()=>{
  const sec=document.getElementById('testimonials'); if(!sec) return {hasSection:false};
  const qi=sec.querySelector('[data-framer-name="tdesign:quote-filled"]');
  return {hasSection:true,hasCgtTrack:!!sec.querySelector('.cgt-track'),quoteBg:qi?getComputedStyle(qi).backgroundColor:null,quoteHasSvg:qi?!!qi.querySelector('svg'):null,placeholderLogos:sec.querySelectorAll('[data-framer-name="logo"]').length};
});
console.log('\nSERVICE (ai-strategy-advisory) testimonials:', JSON.stringify(svc));
if(svc.hasSection){
  const top=await page.evaluate(()=>{const s=document.getElementById('testimonials');return Math.round(s.getBoundingClientRect().top+window.scrollY);});
  await page.evaluate(t=>window.scrollTo(0,t-120),top); await page.waitForTimeout(1200);
  await page.screenshot({path:OUT+'/testi-service-clean.png'});
}
await browser.close();
