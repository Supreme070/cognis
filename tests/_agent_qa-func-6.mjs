import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const pages = ['/privacy-policy/', '/terms/', '/thanks/', '/thanks-subscribe/'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const failed = [];
page.on('requestfailed', r => { const u = r.url(); if (/cdn-cgi|\/rum\b|challenge/.test(u)) return; failed.push(u + ' :: ' + (r.failure()?.errorText||'')); });
page.on('response', r => { if (r.status() >= 400) failed.push('HTTP' + r.status() + ' ' + r.url()); });

for (const p of pages) {
  failed.length = 0;
  await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2800); // let injectors run
  const data = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href]')].map(a => ({
      text: (a.textContent||'').trim().slice(0,40),
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
    }));
    const body = getComputedStyle(document.body).fontFamily;
    const h1 = document.querySelector('h1');
    const h1font = h1 ? getComputedStyle(h1).fontFamily : null;
    const hasProductsInjected = !!document.querySelector('a[data-cognis-products]');
    const headerNav = [...document.querySelectorAll('header.site-nav nav a')].map(a=>a.textContent.trim());
    const siteLinksNav = !!document.querySelector('nav.cognis-site-links');
    const forms = document.querySelectorAll('form').length;
    return { links, body, h1font, hasProductsInjected, headerNav, siteLinksNav, forms, title: document.title };
  });
  console.log('\n===== ' + p + ' =====');
  console.log('title:', data.title);
  console.log('body font:', data.body);
  console.log('h1 font:', data.h1font);
  console.log('header nav:', JSON.stringify(data.headerNav));
  console.log('products link injected:', data.hasProductsInjected, '| site-links footer nav:', data.siteLinksNav, '| forms:', data.forms);
  console.log('LINKS:');
  for (const l of data.links) console.log('  ', JSON.stringify(l));
  console.log('FAILED REQUESTS:', failed.length);
  for (const f of [...new Set(failed)]) console.log('   ', f);
}
await browser.close();
