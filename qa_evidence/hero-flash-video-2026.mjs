import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('qa_evidence/2026-07-26/hero-flash-video');
await fs.mkdir(out, { recursive: true });
const routes = [
  ['why-cognis', '/why-cognis/'],
  ['case-studies', '/case-studies/'],
  ['how-we-work', '/how-we-work/'],
];
const report = { console: [], videos: [] };

async function capture(name, route, mode) {
  const browser = await chromium.launch({ headless: false, slowMo: 20 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: out, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') report.console.push({ name, mode, text: m.text() }); });
  page.on('pageerror', e => report.console.push({ name, mode, text: e.message }));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await page.waitForTimeout(500);
  if (mode === 'cold') {
    await page.goto(`http://127.0.0.1:8099${route}`, { waitUntil: 'commit' });
  } else {
    await page.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.evaluate(target => {
      const link = [...document.querySelectorAll('a[href]')].find(a => new URL(a.href, location.href).pathname === target);
      if (!link) throw new Error(`Missing navigation link: ${target}`);
      link.click();
    }, route);
  }
  await page.waitForTimeout(3500);
  const video = page.video();
  await context.close();
  const raw = await video.path();
  const finalPath = path.join(out, `${name}__${mode}.webm`);
  await fs.rename(raw, finalPath);
  await browser.close();
  report.videos.push({ name, mode, file: path.basename(finalPath) });
}

for (const [name, route] of routes) {
  await capture(name, route, 'cold');
  await capture(name, route, 'navigation');
}

await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
