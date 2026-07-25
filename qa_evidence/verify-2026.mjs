import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('qa_evidence/2026-07-25');
await fs.mkdir(out, { recursive: true });
const posts = [
  'ai-governance-is-not-optional',
  'ai-native-operations-for-african-enterprises',
  'building-ai-agents-that-actually-ship',
  'making-your-workforce-ai-ready',
  'the-real-roi-of-ai',
  'why-most-enterprise-ai-strategies-fail-before-they-start',
];
const report = { posts: {}, console: [], sanity: {}, hover: {} };
const browser = await chromium.launch({ headless: false, slowMo: 35 });

async function context(viewport = { width: 1440, height: 900 }) {
  const c = await browser.newContext({ viewport });
  return c;
}

function watch(page, label) {
  page.on('console', msg => {
    if (msg.type() === 'error') report.console.push({ page: label, type: 'console', text: msg.text() });
  });
  page.on('pageerror', err => report.console.push({ page: label, type: 'pageerror', text: err.message }));
}

async function visibleText(page) {
  return page.locator('body').innerText().catch(() => '');
}

for (const slug of posts) {
  report.posts[slug] = { coldRuns: [], boundary: {} };
  for (let run = 1; run <= 2; run++) {
    const c = await context();
    const page = await c.newPage();
    watch(page, `${slug}-cold-${run}`);
    const cdp = await c.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const nav = page.goto(`http://127.0.0.1:8099/blog/${slug}/`, { waitUntil: 'commit' });
    const frames = [];
    for (let ms = 0; ms <= 2000; ms += 100) {
      if (ms) await page.waitForTimeout(100);
      const file = `${slug}__cold-r${run}__${String(ms).padStart(4, '0')}ms.png`;
      await page.screenshot({ path: path.join(out, file) });
      frames.push(file);
    }
    await nav.catch(() => {});
    const text = await visibleText(page);
    report.posts[slug].coldRuns.push({
      run,
      title: await page.title(),
      bodyTextStart: text.slice(0, 500),
      frames,
    });
    await c.close();
  }

  const c = await context();
  const page = await c.newPage();
  watch(page, `${slug}-boundary`);
  await page.goto(`http://127.0.0.1:8099/blog/${slug}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const footer = document.querySelector('footer, .cgxf');
    const all = [...document.querySelectorAll('body *')];
    const byline = all.find(e => /(?:Written by|By\s+)[A-Z]|Founder\s*&\s*CEO/i.test((e.textContent || '').trim()) && (e.textContent || '').trim().length < 250);
    const related = all.find(e => /Related services/i.test((e.textContent || '').trim()) && (e.textContent || '').trim().length < 250);
    const article = document.querySelector('article, .cgx-article, [class*="article"]');
    const founder = all.filter(e => /Founder/i.test((e.textContent || '').trim()) && (e.textContent || '').trim().length < 350)
      .slice(0, 10).map(e => ({ tag: e.tagName, cls: e.className, text: (e.textContent || '').trim().slice(0, 300), top: e.getBoundingClientRect().top + scrollY }));
    const box = e => e ? ({ top: e.getBoundingClientRect().top + scrollY, bottom: e.getBoundingClientRect().bottom + scrollY, text: (e.textContent || '').trim().slice(0, 250), tag: e.tagName, cls: e.className }) : null;
    return { footer: box(footer), article: box(article), byline: box(byline), related: box(related), founder, height: document.documentElement.scrollHeight };
  });
  report.posts[slug].boundary = info;
  if (info.footer) {
    await page.evaluate(y => scrollTo(0, Math.max(0, y - innerHeight * .68)), info.footer.top);
    await page.waitForTimeout(350);
  } else {
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  }
  await page.screenshot({ path: path.join(out, `${slug}__article-footer-boundary.png`) });
  await c.close();
}

async function sanity(name, viewport) {
  const c = await context(viewport);
  const page = await c.newPage();
  watch(page, name);
  await page.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, `${name}__top.png`) });
  const headerBefore = await page.locator('header, nav').first().evaluate(e => {
    const s = getComputedStyle(e); const r = e.getBoundingClientRect();
    return { background: s.backgroundColor, position: s.position, top: r.top, text: (e.textContent || '').trim().slice(0, 100) };
  }).catch(() => null);
  await page.evaluate(() => scrollTo(0, Math.min(1400, document.documentElement.scrollHeight * .45)));
  await page.waitForTimeout(500);
  const headerAfter = await page.locator('header, nav').first().evaluate(e => {
    const s = getComputedStyle(e); const r = e.getBoundingClientRect();
    return { background: s.backgroundColor, position: s.position, top: r.top, text: (e.textContent || '').trim().slice(0, 100) };
  }).catch(() => null);
  await page.screenshot({ path: path.join(out, `${name}__scrolled.png`) });
  report.sanity[name] = { viewport, headerBefore, headerAfter, title: await page.title() };
  await c.close();
}
await sanity('landing-desktop-1440x900', { width: 1440, height: 900 });
await sanity('landing-mobile-390x844', { width: 390, height: 844 });

async function hoverEvidence(label, url, preferCard = true) {
  const c = await context();
  const page = await c.newPage();
  watch(page, label);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  const candidates = preferCard
    ? ['article a', '[class*="card"] a', 'a[href*="/blog/"]', 'a[href*="/insight"]']
    : ['a[role="button"]', 'button', 'a'];
  let target = null;
  for (const sel of candidates) {
    const loc = page.locator(sel).filter({ visible: true }).first();
    if (await loc.count() && await loc.isVisible().catch(() => false)) { target = loc; break; }
  }
  if (!target) throw new Error(`No hover target for ${label}`);
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const beforeStyle = await target.evaluate(e => {
    const s = getComputedStyle(e); const r = e.getBoundingClientRect();
    return { transform: s.transform, boxShadow: s.boxShadow, background: s.backgroundColor, color: s.color, rect: { x:r.x,y:r.y,w:r.width,h:r.height }, text:(e.textContent||'').trim().slice(0,120) };
  });
  await page.screenshot({ path: path.join(out, `${label}__before.png`) });
  await target.hover();
  await page.waitForTimeout(700);
  const afterStyle = await target.evaluate(e => {
    const s = getComputedStyle(e); const r = e.getBoundingClientRect();
    return { transform: s.transform, boxShadow: s.boxShadow, background: s.backgroundColor, color: s.color, rect: { x:r.x,y:r.y,w:r.width,h:r.height }, text:(e.textContent||'').trim().slice(0,120) };
  });
  await page.screenshot({ path: path.join(out, `${label}__after.png`) });
  report.hover[label] = { url, beforeStyle, afterStyle };
  await c.close();
}

await hoverEvidence('local-blog-card', 'http://127.0.0.1:8099/blog/', true);
await hoverEvidence('local-main-button', 'http://127.0.0.1:8099/', false);
await hoverEvidence('aeline-insight-card', 'https://aeline.webflow.io', true);
await hoverEvidence('aeline-main-button', 'https://aeline.webflow.io', false);

await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify({ out, posts: posts.length, consoleErrors: report.console.length }, null, 2));
