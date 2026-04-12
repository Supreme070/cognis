import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

p.on('console', m => {
  if (m.type() === 'error') console.log('[err]', m.text().slice(0, 120));
});

const start = Date.now();
await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'domcontentloaded' });

const timeline = [100, 300, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000, 10000, 14000];
for (const t of timeline) {
  const elapsed = Date.now() - start;
  if (elapsed < t) await p.waitForTimeout(t - elapsed);
  await p.screenshot({
    path: `playwright-screenshots/timeline-${String(t).padStart(5, '0')}.png`,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
}
console.log('captured', timeline.length, 'timeline shots');
await b.close();
