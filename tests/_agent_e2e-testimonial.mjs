import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/e2e-scatter-repro';
const url = process.argv[2] || '/our-services/ai-strategy-advisory/';
const tag = process.argv[3] || 'svc';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(6500);
const ev = async (fn, a) => { try { return await p.evaluate(fn, a); } catch (e) { return null; } };
await ev(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
const ey = await ev(() => { let y = null; document.querySelectorAll('*').forEach(e => { const t = (e.childElementCount === 0 ? e.textContent : '').trim(); if (/^testimonials$/i.test(t) && y === null) y = Math.round(e.getBoundingClientRect().top + window.scrollY); }); return y; });
if (ey != null) { await ev((y) => window.scrollTo(0, y - 80), ey); }
await p.waitForTimeout(800);
// transition value
const trans = await ev(() => { const ul = document.querySelector('.framer-slideshow-axis-x ul'); return ul ? getComputedStyle(ul).transition : null; });
let prev = null; const jumps = [];
for (let i = 0; i < 16; i++) {
  const x = await ev(() => { const ul = document.querySelector('.framer-slideshow-axis-x ul'); if (!ul) return null; const m = getComputedStyle(ul).transform; const mm = m.match(/matrix\(([^)]*)\)/); return mm ? parseFloat(mm[1].split(',')[4]) : null; });
  if (prev != null && x != null) jumps.push(Math.round(prev - x));
  prev = x; await p.waitForTimeout(250);
}
const cards = await ev(() => { const ul = document.querySelector('.framer-slideshow-axis-x ul'); if (!ul) return []; return Array.prototype.slice.call(ul.children).map(li => { const c = li.firstElementChild || li; const r = c.getBoundingClientRect(); return { h: Math.round(r.height), top: Math.round(r.top) }; }).slice(0, 8); });
await p.screenshot({ path: `${out}/${tag}-testimonial-whitespace.png` });
const total = jumps.reduce((a, c) => a + c, 0);
console.log(JSON.stringify({ url, transition: trans, dxPer250ms: jumps, pxOver3_75s: total, pxPerSec: Math.round(total / 3.75), cards }, null, 2));
await b.close();
