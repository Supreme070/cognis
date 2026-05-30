import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/realuser-3-x';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
await p.goto(BASE+'/products/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(2500);
await p.screenshot({path:`${OUT}/scatter-0-products.png`});
// click Cognis logo -> home
await p.click('a[href="/"]').catch(e=>console.log('click err',String(e).slice(0,60)));
await p.waitForTimeout(1200);
await p.screenshot({path:`${OUT}/scatter-1-justafter.png`});
await p.waitForTimeout(2500);
await p.screenshot({path:`${OUT}/scatter-2-settled.png`});
console.log('final url',p.url());
await b.close();
