import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const EXE = 'C:\\Users\\supre\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/ux-a11y';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE });
const result = {};
async function settle(page){ for(let i=0;i<8;i++){ try{ await page.evaluate(()=>1); return true; }catch{ await page.waitForTimeout(700);} } return false; }

// Mobile nav: products (custom header) vs home (global framer header)
for (const [tag,url,clickHome] of [['products','/products/',false],['home','/',false]]) {
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  const page = await ctx.newPage();
  await page.goto(BASE+url, { waitUntil:'load', timeout:60000 }).catch(()=>{});
  await page.waitForTimeout(4000); await settle(page);
  await page.screenshot({ path:`${OUT}/mobile-${tag}-header.png` }).catch(()=>{});
  result['mobileNav_'+tag] = await page.evaluate(() => {
    const customNav=document.querySelector('header.site-nav nav');
    const customLinks = customNav ? [...customNav.querySelectorAll('a')] : [];
    const customVisible = customLinks.filter(a=>a.offsetParent!==null && getComputedStyle(a).display!=='none').map(a=>a.textContent.trim());
    // any hamburger / menu toggle anywhere visible top of page
    const toggles=[...document.querySelectorAll('button,[role="button"],[aria-label*="menu" i],[aria-label*="navigation" i],[class*="hamburger" i],[class*="burger" i],[class*="menu-toggle" i]')]
      .filter(b=>{const r=b.getBoundingClientRect(); return b.offsetParent!==null && r.top<120 && r.width>0;})
      .map(b=>({tag:b.tagName,al:b.getAttribute('aria-label'),cls:(b.className||'').toString().slice(0,50)}));
    return { customHeaderPresent:!!customNav, customNavLinksTotal:customLinks.length, customNavLinksVisible:customVisible, topToggles:toggles.slice(0,6) };
  }).catch(e=>({err:String(e).slice(0,100)}));
  await ctx.close();
}

// reduced-motion on service: load, settle hard before any evaluate
{
  const ctx = await browser.newContext({ viewport:{width:1440,height:900}, reducedMotion:'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE+'/our-services/ai-strategy-advisory/', { waitUntil:'load', timeout:60000 }).catch(()=>{});
  await page.waitForTimeout(7000); await settle(page);
  // scroll to testimonials
  await page.evaluate(()=>{const h=[...document.querySelectorAll('h2')].find(x=>/clients say/i.test(x.textContent)); if(h)h.scrollIntoView({block:'center'});}).catch(()=>{});
  await page.waitForTimeout(2000); await settle(page);
  result.rmServiceTestimonial = await page.evaluate(async () => {
    const ss=document.querySelector('.framer-slideshow'); if(!ss) return {found:false, prm:matchMedia('(prefers-reduced-motion: reduce)').matches};
    const track=ss.querySelector('.framer-slideshow-axis-x')||ss.firstElementChild;
    const ul = track? track.querySelector('ul'):null;
    const s=[]; for(let i=0;i<5;i++){ s.push(ul?getComputedStyle(ul).transform:null); await new Promise(r=>setTimeout(r,500)); }
    return { found:true, slideMoving:new Set(s).size>1, samples:s, prm:matchMedia('(prefers-reduced-motion: reduce)').matches };
  }).catch(e=>({err:String(e).slice(0,100)}));
  await ctx.close();
}

writeFileSync(`${OUT}/a11y-final.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
