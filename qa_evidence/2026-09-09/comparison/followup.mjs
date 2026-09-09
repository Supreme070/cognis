import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const out=new URL('.',import.meta.url).pathname,b=await chromium.launch({headless:true}),results=[];
try{
for(const width of [390,1440]){
 const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await c.newPage();await p.goto('https://luminarymeridian.com/',{waitUntil:'load'});
 await p.addStyleTag({content:'html {scroll-behavior:auto!important}'});
 for(const id of ['team','case-studies','contact']){await p.locator('#'+id).scrollIntoViewIfNeeded();await p.waitForTimeout(1600);await p.screenshot({path:out+'lm-'+width+'-'+id+'-settled.png'});}
 results.push({site:'LM',width,state:await p.evaluate(()=>({overflow:[...document.querySelectorAll('body *')].map(x=>({tag:x.tagName,cls:typeof x.className==='string'?x.className:'',text:x.innerText?.slice(0,80),right:x.getBoundingClientRect().right,width:x.getBoundingClientRect().width})).filter(x=>x.right>innerWidth+2&&x.width>0).slice(0,20),navPadding:getComputedStyle(document.querySelector('nav')).padding,landmarks:document.querySelectorAll('main,[role="main"]').length,revealHidden:[...document.querySelectorAll('#contact .reveal')].filter(x=>getComputedStyle(x).opacity==='0').length}))});await c.close();
}
for(const url of ['https://luminarymeridian.com/','https://cognis.group/']){
 const c=await b.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}}),p=await c.newPage();await p.goto(url,{waitUntil:'load'});
 results.push({url,nojs:await p.evaluate(()=>({hiddenReveal:[...document.querySelectorAll('.reveal')].filter(x=>getComputedStyle(x).opacity==='0').length,reveals:document.querySelectorAll('.reveal').length,landmarks:document.querySelectorAll('main,[role="main"]').length}))});await c.close();
}
const c=await b.newContext({viewport:{width:390,height:900}}),p=await c.newPage();await p.goto('https://cognis.group/contact/',{waitUntil:'load'});const f=p.locator('form[action="/api/form"]').first();await f.scrollIntoViewIfNeeded();await p.screenshot({path:out+'cognis-contact-form.png'});results.push({site:'Cognis',formSnapshot:await f.ariaSnapshot(),fields:await f.locator('input,textarea').evaluateAll(xs=>xs.map(x=>({name:x.name,placeholder:x.getAttribute('placeholder'),label:x.getAttribute('aria-label'),labelledby:x.getAttribute('aria-labelledby'),title:x.getAttribute('title'),outer:x.outerHTML.slice(0,600)})))});await c.close();
await fs.writeFile(out+'followup.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await b.close();}
