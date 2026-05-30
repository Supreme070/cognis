import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(4000);
// dump all nav anchors hrefs+text in header
const links=await p.evaluate(()=>{
  return [...document.querySelectorAll('a[href]')].map(a=>({h:a.getAttribute('href'),t:(a.innerText||'').trim().slice(0,30)})).filter(x=>x.t).slice(0,60);
});
console.log('HOME ANCHORS:');
links.forEach(l=>console.log(' ',JSON.stringify(l.h),'|',l.t));
await b.close();
