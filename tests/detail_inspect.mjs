import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:2400}})).newPage();
await p.goto('http://127.0.0.1:3001/team/supreme-oyewumi?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
const info = await p.evaluate(() => {
  const all = [...document.querySelectorAll('img')];
  return all.map(i => ({
    src: i.getAttribute('src'),
    w: Math.round(i.getBoundingClientRect().width),
    h: Math.round(i.getBoundingClientRect().height),
    top: Math.round(i.getBoundingClientRect().top + window.scrollY),
    complete: i.complete,
    natW: i.naturalWidth,
  })).filter(x => x.w > 100);
});
console.log(JSON.stringify(info.slice(0,25), null, 2));
await p.screenshot({path: 'playwright-screenshots/detail-supreme.png', fullPage: true});
await b.close();
