import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => {
  console.log('--- PAGEERR ---');
  console.log(String(e));
  if (e.stack) console.log('STACK:', e.stack);
});
await page.goto('http://localhost:8765/aeline_framer_website.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
await browser.close();
