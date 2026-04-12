import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errors = [];
const pageErrors = [];
const failedReqs = [];
p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', e => pageErrors.push(e.message));
p.on('requestfailed', r => failedReqs.push(r.url() + ' :: ' + r.failure()?.errorText));
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);

const html = await p.content();
const srcHtml = await (await fetch('http://127.0.0.1:3001/index.html?cb=' + Date.now())).text();

const report = {
  // fingerprint checks on RAW HTML source (what is served, not post-hydration DOM)
  src_framer_com: srcHtml.includes('https://www.framer.com'),
  src_badge_container: srcHtml.includes('__framer-badge-container'),
  src_template_overlay: srcHtml.includes('template-overlay'),
  src_made_in_framer_removed: !srcHtml.includes('Made in Framer'),
  // post-hydration DOM sanity
  dom_badge_node: await p.locator('#__framer-badge-container').count(),
  dom_overlay_node: await p.locator('#template-overlay').count(),
  dom_framer_link: await p.locator('a[href="https://www.framer.com"]').count(),
  // page sanity
  h1: (await p.locator('h1').first().innerText())?.replace(/\s+/g,' ').trim(),
  bodyScrollH: await p.evaluate(() => document.body.scrollHeight),
  // errors
  consoleErrorCount: errors.length,
  pageErrors,
  failedReqsCount: failedReqs.length,
  failedReqs: failedReqs.slice(0, 5),
  pageErrorsFirst: pageErrors.slice(0, 3),
};
console.log(JSON.stringify(report, null, 2));
await p.screenshot({ path: 'playwright-screenshots/phase3-1440.png', fullPage: false });
await b.close();
