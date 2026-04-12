import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => (e.innerText||'').includes('Meet our team'));
  if (el) el.scrollIntoView({block:'center'});
});
await p.waitForTimeout(1500);
const links = await p.evaluate(() => {
  const img = document.querySelector('img[src*="QnjDKI0euXnnnPi4GtTEaqYDJLo"]');
  if (!img) return 'no supreme img';
  const a = img.closest('a');
  return {hasLink: !!a, href: a?.getAttribute('href'), allHrefs: [...document.querySelectorAll('section.framer-slideshow a')].map(x => x.getAttribute('href'))};
});
console.log(JSON.stringify(links, null, 2));
await b.close();
