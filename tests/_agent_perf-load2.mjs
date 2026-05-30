import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe`;
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/perf-load';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: 'services', url: '/our-services/' },
  { name: 'service-detail', url: '/our-services/ai-strategy-advisory/' },
];

const results = [];
for (const p of PAGES) {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let nav;
  try {
    nav = await page.goto(BASE + p.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) { results.push({ page: p.name, error: String(e).slice(0,150) }); await browser.close(); continue; }
  // wait for SPA hydration to settle and stop re-navigating
  await page.waitForTimeout(8000);
  const ev = async (fn, def) => { try { return await page.evaluate(fn); } catch { try { await page.waitForTimeout(1500); return await page.evaluate(fn); } catch { return def; } } };

  const m = await ev(() => {
    const nt = performance.getEntriesByType('navigation')[0] || {};
    const paints = {}; for (const e of performance.getEntriesByType('paint')) paints[e.name] = Math.round(e.startTime);
    const res = performance.getEntriesByType('resource').map(r => ({ name: r.name, type: r.initiatorType, transfer: r.transferSize, decoded: r.decodedBodySize }));
    return {
      ttfb: Math.round((nt.responseStart||0)-(nt.requestStart||0)),
      fcp: paints['first-contentful-paint']||0,
      dcl: Math.round(nt.domContentLoadedEventEnd||0),
      load: Math.round(nt.loadEventEnd||0),
      docTransfer: nt.transferSize||0, res,
    };
  }, { ttfb:0,fcp:0,dcl:0,load:0,docTransfer:0,res:[] });

  const lcp = await ev(() => new Promise(r => { let v=0; try{ new PerformanceObserver(l=>{for(const e of l.getEntries())v=Math.round(e.startTime)}).observe({type:'largest-contentful-paint',buffered:true}); }catch{} setTimeout(()=>r(v),500); }), 0);

  const imgInfo = await ev(() => [...document.querySelectorAll('img')].map(img=>{const r=img.getBoundingClientRect();return{src:img.currentSrc||img.src,natW:img.naturalWidth,natH:img.naturalHeight,dispW:Math.round(r.width),dispH:Math.round(r.height)}}), []);
  const videos = await ev(() => [...document.querySelectorAll('video')].map(v=>({src:v.currentSrc||'',autoplay:v.autoplay,preload:v.preload,w:v.videoWidth,h:v.videoHeight})), []);
  const renderBlocking = await ev(() => { const o=[]; document.querySelectorAll('head link[rel="stylesheet"]').forEach(l=>o.push({kind:'css',href:l.href})); document.querySelectorAll('head script[src]').forEach(s=>{if(!s.async&&!s.defer)o.push({kind:'sync',src:s.src})}); return o; }, []);

  let totalTransfer=m.docTransfer, totalDecoded=0; const byType={};
  for(const r of m.res){ totalTransfer+=(r.transfer||0); totalDecoded+=(r.decoded||0); byType[r.type]=(byType[r.type]||0)+(r.transfer||0); }
  const biggest=[...m.res].sort((a,b)=>b.transfer-a.transfer).slice(0,10);
  const shot=`${OUT}/${p.name}.png`; await page.screenshot({path:shot,fullPage:false});

  const r = { page:p.name, url:p.url, status:nav.status(), metrics:{ttfb:m.ttfb,fcp:m.fcp,lcp:lcp||0,dcl:m.dcl,load:m.load}, totalTransferBytes:totalTransfer, totalDecodedBytes:totalDecoded, requestCount:m.res.length+1, byType, biggest, oversizedImages: imgInfo.filter(i=>i.natW>0&&i.dispW>0&&i.natW>i.dispW*2+100).map(i=>({...i,ratio:(i.natW/i.dispW).toFixed(1)})), videos, renderBlocking, screenshot:shot };
  results.push(r);
  console.log(`\n### ${p.name} status=${r.status} TTFB=${m.ttfb} FCP=${m.fcp} LCP=${r.metrics.lcp} load=${m.load}`);
  console.log(`  transfer=${(totalTransfer/1024).toFixed(0)}KB decoded=${(totalDecoded/1024/1024).toFixed(2)}MB req=${m.res.length+1}`);
  console.log(`  byType: ${Object.entries(byType).map(([k,v])=>`${k}=${(v/1024).toFixed(0)}KB`).join(' ')}`);
  console.log(`  renderBlocking css=${renderBlocking.filter(x=>x.kind==='css').length} sync=${renderBlocking.filter(x=>x.kind==='sync').length}`);
  console.log(`  videos: ${JSON.stringify(videos)}`);
  console.log(`  oversized(${r.oversizedImages.length}): `+r.oversizedImages.slice(0,5).map(i=>`${i.ratio}x ${i.natW}>${i.dispW} ${i.src.split('/').pop().slice(0,40)}`).join(' | '));
  console.log('  biggest: '+biggest.slice(0,6).map(b=>`${(b.transfer/1024).toFixed(0)}KB ${b.name.split('/').pop().slice(0,40)}`).join(' | '));
  await browser.close();
}
writeFileSync(`${OUT}/perf-metrics-2.json`, JSON.stringify(results,null,2));
console.log('\nWROTE perf-metrics-2.json');
