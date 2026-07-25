import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve('qa_evidence/2026-07-25/scroll-sanity');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:false,slowMo:50});
const report={console:[],views:{}};
for(const [name,viewport] of Object.entries({desktop:{width:1440,height:900},mobile:{width:390,height:844}})){
 const c=await browser.newContext({viewport});const p=await c.newPage();
 p.on('console',m=>{if(m.type()==='error')report.console.push({name,text:m.text()})});
 p.on('pageerror',e=>report.console.push({name,text:e.message}));
 await p.goto('http://127.0.0.1:8099/',{waitUntil:'networkidle'});await p.waitForTimeout(1200);
 const candidates=await p.evaluate(()=>[...document.querySelectorAll('*')].map((e,i)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{i,tag:e.tagName,cls:String(e.className).slice(0,100),sh:e.scrollHeight,ch:e.clientHeight,oy:s.overflowY,rect:{x:r.x,y:r.y,w:r.width,h:r.height}}}).filter(x=>x.sh>x.ch+100).sort((a,b)=>(b.sh-b.ch)-(a.sh-a.ch)).slice(0,12));
 const scrollResult=await p.evaluate(()=>{
   const els=[document.scrollingElement,...document.querySelectorAll('*')].filter(Boolean);
   const e=els.sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0];
   const before={tag:e.tagName,cls:String(e.className),top:e.scrollTop,sh:e.scrollHeight,ch:e.clientHeight};
   e.scrollTop=Math.min(1500,e.scrollHeight-e.clientHeight);
   e.dispatchEvent(new Event('scroll',{bubbles:true}));
   return{before,after:e.scrollTop};
 });
 await p.waitForTimeout(1000);
 const topPixel=await p.evaluate(()=>{const e=document.elementFromPoint(innerWidth/2,24);const s=getComputedStyle(e);return{tag:e?.tagName,cls:String(e?.className||''),text:(e?.textContent||'').trim().slice(0,80),background:s.backgroundColor,opacity:s.opacity}});
 await p.screenshot({path:path.join(out,`${name}__scrolled.png`)});
 report.views[name]={viewport,candidates,scrollResult,topPixel};
 await c.close();
}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
await browser.close();console.log(JSON.stringify(report,null,2));
