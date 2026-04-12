import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

p.on('console', m => {
  if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 120));
});

await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'load' });

const probe = async () => p.evaluate(() => {
  const videos = document.querySelectorAll('video[data-cognis-hero-portal], video[data-cognis-hero]');
  const vInfo = Array.from(videos).map(v => {
    const r = v.getBoundingClientRect();
    const cs = getComputedStyle(v);
    return {
      inDOM: document.contains(v),
      visibility: cs.visibility,
      display: cs.display,
      opacity: cs.opacity,
      zIndex: cs.zIndex,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      paused: v.paused,
      readyState: v.readyState,
      currentTime: v.currentTime.toFixed(2),
      parentClass: v.parentElement?.className || 'none',
      parentAttrs: v.parentElement?.getAttribute('data-framer-background-image-wrapper') || 'none',
    };
  });
  const skyImgs = document.querySelectorAll('img[src*="Yz08gMSk8HCg9OI0jQXkoDm7t7Y"], img[srcset*="Yz08gMSk8HCg9OI0jQXkoDm7t7Y"]');
  const imgInfo = Array.from(skyImgs).map(img => {
    const r = img.getBoundingClientRect();
    const cs = getComputedStyle(img);
    return {
      inDOM: document.contains(img),
      visibility: cs.visibility,
      display: cs.display,
      opacity: cs.opacity,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  });
  return { videoCount: vInfo.length, videos: vInfo, imgCount: imgInfo.length, imgs: imgInfo };
});

for (const t of [500, 1500, 3000, 5000, 8000, 12000, 16000]) {
  await p.waitForTimeout(t - (t > 500 ? (t - 500) - 500 : 0));
  // simpler: just wait absolute milestones
}

// Redo properly: sample at absolute timestamps after navigation
await p.waitForTimeout(500);
console.log('[t=0.5s]', JSON.stringify(await probe(), null, 2));
await p.waitForTimeout(1500);
console.log('[t=2s]', JSON.stringify(await probe(), null, 2));
await p.waitForTimeout(2000);
console.log('[t=4s]', JSON.stringify(await probe(), null, 2));
await p.waitForTimeout(3000);
console.log('[t=7s]', JSON.stringify(await probe(), null, 2));
await p.waitForTimeout(4000);
console.log('[t=11s]', JSON.stringify(await probe(), null, 2));

await b.close();
