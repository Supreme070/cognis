import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/teams/supreme-oyewumi?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
// find all "Meet our team" headings
const meetOccurrences = await p.evaluate(() => {
  return [...document.querySelectorAll('h1,h2,h3')].map(h => ({tag: h.tagName, text: (h.innerText||'').slice(0,60), top: Math.round(h.getBoundingClientRect().top + window.scrollY)})).filter(x => /meet|team/i.test(x.text));
});
console.log('headings:', JSON.stringify(meetOccurrences, null, 2));
// scroll to the last one
await p.evaluate(() => {
  const hs = [...document.querySelectorAll('h1,h2,h3')].filter(h => /meet our team/i.test(h.innerText||''));
  if (hs.length) hs[hs.length-1].scrollIntoView({block:'center'});
});
await p.waitForTimeout(2000);
await p.screenshot({path:'playwright-screenshots/detail-meet-team.png', fullPage:false});
// inspect imgs near the bottom "Meet our team"
const info = await p.evaluate(() => {
  const hs = [...document.querySelectorAll('h1,h2,h3')].filter(h => /meet our team/i.test(h.innerText||''));
  if (!hs.length) return 'no heading';
  const h = hs[hs.length-1];
  const hTop = h.getBoundingClientRect().top + window.scrollY;
  const seen = new Set();
  return [...document.querySelectorAll('img')].map(i => ({
    src: i.getAttribute('src'),
    top: Math.round(i.getBoundingClientRect().top + window.scrollY),
    dw: Math.round(i.getBoundingClientRect().width),
  })).filter(x => x.dw > 100 && x.top > hTop - 50 && x.top < hTop + 800)
    .filter(x => !seen.has(x.src) && seen.add(x.src));
});
console.log('imgs near bottom team:', JSON.stringify(info, null, 2));
await b.close();
