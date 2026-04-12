import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(4000);
await p.locator('a[href*="supreme-oyewumi"]').first().click();
await p.waitForTimeout(6000);
const info = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter(i => (i.getAttribute('src')||'').includes('qo6HZFi07ViVs9Z02uanZYrR84'));
  return imgs.map(img => {
    const chain = [];
    let el = img;
    for (let i = 0; i < 14 && el; i++) {
      chain.push({tag: el.tagName, cls: (el.className||'').toString().slice(0,150), href: el.getAttribute?el.getAttribute('href'):null});
      el = el.parentElement;
    }
    return chain;
  });
});
console.log(JSON.stringify(info, null, 2));
await b.close();
