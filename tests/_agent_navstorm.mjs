import { chromium } from 'playwright';
const BASE='https://www.cognis.group';
const browser=await chromium.launch();
for(const path of ['/about-us/','/about-us','/our-services/','/contact/','/blog/']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const page=await ctx.newPage();
  let nav=0; const urls=[];
  page.on('framenavigated',f=>{if(f===page.mainFrame()){nav++; if(urls.length<6)urls.push(f.url().replace(BASE,''));}});
  try{ await page.goto(BASE+path,{waitUntil:'load',timeout:45000}); }catch(e){}
  await page.waitForTimeout(5000);
  console.log(`${path.padEnd(16)} navs=${String(nav).padStart(3)} final=${page.url().replace(BASE,'')||'/'} first6=${JSON.stringify(urls)}`);
  await ctx.close();
}
await browser.close();
