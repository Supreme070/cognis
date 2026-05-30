import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/fe-console-hydration';
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1440,height:900}});
const page=await ctx.newPage();

async function ev(fn){ for(let i=0;i<3;i++){ try{ return await page.evaluate(fn);}catch(e){ await page.waitForTimeout(1200);} } return null; }
async function inspect(url, tag){
  await page.goto(BASE+url,{waitUntil:'domcontentloaded'}).catch(()=>{});
  await page.waitForTimeout(5500);
  // find testimonial section: look for quote boxes or a slideshow with attribution text
  const info = await page.evaluate(()=>{
    const qb=document.querySelectorAll('[data-framer-name="tdesign:quote-filled"]');
    const slideshows=document.querySelectorAll('.framer-slideshow-axis-x, [data-framer-name="slideshow"]');
    let sec=null;
    if(qb.length) sec=qb[0].closest('section')||qb[0].closest('[data-framer-name]');
    // measure transition speed on slideshow ul
    const out=[];
    slideshows.forEach(ss=>{
      const ul=ss.querySelector('ul');
      const cs=ul?getComputedStyle(ul):null;
      out.push({transition: cs?cs.transitionDuration:null, lis: ul?ul.children.length:0});
    });
    return { quoteBoxes:qb.length, slideshows:slideshows.length, ssDetail:out };
  });
  // measure slideshow transform movement over 1s to gauge speed
  const t1=await ev(()=>{const u=document.querySelector('.framer-slideshow-axis-x ul,[data-framer-name="slideshow"] ul');return u?new DOMMatrix(getComputedStyle(u).transform).m41:null;});
  await page.waitForTimeout(1000);
  const t2=await ev(()=>{const u=document.querySelector('.framer-slideshow-axis-x ul,[data-framer-name="slideshow"] ul');return u?new DOMMatrix(getComputedStyle(u).transform).m41:null;});
  // scroll the quote box into center & shoot
  await ev(()=>{const q=document.querySelector('[data-framer-name="tdesign:quote-filled"]'); if(q) q.scrollIntoView({block:'center'}); else { const s=document.querySelector('.framer-slideshow-axis-x'); if(s) s.scrollIntoView({block:'center'});}});
  await page.waitForTimeout(1200);
  await page.screenshot({path:`${OUT}/testi-${tag}.png`});
  // detect whitespace: check if any visible card region in slideshow is empty
  console.log(tag, JSON.stringify(info), 'moved/sec=', (t1!=null&&t2!=null)?Math.round(Math.abs(t2-t1)):'static', 't1=',t1,'t2=',t2);
}

await inspect('/about-us/','about');
await inspect('/our-services/ai-strategy-advisory/','svc-strategy');
await inspect('/our-services/ai-agent-automation-engineering/','svc-agent');
await browser.close();
