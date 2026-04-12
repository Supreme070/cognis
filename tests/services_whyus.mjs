import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/our-services?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(4000);
const all = await p.evaluate(() => {
  return [...document.querySelectorAll('img')].map(i => {
    const r = i.getBoundingClientRect();
    return {src: (i.getAttribute('src')||'').slice(0,120), top: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height), nat: i.naturalWidth+'x'+i.naturalHeight, alt: i.alt};
  }).filter(x => x.w > 100);
});
console.log(JSON.stringify(all, null, 2));
await b.close();
