import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base='http://127.0.0.1:3001';
const out=path.resolve('qa_evidence/2026-07-26/screenshots');
fs.mkdirSync(out,{recursive:true});
const targets=[
  ['home-desktop','/',1440,1000],
  ['home-mobile','/',390,844],
  ['blog-hub-desktop','/blog/',1440,1000],
  ['existing-post-desktop','/blog/building-ai-agents-that-actually-ship/',1440,1000],
  ['kola-security-desktop','/blog/securing-ai-agents-in-production/',1440,1000],
  ['kola-governance-mobile','/blog/ai-governance-africa-2026/',390,844],
  ['tosin-product-desktop','/blog/from-copilot-to-coworker-productizing-ai-agents/',1440,1000],
  ['tosin-operations-mobile','/blog/ai-agent-product-operating-system/',390,844],
  ['agent-service-desktop','/our-services/ai-agent-automation-engineering/',1440,1000],
  ['case-studies-desktop','/case-studies/',1440,1000],
  ['research-desktop','/research/state-of-ai-african-enterprises-2026/',1440,1000],
  ['kola-profile-desktop','/teams/kola-olatunde/',1440,1000],
  ['tosin-profile-mobile','/teams/tosin-salami/',390,844],
];
// This intentionally runs headed: the visible browser is part of the review
// contract for the final content/chrome check.
const browser=await chromium.launch({headless:false}); const results=[];
for(const [name,route,width,height] of targets){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}); const consoleErrors=[],pageErrors=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())}); page.on('pageerror',e=>pageErrors.push(e.message));
  const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:15000}); await page.waitForTimeout(1400);
  const state=await page.evaluate(()=>({
    title:document.title,h1:document.querySelector('h1')?.textContent?.trim()||'',
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src),
    bodyHeight:document.body.scrollHeight,footer:!!document.querySelector('footer'),
    universalHeader:!!document.querySelector('header.cgx[data-cognis-gnav], [data-dc-tpl="7"]'),
    universalFooter:!!document.querySelector('footer.cgxf, footer[data-dc-tpl="84"]'),
    newsletterDirectlyBeforeFooter:(()=>{const n=document.querySelector('[data-dc-tpl="75"]');return n ? n.nextElementSibling?.matches('footer')===true : null})(),
    authoredHeading:(()=>{const e=document.querySelector('.authored-insights h2');if(!e)return null;const s=getComputedStyle(e);return{text:e.textContent,color:s.color,opacity:s.opacity,webkitTextFillColor:s.webkitTextFillColor,fontSize:s.fontSize,lineHeight:s.lineHeight,visibility:s.visibility}})()
  }));
  await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
  if(name==='blog-hub-desktop'){
    const cards=page.locator('[data-cognis-expert-card]');
    await cards.nth(0).evaluate(e=>e.scrollIntoView({block:'center'})); await page.waitForTimeout(1200);
    await page.screenshot({path:path.join(out,'blog-recent-published-row-1-desktop.png'),fullPage:false});
    await cards.nth(3).evaluate(e=>e.scrollIntoView({block:'center'})); await page.waitForTimeout(1200);
    await page.screenshot({path:path.join(out,'blog-recent-published-row-2-desktop.png'),fullPage:false});
    const newsletter=page.locator('[data-dc-tpl="75"]'); await newsletter.evaluate(e=>e.scrollIntoView({block:'start'})); await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,'blog-newsletter-footer-desktop.png'),fullPage:false});
  }
  if(name==='kola-security-desktop'){
    const footer=page.locator('footer').last(); await footer.evaluate(e=>e.scrollIntoView({block:'end'})); await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,'expert-article-universal-footer-desktop.png'),fullPage:false});
  }
  if(name==='kola-profile-desktop'){
    const authored=page.locator('.authored-insights'); await authored.evaluate(e=>e.scrollIntoView({block:'center'})); await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,'kola-authored-section-viewport.png'),fullPage:false});
  }
  if(name==='tosin-profile-mobile'){
    const authored=page.locator('.authored-insights'); await authored.scrollIntoViewIfNeeded(); await authored.screenshot({path:path.join(out,'tosin-authored-insights-mobile.png')});
  }
  const expertArticle=route==='/blog/securing-ai-agents-in-production/'||route==='/blog/ai-governance-africa-2026/'||route==='/blog/from-copilot-to-coworker-productizing-ai-agents/'||route==='/blog/ai-agent-product-operating-system/';
  const hubPlacement=route!=='/blog/'||state.newsletterDirectlyBeforeFooter===true;
  results.push({name,route,viewport:`${width}x${height}`,status:response?.status(),...state,consoleErrors:[...new Set(consoleErrors)],pageErrors:[...new Set(pageErrors)],pass:response?.ok()&&!!state.h1&&state.overflow<=1&&!state.brokenImages.length&&!pageErrors.length&&hubPlacement&&(!expertArticle||(state.universalHeader&&state.universalFooter))});
  await page.close();
}
await browser.close();
fs.writeFileSync('qa_evidence/2026-07-26/visual-regression.json',JSON.stringify(results,null,2));
console.log(JSON.stringify({captures:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(r=>({name:r.name,status:r.status,h1:r.h1,overflow:r.overflow,brokenImages:r.brokenImages,pageErrors:r.pageErrors}))},null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
