import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:2000}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us', {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(6000);
const info = await p.evaluate(() => {
  const h = [...document.querySelectorAll('h1,h2,h3')].find(e => /Empowering businesses through strategy/i.test(e.innerText));
  const hTop = h ? h.getBoundingClientRect().top + window.scrollY : null;
  const imgs = [...document.querySelectorAll('img')].map(i => ({
    src: i.getAttribute('src'),
    dw: i.width, dh: i.height,
    top: i.getBoundingClientRect().top + window.scrollY,
    alt: i.alt,
  })).filter(x => x.dw > 150 && x.dh > 150);
  return {hTop, imgs};
});
console.log(JSON.stringify(info, null, 2));
await b.close();
