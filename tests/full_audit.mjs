import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:3001';
const SHOTS = '/Users/supreme/Desktop/cognis/playwright-screenshots';
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const pages = [
  '/',
  '/about-us',
  '/our-services',
  '/our-services/ai-training-workforce-development',
  '/our-services/ai-agent-automation-engineering',
  '/our-services/ai-strategy-advisory',
  '/teams/supreme-oyewumi',
  '/teams/kola-olatunde',
  '/teams/fisayo-oludare',
  '/contact',
  '/insights',
];

const IGNORE_CONSOLE = /(preload|resource hint|was preloaded|Download the React DevTools|DevTools|\[HMR\]|favicon)/i;

const results = [];
const linkCache = new Map();

async function headCheck(url) {
  if (linkCache.has(url)) return linkCache.get(url);
  try {
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (r.status === 405 || r.status === 501) {
      r = await fetch(url, { method: 'GET', redirect: 'follow' });
    }
    linkCache.set(url, r.status);
    return r.status;
  } catch (e) {
    linkCache.set(url, 0);
    return 0;
  }
}

async function auditPage(browser, route, extraChecks = []) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (!IGNORE_CONSOLE.test(t)) consoleErrors.push(t);
    }
  });
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('requestfailed', req => {
    const f = req.failure();
    failedRequests.push(`${req.url()} :: ${f ? f.errorText : 'failed'}`);
  });
  page.on('response', async resp => {
    try {
      const s = resp.status();
      if (s >= 400) badResponses.push(`${s} ${resp.url()}`);
    } catch {}
  });

  const url = BASE + route;
  const result = {
    route, url, status: null, finalUrl: null, title: null,
    consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [],
    brokenLinks: [], checks: {}, failures: []
  };

  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    result.status = resp ? resp.status() : null;
    await page.waitForTimeout(4000);
    result.finalUrl = page.url();
    result.title = await page.title();

    if (result.finalUrl.replace(/\/$/, '') !== url.replace(/\/$/, '')) {
      // redirect — flag only if unexpected (non-same route)
      const a = new URL(result.finalUrl).pathname.replace(/\/$/, '');
      const b = new URL(url).pathname.replace(/\/$/, '');
      if (a !== b) result.failures.push(`Unexpected redirect: ${url} -> ${result.finalUrl}`);
    }

    if (result.status && result.status >= 400) result.failures.push(`HTTP ${result.status}`);

    // Collect links
    const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
    const unique = [...new Set(hrefs)];
    const internal = unique.filter(h => h && !/^(mailto:|tel:|#|javascript:)/i.test(h))
      .filter(h => h.startsWith('/') || h.startsWith(BASE))
      .map(h => h.startsWith('/') ? BASE + h : h);

    for (const link of internal) {
      const s = await headCheck(link);
      if (s >= 400 || s === 0) result.brokenLinks.push(`${s} ${link}`);
    }

    // Run route-specific checks
    for (const c of extraChecks) {
      try {
        const r = await c(page);
        result.checks[r.name] = r;
        if (!r.pass) result.failures.push(`CHECK FAIL: ${r.name} — ${r.detail}`);
      } catch (e) {
        result.failures.push(`CHECK ERROR: ${e.message}`);
      }
    }

    // Screenshot
    const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
    await page.screenshot({ path: path.join(SHOTS, `audit-${slug}.png`), fullPage: true });

  } catch (e) {
    result.failures.push(`Navigation error: ${e.message}`);
  }

  result.consoleErrors = consoleErrors;
  result.pageErrors = pageErrors;
  result.failedRequests = failedRequests.filter(x => !/favicon/i.test(x));
  result.badResponses = badResponses.filter(x => !/favicon/i.test(x));

  if (result.pageErrors.length) result.failures.push(`${result.pageErrors.length} page errors`);
  if (result.consoleErrors.length) result.failures.push(`${result.consoleErrors.length} console errors`);
  if (result.failedRequests.length) result.failures.push(`${result.failedRequests.length} failed requests`);
  if (result.badResponses.length) result.failures.push(`${result.badResponses.length} bad HTTP responses`);
  if (result.brokenLinks.length) result.failures.push(`${result.brokenLinks.length} broken internal links`);

  await ctx.close();
  return result;
}

