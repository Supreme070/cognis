import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
await p.goto('http://127.0.0.1:3001/index.html', { waitUntil: 'load' });
await p.waitForTimeout(2500);

const r = await p.evaluate(() => {
  const q = sel => {
    const el = document.querySelector(sel);
    if (!el) return { sel, found: false };
    const cs = getComputedStyle(el);
    // find matching CSS rules
    const matched = [];
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || [];
        for (const rule of rules) {
          if (rule.style && rule.selectorText && el.matches?.(rule.selectorText)) {
            const bg = rule.style.getPropertyValue('background') || rule.style.getPropertyValue('background-color');
            if (bg) matched.push({ selector: rule.selectorText, bg, priority: rule.style.getPropertyPriority('background-color') });
          }
        }
      } catch(e) {}
    }
    return {
      sel,
      found: true,
      bg: cs.backgroundColor,
      inlineBg: el.style.backgroundColor,
      className: (el.className || '').toString(),
      matchedRules: matched.slice(0, 10)
    };
  };
  return {
    hero: q('section[data-framer-name="hero"]'),
    main: q('main.framer-f906oe'),
    wrapper: q('.framer-ssAsq.framer-m5w6qg'),
  };
});
console.log(JSON.stringify(r, null, 2));
await b.close();
