import { chromium } from 'playwright';
const b = await chromium.launch();
const results = {};
for (const w of [1440, 768, 375]) {
  const p = await b.newContext({ viewport: { width: w, height: 900 } }).then(c => c.newPage());
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(3500);

  const info = await p.evaluate(() => {
    function getVis(el){ const r = el.getBoundingClientRect(); return r.width>0 && r.height>0; }
    const insightsEls = Array.from(document.querySelectorAll('[id="insights"]'));
    const insightsEl = document.getElementById('insights');
    const expertiseSec = document.querySelector('section[data-framer-name="expertise"]');
    const blogHeaderText = Array.from(document.querySelectorAll('*')).find(n => (n.textContent||'').trim().startsWith('Insights & Perspectives'));
    return {
      insightsCount: insightsEls.length,
      insightsOnBlog: insightsEl ? insightsEl.className.includes('framer-lgfeet-container') : false,
      insightsVisible: insightsEl ? getVis(insightsEl) : false,
      expertiseHasId: expertiseSec ? expertiseSec.id : null,
      hasBlogHeader: !!blogHeaderText,
    };
  });

  // Simulate clicking nav Insights link and check final scroll position
  await p.evaluate(() => { location.hash = '#insights'; });
  await p.waitForTimeout(700);
  const scrollData = await p.evaluate(() => {
    const el = document.getElementById('insights');
    if (!el) return { err: 'no insights el' };
    const r = el.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      elTop: Math.round(r.top),
      elHeight: Math.round(r.height),
      inView: r.top >= 0 && r.top < window.innerHeight,
    };
  });

  results[w] = { ...info, scroll: scrollData, pageErrors: errs.length, pageErrorsFirst: errs.slice(0,3) };
  await p.screenshot({ path: `playwright-screenshots/phase1-insights-${w}.png`, fullPage: false });
  await p.close();
}
console.log(JSON.stringify(results, null, 2));
await b.close();
