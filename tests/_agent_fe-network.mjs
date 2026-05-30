import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'https://www.cognis.group';
const outDir = 'test-results/site-audit/evidence/fe-network';
mkdirSync(outDir, { recursive: true });

const routes = [
  '/', '/about-us/', '/our-services/', '/our-services/ai-strategy-advisory/',
  '/our-services/ai-agent-automation-engineering/', '/our-services/ai-training-workforce-development/',
  '/products/', '/why-cognis/', '/case-studies/', '/blog/',
  '/contact/', '/faq/', '/how-we-work/',
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const allReq = [];        // every response status
const failed = [];        // requestfailed (aborted/err)
const perRoute = {};

page.on('requestfailed', (r) => {
  const u = r.url();
  failed.push({ route: page.url(), url: u, err: r.failure()?.errorText || '', type: r.resourceType() });
});
page.on('response', async (resp) => {
  const req = resp.request();
  const u = resp.url();
  const status = resp.status();
  let len = resp.headers()['content-length'] || '';
  if (status >= 400 || /redirect/i.test(resp.headers()['cf-cache-status'] || '')) {
    allReq.push({ route: page.url(), url: u, status, type: req.resourceType(), len });
  }
  if (status >= 300) {
    allReq.push({ route: page.url(), url: u, status, type: req.resourceType(), len, loc: resp.headers()['location'] || '' });
  }
});

for (const r of routes) {
  const beforeFailed = failed.length;
  const t0 = Date.now();
  let httpStatus = null;
  try {
    const resp = await page.goto(BASE + r, { waitUntil: 'networkidle', timeout: 45000 });
    httpStatus = resp ? resp.status() : null;
  } catch (e) {
    perRoute[r] = { error: String(e).slice(0, 120) };
    continue;
  }
  await page.waitForTimeout(1500);
  // collect image sizes via Resource Timing
  const heavy = await page.evaluate(() => {
    const out = [];
    for (const e of performance.getEntriesByType('resource')) {
      if (e.transferSize > 300000 || e.encodedBodySize > 300000) {
        out.push({ name: e.name, transfer: e.transferSize, body: e.encodedBodySize, type: e.initiatorType });
      }
    }
    return out.sort((a,b)=>b.transfer-a.transfer).slice(0,8);
  });
  const failedHere = failed.slice(beforeFailed).map(f => `${f.type} ${f.err} ${f.url}`);
  perRoute[r] = { httpStatus, ms: Date.now()-t0, heavy, failedCount: failedHere.length, failed: failedHere };
}

// Redirect checks (retired slugs) via direct fetch, no-redirect
const redirectChecks = [
  '/our-services/ml-data-intelligence',
  '/our-services/ai-governance-risk-compliance',
  '/our-services/enterprise-digital-transformation',
  '/our-services/ml-data-intelligence/',
];
const redirResults = {};
for (const rc of redirectChecks) {
  const resp = await page.goto(BASE + rc, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e=>null);
  redirResults[rc] = { finalUrl: page.url(), status: resp?.status() ?? null };
}

// caching headers sample
const headerSamples = {};
for (const u of [BASE + '/', BASE + '/products/', BASE + '/about-us/']) {
  const resp = await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(()=>null);
  if (resp) {
    const h = resp.headers();
    headerSamples[u] = { 'cache-control': h['cache-control'], 'cf-cache-status': h['cf-cache-status'], 'content-type': h['content-type'], status: resp.status() };
  }
}

writeFileSync(`${outDir}/network-report.json`, JSON.stringify({ perRoute, redirResults, headerSamples, failed, statusEvents: allReq }, null, 2));
console.log(JSON.stringify({
  routesProbed: Object.keys(perRoute).length,
  routeSummary: Object.fromEntries(Object.entries(perRoute).map(([k,v])=>[k, { http:v.httpStatus, ms:v.ms, failed:v.failedCount, heavyCount:(v.heavy||[]).length }])),
  totalFailed: failed.length,
  failedSample: failed.slice(0,20).map(f=>`${f.err} ${f.type} ${f.url}`),
  redirResults,
  headerSamples,
  status4xx: allReq.filter(a=>a.status>=400).slice(0,20),
}, null, 2));
await browser.close();
