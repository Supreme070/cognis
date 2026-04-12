import { chromium } from 'playwright';
const b = await chromium.launch();
for (const w of [1440, 768, 375]) {
  const p = await b.newContext({ viewport: { width: w, height: 900 } }).then(c => c.newPage());
  await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(4500);
  const r = await p.evaluate(() => {
    const h1 = document.querySelector('h1');
    const txt = h1?.innerText?.replace(/\s+/g,' ').trim();
    // Find the Quod element
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let n, quodEl = null;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.includes('Quod')) { quodEl = n.parentElement; break; }
    }
    let cs = null, parentCs = null, h1Cs = null;
    if (quodEl) {
      // climb to the block-level span wrapper if we're at the word-level
      let el = quodEl;
      while (el && getComputedStyle(el).display !== 'block' && el.tagName !== 'H1') el = el.parentElement;
      cs = {
        display: getComputedStyle(el).display,
        fontSize: getComputedStyle(el).fontSize,
        fontWeight: getComputedStyle(el).fontWeight,
        letterSpacing: getComputedStyle(el).letterSpacing,
        opacity: getComputedStyle(el).opacity,
      };
      h1Cs = { fontSize: getComputedStyle(h1).fontSize, fontFamily: getComputedStyle(h1).fontFamily };
    }
    return { h1text: txt, quodFound: !!quodEl, signatureStyle: cs, h1Style: h1Cs };
  });
  console.log(w, JSON.stringify(r, null, 2));
  await p.screenshot({ path: `playwright-screenshots/hero-sig-${w}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(900, 1100) } });
  await p.close();
}
await b.close();
