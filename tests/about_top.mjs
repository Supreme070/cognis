import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:2000}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us', {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
const info = await p.evaluate(() => {
  const seen = new Set();
  const imgs = [...document.querySelectorAll('img')].map(i => ({
    src: i.getAttribute('src'),
    dw: i.width, dh: i.height,
    top: Math.round(i.getBoundingClientRect().top + window.scrollY),
    left: Math.round(i.getBoundingClientRect().left),
  })).filter(x => x.src && !seen.has(x.src) && seen.add(x.src));
  return imgs;
});
console.log(JSON.stringify(info, null, 2));
await b.close();
