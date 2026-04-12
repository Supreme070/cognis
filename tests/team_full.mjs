import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(2000);
const info = await p.evaluate(() => {
  const seen = new Set();
  return [...document.querySelectorAll('img')].map(i => {
    let parent = i.closest('div');
    let txt = '';
    for (let k=0;k<6 && parent;k++){ txt = parent.innerText||''; if (txt.length>30) break; parent = parent.parentElement; }
    return {src: i.getAttribute('src'), txt: (txt||'').slice(0,400), dw: i.width};
  }).filter(x => x.dw > 80 && /supreme|kola|fisayo|eugene/i.test(x.txt))
    .filter(x => !seen.has(x.src) && seen.add(x.src));
});
console.log(JSON.stringify(info, null, 2));
await b.close();
