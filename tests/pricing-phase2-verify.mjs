import { chromium } from 'playwright';
const errors = [];
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
p.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 200)));
p.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);
const info = await p.evaluate(() => {
  const bodyText = document.body.innerText;
  return {
    bodyHeight: document.body.scrollHeight,
    h1: document.querySelector('h1')?.innerText?.replace(/\s+/g,' ').trim(),
    pricingCount: (bodyText.match(/pricing/gi) || []).length,
    // Section presence + order
    sections: Array.from(document.querySelectorAll('section[data-framer-name]')).map(s => {
      const r = s.getBoundingClientRect();
      return { name: s.dataset.framerName, y: Math.round(r.top + window.scrollY), h: Math.round(r.height) };
    }),
    allCopy: {
      hasTouch: bodyText.toLowerCase().includes('what we touch'),
      hasAbout: bodyText.toLowerCase().includes('global intelligence partner'),
      hasServices: bodyText.toLowerCase().includes('end-to-end ai consulting'),
      hasExpertise: bodyText.toLowerCase().includes('where human judgment'),
      hasInsights: bodyText.toLowerCase().includes('insights & perspectives'),
      hasPreFooter: bodyText.toLowerCase().includes('combine deep ai'),
      hasFooter: bodyText.toLowerCase().includes('2026 cognis group'),
    },
  };
});
console.log(JSON.stringify(info, null, 2));
console.log('\nerrors:', errors.length);
errors.forEach(e => console.log('  ' + e));
await p.screenshot({ path: 'playwright-screenshots/pricing-phase2-1440.png', fullPage: true });
await b.close();
