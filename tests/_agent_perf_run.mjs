// Wrapper: reads journey JSON from a file and invokes the probe logic inline.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = 'https://www.cognis.group';
const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const outDir = process.argv[3] || 'test-results/probe';
mkdirSync(outDir, { recursive: true });
const vp = spec.viewport || { width: 1440, height: 900 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: vp });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__lt = 0; window.__ltMax = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 50) { window.__lt++; if (e.duration > window.__ltMax) window.__ltMax = e.duration; } }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
});

const events = [];
const push = (k, t) => { if (events.length < 400) events.push({ k, t: String(t).slice(0, 300), url: page.url() }); };
page.on('console', (m) => { const ty = m.type(); if (ty === 'error' || ty === 'warning') push(ty, m.text()); });
page.on('pageerror', (e) => push('pageerror', e));
page.on('requestfailed', (r) => { const u = r.url(); if (/cdn-cgi|\/rum\b|challenge-platform/.test(u)) return; push('reqfail', u + ' ' + (r.failure()?.errorText || '')); });

async function safe(fn) { try { return await fn(); } catch (e) { return { __err: String(e).slice(0, 160) }; } }
async function isResponsive() {
  for (let i = 0; i < 4; i++) {
    try { await Promise.race([page.evaluate(() => 1), new Promise((_, r) => setTimeout(() => r('to'), 2500))]); return true; }
    catch { await page.waitForTimeout(500); }
  }
  return false;
}

const steps = [];
for (let i = 0; i < spec.steps.length; i++) {
  const s = spec.steps[i];
  const before = page.url();
  const t0 = Date.now();
  const ltBefore = await safe(() => page.evaluate(() => window.__lt || 0));
  const err = await safe(async () => {
    if (s.action === 'goto') await page.goto(s.url.startsWith('http') ? s.url : BASE + s.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    else if (s.action === 'click') { const l = s.text ? page.getByText(s.text, { exact: false }).first() : page.locator(s.selector).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.click({ timeout: 8000 }); }
    else if (s.action === 'hover') { const l = s.text ? page.getByText(s.text, { exact: false }).first() : page.locator(s.selector).first(); await l.hover({ timeout: 6000 }); }
    else if (s.action === 'back') await page.goBack({ timeout: 20000 });
    else if (s.action === 'forward') await page.goForward({ timeout: 20000 });
    else if (s.action === 'reload') await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    else if (s.action === 'viewport') await page.setViewportSize(s.size);
    else if (s.action === 'wait') await page.waitForTimeout(s.ms || 1000);
    else if (s.action === 'scroll') await page.evaluate(async (to) => { if (to === 'bottom') { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); } } else window.scrollTo(0, to || 0); }, s.to);
  });
  await page.waitForTimeout(s.settle ?? 1600);
  const responsive = await isResponsive();
  const lt = await safe(() => page.evaluate(() => window.__lt || 0));
  const ltMax = await safe(() => page.evaluate(() => Math.round(window.__ltMax || 0)));
  const shot = `${outDir}/s${i}-${s.action}.png`;
  await safe(() => page.screenshot({ path: shot }));
  const ltDelta = (typeof lt === 'number' && typeof ltBefore === 'number') ? lt - ltBefore : null;
  steps.push({ i, action: s.action, arg: s.text || s.selector || s.url || (s.to !== undefined ? String(s.to) : (s.ms ? s.ms + 'ms' : '')), before, after: page.url(), ms: Date.now() - t0, responsive, longtasks: (typeof lt === 'number' ? lt : null), ltDelta, ltMaxMs: (typeof ltMax === 'number' ? ltMax : null), screenshot: shot, error: err && err.__err ? err.__err : null });
}

const errorEvents = events.filter((e) => e.k !== 'warning');
writeFileSync(`${outDir}/report.json`, JSON.stringify({ name: spec.name, viewport: vp, steps, events }, null, 2));
console.log(JSON.stringify({
  name: spec.name, stepCount: steps.length,
  seizes: steps.filter((s) => !s.responsive).map((s) => `step${s.i}:${s.action} ${s.arg}`),
  longtaskTrail: steps.map((s) => `s${s.i}:${s.action}(${s.arg})=+${s.ltDelta} max${s.ltMaxMs}ms ${s.responsive ? '' : 'SEIZE'}`),
  navErrors: steps.filter((s) => s.error).map((s) => `step${s.i}:${s.error}`),
  errorEventCount: errorEvents.length,
  sampleErrors: errorEvents.slice(0, 10).map((e) => `[${e.k}] ${e.t}`),
  reportFile: `${outDir}/report.json`,
}, null, 2));
await browser.close();
