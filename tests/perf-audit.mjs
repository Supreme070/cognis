// Performance audit. Usage: node tests/perf-audit.mjs [baseURL]
// Captures the full resource waterfall, bytes by type, render-blocking assets,
// failed requests, and image lazy-load / dimension status (CLS risk).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] || 'https://www.cognis.group';
const OUT = 'test-results/perf';
mkdirSync(OUT, { recursive: true });
const PAGES = [['home', '/'], ['our-services', '/our-services/'], ['blog', '/blog/']];

const browser = await chromium.launch();
const report = {};
for (const [name, path] of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const reqs = [];
  const failed = [];
  page.on('requestfinished', async (r) => {
    try {
      const resp = await r.response();
      const sz = Number((await resp.headerValue('content-length')) || 0);
      reqs.push({ url: r.url(), type: r.resourceType(), status: resp.status(), size: sz, enc: (await resp.headerValue('content-encoding')) || '' });
    } catch {}
  });
  page.on('requestfailed', (r) => failed.push({ url: r.url(), type: r.resourceType(), err: r.failure()?.errorText }));
  const t0 = Date.now();
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  const tLoad = Date.now() - t0;
  await page.waitForTimeout(4000);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((p) => p.name === 'first-contentful-paint');
    // images: count, lazy status, missing dimensions (CLS), offscreen
    const imgs = Array.from(document.images);
    const vh = window.innerHeight;
    let belowFoldEager = 0, missingDims = 0, lazy = 0;
    imgs.forEach((im) => {
      const r = im.getBoundingClientRect();
      const below = r.top > vh;
      if (im.loading === 'lazy') lazy++;
      if (below && im.loading !== 'lazy') belowFoldEager++;
      if (!im.getAttribute('width') && !im.style.width && !im.getAttribute('height')) missingDims++;
    });
    // render-blocking: stylesheets + sync scripts in <head>
    const headCss = document.querySelectorAll('head link[rel="stylesheet"]').length;
    const headSyncJs = Array.from(document.querySelectorAll('head script[src]')).filter((s) => !s.async && !s.defer && s.type !== 'module').length;
    const moduleJs = document.querySelectorAll('script[type="module"][src]').length;
    return {
      ttfb: Math.round(nav.responseStart || 0),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(nav.loadEventEnd || 0),
      fcp: Math.round(fcp ? fcp.startTime : 0),
      imgCount: imgs.length, lazyImgs: lazy, belowFoldEager, imgsMissingDims: missingDims,
      headCss, headSyncJs, moduleJs,
    };
  }).catch(() => ({}));

  // aggregate
  const byType = {};
  let total = 0;
  for (const r of reqs) { byType[r.type] = byType[r.type] || { count: 0, bytes: 0 }; byType[r.type].count++; byType[r.type].bytes += r.size; total += r.size; }
  const top = [...reqs].sort((a, b) => b.size - a.size).slice(0, 12).map((r) => ({ kb: Math.round(r.size / 1024), type: r.type, enc: r.enc, url: r.url.replace(BASE, '').slice(0, 90) }));
  report[name] = { tLoadMs: tLoad, metrics, totalKB: Math.round(total / 1024), reqCount: reqs.length, byType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, { count: v.count, KB: Math.round(v.bytes / 1024) }])), failed, top };
  await ctx.close();
}
writeFileSync(`${OUT}/perf.json`, JSON.stringify(report, null, 2));
await browser.close();

for (const [name, r] of Object.entries(report)) {
  const m = r.metrics;
  console.log(`\n=== ${name} === ${r.totalKB}KB / ${r.reqCount} reqs | TTFB=${m.ttfb} FCP=${m.fcp} DCL=${m.domContentLoaded} load=${m.loadEvent}`);
  console.log(`   imgs=${m.imgCount} lazy=${m.lazyImgs} belowFoldEager=${m.belowFoldEager} missingDims=${m.imgsMissingDims} | head: css=${m.headCss} syncJS=${m.headSyncJs} moduleJS=${m.moduleJs}`);
  console.log(`   bytes by type: ${JSON.stringify(r.byType)}`);
  if (r.failed.length) console.log(`   FAILED(${r.failed.length}): ` + r.failed.slice(0, 4).map((f) => f.url.replace(BASE, '').slice(0, 70) + ' ' + f.err).join(' | '));
  console.log(`   heaviest:`); r.top.slice(0, 8).forEach((t) => console.log(`     ${t.kb}KB ${t.type} ${t.enc} ${t.url}`));
}
console.log(`\nReport: ${OUT}/perf.json`);
