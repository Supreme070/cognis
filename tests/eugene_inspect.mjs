import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
const info = await p.evaluate(() => {
  const img = document.querySelector('img[src*="qo6HZFi07ViVs9Z02uanZYrR84"]');
  if (!img) return 'no img';
  const chain = [];
  let cur = img;
  for (let i=0;i<8;i++){
    if (!cur) break;
    chain.push({tag: cur.tagName, cls: cur.className, name: cur.getAttribute('data-framer-name'), display: getComputedStyle(cur).display});
    cur = cur.parentElement;
  }
  return chain;
});
console.log(JSON.stringify(info, null, 2));
await b.close();
