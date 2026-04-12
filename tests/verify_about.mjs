import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us', {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
const r = await p.evaluate(() => {
  const all = [...document.querySelectorAll('img')];
  return all.filter(i => /Vyfo3xCm2mXciLK38EvtcSz9M|about-hero/.test(i.getAttribute('src')||''))
    .map(i => i.getAttribute('src'));
});
console.log(JSON.stringify(r, null, 2));
await p.screenshot({path:'playwright-screenshots/about-hero-new.png'});
await b.close();
