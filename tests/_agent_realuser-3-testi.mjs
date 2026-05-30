import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/realuser-3-x';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
await p.goto(BASE+'/our-services/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(4000);
// scroll in steps, screenshot each, look for testimonial band
for(let i=1;i<=9;i++){
  await p.mouse.wheel(0,900);
  await p.waitForTimeout(700);
}
await p.waitForTimeout(500);
await p.screenshot({path:`${OUT}/svc-testi-1.png`});
await p.waitForTimeout(1500);
await p.screenshot({path:`${OUT}/svc-testi-2.png`});
console.log('done',p.url());
await b.close();
