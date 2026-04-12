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
const info = await p.evaluate(() => {
  const slideshow = document.querySelector('section.framer-slideshow, [class*="slideshow"]');
  if (!slideshow) return 'none';
  const ul = slideshow.querySelector('ul');
  const items = ul ? [...ul.children] : [];
  return {
    slideshowClass: slideshow.className,
    slideshowStyle: slideshow.getAttribute('style')?.slice(0,200),
    itemCount: items.length,
    visibleCount: items.filter(i => getComputedStyle(i).display !== 'none').length,
    ulTransform: ul ? getComputedStyle(ul).transform : null,
    ulStyle: ul ? ul.getAttribute('style')?.slice(0,300) : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
