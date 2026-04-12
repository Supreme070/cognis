import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
const info = await p.evaluate(() => {
  const t = document.body.innerText.toLowerCase();
  return {
    servicesWord: t.includes('services'),
    expertiseWord: t.includes('expertise'),
    relentless: t.includes('relentless'),
    exploreOur: t.includes('explore our services'),
    allInsights: t.includes('all insights'),
    startConv: t.includes('start the conversation'),
    workWithUs: t.includes('work with us'),
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
