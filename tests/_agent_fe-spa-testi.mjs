import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/fe-console-hydration';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1440,height:900}});
const page=await ctx.newPage();
const warns=[]; let recov=0;
page.on('console',m=>{const t=m.text(); if(/recoverable/i.test(t)) recov++; if(m.type()==='error') warns.push(t.slice(0,120));});

// ---- SPA scatter: home -> About (SPA) -> back to home ----
await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(3500);
recov=0;
// click a Framer SPA nav link (ABOUT US)
const aboutLink = page.locator('#main a[href*="about" i], #main a:has-text("About")').first();
await aboutLink.click({timeout:8000}).catch(e=>console.log('about click fail',e.message));
await page.waitForTimeout(2500);
console.log('after SPA->About, recov-since-home-load=',recov, 'url=',page.url());
// Back to home via browser
await page.goBack({timeout:20000}).catch(()=>{});
await page.waitForTimeout(800);
await page.screenshot({path:OUT+'/spa-back-home-t800.png'});
await page.waitForTimeout(2500);
await page.screenshot({path:OUT+'/spa-back-home-settled.png'});
const layout = await page.evaluate(()=>{
  const secs=[...document.querySelectorAll('#main [data-framer-name]')];
  let zero=0,overlap=0;
  const rects=secs.map(s=>s.getBoundingClientRect());
  for(const r of rects){ if(r.width===0&&r.height===0) zero++; }
  return {count:secs.length, zeroBox:zero, scrollH:document.body.scrollHeight};
});
console.log('LAYOUT after back-to-home:',JSON.stringify(layout));

// ---- Testimonials inspection on home ----
await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(4000);
await page.locator('#testimonials').scrollIntoViewIfNeeded().catch(()=>{});
await page.waitForTimeout(1500);
await page.screenshot({path:OUT+'/home-testimonials.png'});
const t1 = await page.evaluate(()=>{
  const sec=document.getElementById('testimonials');
  if(!sec) return {noSec:true};
  const track=sec.querySelector('.cgt-track');
  const ul=sec.querySelector('.framer-slideshow-axis-x ul');
  const cards=track?[...track.children].map(c=>{const r=c.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};}):[];
  return {
    hasTrack:!!track, hasUl:!!ul,
    ulHidden: ul?getComputedStyle(ul).opacity:null,
    trackChildren: track?track.children.length:0,
    cardSizes: cards.slice(0,6),
    trackTransform: track?getComputedStyle(track).transform:null,
    secH: Math.round(sec.getBoundingClientRect().height),
  };
});
console.log('HOME TESTI:',JSON.stringify(t1));
// measure marquee speed: sample transform twice
const x1=await page.evaluate(()=>{const t=document.querySelector('#testimonials .cgt-track');return t?new DOMMatrix(getComputedStyle(t).transform).m41:null;});
await page.waitForTimeout(1000);
const x2=await page.evaluate(()=>{const t=document.querySelector('#testimonials .cgt-track');return t?new DOMMatrix(getComputedStyle(t).transform).m41:null;});
console.log('MARQUEE px/sec ~', (x1!=null&&x2!=null)?Math.round(Math.abs(x2-x1)):'n/a', 'x1=',x1,'x2=',x2);

// ---- Testimonials on a service page (Framer live carousel) ----
await page.goto(BASE+'/our-services/ai-strategy-advisory/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(4000);
const t2 = await page.evaluate(()=>{
  // find any testimonial-ish carousel and measure whitespace / card fill
  const qb=document.querySelectorAll('[data-framer-name="tdesign:quote-filled"]');
  const sec = qb.length? qb[0].closest('section,[data-framer-name]') : null;
  return { quoteBoxes: qb.length };
});
console.log('SVC TESTI:',JSON.stringify(t2));
await page.evaluate(()=>{const q=document.querySelector('[data-framer-name="tdesign:quote-filled"]'); if(q) q.scrollIntoView({block:'center'});});
await page.waitForTimeout(1500);
await page.screenshot({path:OUT+'/svc-testimonials.png'});
console.log('ERRORS:',JSON.stringify([...new Set(warns)].slice(0,8)));
await browser.close();
