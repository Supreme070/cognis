import { chromium } from 'playwright';
const b = await chromium.launch();
const results = {};
for (const [label, vp] of [['1440', {width:1440,height:900}], ['768', {width:768,height:1024}], ['375', {width:375,height:812}]]) {
  const ctx = await b.newContext({ viewport: vp, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  await p.route('**/*', r => r.continue({ headers: { ...r.request().headers(), 'cache-control': 'no-cache' }}));
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(4000);
  const bodyText = await p.evaluate(() => document.body.innerText);
  const counts = {};
  for (const s of [
    'What We Touch','We Change','Work With Us','About Us','Explore Our Services',
    'Start the Conversation','Get AI intelligence in your inbox','Subscribe',
    'Intelligence Impact','Insights & Perspectives','All Insights','Quod Tango Muto',
    'Active Engagement','AI Adoption Rate','Decisions Transformed','Markets Served',
    'Leadership team','Operations lead','Chief People Officer',
    'Cognis Group',
    // Should be 0:
    'Talk to us','Book a consultation','Blog and articles','Latest insights and trends',
    'What they say about us','Our Approach','Our Philosophy','Our Promise',
    '130+ Premium','1,540+ happy','Temlis','Aeline','Subscribe to our insights',
    'Automation & optimization','Experience intelligence','Data Points','Continents',
    'Built in Lagos','Turning Data into Strategy',
  ]) {
    const re = new RegExp(s.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&'), 'g');
    counts[s] = (bodyText.match(re) || []).length;
  }
  const navText = await p.locator('nav').first().innerText().catch(() => '');
  await p.screenshot({ path: `playwright-screenshots/final-${label}.png`, fullPage: false });
  results[label] = { counts, nav: navText, errs };
  await ctx.close();
}
console.log(JSON.stringify(results, null, 2));
await b.close();
