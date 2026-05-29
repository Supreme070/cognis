import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://127.0.0.1:3997';
const OUT = 'test-results/verify';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// 1. Header Products + hover on a Framer page
{
  const page = await ctx.newPage();
  await page.goto(BASE + '/our-services/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const prod = page.locator('a[data-cognis-products]').first();
  await prod.scrollIntoViewIfNeeded().catch(() => {});
  // crop the nav menu
  const menu = page.locator('nav [data-framer-name="menu"]').first();
  await menu.screenshot({ path: `${OUT}/menu-rest.png` }).catch(() => {});
  await prod.hover().catch(() => {});
  await page.waitForTimeout(500);
  await menu.screenshot({ path: `${OUT}/menu-hover.png` }).catch(() => {});
  const txt = await prod.evaluate((a) => ({
    visibleText: a.innerText.trim(),
    rect: (() => { const r = a.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
    color: getComputedStyle(a).color,
  }));
  console.log('our-services Products link:', JSON.stringify(txt));
  await page.close();
}

// 2. Quote box fixed on a service detail page
{
  const page = await ctx.newPage();
  await page.goto(BASE + '/our-services/ai-agent-automation-engineering/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const q = await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('[data-framer-name="tdesign:quote-filled"]'));
    return { total: boxes.length, fixed: boxes.filter((b) => b.getAttribute('data-cognis-quote') !== null).length, hasSvg: boxes.filter((b) => b.querySelector('svg')).length };
  });
  console.log('service-detail quote boxes:', JSON.stringify(q));
  // scroll the quote into view + screenshot
  await page.evaluate(() => { const b = document.querySelector('[data-framer-name="tdesign:quote-filled"]'); b?.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/service-quote.png` });
  await page.close();
}
await browser.close();
console.log('done');
