import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:8765/aeline_framer_website.html', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(3500);
// Scroll through and capture at each y position
const positions = [0, 900, 1800, 2700, 3600, 4500, 5400, 6300];
for (const y of positions) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `playwright-screenshots/scroll-${y}.png`, fullPage: false });
}
await browser.close();
