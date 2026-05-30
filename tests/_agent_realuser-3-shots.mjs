import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const OUT='test-results/site-audit/evidence/realuser-3-x';
import {mkdirSync} from 'node:fs'; mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();
async function shot(u,name,vp={width:1440,height:900}){
  const ctx=await b.newContext({viewport:vp});
  const p=await ctx.newPage();
  await p.goto(BASE+u,{waitUntil:'domcontentloaded'}).catch(()=>{});
  await p.waitForTimeout(6000);
  const f=p.url().replace(BASE,'')||'/';
  await p.screenshot({path:`${OUT}/${name}.png`,fullPage:false}).catch(()=>{});
  console.log(name,'req',u,'final',f);
  await ctx.close();
}
await shot('/teams/supreme-oyewumi/','team-direct');
await shot('/blog/','blog-direct');
await shot('/contact/','contact-direct');
await shot('/contact/','contact-mobile',{width:390,height:844});
await b.close();
