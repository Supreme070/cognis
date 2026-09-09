import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const output=new URL('.',import.meta.url).pathname;
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const width of [390,1440]) {
  for(const url of ['https://luminarymeridian.com/','https://cognis.group/','https://cognis.group/contact/','https://cognis.group/our-services/ai-strategy-advisory/']) {
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await context.newPage();const errors=[],failed=[],badResponses=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()}));
   page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});
   const response=await page.goto(url,{waitUntil:'load',timeout:60000});await page.waitForTimeout(1800);
   const name=new URL(url).hostname+'-'+(new URL(url).pathname.replaceAll('/','_')||'home')+'-'+width;
   await page.screenshot({path:output+name+'-viewport.png'});
   const state=await page.evaluate(()=>({
    title:document.title,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
    headings:[...document.querySelectorAll('h1,h2,h3')].map(x=>({tag:x.tagName,text:x.innerText})),
    links:[...document.querySelectorAll('a')].map(x=>({text:x.innerText,label:x.getAttribute('aria-label'),href:x.getAttribute('href'),visible:x.getBoundingClientRect().width>0&&x.getBoundingClientRect().height>0})),
    buttons:[...document.querySelectorAll('button')].map(x=>({text:x.innerText,label:x.getAttribute('aria-label'),expanded:x.getAttribute('aria-expanded'),visible:x.getBoundingClientRect().width>0})),
    forms:[...document.forms].map(x=>({action:x.getAttribute('action'),method:x.method,fields:[...x.elements].map(y=>({tag:y.tagName,type:y.type,name:y.name,required:y.required,label:y.getAttribute('aria-label'),labels:[...(y.labels||[])].map(z=>z.innerText)}))})),
    missingAlt:[...document.images].filter(x=>!x.hasAttribute('alt')).map(x=>x.src),
    brokenFragments:[...document.querySelectorAll('a[href^="#"]')].filter(x=>x.hash.length>1&&!document.getElementById(decodeURIComponent(x.hash.slice(1)))).map(x=>x.hash),
    landmarks:{main:document.querySelectorAll('main').length,nav:document.querySelectorAll('nav').length,footer:document.querySelectorAll('footer').length},
    text:document.body.innerText,
   }));
   if(url==='https://luminarymeridian.com/'){
    for(const id of ['team','case-studies','contact']) {const locator=page.locator('#'+id);if(await locator.count()){await locator.scrollIntoViewIfNeeded();await page.screenshot({path:output+name+'-'+id+'.png'});}}
   }
   let menuResult=null;
   if(width===390){
    const menu=page.getByRole('button',{name:/menu/i}).first();
    if(await menu.count()&&await menu.isVisible()) {await menu.click();menuResult={afterClick:await menu.getAttribute('aria-expanded')};await page.screenshot({path:output+name+'-menu.png'});await page.keyboard.press('Escape');menuResult.afterEscape=await menu.getAttribute('aria-expanded');}
   }
   results.push({url,width,status:response.status(),errors,failed,badResponses,menuResult,...state});await context.close();
  }
 }
 for(const url of ['https://luminarymeridian.com/','https://cognis.group/']) {
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});const page=await context.newPage();await page.goto(url,{waitUntil:'load'});
  const name=new URL(url).hostname+'-nojs';await page.screenshot({path:output+name+'.png'});
  results.push({url,javaScript:false,textLength:(await page.locator('body').innerText()).length,visibleH1:await page.locator('h1').isVisible()});await context.close();
 }
 await fs.writeFile(output+'browser.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results.map(({url,width,status,scrollWidth,height,errors,failed,badResponses,menuResult,brokenFragments,landmarks,javaScript,textLength,visibleH1})=>({url,width,status,scrollWidth,height,errors,failed,badResponses,menuResult,brokenFragments,landmarks,javaScript,textLength,visibleH1})),null,2));
}finally{await browser.close();}
