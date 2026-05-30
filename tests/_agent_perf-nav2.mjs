import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/perf-nav-thrash';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

let frameNavs = 0;
page.on('framenavigated', (f) => { if (f === page.mainFrame()) frameNavs++; });

await page.goto(BASE + '/', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(3500);

// Enumerate header nav links + their href shape (rel vs abs)
const navLinks = await page.evaluate(() => {
  const hdr = document.querySelector('header, [data-framer-name*="nav" i], nav');
  const set = new Set();
  document.querySelectorAll('a[href]').forEach(a => {
    const r = a.getBoundingClientRect();
    if (r.top < 120 && r.width>0 && r.height>0 && r.top>=0) set.add(a.getAttribute('href')+' :: '+(a.textContent||'').trim().slice(0,20));
  });
  return Array.from(set).slice(0,20);
});
console.log('TOP-BAR LINKS:'); navLinks.forEach(l=>console.log('  '+l));

// Click About via its anchor and measure SPA vs hard nav + settle time
async function navClick(text) {
  await page.goto(BASE + '/', { waitUntil:'domcontentloaded' }); await page.waitForTimeout(3000);
  await page.evaluate(() => { window.__S = 'ALIVE'; });
  const before = frameNavs; const t0 = Date.now();
  const a = page.locator(`a:has-text("${text}")`).first();
  let clicked = true;
  try { await a.click({ timeout: 5000 }); } catch { clicked = false; }
  await page.waitForTimeout(3500);
  const survived = await page.evaluate(()=>window.__S).catch(()=>null);
  return { text, clicked, url: page.url().replace(BASE,''), frameNavsDelta: frameNavs-before, hardReload: survived!=='ALIVE', ms: Date.now()-t0 };
}
console.log('\nNAV MECHANISM:');
for (const t of ['About Us','Services','Insights','Products']) {
  console.log(JSON.stringify(await navClick(t)));
}

// === TESTIMONIALS on about + a service page ===
console.log('\n=== TESTIMONIALS ===');
for (const path of ['/about-us', '/our-services/ai-strategy-advisory']) {
  const tp = await ctx.newPage();
  await tp.goto(BASE + path, { waitUntil:'domcontentloaded', timeout:40000 });
  await tp.waitForTimeout(3500);
  // find testimonial-ish section
  const info = await tp.evaluate(() => {
    function findSec() {
      let el = document.getElementById('testimonials');
      if (el) return el;
      const all = [...document.querySelectorAll('section,div')];
      return all.find(e => /what our clients say|testimonial|operating principles/i.test(e.textContent||'') && e.querySelector('.framer-slideshow-axis-x, [data-framer-name="slideshow"]'));
    }
    const sec = findSec();
    if (!sec) return { found:false };
    const r = sec.getBoundingClientRect();
    const track = sec.querySelector('.cgt-track');
    const ul = sec.querySelector('.framer-slideshow-axis-x ul, [data-framer-name="slideshow"] ul');
    // detect whitespace: compute bounding of children vs section height
    const cards = track ? [...track.children] : (ul ? [...ul.children].map(li=>li.firstElementChild||li) : []);
    const cardH = cards.length ? Math.max(...cards.map(c=>c.getBoundingClientRect().height)) : 0;
    return {
      found:true, hasMarqueeTrack: !!track, hasOrigUl: !!ul,
      secHeight: Math.round(r.height), maxCardHeight: Math.round(cardH), cardCount: cards.length,
      whitespaceGap: Math.round(r.height - cardH),
      transform: track ? track.style.transform : null
    };
  });
  // scroll to it and screenshot, then sample marquee motion to measure speed
  await tp.evaluate(() => { const s = document.getElementById('testimonials') || [...document.querySelectorAll('*')].find(e=>/what our clients say/i.test(e.textContent||'')); if (s) s.scrollIntoView({block:'center'}); });
  await tp.waitForTimeout(800);
  const name = path.replace(/\//g,'_');
  await tp.screenshot({ path: `${OUT}/testi${name}-a.png` });
  // measure marquee speed: sample transform over 1s
  const speed = await tp.evaluate(() => new Promise(res => {
    const t = document.querySelector('#testimonials .cgt-track'); if (!t) return res(null);
    const read = () => { const m = /translateX\(([-\d.]+)px\)/.exec(t.style.transform||''); return m?parseFloat(m[1]):null; };
    const a = read(); setTimeout(()=>{ const b = read(); res({a,b, pxPerSec: (a!=null&&b!=null)? Math.round(Math.abs(b-a)) : null }); }, 1000);
  }));
  await tp.waitForTimeout(400);
  await tp.screenshot({ path: `${OUT}/testi${name}-b.png` });
  console.log(path, JSON.stringify(info), 'speed=', JSON.stringify(speed));
  await tp.close();
}
await browser.close();
