import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const urls=['/contact/','/products/','/why-cognis/','/case-studies/','/teams/kola-olatunde/','/teams/fisayo-oludare/','/faq/','/blog/'];
const b=await chromium.launch();
for(const u of urls){
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const p=await ctx.newPage();
  try{
    await p.goto(BASE+u,{waitUntil:'domcontentloaded',timeout:45000});
    await p.waitForTimeout(4000);
    const finalUrl=p.url();
    let title='',h1='';
    try{ title=await p.title(); }catch{}
    try{ h1=await p.evaluate(()=>{const h=document.querySelector('h1');return h?h.innerText.slice(0,70):'(no h1)';}); }catch(e){ h1='(ctx destroyed)'; }
    console.log(`REQ ${u} | final=${finalUrl.replace(BASE,'')||'/'} | title="${title.slice(0,45)}" | h1="${h1}"`);
  }catch(e){ console.log(`REQ ${u} | ERROR ${String(e).slice(0,80)}`); }
  await ctx.close();
}
await b.close();
