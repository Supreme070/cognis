import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/perf-mobile';
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await ctx.newPage();
let nav=0; const seq=[];
page.on('framenavigated',f=>{if(f===page.mainFrame()){nav++; seq.push({t:Date.now(),u:f.url().replace(BASE,'')});}});
const t0=Date.now();
await page.goto(BASE+'/about-us/',{waitUntil:'commit',timeout:45000});
// snap every 800ms for 8s
for(let i=0;i<10;i++){ await page.waitForTimeout(800); try{await page.screenshot({path:OUT+`/storm-${i}.png`});}catch{} }
// settle 6s more then final
await page.waitForTimeout(6000);
try{await page.screenshot({path:OUT+'/storm-final.png'});}catch{}
const finalUrl=page.url().replace(BASE,'');
const h1=await page.evaluate(()=>document.querySelector('h1')?.textContent?.trim()?.slice(0,60)||'(no h1)').catch(()=>'(err)');
console.log('total navs in ~14s:',nav,'final url:',finalUrl,'h1:',h1);
console.log('nav timeline (ms from start -> url):');
seq.slice(0,40).forEach(s=>console.log('  +'+(s.t-t0)+'ms',s.u||'/'));
await browser.close();
