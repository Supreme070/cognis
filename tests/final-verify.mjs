import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);
const info = await p.evaluate(() => {
  const h1 = document.querySelector('h1');
  const bodyText = document.body.innerText.toLowerCase();
  return {
    heroH1: h1?.innerText?.replace(/\s+/g, ' ').trim(),
    heroH1textContent: h1?.textContent?.replace(/\s+/g, ' ').trim(),
    // case-insensitive key string checks
    hasTouch: bodyText.includes('what we touch'),
    hasWeChange: bodyText.includes('we change'),
    hasWorkWith: bodyText.includes('work with us'),
    hasExploreOur: bodyText.includes('explore our services'),
    hasStartConv: bodyText.includes('start the conversation'),
    hasIntelImpact: bodyText.includes('intelligence impact'),
    hasInsightsPersp: bodyText.includes('insights & perspectives'),
    hasAllInsights: bodyText.includes('all insights'),
    hasGetAIInbox: bodyText.includes('get ai intelligence in your inbox'),
    hasSubscribe: bodyText.includes('subscribe'),
    hasHeroSub: bodyText.includes('global ai consulting and advisory firm'),
    hasTrustLine: bodyText.includes('trusted by'),
    hasAboutHeadline: bodyText.includes('global intelligence partner'),
    // Footer copyright
    hasCopyright: bodyText.includes('2026 cognis group'),
  };
});
console.log(JSON.stringify(info, null, 2));
await p.screenshot({ path: 'playwright-screenshots/final-1440-fullpage.png', fullPage: true });
await b.close();
