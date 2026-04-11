import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:8765/aeline_framer_website.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);

// Find top-level sections and their positions
const sections = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('main > *, main section, #main > section, body > div section'))
    .slice(0, 20)
    .map(s => {
      const r = s.getBoundingClientRect();
      return {
        tag: s.tagName,
        name: s.getAttribute('data-framer-name'),
        cls: s.className?.slice ? (s.className.slice(0, 40)) : '',
        top: Math.round(r.top + window.scrollY),
        h: Math.round(r.height),
        w: Math.round(r.width),
        opacity: window.getComputedStyle(s).opacity,
        display: window.getComputedStyle(s).display,
        visibility: window.getComputedStyle(s).visibility,
        textLen: (s.innerText || '').length,
      };
    });
});
console.log(JSON.stringify(sections, null, 2));

// Try screenshotting the hero only
await page.screenshot({ path: 'playwright-screenshots/viewport-top.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(500);
await page.screenshot({ path: 'playwright-screenshots/viewport-1200.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await page.evaluate(() => window.scrollTo(0, 2400));
await page.waitForTimeout(500);
await page.screenshot({ path: 'playwright-screenshots/viewport-2400.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
await browser.close();
