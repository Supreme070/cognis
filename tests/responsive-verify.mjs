import { chromium } from 'playwright';
const b = await chromium.launch();
for (const w of [1440, 768, 375]) {
  const p = await b.newContext({ viewport: { width: w, height: 900 } }).then(c => c.newPage());
  await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(3500);
  const r = await p.evaluate(() => {
    const t = document.body.innerText.toLowerCase();
    return {
      h1: document.querySelector('h1')?.innerText?.replace(/\s+/g,' ').trim(),
      hasTouch: t.includes('what we touch'),
      hasWork: t.includes('work with us'),
      hasExplore: t.includes('explore our services'),
      hasStart: t.includes('start the conversation'),
      hasInsightsP: t.includes('insights & perspectives'),
      hasSubscribe: t.includes('subscribe'),
      hasGetInbox: t.includes('get ai intelligence in your inbox'),
      noAeline: !t.includes('aeline') && !t.includes('temlis'),
      noBook: !t.includes('book a consultation'),
      noTalkTo: !t.includes('talk to us'),
      no130: !t.includes('130+ premium'),
    };
  });
  console.log(w, JSON.stringify(r));
  await p.screenshot({ path: `playwright-screenshots/final-${w}.png`, fullPage: true });
  await p.close();
}
await b.close();
