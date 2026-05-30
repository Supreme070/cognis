import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe`;
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/perf-load';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: 'home', url: '/' },
  { name: 'services', url: '/our-services/' },
  { name: 'service-detail', url: '/our-services/ai-strategy-advisory/' },
  { name: 'products', url: '/products/' },
  { name: 'blog-post', url: '/blog/the-real-roi-of-ai/' },
];

const results = [];

for (const p of PAGES) {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  // Simulate cold cache
  await ctx.clearCookies();

  const reqs = [];
  page.on('response', async (resp) => {
    try {
      const req = resp.request();
      const url = resp.url();
      const headers = resp.headers();
      let len = Number(headers['content-length'] || 0);
      const type = req.resourceType();
      reqs.push({ url, status: resp.status(), type, len, ct: headers['content-type'] || '' });
    } catch {}
  });

  const t0 = Date.now();
  let nav;
  try {
    nav = await page.goto(BASE + p.url, { waitUntil: 'load', timeout: 60000 });
  } catch (e) {
    results.push({ page: p.name, url: p.url, error: String(e).slice(0, 200) });
    await browser.close();
    continue;
  }
  // settle for lazy assets / LCP; tolerate SPA re-navigation
  await page.waitForTimeout(4000);
  try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
  const ev = async (fn, def) => { try { return await page.evaluate(fn); } catch { try { await page.waitForTimeout(1500); return await page.evaluate(fn); } catch { return def; } } };

  // Web vitals + nav timing
  const metrics = await ev(() => {
    const nt = performance.getEntriesByType('navigation')[0] || {};
    const paints = {};
    for (const e of performance.getEntriesByType('paint')) paints[e.name] = Math.round(e.startTime);
    // LCP via buffered observer
    let lcp = 0;
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length) lcp = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
    } catch {}
    // resource sizes from PerformanceResourceTiming (transferSize/encodedBodySize)
    const res = performance.getEntriesByType('resource').map(r => ({
      name: r.name,
      type: r.initiatorType,
      transfer: r.transferSize,
      encoded: r.encodedBodySize,
      decoded: r.decodedBodySize,
      dur: Math.round(r.duration),
      start: Math.round(r.startTime),
    }));
    const docTransfer = nt.transferSize || 0;
    return {
      ttfb: Math.round((nt.responseStart || 0) - (nt.requestStart || 0)),
      responseStart: Math.round(nt.responseStart || 0),
      domContentLoaded: Math.round(nt.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(nt.loadEventEnd || 0),
      fcp: paints['first-contentful-paint'] || 0,
      fp: paints['first-paint'] || 0,
      lcp,
      docTransfer,
      res,
    };
  }, { ttfb:0, fcp:0, fp:0, lcp:0, domContentLoaded:0, loadEvent:0, docTransfer:0, res:[] });

  // Try a real LCP measurement via PerformanceObserver injected earlier — fallback heuristic
  const lcp2 = await ev(() => new Promise(resolve => {
    let val = 0;
    try {
      const po = new PerformanceObserver(list => {
        for (const e of list.getEntries()) val = Math.round(e.startTime);
      });
      po.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
    setTimeout(() => resolve(val), 500);
  }), 0);

  // image natural vs displayed sizes
  const imgInfo = await ev(() => {
    const out = [];
    for (const img of document.querySelectorAll('img')) {
      const r = img.getBoundingClientRect();
      out.push({
        src: img.currentSrc || img.src,
        natW: img.naturalWidth, natH: img.naturalHeight,
        dispW: Math.round(r.width), dispH: Math.round(r.height),
        loading: img.getAttribute('loading') || '',
      });
    }
    return out;
  }, []);

  const videoInfo = await ev(() => {
    const out = [];
    for (const v of document.querySelectorAll('video')) {
      const s = v.currentSrc || (v.querySelector('source') && v.querySelector('source').src) || '';
      out.push({ src: s, autoplay: v.autoplay, preload: v.preload, muted: v.muted, loop: v.loop, w: v.videoWidth, h: v.videoHeight });
    }
    return out;
  }, []);

  // Aggregate from resource timing (transferSize is most accurate for cold load)
  const res = metrics.res;
  let totalTransfer = metrics.docTransfer;
  let totalDecoded = 0;
  const byType = {};
  for (const r of res) {
    totalTransfer += (r.transfer || 0);
    totalDecoded += (r.decoded || 0);
    byType[r.type] = (byType[r.type] || 0) + (r.transfer || 0);
  }
  const requestCount = res.length + 1;

  // biggest resources
  const biggest = [...res].sort((a, b) => b.transfer - a.transfer).slice(0, 12);

  // render-blocking: stylesheets + sync scripts in <head> before FCP
  const renderBlocking = await ev(() => {
    const out = [];
    document.querySelectorAll('head link[rel="stylesheet"]').forEach(l => out.push({ kind: 'css', href: l.href }));
    document.querySelectorAll('head script[src]').forEach(s => { if (!s.async && !s.defer) out.push({ kind: 'sync-script', src: s.src }); });
    return out;
  }, []);

  const shot = `${OUT}/${p.name}.png`;
  await page.screenshot({ path: shot });

  results.push({
    page: p.name,
    url: p.url,
    status: nav.status(),
    metrics: {
      ttfb: metrics.ttfb,
      fcp: metrics.fcp,
      fp: metrics.fp,
      lcp: lcp2 || metrics.lcp,
      domContentLoaded: metrics.domContentLoaded,
      loadEvent: metrics.loadEvent,
    },
    totalTransferBytes: totalTransfer,
    totalDecodedBytes: totalDecoded,
    requestCount,
    byType,
    biggest,
    oversizedImages: imgInfo.filter(i => i.natW > 0 && (i.natW > i.dispW * 2 + 100)).map(i => ({ ...i, ratio: i.dispW ? (i.natW / i.dispW).toFixed(1) : 'n/a' })),
    allImages: imgInfo,
    videos: videoInfo,
    renderBlocking,
    screenshot: shot,
  });

  await browser.close();
}

writeFileSync(`${OUT}/perf-metrics.json`, JSON.stringify(results, null, 2));

// print compact summary
for (const r of results) {
  if (r.error) { console.log(`\n### ${r.page} ERROR: ${r.error}`); continue; }
  console.log(`\n### ${r.page} (${r.url}) status=${r.status}`);
  console.log(`  TTFB=${r.metrics.ttfb}ms FCP=${r.metrics.fcp}ms LCP=${r.metrics.lcp}ms DCL=${r.metrics.domContentLoaded}ms load=${r.metrics.loadEvent}ms`);
  console.log(`  transfer=${(r.totalTransferBytes/1024).toFixed(0)}KB decoded=${(r.totalDecodedBytes/1024/1024).toFixed(2)}MB requests=${r.requestCount}`);
  console.log(`  byType: ${Object.entries(r.byType).map(([k,v])=>`${k}=${(v/1024).toFixed(0)}KB`).join(' ')}`);
  console.log(`  renderBlocking: css=${r.renderBlocking.filter(x=>x.kind==='css').length} syncScript=${r.renderBlocking.filter(x=>x.kind==='sync-script').length}`);
  console.log(`  videos: ${JSON.stringify(r.videos)}`);
  console.log(`  oversizedImages(${r.oversizedImages.length}):`);
  for (const i of r.oversizedImages.slice(0,6)) console.log(`    ${i.ratio}x nat=${i.natW}x${i.natH} disp=${i.dispW}x${i.dispH} ${i.src.slice(0,90)}`);
  console.log(`  biggest:`);
  for (const b of r.biggest.slice(0,6)) console.log(`    ${(b.transfer/1024).toFixed(0)}KB ${b.type} ${b.name.slice(0,95)}`);
}
console.log('\nWROTE', `${OUT}/perf-metrics.json`);
