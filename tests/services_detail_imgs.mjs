import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/?cb='+Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(4500);
await p.evaluate(async () => { for (let y=0; y<10000; y+=300) { window.scrollTo(0,y); await new Promise(r=>setTimeout(r,100)); } window.scrollTo(0,0); });
await p.waitForTimeout(2000);
const imgs = await p.evaluate(() => {
  return [...document.querySelectorAll('img')].map(i => {
    const r = i.getBoundingClientRect();
    return {src:(i.getAttribute('src')||''), top: Math.round(r.top+window.scrollY), w: Math.round(r.width), h: Math.round(r.height)};
  }).filter(x => x.w > 200 && x.w < 900);
});
console.log(JSON.stringify(imgs, null, 2));
await b.close();
