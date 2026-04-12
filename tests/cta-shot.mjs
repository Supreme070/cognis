import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }).then(c => c.newPage());
await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'load' });
await p.waitForTimeout(4000);

// Highlight the CTAs so we can see where they are
await p.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a')).filter(a => {
    const t = a.textContent.toLowerCase();
    return t.includes('book a consultation') || t.includes('talk to us');
  });
  links.forEach(a => {
    a.style.outline = '4px solid magenta';
    a.style.outlineOffset = '2px';
  });
});

await p.screenshot({ path: 'playwright-screenshots/cta-highlight.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
console.log('saved cta-highlight.png');
await b.close();
