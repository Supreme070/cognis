import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const slugs=['ai-governance-is-not-optional','ai-native-operations-for-african-enterprises','building-ai-agents-that-actually-ship','making-your-workforce-ai-ready','the-real-roi-of-ai','why-most-enterprise-ai-strategies-fail-before-they-start'];
const out=path.resolve('qa_evidence/2026-07-25/bylines');await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({headless:false,slowMo:40});const c=await b.newContext({viewport:{width:1440,height:900}});
const report={console:[],bylines:{}};
for(const s of slugs){const p=await c.newPage();p.on('console',m=>{if(m.type()==='error')report.console.push({s,text:m.text()})});p.on('pageerror',e=>report.console.push({s,text:e.message}));
 await p.goto(`http://127.0.0.1:8099/blog/${s}/`,{waitUntil:'networkidle'});const by=p.locator('.lf-byline');await by.scrollIntoViewIfNeeded();await p.waitForTimeout(400);
 report.bylines[s]={text:await by.innerText(),href:await by.locator('a').getAttribute('href')};await p.screenshot({path:path.join(out,`${s}__byline.png`)});await p.close();}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await b.close();console.log(JSON.stringify(report,null,2));
