import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://127.0.0.1:3997';
const b = await chromium.launch();

function track(page){ const s={bytes:0,count:0}; page.on('requestfinished',(r)=>{ if(/hero-afr5\.mp4/.test(r.url())){ r.response().then(rs=>rs.headerValue('content-length')).then(v=>{s.bytes+=Number(v||0);s.count++;}).catch(()=>{}); } }); return s; }
async function ev(p,fn,fb){ for(let i=0;i<4;i++){ try{return await p.evaluate(fn);}catch{await p.waitForTimeout(700);} } return fb; }
async function heroState(p){ return ev(p,()=>{ const v=document.querySelector('video[data-cognis-hero-portal]'); if(!v) return {exists:false}; return {exists:true, hasSrc:!!v.getAttribute('src'), src:(v.currentSrc||'').slice(-20), opacity:getComputedStyle(v).opacity, paused:v.paused, readyState:v.readyState, currentTime:Math.round(v.currentTime*100)/100}; },{exists:false}); }

// 1. HOME direct
{ const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const s=track(p);
  await p.goto(BASE+'/',{waitUntil:'load'}); await p.waitForTimeout(5000);
  console.log('HOME  hero-afr5 bytes:',Math.round(s.bytes/1024)+'KB','reqs:',s.count,'| video:',JSON.stringify(await heroState(p)));
  await p.screenshot({path:'test-results/perf/hero-home.png'}); await p.close(); }
// 2. ABOUT direct
{ const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const s=track(p);
  await p.goto(BASE+'/about-us/',{waitUntil:'load'}); await p.waitForTimeout(5000);
  console.log('ABOUT hero-afr5 bytes:',Math.round(s.bytes/1024)+'KB','reqs:',s.count,'| video:',JSON.stringify(await heroState(p)));
  await p.screenshot({path:'test-results/perf/hero-about.png'}); await p.close(); }
// 3. SERVICE direct
{ const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const s=track(p);
  await p.goto(BASE+'/our-services/',{waitUntil:'load'}); await p.waitForTimeout(5000);
  console.log('SVCS  hero-afr5 bytes:',Math.round(s.bytes/1024)+'KB','reqs:',s.count,'| video:',JSON.stringify(await heroState(p))); await p.close(); }
// 4. SPA: home -> about -> home
{ const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
  await p.goto(BASE+'/',{waitUntil:'load'}); await p.waitForTimeout(3500);
  console.log('SPA home(initial) video:',JSON.stringify(await heroState(p)));
  try{ await p.locator('a[href="/about-us"], a[href$="/about-us"]').first().click({timeout:5000}); }catch(e){ console.log('  about click failed'); }
  await p.waitForTimeout(3000);
  console.log('SPA ->about video:',JSON.stringify(await heroState(p)));
  try{ await p.locator('nav [data-framer-name="menu"] a[href="/"], a[href="./"]').first().click({timeout:5000}); }catch(e){ console.log('  home click failed'); }
  await p.waitForTimeout(3500);
  console.log('SPA ->home(return) video:',JSON.stringify(await heroState(p)));
  await p.close(); }
await b.close();
