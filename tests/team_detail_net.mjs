import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
const fails = [];
p.on('requestfailed', r => fails.push(r.url() + ' :: ' + r.failure()?.errorText));
p.on('response', r => { if (!r.ok() && /v4o6m3a|xMyo1j|v9xKso|QnjDKI|QTiI3J/.test(r.url())) fails.push('BAD ' + r.status() + ' ' + r.url()); });
await p.goto('http://127.0.0.1:3001/team/supreme-oyewumi?cb=' + Date.now(), {waitUntil:'networkidle', timeout:60000});
await p.waitForTimeout(4000);
console.log('fails:', fails.slice(0,20));
const portrait = await p.evaluate(() => {
  // pick images > 300px wide
  return [...document.querySelectorAll('img')].filter(i => {
    const r = i.getBoundingClientRect();
    return r.width > 300 && r.height > 300;
  }).map(i => ({src: i.getAttribute('src'), complete: i.complete, natW: i.naturalWidth}));
});
console.log(JSON.stringify(portrait, null, 2));
await b.close();
