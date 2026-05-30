import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const pageerrs = [];
page.on('pageerror', e => pageerrs.push(String(e).slice(0,160)));
page.on('framenavigated', f => { if (f === page.mainFrame()) console.log('NAVIGATED ->', f.url()); });
await page.goto(BASE + '/blog/', { waitUntil: 'load', timeout: 45000 }).catch(()=>{});
await page.waitForTimeout(6000);
// find first blog card link and its resolved href
await page.waitForLoadState('load').catch(()=>{});
const cards = await page.evaluate(() => [...document.querySelectorAll('a[href*="blog/"]')]
  .map(a => ({ href: a.href, text: a.textContent.trim().slice(0,40) }))
  .filter((v,i,s)=>s.findIndex(x=>x.href===v.href)===i).slice(0,8)).catch(e=>'EVALERR '+e.message);
console.log('CARDS:', JSON.stringify(cards, null, 2));
// click the first card
const before = page.url();
const link = page.locator('a[href*="blog/"]').first();
await link.scrollIntoViewIfNeeded().catch(()=>{});
await link.click({ timeout: 8000 }).catch(e=>console.log('CLICKERR', e.message));
await page.waitForTimeout(3500);
const after = page.url();
const post = await page.evaluate(() => ({ title: document.title, h1: document.querySelector('h1')?.textContent.trim().slice(0,60), scrollH: document.body.scrollHeight, bodyText: document.body.innerText.slice(0,80) }));
console.log('NAV', before, '->', after);
console.log('POST', JSON.stringify(post));
console.log('PAGEERRS', pageerrs.slice(0,5));
await page.screenshot({ path: 'test-results/site-audit/evidence/e2e-blog-journeys/click-card.png' });
// now go back
await page.goBack({ timeout: 20000 }).catch(e=>console.log('BACKERR', e.message));
await page.waitForTimeout(3000);
console.log('BACK URL', page.url());
await page.screenshot({ path: 'test-results/site-audit/evidence/e2e-blog-journeys/after-back.png' });
await browser.close();