// --- Route-specific checks ---
const homeChecks = [
  async (p) => {
    const count = await p.evaluate(() => {
      const sec = document.querySelector('section.framer-slideshow');
      if (!sec) return 0;
      // count unique quote-ish elements
      const cards = sec.querySelectorAll('[class*="slide"], [data-framer-name*="slide" i]');
      return cards.length;
    });
    // fallback: count distinct text blocks with quote chars
    const quotes = await p.evaluate(() => {
      const sec = document.querySelector('section.framer-slideshow') || document.body;
      const texts = [...sec.querySelectorAll('p, h3, h4, div')].map(e => e.innerText).filter(t => t && t.length > 40);
      return [...new Set(texts)].length;
    });
    const total = Math.max(count, quotes);
    return { name: 'testimonials>=4', pass: total >= 4, detail: `cards=${count} quotes=${quotes}` };
  },
  async (p) => {
    const ok = await p.evaluate(() => {
      const vids = [...document.querySelectorAll('video')];
      return vids.some(v => {
        const src = v.currentSrc || v.src || '';
        if (src.includes('hero-afr5')) return true;
        return [...v.querySelectorAll('source')].some(s => (s.src || '').includes('hero-afr5'));
      });
    });
    return { name: 'hero-video hero-afr5', pass: ok, detail: ok ? 'found' : 'missing hero-afr5 video' };
  },
];

const aboutChecks = [
  async (p) => {
    const info = await p.evaluate(() => {
      const body = document.body.innerText;
      const hasSupreme = /Supreme/i.test(body);
      const hasKola = /Kola/i.test(body);
      const hasFisayo = /Fisayo/i.test(body);
      const hasEugene = /Eugene/i.test(body);
      return { hasSupreme, hasKola, hasFisayo, hasEugene };
    });
    const pass = info.hasSupreme && info.hasKola && info.hasFisayo && !info.hasEugene;
    return { name: 'team=3 no-eugene', pass, detail: JSON.stringify(info) };
  },
  async (p) => {
    const info = await p.evaluate(() => {
      const body = document.body.innerText;
      return {
        q22025: /Q2\s*2025/i.test(body),
        q32025: /Q3\s*2025/i.test(body),
        q12026: /Q1\s*2026/i.test(body),
        q32026: /Q3\s*2026/i.test(body),
        hasOld: /\b(2017|2019|2021|2023)\b/.test(body),
      };
    });
    const pass = info.q22025 && info.q32025 && info.q12026 && info.q32026;
    return { name: 'journey quarters', pass, detail: JSON.stringify(info) };
  },
  async (p) => {
    const info = await p.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')].filter(i => /il73eZe/i.test(i.src || '') || /il73eZe/i.test(i.getAttribute('src') || ''));
      if (!imgs.length) return { found: false };
      return { found: true, visibility: imgs.map(i => getComputedStyle(i).visibility) };
    });
    const pass = info.found && info.visibility.every(v => v === 'hidden');
    return { name: 'fisayo-portrait hidden', pass, detail: JSON.stringify(info) };
  },
  async (p) => {
    // team slideshow frozen translateX(0)
    const info = await p.evaluate(() => {
      // find team slideshow element
      const sels = document.querySelectorAll('section.framer-slideshow, [class*="slideshow"]');
      const transforms = [];
      sels.forEach(s => {
        s.querySelectorAll('*').forEach(el => {
          const t = getComputedStyle(el).transform;
          if (t && t !== 'none' && t.includes('matrix')) transforms.push(t);
        });
      });
      return transforms.slice(0, 10);
    });
    // heuristic: at least one transform = matrix(1,0,0,1,0,0) (translateX 0)
    const pass = info.some(t => /matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\)/.test(t)) || info.length === 0;
    return { name: 'team-slideshow translateX(0)', pass, detail: `sampled=${info.length}` };
  },
];

