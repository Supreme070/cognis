import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/realuser-3-x';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
await p.goto(BASE+'/products/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(3000);
const hdr=await p.evaluate(()=>{
  const h=document.querySelector('header')||document.body;
  return {anchors:[...document.querySelectorAll('header a, nav a')].map(a=>({h:a.getAttribute('href'),t:(a.innerText||'').trim()})).filter(x=>x.t).slice(0,20)};
});
console.log('PRODUCTS HEADER ANCHORS:',JSON.stringify(hdr.anchors,null,1));
await p.screenshot({path:`${OUT}/products-header.png`,clip:{x:0,y:0,width:1440,height:120}});
// now click logo/home and see scatter
const home=await p.$('a[href="/"], a[href="./"], a[href="https://www.cognis.group/"]');
console.log('home link found:',!!home);
await b.close();
