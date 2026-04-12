import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => (e.innerText||'').includes('Meet our team'));
  if (el) el.scrollIntoView({block:'center'});
});
await p.waitForTimeout(2000);
const info = await p.evaluate(() => {
  const slideshow = document.querySelector('section.framer-slideshow');
  const ul = slideshow.querySelector('ul');
  const items = [...ul.children].map((li, idx) => {
    const r = li.getBoundingClientRect();
    return {idx, display: getComputedStyle(li).display, w: Math.round(r.width), left: Math.round(r.left), hasEugene: !!li.querySelector('img[src*="qo6HZFi07ViVs9Z02uanZYrR84"]')};
  });
  return {
    slideshowWidth: slideshow.getBoundingClientRect().width,
    slideshowLeft: slideshow.getBoundingClientRect().left,
    ulWidth: ul.getBoundingClientRect().width,
    totalItems: items.length,
    visible: items.filter(i => i.display !== 'none')
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
