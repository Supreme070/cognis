import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const EXE = 'C:\\Users\\supre\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/ux-a11y';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE });
const result = {};

// 1) Contact form: which visible fields lack accessible labels?
{
  const page = await (await browser.newContext({ viewport:{width:1440,height:900} })).newPage();
  await page.goto(BASE+'/contact/', { waitUntil:'networkidle', timeout:45000 }).catch(()=>{});
  await page.waitForTimeout(2000);
  result.contactForm = await page.evaluate(() => {
    const fields = [...document.querySelectorAll('form input, form textarea, form select')];
    const visible = fields.filter(f => f.type!=='hidden' && f.offsetParent!==null && getComputedStyle(f).display!=='none' && getComputedStyle(f).visibility!=='hidden');
    const describe = f => {
      const id=f.id; const hasFor=id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
      const wrapped=f.closest('label'); const aria=f.getAttribute('aria-label')||f.getAttribute('aria-labelledby');
      const ph=f.getAttribute('placeholder');
      return { name:f.name, type:f.type, hasFor:!!hasFor, wrapped:!!wrapped, aria:aria||null, placeholder:ph||null, required:f.required };
    };
    return { totalFields: fields.length, visibleCount: visible.length, visible: visible.map(describe) };
  }).catch(e=>({error:String(e).slice(0,120)}));
}

// 2) reduced-motion: does the testimonial/ticker keep animating? Test on a service page (has testimonials + ticker)
for (const [tag,url] of [['service','/our-services/ai-strategy-advisory/'],['about','/about-us/']]) {
  const ctx = await browser.newContext({ viewport:{width:1440,height:900}, reducedMotion:'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE+url, { waitUntil:'domcontentloaded', timeout:45000 }).catch(()=>{});
  await page.waitForTimeout(4500);
  const rm = await page.evaluate(async () => {
    // ticker (marquee) elements
    const tickers = [...document.querySelectorAll('.ticker-item, [class*="ticker" i], ul[role="group"]')];
    const trackEl = tickers.map(t => t.closest('ul') || t.parentElement).find(Boolean);
    function sampleTransform(el){ return el ? getComputedStyle(el).transform : null; }
    const tickerSamples=[];
    // testimonial slideshow
    const slideshow = document.querySelector('.framer-slideshow, [class*="slideshow" i], [data-framer-name*="testimonial" i]');
    const slideTrack = slideshow ? (slideshow.querySelector('.framer-slideshow-axis-x') || slideshow.firstElementChild) : null;
    const slideSamples=[];
    for (let i=0;i<7;i++){
      tickerSamples.push(sampleTransform(trackEl));
      slideSamples.push(sampleTransform(slideTrack));
      await new Promise(r=>setTimeout(r,350));
    }
    return {
      tickerFound: !!trackEl, tickerMoving: new Set(tickerSamples).size>1, tickerSamples: tickerSamples.slice(0,4),
      slideshowFound: !!slideshow, slideMoving: new Set(slideSamples).size>1, slideSamples: slideSamples.slice(0,4),
      prefersReducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  }).catch(e=>({error:String(e).slice(0,120)}));
  result['reducedMotion_'+tag]=rm;
  await page.screenshot({ path:`${OUT}/rm-${tag}.png` }).catch(()=>{});
  await ctx.close();
}

// 3) Testimonial whitespace + speed: capture screenshots of testimonial region over time (no reduced motion)
{
  const ctx = await browser.newContext({ viewport:{width:1440,height:900} });
  const page = await ctx.newPage();
  await page.goto(BASE+'/our-services/ai-strategy-advisory/', { waitUntil:'domcontentloaded', timeout:45000 }).catch(()=>{});
  await page.waitForTimeout(3000);
  // scroll to "What our clients say"
  await page.evaluate(() => { const h=[...document.querySelectorAll('h2')].find(x=>/clients say/i.test(x.textContent)); if(h) h.scrollIntoView({block:'center'}); });
  await page.waitForTimeout(1200);
  await page.screenshot({ path:`${OUT}/testimonial-t0.png` }).catch(()=>{});
  await page.waitForTimeout(1500);
  await page.screenshot({ path:`${OUT}/testimonial-t1.png` }).catch(()=>{});
  // Measure the testimonial slideshow geometry + whitespace
  result.testimonialGeom = await page.evaluate(() => {
    const ss = document.querySelector('.framer-slideshow');
    if(!ss) return { found:false };
    const r = ss.getBoundingClientRect();
    const track = ss.querySelector('.framer-slideshow-axis-x') || ss.firstElementChild;
    const slides = track ? [...track.children] : [];
    const slideBoxes = slides.map(s=>{ const b=s.getBoundingClientRect(); return { w:Math.round(b.width), x:Math.round(b.x), visible: b.x<window.innerWidth && b.x+b.width>0 }; });
    const cs = track ? getComputedStyle(track) : null;
    return { found:true, container:{w:Math.round(r.width),h:Math.round(r.height)}, slideCount:slides.length, slideBoxes:slideBoxes.slice(0,8), transition: cs?cs.transition:null, animationDuration: cs?cs.animationDuration:null };
  }).catch(e=>({error:String(e).slice(0,120)}));
  await ctx.close();
}

// 4) Products -> Home scatter: navigate via SPA link then capture
{
  const ctx = await browser.newContext({ viewport:{width:1440,height:900} });
  const page = await ctx.newPage();
  await page.goto(BASE+'/products/', { waitUntil:'domcontentloaded', timeout:45000 }).catch(()=>{});
  await page.waitForTimeout(2500);
  await page.screenshot({ path:`${OUT}/scatter-0-products.png` }).catch(()=>{});
  // click brand/home link in products header
  await page.click('a.brand[href="/"]', { timeout:8000 }).catch(async()=>{ await page.goto(BASE+'/').catch(()=>{}); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path:`${OUT}/scatter-1-home-justloaded.png` }).catch(()=>{});
  await page.waitForTimeout(2500);
  await page.screenshot({ path:`${OUT}/scatter-2-home-settled.png` }).catch(()=>{});
  result.scatter = await page.evaluate(() => ({ url:location.href, bodyScrollH:document.body.scrollHeight, h1:(document.querySelector('h1')||{}).textContent }));
  await ctx.close();
}

// 5) Keyboard: tab order on home + which elements lack focus indicator (detail)
{
  const ctx = await browser.newContext({ viewport:{width:1440,height:900} });
  const page = await ctx.newPage();
  await page.goto(BASE+'/why-cognis/', { waitUntil:'networkidle', timeout:45000 }).catch(()=>{});
  await page.waitForTimeout(2000);
  result.focusDetailWhy = await page.evaluate(() => {
    const sel='a[href],button,input,textarea,select,[tabindex]:not([tabindex="-1"])';
    const els=[...document.querySelectorAll(sel)].filter(e=>e.offsetParent!==null);
    const bad=[];
    for(const el of els){ el.focus(); const cs=getComputedStyle(el);
      const o=cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0; const bs=cs.boxShadow&&cs.boxShadow!=='none';
      if(!o&&!bs) bad.push({tag:el.tagName, cls:(el.className||'').toString().slice(0,40), txt:(el.textContent||'').trim().slice(0,30)});
    }
    return { focusable:els.length, noIndicator:bad.length, sample:bad.slice(0,10) };
  }).catch(e=>({error:String(e).slice(0,120)}));
  await ctx.close();
}

writeFileSync(`${OUT}/a11y-deep.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
