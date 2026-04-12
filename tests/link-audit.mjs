import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);

const links = await p.evaluate(() => {
  const section = el => {
    let cur = el;
    while (cur) {
      if (cur.tagName === 'NAV') return 'NAV';
      if (cur.tagName === 'HEADER') return 'HEADER';
      if (cur.tagName === 'FOOTER') return 'FOOTER';
      if (cur.tagName === 'SECTION' && cur.dataset.framerName) return 'SECTION:' + cur.dataset.framerName;
      cur = cur.parentElement;
    }
    return '?';
  };
  return Array.from(document.querySelectorAll('a[href]')).map(a => ({
    text: (a.innerText || '').replace(/\s+/g,' ').trim().slice(0, 50),
    href: a.getAttribute('href'),
    section: section(a),
  })).filter(l => l.text || l.href.startsWith('/') || l.href.startsWith('#') || l.href.startsWith('http'));
});

// Dedupe by (text|href)
const seen = new Set();
const uniq = links.filter(l => {
  const k = l.section + '|' + l.text + '|' + l.href;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

// Filter to header/footer candidates
const hf = uniq.filter(l =>
  l.section === 'HEADER' || l.section === 'FOOTER' ||
  l.section.startsWith('SECTION:nav') || l.section.startsWith('SECTION:footer')
);

console.log('TOTAL LINKS:', uniq.length);
console.log('\n--- ALL DISTINCT (text → href) ---');
const byKey = {};
uniq.forEach(l => {
  const k = l.text + ' → ' + l.href;
  byKey[k] = (byKey[k] || 0) + 1;
});
Object.entries(byKey).sort().forEach(([k,v]) => console.log(`  [${v}x] ${k}`));

await b.close();
