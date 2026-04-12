import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => (e.innerText||'').includes('Fisayo'));
  if (el) el.scrollIntoView({block:'center'});
});
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  return [...document.querySelectorAll('img')].filter(i => {
    const s = i.getAttribute('src')||'';
    return /il73eZeVzET6bn72svJVyQpD4|qo6HZFi07ViVs9Z02uanZYrR84|QnjDKI0euXnnnPi4GtTEaqYDJLo|QTiI3J2XXGOwJw3fyXhxuB92fl0/.test(s);
  }).map(i => {
    const r = i.getBoundingClientRect();
    const wrap = i.closest('[data-framer-background-image-wrapper]') || i.parentElement;
    const card = i.closest('.framer-Y77Or, [data-framer-name="Default"]') || wrap;
    const cs = card ? getComputedStyle(card) : {};
    return {src: i.getAttribute('src').slice(-50), natW: i.naturalWidth, natH: i.naturalHeight, dispW: Math.round(r.width), dispH: Math.round(r.height), cardBg: cs.backgroundColor};
  });
});
console.log(JSON.stringify(info, null, 2));
await b.close();
