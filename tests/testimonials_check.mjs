import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/?cb='+Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(4500);
const info = await p.evaluate(() => {
  const slideshows = [...document.querySelectorAll('section.framer-slideshow')];
  return slideshows.map(s => ({
    cls: s.className,
    rect: s.getBoundingClientRect(),
    ulCount: s.querySelectorAll('ul').length,
    liCount: s.querySelectorAll('li').length,
    text: (s.innerText||'').slice(0,120),
    frozen: !!s.querySelector('ul[data-cognis-frozen]')
  }));
});
console.log(JSON.stringify(info, null, 2));
await b.close();