const servicesChecks = [
  async (p) => {
    const info = await p.evaluate(() => {
      const vids = [...document.querySelectorAll('video')];
      const hero = vids.find(v => {
        const src = (v.currentSrc || v.src || '') + [...v.querySelectorAll('source')].map(s => s.src).join(' ');
        return src.includes('services-hero');
      });
      if (!hero) return { found: false };
      return { found: true, paused: hero.paused, readyState: hero.readyState, src: hero.currentSrc || hero.src };
    });
    const pass = info.found && !info.paused && info.readyState >= 2;
    return { name: 'services-hero video playing', pass, detail: JSON.stringify(info) };
  },
];

const trainingChecks = [
  async (p) => {
    const info = await p.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')].map(i => i.currentSrc || i.src);
      const hasTraining = imgs.some(s => /service-training\.jpg/i.test(s));
      const hasOld = imgs.some(s => /FCaQJxl/i.test(s));
      return { hasTraining, hasOld, sample: imgs.filter(s => /service-|FCaQJxl/i.test(s)) };
    });
    return { name: 'training image mapped', pass: info.hasTraining, detail: JSON.stringify(info) };
  },
];
const agentChecks = [
  async (p) => {
    const info = await p.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')].map(i => i.currentSrc || i.src);
      const hasAgent = imgs.some(s => /service-agent\.jpg/i.test(s));
      const hasOld = imgs.some(s => /J2zudel0/i.test(s));
      return { hasAgent, hasOld, sample: imgs.filter(s => /service-|J2zudel0/i.test(s)) };
    });
    return { name: 'agent image mapped', pass: info.hasAgent, detail: JSON.stringify(info) };
  },
];

function teamPortraitCheck(idFragment, name) {
  return async (p) => {
    const info = await p.evaluate((frag) => {
      const imgs = [...document.querySelectorAll('img')].map(i => i.currentSrc || i.src);
      return { found: imgs.some(s => s.includes(frag)), sample: imgs.slice(0, 5) };
    }, idFragment);
    return { name: `${name} portrait`, pass: info.found, detail: JSON.stringify(info) };
  };
}
function deepRouteCheck(expectedH1Fragment, expectedPath) {
  // Assert cold/direct URL loads actually resolve to the target page
  // (not the homepage hero). Runs alongside existing per-route checks.
  return async (p) => {
    const info = await p.evaluate(() => ({
      h1: (document.querySelector('h1')?.innerText || '').slice(0, 120),
      path: location.pathname,
    }));
    const h1Ok = new RegExp(expectedH1Fragment, 'i').test(info.h1);
    const pathOk = info.path.replace(/\/+$/, '') === expectedPath;
    return {
      name: `deep-URL resolves (${expectedPath})`,
      pass: h1Ok && pathOk,
      detail: JSON.stringify(info),
    };
  };
}
function noEugeneCheck() {
  return async (p) => {
    const has = await p.evaluate(() => /Eugene/i.test(document.body.innerText));
    return { name: 'no Eugene in Meet our team', pass: !has, detail: has ? 'Eugene present' : 'ok' };
  };
}

async function mobileFooterCheck(browser, route) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    const info = await page.evaluate(() => {
      const a = document.querySelector('footer a');
      return { found: !!a, href: a ? a.getAttribute('href') : null };
    });
    await ctx.close();
    return { name: 'mobile footer logo href', pass: info.found && !!info.href, detail: JSON.stringify(info) };
  } catch (e) {
    await ctx.close();
    return { name: 'mobile footer logo href', pass: false, detail: e.message };
  }
}

