import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const pageErrors = [];
const failedReqs = [];
p.on('pageerror', e => pageErrors.push(e.message));
p.on('requestfailed', r => failedReqs.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));

const report = {};

await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);

const cardInfo = await p.evaluate(() => {
  const anchors = Array.from(document.querySelectorAll('a.framer-1kqwkg9'));
  const visible = anchors.filter(a => {
    const r = a.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  return visible.map(a => ({
    href: a.getAttribute('href'),
    title: (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
  }));
});
report.homepageCards = cardInfo;
report.homepagePageErrors = pageErrors.length;
report.homepageFailedReqs = failedReqs.length;
report.homepageFailedReqsFirst = failedReqs.slice(0, 3);

// Click first card, verify detail page renders
pageErrors.length = 0;
failedReqs.length = 0;

const firstHref = cardInfo[0]?.href;
report.firstHrefClicked = firstHref;

await Promise.all([
  p.waitForLoadState('networkidle').catch(() => {}),
  p.click('a.framer-1kqwkg9:visible >> nth=0'),
]);
await p.waitForTimeout(2500);

const detailInfo = await p.evaluate(() => {
  return {
    url: location.href,
    title: document.title,
    h1: document.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim()?.slice(0, 100),
    bodyLen: document.body.innerText.length,
    hasContent: document.body.innerText.length > 500,
  };
});
report.detail = detailInfo;
report.detailPageErrors = pageErrors.length;
report.detailFailedReqs = failedReqs.length;
report.detailFailedReqsFirst = failedReqs.slice(0, 3);
report.detailPageErrorsFirst = pageErrors.slice(0, 3);

await p.screenshot({ path: 'playwright-screenshots/phase3-blog-detail.png', fullPage: false });

console.log(JSON.stringify(report, null, 2));
await b.close();
