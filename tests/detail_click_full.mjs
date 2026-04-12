import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(4000);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => (e.innerText||'').includes('Meet our team'));
  if (el) el.scrollIntoView({block:'center'});
});
await p.waitForTimeout(1500);
await p.locator('a[href*="supreme-oyewumi"]').first().click();
await p.waitForTimeout(5000);
const headings = await p.evaluate(() => {
  return [...document.querySelectorAll('h1,h2,h3')].map(h => ({t: h.tagName, text: (h.innerText||'').slice(0,60), top: Math.round(h.getBoundingClientRect().top + window.scrollY)}));
});
console.log('url:', await p.evaluate(()=>location.pathname));
console.log('headings:', JSON.stringify(headings, null, 2));
await p.screenshot({path:'playwright-screenshots/detail-full.png', fullPage:true});
await b.close();
