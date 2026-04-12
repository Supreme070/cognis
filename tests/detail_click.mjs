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
// click Supreme's card
await p.locator('a[href*="supreme-oyewumi"]').first().click();
await p.waitForTimeout(4000);
const info = await p.evaluate(() => ({
  url: location.pathname,
  h1: document.querySelector('h1')?.innerText?.slice(0,100),
  bigImgs: [...document.querySelectorAll('img')].filter(i => i.getBoundingClientRect().width > 300).map(i => ({src: i.getAttribute('src'), w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height)})).slice(0,5),
}));
console.log(JSON.stringify(info, null, 2));
await p.screenshot({path:'playwright-screenshots/detail-click-supreme.png', fullPage:false});
await b.close();
