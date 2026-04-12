import { chromium } from 'playwright';
const errors = [];
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());
p.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 200)));
p.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
await p.goto('http://127.0.0.1:3001/index.html?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(4500);
const info = await p.evaluate(() => {
  const bodyText = document.body.innerText;
  const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
    text: a.innerText.replace(/\s+/g,' ').trim().slice(0,30),
    href: a.getAttribute('href'),
  })).filter(l => l.href.toLowerCase().includes('pric') || l.text.toLowerCase().includes('pric'));
  return {
    pricingTextCount: (bodyText.match(/pricing/gi) || []).length,
    remainingPricingLinks: links,
    h1: document.querySelector('h1')?.innerText?.replace(/\s+/g,' ').trim(),
    footerLinks: Array.from(document.querySelectorAll('footer a, [data-framer-name="footer"] a')).map(a => a.innerText.replace(/\s+/g,' ').trim()).filter(Boolean).slice(0, 20),
  };
});
console.log(JSON.stringify(info, null, 2));
console.log('errors:', errors.length);
errors.forEach(e => console.log('  ' + e));
await b.close();
