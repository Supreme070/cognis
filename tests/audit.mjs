// Live-site audit harness. Usage: node tests/audit.mjs [baseURL]
// Captures console/page errors, load timing, header Products link state,
// testimonials state, and an SPA nav flow (home -> products -> about -> home).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] || 'https://www.cognis.group';
const OUT = 'test-results/audit';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['home', '/'],
  ['products', '/products/'],
  ['our-services', '/our-services/'],
  ['service-detail', '/our-services/ai-agent-automation-engineering/'],
  ['about-us', '/about-us/'],
  ['blog', '/blog/'],
  ['contact', '/contact/'],
];

const report = { base: BASE, pages: {}, nav: [] };

async function safeEval(page, fn, fallback) {
  for (let i = 0; i < 3; i++) {
    try { return await page.evaluate(fn); }
    catch { await page.waitForTimeout(800); }
  }
  return fallback;
}

function attachConsole(page, bucket) {
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') bucket.push(`[${t}] ${m.text()}`.slice(0, 300));
  });
  page.on('pageerror', (e) => bucket.push(`[pageerror] ${String(e).slice(0, 300)}`));
  page.on('requestfailed', (r) => bucket.push(`[reqfail] ${r.url().slice(0, 120)} ${r.failure()?.errorText || ''}`));
}

// Inspect the primary header for the Products link and compare hover affordance.
async function inspectHeader(page) {
  return safeEval(page, () => {
    const out = { menus: 0, items: [], productsFound: false, productsVisible: false, productsBox: null };
    const menu = document.querySelector('nav [data-framer-name="menu"]') || document.querySelector('header nav');
    if (!menu) return out;
    out.menus = 1;
    const links = Array.from(menu.querySelectorAll('a[href]'));
    out.items = links.map((a) => {
      const r = a.getBoundingClientRect();
      const txt = (a.textContent || '').trim();
      return { text: txt, href: a.getAttribute('href'), w: Math.round(r.width), h: Math.round(r.height), isProducts: /products/i.test(txt) || /\/products/.test(a.getAttribute('href') || '') };
    });
    const p = links.find((a) => /\/products/.test(a.getAttribute('href') || '') || /^products$/i.test((a.textContent || '').trim()));
    if (p) {
      out.productsFound = true;
      const r = p.getBoundingClientRect();
      const cs = getComputedStyle(p);
      out.productsBox = { w: Math.round(r.width), h: Math.round(r.height), opacity: cs.opacity, color: cs.color, visibility: cs.visibility, text: (p.textContent || '').trim() };
      out.productsVisible = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0' && (p.textContent || '').trim().length > 0;
    }
    return out;
  }, { menus: 0, items: [], productsFound: false, productsVisible: false, productsBox: null });
}

async function inspectTestimonials(page) {
  return safeEval(page, () => {
    const sec = document.getElementById('testimonials');
    if (!sec) return { present: false };
    const r = sec.getBoundingClientRect();
    const quoteBoxes = sec.querySelectorAll('[data-framer-name="tdesign:quote-filled"]').length;
    const fixedQuotes = sec.querySelectorAll('[data-cognis-quote]').length;
    const track = !!sec.querySelector('.cgt-track');
    const heading = (sec.querySelector('h2')?.textContent || '').trim();
    const placeholderLogos = sec.querySelectorAll('[data-framer-name="logo"]').length;
    return { present: true, h: Math.round(r.height), quoteBoxes, fixedQuotes, marqueeTrack: track, heading, placeholderLogos };
  }, { present: false });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

for (const [name, path] of PAGES) {
  const page = await ctx.newPage();
  const logs = [];
  attachConsole(page, logs);
  const t0 = Date.now();
  let status = 0;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = resp?.status() || 0;
  } catch (e) { logs.push(`[goto-error] ${String(e).slice(0, 200)}`); }
  const tDom = Date.now() - t0;
  await page.waitForTimeout(3500); // let Framer hydrate + our scripts run
  const timing = await safeEval(page, () => {
    const n = performance.getEntriesByType('navigation')[0] || {};
    const res = performance.getEntriesByType('resource');
    const byType = {};
    let totalBytes = 0;
    for (const r of res) { const k = r.initiatorType; byType[k] = (byType[k] || 0) + 1; totalBytes += r.transferSize || 0; }
    return {
      domContentLoaded: Math.round(n.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(n.loadEventEnd || 0),
      resourceCount: res.length,
      transferKB: Math.round(totalBytes / 1024),
      byType,
    };
  });
  const header = await inspectHeader(page);
  const testimonials = name === 'home' ? await inspectTestimonials(page) : undefined;
  await page.screenshot({ path: `${OUT}/${name}-top.png` });
  // header crop
  try { await page.locator('header, nav').first().screenshot({ path: `${OUT}/${name}-header.png` }); } catch {}
  if (name === 'home') {
    await safeEval(page, () => document.getElementById('testimonials')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${name}-testimonials.png` });
    await safeEval(page, () => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${name}-header-after-scroll.png` });
  }
  report.pages[name] = { path, status, tDomMs: tDom, timing, header, testimonials, logs };
  await page.close();
}

// SPA nav flow: load home, click Products, click About, click Home — capture console + header each step.
{
  const page = await ctx.newPage();
  const logs = [];
  attachConsole(page, logs);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const steps = [
    ['click-products', 'a[href="/products"], a[href$="/products"], a[data-cognis-products]'],
    ['click-about', 'a[href="/about-us"], a[href$="/about-us"]'],
    ['click-home', 'a[href="/"], a[href$="cognis.group/"]'],
  ];
  for (const [label, sel] of steps) {
    const before = page.url();
    let clicked = false;
    try {
      const el = page.locator(sel).first();
      await el.click({ timeout: 5000 });
      clicked = true;
    } catch (e) { logs.push(`[nav ${label}] click failed: ${String(e).slice(0, 150)}`); }
    await page.waitForTimeout(2500);
    const header = await inspectHeader(page);
    await page.screenshot({ path: `${OUT}/nav-${label}.png` });
    report.nav.push({ label, clicked, before, after: page.url(), header, logsSoFar: logs.length });
  }
  report.nav.push({ label: 'console', logs });
  await page.close();
}

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
await browser.close();

// console summary
for (const [name, p] of Object.entries(report.pages)) {
  console.log(`\n=== ${name} (${p.status}) dom=${p.tDomMs}ms load=${p.timing.loadEvent}ms res=${p.timing.resourceCount} ${p.timing.transferKB}KB`);
  console.log(`   header: productsFound=${p.header.productsFound} visible=${p.header.productsVisible} box=${JSON.stringify(p.header.productsBox)}`);
  if (p.testimonials) console.log(`   testimonials: ${JSON.stringify(p.testimonials)}`);
  const errs = p.logs.filter((l) => l.startsWith('[error]') || l.startsWith('[pageerror]'));
  if (errs.length) console.log(`   ERRORS(${errs.length}): ` + errs.slice(0, 5).join(' | '));
}
console.log('\n=== SPA NAV ===');
for (const s of report.nav) {
  if (s.logs) { console.log(`nav console errors: ${s.logs.filter(l=>l.includes('error')).length}`); continue; }
  console.log(`${s.label}: clicked=${s.clicked} -> ${s.after}  productsVisible=${s.header.productsVisible}`);
}
console.log(`\nReport: ${OUT}/report.json`);
