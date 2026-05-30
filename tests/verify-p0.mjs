import { chromium } from 'playwright';
const b = await chromium.launch();
const routes = ['/about-us/','/our-services/','/our-services/ai-agent-automation-engineering/','/blog/','/blog/the-real-roi-of-ai/','/contact/','/teams/supreme-oyewumi/'];
for (const r of routes) {
  const ctx = await b.newContext({viewport:{width:1440,height:900}}); // fresh = cold cache
  const p = await ctx.newPage();
  let navs=0; p.on('framenavigated', f=>{ if(f===p.mainFrame()) navs++; });
  const t0=Date.now();
  try { await p.goto('https://www.cognis.group'+r,{waitUntil:'domcontentloaded',timeout:30000}); } catch(e){}
  await p.waitForTimeout(15000); // long settle window
  const s = await p.evaluate(()=>{ const can=document.querySelector('link[rel=canonical]'); const h1=document.querySelector('h1'); return { url:location.pathname, canonical:can?new URL(can.href).pathname:null, h1:(h1?h1.textContent.trim().slice(0,40):null), title:document.title.slice(0,50) }; }).catch(()=>({err:1}));
  const onHome = s.url==='/' || s.url==='';
  const routeMatch = s.url.replace(/\/$/,'')===r.replace(/\/$/,'');
  console.log(`${r}\n   final URL=${s.url} routeMatch=${routeMatch} dumpedToHome=${onHome} navEvents=${navs} h1="${s.h1}" title="${s.title}"`);
  await ctx.close();
}
await b.close();
