import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'load' });

// Sample video state + screenshot at many timestamps.
// A flicker would show as a visibility/opacity change in the probe.
const samples = [];
for (let i = 0; i < 20; i++) {
  await p.waitForTimeout(300);
  const s = await p.evaluate(() => {
    const v = document.querySelector('video[data-cognis-hero-portal]');
    if (!v) return { videoPresent: false };
    const cs = getComputedStyle(v);
    const r = v.getBoundingClientRect();
    return {
      videoPresent: true,
      currentTime: +v.currentTime.toFixed(2),
      paused: v.paused,
      opacity: cs.opacity,
      visibility: cs.visibility,
      top: Math.round(r.top),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  });
  samples.push(s);
}

// Simulate scroll: scroll down 500px, check video follows
await p.evaluate(() => window.scrollTo(0, 500));
await p.waitForTimeout(400);
const scrolled = await p.evaluate(() => {
  const v = document.querySelector('video[data-cognis-hero-portal]');
  const img = document.querySelector('img[src*="Yz08gMSk8HCg9OI0jQXkoDm7t7Y"]');
  const vr = v?.getBoundingClientRect?.();
  const ir = img?.getBoundingClientRect?.();
  return {
    video: vr ? { top: Math.round(vr.top), height: Math.round(vr.height) } : null,
    img: ir ? { top: Math.round(ir.top), height: Math.round(ir.height) } : null,
  };
});
await p.screenshot({ path: 'playwright-screenshots/scrolled-500.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

// Back to top
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);
await p.screenshot({ path: 'playwright-screenshots/after-return.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

console.log('samples:', JSON.stringify(samples, null, 2));
console.log('\nafter scroll:', JSON.stringify(scrolled, null, 2));

// Flicker detection: any opacity/visibility change between samples?
const ops = new Set(samples.map(s => s.opacity + '/' + s.visibility));
console.log('\nunique opacity/visibility states:', [...ops]);
console.log('FLICKER:', ops.size > 1 ? 'YES' : 'NO');

await b.close();
