import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/?cb='+Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(6500);
await p.evaluate(async () => { for (let y=0; y<12000; y+=400) { window.scrollTo(0,y); await new Promise(r=>setTimeout(r,150)); } });
await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => /Production-first delivery/i.test(e.innerText||'')); if (el) el.scrollIntoView({block:'center'}); });
await p.waitForTimeout(10000);
const info = await p.evaluate(() => {
  const want = ['Production-first delivery','Disciplines under one roof','Continents engaged','Integrating with the AI and cloud','Google, AWS, Microsoft, OpenAI','partners like MarketSage','no handoffs, no gaps'];
  const present = {};
  want.forEach(s => { present[s] = document.body.innerText.includes(s); });
  const stray = ['Commitment to measurable','Committed to permanent','Decisions Transformed','Markets Served','Driving faster','Analyzed monthly'];
  const ghosts = {};
  stray.forEach(s => { ghosts[s] = document.body.innerText.includes(s); });
  // try read rendered counter numbers
  const counters = [...document.querySelectorAll('p')].map(el => (el.innerText||'').trim()).filter(t => /^\d+[%+]?$|^\d+k?\+$/.test(t));
  return {present, ghosts, counters};
});
console.log(JSON.stringify(info, null, 2));
await p.screenshot({path:'playwright-screenshots/stats-band.png', fullPage:false});
await b.close();
