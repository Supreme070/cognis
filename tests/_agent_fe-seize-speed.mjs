import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/fe-console-hydration';
const browser=await chromium.launch();

// ---- A) Testimonial auto-advance cadence on service page (sample transform every 250ms x 24) ----
{
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  await page.goto(BASE+'/our-services/ai-strategy-advisory/',{waitUntil:'domcontentloaded'}).catch(()=>{});
  await page.waitForTimeout(5000);
  const samples=[];
  for(let i=0;i<24;i++){
    const x=await page.evaluate(()=>{const u=document.querySelector('.framer-slideshow-axis-x ul');return u?Math.round(new DOMMatrix(getComputedStyle(u).transform).m41):null;}).catch(()=>null);
    samples.push(x);
    await page.waitForTimeout(250);
  }
  // count distinct positions & max jump
  const changes=[]; for(let i=1;i<samples.length;i++){ if(samples[i]!==samples[i-1]) changes.push(Math.abs(samples[i]-samples[i-1])); }
  console.log('SVC SLIDESHOW samples(6s):', JSON.stringify(samples));
  console.log('transitions:', changes.length, 'jumps:', JSON.stringify(changes));
  await ctx.close();
}

// ---- B) Seize/freeze under 4x CPU throttle during nav storm ----
{
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  const client=await ctx.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate',{rate:4});
  let longtasks=0;
  await page.addInitScript(()=>{window.__lt=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.duration>50)window.__lt++;}).observe({entryTypes:['longtask']});}catch(e){}});
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'}).catch(()=>{});
  await page.waitForTimeout(4000);
  // responsiveness probe under load + during scroll thrash
  async function responsive(){ for(let i=0;i<4;i++){ try{ await Promise.race([page.evaluate(()=>1),new Promise((_,r)=>setTimeout(()=>r('to'),3000))]); return true;}catch{await page.waitForTimeout(400);}} return false;}
  // scroll thrash to provoke observers + marquee + Framer animations
  for(let k=0;k<6;k++){ await page.mouse.wheel(0,1500); await page.waitForTimeout(300); }
  const r1=await responsive();
  const lt=await page.evaluate(()=>window.__lt||0).catch(()=>null);
  console.log('HOME @4x CPU: responsive=',r1,'longtasks(>50ms)=',lt);
  await page.screenshot({path:OUT+'/home-throttled.png'});
  await ctx.close();
}
await browser.close();
