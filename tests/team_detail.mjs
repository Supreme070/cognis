import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
for (const slug of ['supreme-oyewumi', 'kola-olatunde', 'fisayo-oludare']) {
  await p.goto('http://127.0.0.1:3001/team/' + slug + '?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
  await p.waitForTimeout(4000);
  const info = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => {
      const r = i.getBoundingClientRect();
      return r.width > 150 && r.height > 150;
    }).map(i => ({src: i.getAttribute('src'), w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height), natW: i.naturalWidth, natH: i.naturalHeight, complete: i.complete}));
    return {url: location.pathname, title: document.title, imgs};
  });
  console.log(JSON.stringify(info, null, 2));
  await p.screenshot({path:`playwright-screenshots/detail-${slug}.png`});
}
await b.close();
