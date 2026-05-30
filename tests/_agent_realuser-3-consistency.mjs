import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const b=await chromium.launch();
async function probe(u){
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const p=await ctx.newPage();
  await p.goto(BASE+u,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
  await p.waitForTimeout(5000);
  const f=p.url().replace(BASE,'')||'/';
  await ctx.close();
  return f;
}
for(const u of ['/contact/','/teams/supreme-oyewumi/','/blog/']){
  const rs=[];
  for(let i=0;i<3;i++) rs.push(await probe(u));
  console.log(u,'=>',rs.join(', '));
}
await b.close();
