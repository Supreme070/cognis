import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const SHELLS = ['/products/','/why-cognis/','/how-we-work/','/case-studies/','/faq/','/terms/','/thanks/'];
const b = await chromium.launch();
const out = [];
for (const path of [...SHELLS, '/']) {
  const ctx = await b.newContext({viewport:{width:1280,height:850}});
  const p = await ctx.newPage();
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120));}); p.on('pageerror',e=>errs.push('PE:'+String(e).slice(0,100)));
  let navs=0; p.on('framenavigated',f=>{if(f===p.mainFrame())navs++;});
  try{ await p.goto(BASE+path,{waitUntil:'load',timeout:30000}); }catch(e){}
  await p.waitForTimeout(3500);
  const info = await p.evaluate(()=>{
    const hdr = document.querySelector('header.cgnav') || document.querySelector('nav [data-framer-name="menu"]') || document.querySelector('header');
    const navItems = hdr ? [...hdr.querySelectorAll('a')].map(a=>a.textContent.trim()).filter(Boolean).slice(0,8) : [];
    return { url:location.pathname, title:document.title.slice(0,40), hasHeader:!!hdr, navItems, bodyH:document.body.scrollHeight, imgs:document.images.length };
  }).catch(e=>({err:String(e).slice(0,60)}));
  await p.screenshot({path:`test-results/site-audit/reg-${path.replace(/\//g,'_')||'home'}.png`});
  out.push({path, ...info, navs, errs: errs.slice(0,3)});
  await ctx.close();
}
// mobile hamburger on a shell
{ const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage();
  await p.goto(BASE+'/products/',{waitUntil:'load'}); await p.waitForTimeout(2500);
  let opened=false; try{ await p.locator('header.cgnav .cgnav-burger').click({timeout:4000}); await p.waitForTimeout(500); opened=await p.evaluate(()=>document.querySelector('header.cgnav').classList.contains('open')); }catch(e){}
  out.push({path:'/products/ MOBILE', hamburgerOpens:opened});
  await ctx.close(); }
await b.close();
for(const r of out) console.log(JSON.stringify(r));
