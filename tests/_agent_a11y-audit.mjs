// a11y audit: axe-core scan + custom keyboard/focus/heading/alt/contrast/aria/motion checks
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const axeSource = readFileSync(axePath, 'utf8');

const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/ux-a11y';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { id: 'home', url: '/' },
  { id: 'products', url: '/products/' },
  { id: 'why-cognis', url: '/why-cognis/' },
  { id: 'about', url: '/about-us/' },
  { id: 'service-strategy', url: '/our-services/ai-strategy-advisory/' },
  { id: 'contact', url: '/contact/' },
];

const browser = await chromium.launch({ executablePath: 'C:\\Users\\supre\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe' });
const results = {};

for (const p of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const rec = { url: p.url, axe: null, custom: {}, errors: [] };
  try {
    await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => rec.errors.push('goto:' + String(e).slice(0,120)));
    await page.waitForTimeout(2500);

    // axe-core
    await page.evaluate(axeSource);
    const axeRes = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const r = await axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'] } });
      return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length,
        sample: v.nodes.slice(0,3).map(n => ({ target: n.target, html: (n.html||'').slice(0,160) })) }));
    });
    rec.axe = axeRes;

    // custom: headings hierarchy
    rec.custom.headings = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({ tag: h.tagName, text: (h.textContent||'').trim().slice(0,60) }));
      const h1count = hs.filter(h => h.tag === 'H1').length;
      // detect skips
      const skips = [];
      let prev = 0;
      for (const h of hs) { const lvl = +h.tag[1]; if (prev && lvl > prev + 1) skips.push(`${prev}->${lvl} (${h.text})`); prev = lvl; }
      return { h1count, total: hs.length, list: hs.slice(0,40), skips };
    });

    // custom: images alt
    rec.custom.images = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      const missing = imgs.filter(i => !i.hasAttribute('alt')).length;
      const emptyAlt = imgs.filter(i => i.getAttribute('alt') === '').length;
      const bgImgs = [...document.querySelectorAll('[style*="background-image"]')].length;
      return { total: imgs.length, missingAltAttr: missing, emptyAlt, withAlt: imgs.filter(i => (i.getAttribute('alt')||'').trim()).length, bgImageEls: bgImgs };
    });

    // custom: skip link presence
    rec.custom.skipLink = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="#"]')].find(x => /skip/i.test(x.textContent||''));
      return { hasSkipLink: !!a, text: a ? a.textContent.trim() : null };
    });

    // custom: forms / labels
    rec.custom.forms = await page.evaluate(() => {
      const fields = [...document.querySelectorAll('input,textarea,select')].filter(f => !['hidden','submit','button'].includes(f.type));
      const unlabeled = fields.filter(f => {
        const id = f.id;
        const hasFor = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
        const wrapped = f.closest('label');
        const aria = f.getAttribute('aria-label') || f.getAttribute('aria-labelledby');
        return !hasFor && !wrapped && !aria;
      }).map(f => ({ name: f.name, type: f.type, placeholder: f.placeholder }));
      return { fieldCount: fields.length, unlabeled };
    });

    // custom: nav landmarks / aria
    rec.custom.landmarks = await page.evaluate(() => ({
      nav: document.querySelectorAll('nav').length,
      main: document.querySelectorAll('main').length,
      header: document.querySelectorAll('header').length,
      footer: document.querySelectorAll('footer').length,
      roleNav: document.querySelectorAll('[role="navigation"]').length,
      lang: document.documentElement.getAttribute('lang') || null,
    }));

    // custom: carousel/testimonial detection
    rec.custom.carousels = await page.evaluate(() => {
      const cands = [...document.querySelectorAll('[class*="carousel" i],[class*="slider" i],[class*="testimonial" i],[class*="swiper" i],[aria-roledescription="carousel"]')];
      return cands.slice(0,6).map(c => ({
        cls: (c.className||'').toString().slice(0,80),
        role: c.getAttribute('role'),
        ariaLive: c.getAttribute('aria-live'),
        ariaRoledesc: c.getAttribute('aria-roledescription'),
      }));
    });

    // custom: focus visibility — tab through first 25 focusables, capture outline
    rec.custom.focus = await page.evaluate(async () => {
      const out = [];
      // find focusables
      const sel = 'a[href],button,input,textarea,select,[tabindex]:not([tabindex="-1"])';
      const els = [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null).slice(0, 30);
      let noVisible = 0;
      for (const el of els) {
        el.focus();
        const cs = getComputedStyle(el);
        const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
        const hasBoxShadow = cs.boxShadow && cs.boxShadow !== 'none';
        if (!hasOutline && !hasBoxShadow) noVisible++;
      }
      return { focusableSampled: els.length, withoutVisibleIndicator: noVisible };
    });

    await page.screenshot({ path: `${OUT}/a11y-${p.id}.png`, fullPage: false });
  } catch (e) {
    rec.errors.push(String(e).slice(0, 200));
  }
  results[p.id] = rec;
  await ctx.close();
}

// reduced-motion test on testimonials (about page) — does carousel keep moving?
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/about-us/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
  await page.waitForTimeout(2000);
  // find a testimonial-ish moving element, sample its transform over time
  const motion = await page.evaluate(async () => {
    const c = [...document.querySelectorAll('[class*="testimonial" i],[class*="slider" i],[class*="carousel" i]')];
    const target = c.map(e => e.querySelector('*') || e).find(Boolean);
    if (!target) return { found: false };
    const samples = [];
    for (let i = 0; i < 6; i++) {
      samples.push(getComputedStyle(target).transform);
      await new Promise(r => setTimeout(r, 400));
    }
    const moving = new Set(samples).size > 1;
    return { found: true, moving, samples: samples.slice(0,6) };
  });
  results.__reducedMotion = motion;
  await ctx.close();
}

writeFileSync(`${OUT}/a11y-report.json`, JSON.stringify(results, null, 2));
// compact summary
const summary = {};
for (const [k, v] of Object.entries(results)) {
  if (k.startsWith('__')) { summary[k] = v; continue; }
  summary[k] = {
    axeViolations: (v.axe||[]).map(a => `${a.id}[${a.impact}]x${a.n}`),
    h1count: v.custom.headings?.h1count, headingSkips: v.custom.headings?.skips,
    imgMissingAlt: v.custom.images?.missingAltAttr, imgEmptyAlt: v.custom.images?.emptyAlt, imgTotal: v.custom.images?.total,
    skipLink: v.custom.skipLink?.hasSkipLink, landmarks: v.custom.landmarks,
    unlabeledFields: v.custom.forms?.unlabeled, carousels: v.custom.carousels,
    focusNoIndicator: v.custom.focus, errors: v.errors,
  };
}
console.log(JSON.stringify(summary, null, 2));
await browser.close();
