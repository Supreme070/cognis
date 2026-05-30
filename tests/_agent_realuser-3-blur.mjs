import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
await p.goto(BASE+'/our-services/',{waitUntil:'domcontentloaded'}).catch(()=>{});
await p.waitForTimeout(9000);
let blurred='ctx-destroyed';
try{ blurred=JSON.stringify(await p.evaluate(()=>{const out=[];document.querySelectorAll('h1,h2,h3,p,span,div').forEach(e=>{const cs=getComputedStyle(e);if(cs.filter&&cs.filter.includes('blur')){const t=(e.innerText||'').trim().slice(0,45);if(t&&t.length>3)out.push({tag:e.tagName,filter:cs.filter,text:t});}});const seen=new Set();return out.filter(o=>{if(seen.has(o.text))return false;seen.add(o.text);return true;}).slice(0,10);}),null,1); }catch(e){ blurred='ctx-destroyed (late nav still running at 9s)'; }
console.log('BLURRED:',blurred);
await b.close();
