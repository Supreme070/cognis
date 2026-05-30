import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/realuser-3-x';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(4000);
const foci=[];
for(let i=0;i<8;i++){
  await p.keyboard.press('Tab');
  await p.waitForTimeout(250);
  const f=await p.evaluate(()=>{const a=document.activeElement;if(!a)return null;const cs=getComputedStyle(a);return{tag:a.tagName,text:(a.innerText||a.getAttribute&&a.getAttribute('aria-label')||'').trim().slice(0,25),outline:cs.outlineStyle+' '+cs.outlineWidth,ring:cs.boxShadow.slice(0,20)};});
  foci.push(f);
}
console.log(JSON.stringify(foci,null,1));
await p.screenshot({path:`${OUT}/kbd-focus.png`});
await b.close();
