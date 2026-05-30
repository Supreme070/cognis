import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const urls=['/our-services/','/teams/supreme-oyewumi/','/contact/','/products/','/why-cognis/','/case-studies/'];
const b=await chromium.launch();
for(const u of urls){
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const p=await ctx.newPage();
  let redirected=null;
  p.on('framenavigated',f=>{ if(f===p.mainFrame()) redirected=f.url(); });
  await p.goto(BASE+u,{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForTimeout(3500);
  const finalUrl=p.url();
  const title=await p.title();
  const h1=await p.evaluate(()=>{const h=document.querySelector('h1');return h?h.innerText.slice(0,80):'(no h1)';});
  console.log(`REQ ${u} | final=${finalUrl.replace(BASE,'')||'/'} | title="${title.slice(0,50)}" | h1="${h1}"`);
  await ctx.close();
}
await b.close();
