import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('console', m => console.log('[' + m.type() + ']', m.text().slice(0, 300)));
await p.goto('http://127.0.0.1:3001/blog/why-enterprise-ai-deployments-fail?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);

// Probe for Framer router state
const probe = await p.evaluate(() => {
  const w = window;
  const keys = Object.keys(w).filter(k => /framer|route|__/i.test(k));
  return {
    pathname: location.pathname,
    title: document.title,
    h1: document.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim(),
    rootCount: document.querySelectorAll('main[data-framer-name]').length,
    rootNames: Array.from(document.querySelectorAll('main[data-framer-name]')).map(m => m.getAttribute('data-framer-name')),
    allSections: Array.from(document.querySelectorAll('section[data-framer-name]')).map(s => s.getAttribute('data-framer-name')).slice(0, 20),
    framerGlobals: keys.slice(0, 20),
  };
});
console.log(JSON.stringify(probe, null, 2));
await b.close();
