import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us', {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(4000);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(2000);
const info = await p.evaluate(() => {
  const text = document.body.innerText;
  const hasSupreme = /supreme/i.test(text);
  const hasKola = /kola/i.test(text);
  // get all imgs with their nearby text
  const imgs = [...document.querySelectorAll('img')].map(i => {
    let parent = i.closest('div');
    let txt = '';
    for (let k=0;k<5 && parent;k++){ txt = parent.innerText||''; if (txt.length>3) break; parent = parent.parentElement; }
    return {src: i.getAttribute('src'), txt: (txt||'').slice(0,100), dw: i.width};
  }).filter(x => x.dw > 80 && /supreme|kola|okoh/i.test(x.txt));
  return {hasSupreme, hasKola, imgs};
});
console.log(JSON.stringify(info, null, 2));
await b.close();
