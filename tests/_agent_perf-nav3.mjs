import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/perf-nav-thrash';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1. about-us testimonials whitespace screenshot
const tp = await ctx.newPage();
await tp.goto(BASE + '/about-us', { waitUntil:'domcontentloaded' });
await tp.waitForTimeout(4500);
try{ const ab = await tp.evaluate(() => {
  const h = [...document.querySelectorAll('h1,h2,h3')].find(e=>/what our clients say|operating principles/i.test(e.textContent||''));
  if (!h) return {found:false};
  let sec = h.closest('section') || h.parentElement;
  const r = sec.getBoundingClientRect();
  const ul = sec.querySelector('.framer-slideshow-axis-x ul, [data-framer-name="slideshow"] ul');
  const cards = ul ? [...ul.children].map(li=>li.firstElementChild||li) : [];
  const cardH = cards.length? Math.max(...cards.map(c=>c.getBoundingClientRect().height)):0;
  sec.scrollIntoView({block:'center'});
  return { found:true, heading:h.textContent.trim().slice(0,40), secHeight:Math.round(r.height), cardCount:cards.length, maxCardHeight:Math.round(cardH), whitespaceGap:Math.round(r.height-cardH), hasMarquee:!!sec.querySelector('.cgt-track') };
});
await tp.waitForTimeout(700);
await tp.screenshot({ path: OUT + '/testi_about-us.png' });
console.log('ABOUT-US TESTIMONIALS:', JSON.stringify(ab));}catch(e){console.log('about-us eval err (likely re-render nav):', e.message.slice(0,80));}
await tp.close();

// 2. Products doubled-nav text + header diff: screenshot global header (home) vs products header
await page.goto(BASE + '/', { waitUntil:'domcontentloaded' }); await page.waitForTimeout(3500);
const homeHdr = await page.evaluate(() => {
  const prod = [...document.querySelectorAll('a')].find(a=>/products/i.test((a.getAttribute('href')||''))&&(a.textContent||'').includes('Products'));
  return prod ? { text: prod.textContent.trim(), spanCount: prod.querySelectorAll('span').length } : null;
});
console.log('HOME HEADER products link:', JSON.stringify(homeHdr));
await page.evaluate(()=>window.scrollTo(0,0)); await page.waitForTimeout(300);
await page.screenshot({ path: OUT + '/header-home.png', clip:{x:0,y:0,width:1440,height:90} });

await page.goto(BASE + '/products', { waitUntil:'domcontentloaded' }); await page.waitForTimeout(2500);
await page.screenshot({ path: OUT + '/header-products.png', clip:{x:0,y:0,width:1440,height:90} });
const prodHdr = await page.evaluate(() => {
  const h = document.querySelector('header.site-nav');
  return { customHeader: !!h, framerHeader: !!document.querySelector('[data-framer-name*="nav" i]'), navLinks: h? [...h.querySelectorAll('a')].map(a=>a.textContent.trim()).filter(Boolean):[] };
});
console.log('PRODUCTS HEADER:', JSON.stringify(prodHdr));

// 3. The Services bounce: click Services from home and trace where it lands
let urls = [];
page.on('framenavigated', f=>{ if(f===page.mainFrame()) urls.push(f.url().replace(BASE,'')||'/'); });
await page.goto(BASE + '/', { waitUntil:'domcontentloaded' }); await page.waitForTimeout(3500);
urls=[];
try { await page.locator('a:has-text("Services")').first().click({timeout:5000}); } catch(e){ console.log('svc click fail'); }
await page.waitForTimeout(4000);
console.log('SERVICES CLICK frame-nav trail:', JSON.stringify(urls), '-> final', page.url().replace(BASE,''));

await browser.close();
