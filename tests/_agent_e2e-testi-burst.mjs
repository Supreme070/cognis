import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/e2e-scatter-repro';
const url = process.argv[2] || '/our-services/ai-strategy-advisory/';
const tag = process.argv[3] || 'svc';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(7000); // let SPA fully settle so it stops resetting scroll
const ev = async (fn, a) => { try { return await p.evaluate(fn, a); } catch (e) { return null; } };
const ey = await ev(() => { let y = null; document.querySelectorAll('*').forEach(e => { const t = (e.childElementCount === 0 ? e.textContent : '').trim(); if (/^testimonials$/i.test(t) && y === null) y = Math.round(e.getBoundingClientRect().top + window.scrollY); }); return y; });
if (ey != null) await ev((y) => window.scrollTo(0, y - 60), ey);
await p.waitForTimeout(1200);
// Detect a transition starting (transform changes) then shoot rapid frames
let last = null;
for (let i = 0; i < 60; i++) {
  const x = await ev(() => { const ul = document.querySelector('.framer-slideshow-axis-x ul'); if (!ul) return null; const m = getComputedStyle(ul).transform; const mm = m.match(/matrix\(([^)]*)\)/); return mm ? Math.round(parseFloat(mm[1].split(',')[4])) : null; });
  if (last != null && x != null && Math.abs(x - last) > 8) {
    // mid-transition — capture two quick frames
    await p.screenshot({ path: `${out}/${tag}-mid-transition-a.png` });
    await p.waitForTimeout(180);
    await p.screenshot({ path: `${out}/${tag}-mid-transition-b.png` });
    console.log(JSON.stringify({ capturedAt: i, from: last, to: x, jump: x - last }));
    break;
  }
  last = x;
  await p.waitForTimeout(120);
}
await b.close();
