import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const origin = 'http://127.0.0.1:8187';
const output = 'qa_evidence/2026-09-08';
const server = spawn('python3', ['-m','http.server','8187','--bind','127.0.0.1'], {stdio:'ignore'});
const pages = ['/', '/products/', '/our-services/', '/our-services/ai-strategy-advisory/', '/our-services/ai-training-workforce-development/', '/our-services/ai-agent-automation-engineering/', '/research/state-of-ai-african-enterprises-2026/', '/best-ai-consulting-firms-africa/', '/blog/the-real-roi-of-ai/', '/case-studies/ai-training-programme/'];
const rows=[];
let browser;
try {
  for(let i=0;i<40;i++) { try { await fetch(origin); break; } catch { await new Promise(r=>setTimeout(r,100)); } }
  await fs.mkdir(output,{recursive:true});
  browser=await chromium.launch({headless:true});
  for (const width of [390,1440]) {
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    for (const route of pages) {
      const page=await context.newPage(); const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      const response=await page.goto(origin+route,{waitUntil:'load'});
      assert.equal(response.status(),200,route);
      await page.waitForTimeout(350);
      assert.equal(await page.locator('h1').count(),1,route+' H1');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
      assert.equal(overflow,false,route+' overflows at '+width);
      assert.deepEqual(errors,[],route+' script errors');
      if(route==='/' || route==='/products/') {
        const cta=page.getByRole('link',{name:/Request a Cognis AI demo/});
        assert.equal(await cta.count(),1,route+' demo CTA');
        assert.match(await cta.getAttribute('href'),/\/contact\/\?interest=cognis-ai/);
      }
      if(width===390 && route.includes('/our-services/ai-')) {
        const menu=page.getByRole('button',{name:'Open menu',exact:true});
        await menu.click();
        assert.equal(await page.getByRole('button',{name:'Close menu',exact:true}).getAttribute('aria-expanded'),'true');
        await page.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('aria-expanded'),'false');
      }
      if(route.includes('/research/') || route.includes('/best-ai-') || route==='/products/') {
        await page.screenshot({path:output+'/'+(route.split('/')[1]||'home')+'-'+width+'.png',fullPage:true});
        const editorial=page.locator('.seo-editorial').first();
        if(await editorial.count()) {
          await editorial.scrollIntoViewIfNeeded();
          await editorial.screenshot({path:output+'/'+route.split('/')[1]+'-content-'+width+'.png'});
        }
      }
      rows.push({route,width,overflow,scriptErrors:errors}); await page.close();
    }
    await context.close();
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});
  for(const route of pages.filter(p=>p.includes('/our-services/ai-'))) {
    const page=await nojs.newPage(); await page.goto(origin+route);
    assert.ok((await page.locator('main').innerText()).length>2000,route+' no-JS service content');
    const faq=page.locator('details').first(); await faq.locator('summary').click();
    assert.equal(await faq.getAttribute('open'),''); await page.close();
    rows.push({route,javaScript:false,contentAndFaq:true});
  }
  await nojs.close();
  await fs.writeFile(output+'/browser-checks.json',JSON.stringify(rows,null,2)+'\n');
  console.log(JSON.stringify({passed:rows.length,output},null,2));
} finally { if(browser)await browser.close(); server.kill('SIGTERM'); }
