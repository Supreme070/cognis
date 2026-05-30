import { chromium } from 'playwright';
const OUT = 'test-results/site-audit/evidence/e2e-contact-funnel';
const BASE = 'https://www.cognis.group';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const log = (...a) => console.log(...a);
const page = await ctx.newPage();

async function clickByText(re, label) {
  const href = await page.evaluate((reStr) => {
    const re = new RegExp(reStr, 'i');
    const a = [...document.querySelectorAll('a')].find(x => re.test((x.textContent||'').trim()) && x.getAttribute('href'));
    if (a) { a.click(); return a.getAttribute('href'); }
    return null;
  }, re.source);
  log(label, '-> href:', href, '| url:', page.url());
  return href;
}

// Reproduce probe path: home -> Services -> contact, all via SPA clicks
log('=== REPRO: SPA hops home -> services -> contact ===');
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
await clickByText(/^Services$/, 'click Services');
await page.waitForTimeout(4000);
log('url now:', page.url());
await page.screenshot({ path: OUT + '/r1-services.png' });
// from services, click contact
await clickByText(/contact|Work With Us|Get Started/, 'click Contact/CTA');
await page.waitForTimeout(5000);
log('url now:', page.url());
await page.screenshot({ path: OUT + '/r2-contact-after-hops.png' });
const layout = await page.evaluate(() => {
  const f = [...document.querySelectorAll('form')].find(x => x.querySelector('textarea'));
  if (!f) return { found: false, url: location.href };
  const vis = [...f.querySelectorAll('input,textarea')].filter(el => el.type !== 'hidden').map(el => {
    const r = el.getBoundingClientRect();
    return { type: el.type, top: Math.round(r.top), left: Math.round(r.left), h: Math.round(r.height) };
  });
  // detect overlap among visible name/email/textarea (first 3)
  return { found: true, url: location.href, vis };
});
log('CONTACT LAYOUT AFTER HOPS:', JSON.stringify(layout));

// Products -> Home (brand link) scatter
log('\n=== REPRO: Products -> Home (brand) ===');
const p2 = await ctx.newPage();
await p2.goto(BASE + '/products/', { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(3000);
const brandHref = await p2.evaluate(() => {
  const a = document.querySelector('header a.brand, header a[href="/"], a[aria-label="Cognis"]');
  if (a) { a.click(); return a.getAttribute('href'); }
  return null;
});
log('brand href clicked:', brandHref);
await p2.waitForTimeout(4500);
log('url after:', p2.url());
await p2.screenshot({ path: OUT + '/r3-products-to-home.png' });

// testimonials on a service detail page (reported broken)
log('\n=== REPRO: testimonials on service page ===');
const p3 = await ctx.newPage();
try {
  await p3.goto(BASE + '/our-services/ai-strategy-advisory/', { waitUntil: 'domcontentloaded', timeout: 45000 });
} catch (e) { log('svc goto err', e.message); }
await p3.waitForTimeout(4000);
const tinfo = await p3.evaluate(() => {
  // find a testimonial/slideshow container
  const c = document.querySelector('.framer-1rfzgaf-container, [data-framer-name*="estimon" i], [data-framer-name*="Slide" i]');
  return { hasContainer: !!c };
});
log('testimonial container:', JSON.stringify(tinfo));
// scroll through page slowly capturing where testimonials sit
await p3.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
await p3.waitForTimeout(2000);
await p3.screenshot({ path: OUT + '/r4-svc-mid.png' });
await p3.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.72));
await p3.waitForTimeout(2000);
await p3.screenshot({ path: OUT + '/r5-svc-testimonials.png' });

// about-us testimonials
const p4 = await ctx.newPage();
try { await p4.goto(BASE + '/about-us/', { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch(e){ log('about goto err', e.message); }
await p4.waitForTimeout(4000);
await p4.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
await p4.waitForTimeout(2500);
await p4.screenshot({ path: OUT + '/r6-about-testimonials.png' });
await p4.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
await p4.waitForTimeout(2000);
await p4.screenshot({ path: OUT + '/r7-about-testimonials2.png' });

await browser.close();
log('DONE');
