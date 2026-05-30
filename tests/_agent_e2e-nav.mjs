import { chromium } from 'playwright';
const OUT = 'test-results/site-audit/evidence/e2e-contact-funnel';
const BASE = 'https://www.cognis.group';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const log = (...a) => console.log(...a);

// TEST 3: Products -> Home scatter
log('=== TEST 3: Products -> Home scatter ===');
const p2 = await ctx.newPage();
await p2.goto(BASE + '/products/', { waitUntil: 'load' });
await p2.waitForTimeout(3500);
await p2.screenshot({ path: OUT + '/x3a-products.png', fullPage: true });
const homeHref = await p2.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find(x => /^\s*Home\s*$/i.test(x.textContent) && x.getAttribute('href'));
  if (a) { a.click(); return a.getAttribute('href'); }
  return null;
});
log('home href:', homeHref, '| url before wait:', p2.url());
await p2.waitForTimeout(4500);
await p2.screenshot({ path: OUT + '/x3b-after-home.png' });
log('url after:', p2.url());

// TEST 4: SPA Home -> Contact
log('=== TEST 4: Home -> Contact via SPA link ===');
const p3 = await ctx.newPage();
await p3.goto(BASE + '/', { waitUntil: 'load' });
await p3.waitForTimeout(4000);
const cHref = await p3.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find(x => /\/contact/i.test(x.getAttribute('href') || ''));
  if (a) { a.click(); return a.getAttribute('href'); }
  return null;
});
log('contact href:', cHref);
await p3.waitForTimeout(5000);
log('url after:', p3.url());
await p3.screenshot({ path: OUT + '/x4-contact-via-spa.png' });
// inspect whether contact form rendered laid-out or overlapping
const contactLayout = await p3.evaluate(() => {
  const f = [...document.querySelectorAll('form')].find(x => x.querySelector('textarea'));
  if (!f) return { found: false };
  const inputs = [...f.querySelectorAll('input,textarea')].map(el => {
    const r = el.getBoundingClientRect();
    return { tag: el.tagName, type: el.type, top: Math.round(r.top), left: Math.round(r.left), h: Math.round(r.height), w: Math.round(r.width) };
  });
  return { found: true, inputs };
});
log('CONTACT LAYOUT (SPA):', JSON.stringify(contactLayout));

// TEST 5: header comparison
log('=== TEST 5: Products vs Home header ===');
const p4 = await ctx.newPage();
await p4.goto(BASE + '/products/', { waitUntil: 'load' });
await p4.waitForTimeout(2500);
const prodHeader = await p4.evaluate(() => ({
  framerNav: !!document.querySelector('[data-framer-name="Navigation"], [data-framer-name*="Nav"]'),
  snapshot: document.documentElement.getAttribute('data-cognis-snapshot'),
  navLinks: [...document.querySelectorAll('header a, nav a')].map(a => a.textContent.trim()).filter(Boolean).slice(0, 14),
  headerHTML: (document.querySelector('header') || {}).outerHTML?.slice(0, 200) || 'NO <header>',
}));
log('PRODUCTS HEADER:', JSON.stringify(prodHeader));
await p4.screenshot({ path: OUT + '/x5-products-header.png' });
const p5 = await ctx.newPage();
await p5.goto(BASE + '/', { waitUntil: 'load' });
await p5.waitForTimeout(3000);
const homeHeader = await p5.evaluate(() => ({
  framerNav: !!document.querySelector('[data-framer-name="Navigation"], [data-framer-name*="Nav"]'),
  navLinks: [...document.querySelectorAll('header a, nav a')].map(a => a.textContent.trim()).filter(Boolean).slice(0, 14),
}));
log('HOME HEADER:', JSON.stringify(homeHeader));
await p5.screenshot({ path: OUT + '/x5-home-header.png' });

// TEST 6: testimonials on about page
log('=== TEST 6: about-us testimonials ===');
const p6 = await ctx.newPage();
await p6.goto(BASE + '/about-us/', { waitUntil: 'load' });
await p6.waitForTimeout(3500);
await p6.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
await p6.waitForTimeout(2500);
await p6.screenshot({ path: OUT + '/x6-about-testimonials.png' });

await browser.close();
log('DONE');
