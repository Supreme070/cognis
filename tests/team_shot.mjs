import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => (e.innerText||'').includes('Supreme Oyewumi'));
  if (el) el.scrollIntoView({block:'center'});
});
await p.waitForTimeout(1500);
await p.screenshot({path:'playwright-screenshots/team-zoomout.png'});
await b.close();
console.log('shot saved');
