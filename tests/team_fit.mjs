import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => (e.innerText||'').includes('Supreme Oyewumi'));
  if (el) el.scrollIntoView({block:'center'});
});
await p.waitForTimeout(2000);
const info = await p.evaluate(() => {
  return [...document.querySelectorAll('img')].filter(i => /QnjDKI0euXnnnPi4GtTEaqYDJLo|QTiI3J2XXGOwJw3fyXhxuB92fl0/.test(i.getAttribute('src')||'')).map(i => {
    const s = getComputedStyle(i);
    const r = i.getBoundingClientRect();
    return {src: i.getAttribute('src').slice(-50), natW: i.naturalWidth, natH: i.naturalHeight, displayW: Math.round(r.width), displayH: Math.round(r.height), objectFit: s.objectFit, objectPosition: s.objectPosition, aspectNat: (i.naturalWidth/i.naturalHeight).toFixed(2), aspectDisp: (r.width/r.height).toFixed(2)};
  });
});
console.log(JSON.stringify(info, null, 2));
await p.screenshot({path:'playwright-screenshots/team-fit.png'});
await b.close();
