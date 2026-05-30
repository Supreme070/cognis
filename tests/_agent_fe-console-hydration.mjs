// FE console + hydration sweep across all routes (direct load).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/fe-console-hydration';
mkdirSync(OUT, { recursive: true });
const routes = ['/','/about-us/','/our-services/','/products/','/why-cognis/','/contact/','/blog/','/our-services/ai-strategy-advisory/','/our-services/ai-training-workforce-development/','/our-services/ai-agent-automation-engineering/','/blog/why-most-enterprise-ai-strategies-fail-before-they-start/','/blog/building-ai-agents-that-actually-ship/','/blog/ai-governance-is-not-optional/','/blog/the-real-roi-of-ai/','/blog/making-your-workforce-ai-ready/','/blog/ai-native-operations-for-african-enterprises/','/privacy-policy/','/case-studies/','/case-studies/marketsage/','/case-studies/claims-processing-automation/','/case-studies/ai-training-programme/','/how-we-work/','/faq/','/terms/','/thanks/','/thanks-subscribe/','/teams/kola-olatunde/','/teams/supreme-oyewumi/','/teams/fisayo-oludare/'];

const browser = await chromium.launch();
const results = [];

for (const r of routes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const ev = [];
  const push = (k, t) => ev.push({ k, t: String(t).slice(0, 400) });
  page.on('console', (m) => { const ty = m.type(); if (ty === 'error' || ty === 'warning') push(ty, m.text()); });
  page.on('pageerror', (e) => push('pageerror', e && e.message ? e.message : e));
  page.on('requestfailed', (rq) => { const u = rq.url(); if (/cdn-cgi|\/rum\b|challenge-platform|google|gtag|analytics/.test(u)) return; push('reqfail', u + ' ' + (rq.failure()?.errorText || '')); });
  let status = null;
  try {
    const resp = await page.goto(BASE + r, { waitUntil: 'networkidle', timeout: 45000 });
    status = resp ? resp.status() : null;
  } catch (e) { push('navfail', String(e).slice(0, 200)); }
  await page.waitForTimeout(2500);
  // count recoverable hydration errors specifically
  const recov = ev.filter(e => /recoverable|hydrat|Minified React error|did not match|server.*client|#418|#423|#425/i.test(e.t));
  results.push({
    route: r, status,
    errors: ev.filter(e => e.k === 'pageerror' || e.k === 'error').length,
    warnings: ev.filter(e => e.k === 'warning').length,
    reqfails: ev.filter(e => e.k === 'reqfail').length,
    recoverable: recov.length,
    sample: ev.slice(0, 12),
  });
  await ctx.close();
}

writeFileSync(`${OUT}/console-sweep.json`, JSON.stringify(results, null, 2));
// summary
for (const x of results) {
  console.log(`${x.status}  err=${x.errors} warn=${x.warnings} recov=${x.recoverable} reqfail=${x.reqfails}  ${x.route}`);
}
await browser.close();
