import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(5000);
await p.screenshot({ path: 'playwright-screenshots/hero-viewport.png' });
await b.close();
console.log('saved playwright-screenshots/hero-viewport.png');
