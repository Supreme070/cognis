import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('qa_evidence/2026-07-26/hero-flash');
await fs.mkdir(out, { recursive: true });
const routes = [
  ['why-cognis', '/why-cognis/', '/assets/why-hero.jpg'],
  ['case-studies', '/case-studies/', '/assets/cases-hero.jpg'],
  ['how-we-work', '/how-we-work/', '/assets/process-hero.jpg'],
];
const browser = await chromium.launch({ headless: false, slowMo: 25 });
const report = { console: [], routes: {} };

for (const [name, route, expected] of routes) {
  report.routes[name] = { expected, cold: [], navigation: null };
  for (let run = 1; run <= 2; run++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('console', m => { if (m.type() === 'error') report.console.push({ name, run, text: m.text() }); });
    page.on('pageerror', e => report.console.push({ name, run, text: e.message }));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    const nav = page.goto(`http://127.0.0.1:8099${route}`, { waitUntil: 'commit' });
    const frames = [];
    for (let ms = 0; ms <= 2000; ms += 100) {
      if (ms) await page.waitForTimeout(100);
      const file = `${name}__cold-r${run}__${String(ms).padStart(4, '0')}ms.png`;
      await page.screenshot({ path: path.join(out, file) });
      const state = await page.evaluate(() => {
        const hero = document.querySelector('[data-screen-label$="hero" i]');
        const img = hero?.querySelector('img');
        return { src: img?.getAttribute('src') || null, currentSrc: img?.currentSrc || null, complete: img?.complete || false };
      }).catch(() => ({ src: null, currentSrc: null, complete: false }));
      frames.push({ ms, file, state });
    }
    await nav.catch(() => {});
    report.routes[name].cold.push(frames);
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
  await page.evaluate(target => { location.href = target; }, route);
  const frames = [];
  for (let ms = 0; ms <= 1200; ms += 100) {
    if (ms) await page.waitForTimeout(100);
    const file = `${name}__navigation__${String(ms).padStart(4, '0')}ms.png`;
    await page.screenshot({ path: path.join(out, file) });
    frames.push(file);
  }
  report.routes[name].navigation = frames;
  await context.close();
}

await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify({ out, consoleErrors: report.console.length }, null, 2));
