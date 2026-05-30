import { chromium } from 'playwright';
const b = await chromium.launch();
const shots = [['desktop-tall',1440,900],['laptop-short',1366,650],['laptop-720',1440,720],['mobile',390,844]];
for (const [name,w,h] of shots) {
  const ctx=await b.newContext({viewport:{width:w,height:h}});
  const p=await ctx.newPage();
  await p.goto('https://www.cognis.group/',{waitUntil:'load'}); await p.waitForTimeout(5500);
  const m=await p.evaluate(()=>{
    const hero=document.querySelector('[data-framer-name="hero"]');
    const h1=document.querySelector('h1');
    let sub=null; for(const pp of document.querySelectorAll('p')){if((pp.textContent||'').trim().length>40&&pp.getBoundingClientRect().top<900){sub=pp;break;}}
    const v=document.querySelector('video[data-cognis-hero-portal]');
    return { minH:hero?hero.style.minHeight||'(none)':'?', subBottom:sub?Math.round(sub.getBoundingClientRect().bottom):null, videoPlaying:v?(!v.paused&&!!v.getAttribute('src')):false };
  });
  await p.screenshot({path:`test-results/investigate/final-${name}.png`});
  console.log(`${name} (${w}x${h}): hero min-h=${m.minH} subBottom=${m.subBottom} heroVideoPlaying=${m.videoPlaying}`);
  await ctx.close();
}
await b.close();
