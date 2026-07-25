import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('qa_evidence/2026-07-25/fixed');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: false, slowMo: 60 });
const report = { console: [], headers: {}, cards: {}, buttons: {}, reducedMotion: {} };

function watch(page, label) {
  page.on('console', m => {
    if (m.type() === 'error') report.console.push({ label, type: 'console', text: m.text() });
  });
  page.on('pageerror', e => report.console.push({ label, type: 'pageerror', text: e.message }));
}
const visual = e => {
  const s = getComputedStyle(e), r = e.getBoundingClientRect();
  return {
    top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height,
    position: s.position, background: s.backgroundColor, transform: s.transform,
    shadow: s.boxShadow, opacity: s.opacity, outline: s.outline,
  };
};

for (const [name, viewport] of Object.entries({
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
})) {
  const c = await browser.newContext({ viewport });
  const p = await c.newPage(); watch(p, `header-${name}`);
  await p.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  const header = p.locator('.sc-host[data-sc-name="__pre__Cognis Home"] > div > [data-dc-tpl="7"]');
  const before = await header.evaluate(visual);
  await p.screenshot({ path: path.join(out, `header-${name}__top.png`) });
  const scroll = await p.evaluate(() => {
    const host = document.querySelector('.sc-host[data-sc-name="__pre__Cognis Home"]');
    const scroller = host?.parentElement;
    if (!scroller) return null;
    scroller.scrollTop = 1500;
    scroller.dispatchEvent(new Event('scroll'));
    return { top: scroller.scrollTop, height: scroller.scrollHeight, client: scroller.clientHeight };
  });
  await p.waitForTimeout(700);
  const after = await header.evaluate(visual);
  const className = await header.getAttribute('class');
  await p.screenshot({ path: path.join(out, `header-${name}__scrolled.png`) });
  report.headers[name] = { viewport, before, after, className, scroll };
  await c.close();
}

async function cardCheck(name, selector) {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage(); watch(p, name);
  await p.goto('http://127.0.0.1:8099/blog/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const card = p.locator(selector).first();
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(350);
  await p.mouse.move(0, 0); await p.waitForTimeout(350);
  const img = card.locator('img').first();
  const before = { card: await card.evaluate(visual), image: await img.evaluate(visual) };
  await card.screenshot({ path: path.join(out, `${name}__before.png`) });
  await card.hover(); await p.waitForTimeout(550);
  const hovered = { card: await card.evaluate(visual), image: await img.evaluate(visual) };
  await card.screenshot({ path: path.join(out, `${name}__hover.png`) });
  await p.mouse.move(0, 0); await card.focus(); await p.waitForTimeout(350);
  const focused = { card: await card.evaluate(visual), image: await img.evaluate(visual) };
  await card.screenshot({ path: path.join(out, `${name}__focus.png`) });
  report.cards[name] = { before, hovered, focused };
  await c.close();
}
await cardCheck('featured-card', '.sc-host[data-sc-name="__pre__Cognis Blog"] a[data-dc-tpl="43"]');
await cardCheck('recent-card', '.sc-host[data-sc-name="__pre__Cognis Blog"] a[data-dc-tpl="65"]');

{
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage(); watch(p, 'button');
  await p.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
  const button = p.getByRole('link', { name: /work with us/i }).first();
  const before = await button.evaluate(visual);
  await button.screenshot({ path: path.join(out, 'main-button__before.png') });
  await button.hover(); await p.waitForTimeout(450);
  const after = await button.evaluate(visual);
  await button.screenshot({ path: path.join(out, 'main-button__hover.png') });
  report.buttons.main = { before, after };
  await c.close();
}

{
  const c = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const p = await c.newPage(); watch(p, 'reduced-motion');
  await p.goto('http://127.0.0.1:8099/blog/', { waitUntil: 'networkidle' });
  const card = p.locator('.sc-host[data-sc-name="__pre__Cognis Blog"] a[data-dc-tpl="65"]').first();
  await card.hover(); await p.waitForTimeout(100);
  report.reducedMotion.card = {
    card: await card.evaluate(visual),
    image: await card.locator('img').first().evaluate(visual),
  };
  await card.screenshot({ path: path.join(out, 'recent-card__reduced-motion-hover.png') });
  await c.close();
}

await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify(report, null, 2));
