import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/realuser-3-x';
const b=await chromium.launch();
for(const label of ['1','2','3']){
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const p=await ctx.newPage();
  await p.goto(BASE+'/our-services/',{waitUntil:'domcontentloaded'}).catch(()=>{});
  await p.waitForTimeout(7000);
  let u='?',info='?';
  try{ u=p.url().replace(BASE,''); }catch{}
  try{ info=JSON.stringify(await p.evaluate(()=>{const h=document.querySelector('h1');if(!h)return{h1:'(none)'};const cs=getComputedStyle(h);return{h1:h.innerText.slice(0,50),filter:cs.filter};})); }catch(e){ info='(ctx destroyed)'; }
  await p.screenshot({path:`${OUT}/svc-fresh-${label}.png`}).catch(()=>{});
  console.log(label,'url',u,info);
  await ctx.close();
}
await b.close();
