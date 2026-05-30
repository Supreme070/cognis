import { chromium } from 'playwright';

const BASE = 'https://www.cognis.group';
const url = process.argv[2] || '/about-us/';
const waitMs = Number(process.argv[3] || 6000);
const shot = process.argv[4] || 'test-results/site-audit/evidence/e2e-deeplink-hydration/recover.png';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const aborted = [];
const failed = [];
const statuses = {};
page.on('requestfailed', (r) => {
  const u = r.url();
  if (/cdn-cgi|\/rum\b|challenge-platform/.test(u)) return;
  if (/framer-runtime/.test(u)) aborted.push(u.replace(BASE, '') + ' :: ' + (r.failure()?.errorText || ''));
  else failed.push(u + ' ' + (r.failure()?.errorText || ''));
});
page.on('response', (resp) => {
  const u = resp.url();
  if (/framer-runtime\/sites\/.*\.mjs/.test(u)) statuses[resp.status()] = (statuses[resp.status()] || 0) + 1;
});

let navCount = 0;
page.on('framenavigated', (f) => { if (f === page.mainFrame()) navCount++; });
await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(waitMs);
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

// Measure whether hero looks hydrated: count overlapping huge headings at top
const diag = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const r = h1 ? h1.getBoundingClientRect() : null;
  return {
    title: document.title,
    h1text: h1 ? h1.textContent.trim().slice(0, 80) : null,
    h1top: r ? Math.round(r.top) : null,
    bodyH: document.body.scrollHeight,
    framerLoaded: !!document.querySelector('[data-framer-hydrate-v2], #main [data-framer-name]'),
  };
});
await page.screenshot({ path: shot, fullPage: false });
console.log(JSON.stringify({
  url, waitMs, navCount, diag,
  mjsStatuses: statuses,
  framerAbortedCount: aborted.length,
  framerAbortedSample: aborted.slice(0, 6),
  otherFailed: failed.slice(0, 6),
}, null, 2));
await browser.close();
