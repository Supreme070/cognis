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
// sample transform over time
const samples = [];
for (let i=0;i<5;i++){
  const t = await p.evaluate(() => {
    const ul = document.querySelector('section.framer-slideshow ul');
    return ul ? ul.style.transform : null;
  });
  samples.push(t);
  await p.waitForTimeout(500);
}
console.log(samples);
await b.close();
