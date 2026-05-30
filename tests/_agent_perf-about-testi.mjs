import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/perf-nav-thrash';
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1440,height:900}});
const page=await ctx.newPage();
let navs=[];
page.on('framenavigated',f=>{if(f===page.mainFrame())navs.push(f.url().replace(BASE,'')||'/');});
await page.goto(BASE+'/about-us',{waitUntil:'load',timeout:40000});
await page.waitForTimeout(6000);
console.log('about-us self-navigation trail (extra entries = self re-nav churn):', JSON.stringify(navs));
// scroll down to testimonials by text via locator (resilient)
const h = page.getByText(/what our clients say|operating principles/i).first();
try { await h.scrollIntoViewIfNeeded({timeout:5000}); } catch {}
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT+'/testi_about-us.png', fullPage:false });
// measure section height vs card height with a settle-safe retry
let m=null;
for (let i=0;i<3;i++){
  try { m = await page.evaluate(()=>{
    const h=[...document.querySelectorAll('h1,h2,h3')].find(e=>/what our clients say|operating principles/i.test(e.textContent||''));
    if(!h)return{found:false};
    let s=h.closest('section')||h.parentElement; const r=s.getBoundingClientRect();
    const ul=s.querySelector('.framer-slideshow-axis-x ul,[data-framer-name="slideshow"] ul');
    const cards=ul?[...ul.children].map(li=>li.firstElementChild||li):[];
    const ch=cards.length?Math.max(...cards.map(c=>c.getBoundingClientRect().height)):0;
    return{found:true,heading:h.textContent.trim().slice(0,40),secHeight:Math.round(r.height),cardCount:cards.length,maxCardHeight:Math.round(ch),whitespaceGap:Math.round(r.height-ch),hasMarquee:!!s.querySelector('.cgt-track')};
  }); break; } catch(e){ await page.waitForTimeout(1000); }
}
console.log('ABOUT-US TESTIMONIALS:', JSON.stringify(m));
await browser.close();
