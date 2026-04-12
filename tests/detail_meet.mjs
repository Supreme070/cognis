import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(4000);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => (e.innerText||'').includes('Meet our team'));
  if (el) el.scrollIntoView({block:'center'});
});
await p.waitForTimeout(1500);
await p.locator('a[href*="supreme-oyewumi"]').first().click();
await p.waitForTimeout(5000);
await p.evaluate(() => {
  const h = [...document.querySelectorAll('h2')].find(e => /meet our team/i.test(e.innerText||''));
  if (h) h.scrollIntoView({block:'center'});
});
await p.waitForTimeout(2000);
const info = await p.evaluate(() => {
  const h = [...document.querySelectorAll('h2')].find(e => /meet our team/i.test(e.innerText||''));
  const hTop = h.getBoundingClientRect().top + window.scrollY;
  const seen = new Set();
  const imgs = [...document.querySelectorAll('img')].map(i => ({
    src: i.getAttribute('src'),
    top: Math.round(i.getBoundingClientRect().top + window.scrollY),
    dw: Math.round(i.getBoundingClientRect().width),
    dh: Math.round(i.getBoundingClientRect().height),
  })).filter(x => x.top > hTop - 50 && x.top < hTop + 700)
    .filter(x => !seen.has(x.src) && seen.add(x.src));
  return {hTop, imgs};
});
console.log(JSON.stringify(info, null, 2));
const box = await p.evaluate(() => {
  const h = [...document.querySelectorAll('h2')].find(e => /meet our team/i.test(e.innerText||''));
  const sec = h.closest('section') || h.parentElement.parentElement.parentElement;
  const r = sec.getBoundingClientRect();
  return {x:r.x, y:r.y, w:r.width, h:r.height};
});
console.log('section box:', box);
await p.screenshot({path:'playwright-screenshots/detail-meet.png', clip:{x:Math.max(0,box.x), y:Math.max(0,box.y), width:Math.min(1440,box.w), height:Math.min(1400,box.h)}});
await b.close();