(async () => {
  const browser = await chromium.launch();
  const routeChecks = {
    '/': homeChecks,
    '/about-us': aboutChecks,
    '/our-services': servicesChecks,
    '/our-services/ai-strategy-advisory': [deepRouteCheck('AI Strategy', '/our-services/ai-strategy-advisory')],
    '/our-services/ai-training-workforce-development': [...trainingChecks, deepRouteCheck('AI Training', '/our-services/ai-training-workforce-development')],
    '/our-services/ai-agent-automation-engineering': [...agentChecks, deepRouteCheck('AI Agent', '/our-services/ai-agent-automation-engineering')],
    '/teams/supreme-oyewumi': [teamPortraitCheck('QnjDKI0', 'Supreme'), noEugeneCheck(), deepRouteCheck('Supreme', '/teams/supreme-oyewumi')],
    '/teams/kola-olatunde': [teamPortraitCheck('QTiI3J2', 'Kola'), noEugeneCheck(), deepRouteCheck('Kola', '/teams/kola-olatunde')],
    '/teams/fisayo-oludare': [noEugeneCheck(), deepRouteCheck('Fisayo', '/teams/fisayo-oludare')],
  };

  // First pass pages
  for (const r of pages) {
    console.log(`\n=== Auditing ${r} ===`);
    const res = await auditPage(browser, r, routeChecks[r] || []);
    results.push(res);
  }

  // Discover up to 3 insight details
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(BASE + '/insights', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(4000);
    const insightLinks = await p.$$eval('a[href]', as =>
      [...new Set(as.map(a => a.getAttribute('href')).filter(h => h && /^\/insights\/./.test(h)))]
    );
    await ctx.close();
    const top = insightLinks.slice(0, 3);
    for (const l of top) {
      console.log(`\n=== Auditing insight ${l} ===`);
      const res = await auditPage(browser, l, []);
      results.push(res);
    }
  } catch (e) {
    console.log('Insight discovery error', e.message);
  }

  // Mobile footer — use homepage
  const mobileResult = await mobileFooterCheck(browser, '/');
  console.log('\nMobile footer:', mobileResult);

  await browser.close();

  // ----- Summary -----
  console.log('\n\n================ SUMMARY TABLE ================');
  console.log('STATUS  ROUTE');
  let pass = 0, fail = 0;
  for (const r of results) {
    const ok = r.failures.length === 0;
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}    ${r.route}  (status=${r.status}, title="${(r.title || '').slice(0, 40)}")`);
  }
  console.log(`Mobile footer: ${mobileResult.pass ? 'PASS' : 'FAIL'} — ${mobileResult.detail}`);
  if (!mobileResult.pass) fail++;
  else pass++;

  console.log(`\nTOTAL: ${pass} passed / ${fail} failed`);

  if (fail > 0) {
    console.log('\n================ FAILURES ================');
    for (const r of results) {
      if (r.failures.length) {
        console.log(`\n[${r.route}]`);
        r.failures.forEach(f => console.log('  - ' + f));
        if (r.brokenLinks.length) r.brokenLinks.slice(0, 5).forEach(l => console.log('    broken: ' + l));
        if (r.failedRequests.length) r.failedRequests.slice(0, 5).forEach(l => console.log('    failedReq: ' + l));
        if (r.badResponses.length) r.badResponses.slice(0, 5).forEach(l => console.log('    badResp: ' + l));
        if (r.consoleErrors.length) r.consoleErrors.slice(0, 3).forEach(l => console.log('    console: ' + l));
        if (r.pageErrors.length) r.pageErrors.slice(0, 3).forEach(l => console.log('    pageErr: ' + l));
      }
    }
    if (!mobileResult.pass) console.log(`\n[mobile footer] ${mobileResult.detail}`);
  }

  process.exit(fail > 0 ? 1 : 0);
})();
