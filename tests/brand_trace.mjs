import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrs = [];
const pageErrs = [];
page.on('pageerror', (e) => pageErrs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });
await page.goto('http://localhost:8765/cognis_base.html', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(6000);

const res = await page.evaluate(() => {
  const out = { h1: document.querySelector('h1')?.innerText, cognisCount: 0, aelineCount: 0, snippets: [] };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent;
    if (/Aeline|Ailine/.test(t)) {
      out.aelineCount++;
      if (out.snippets.length < 8) out.snippets.push(t.slice(0, 80));
    }
    if (/Cognis/.test(t)) out.cognisCount++;
  }
  return out;
});
console.log('Result:', JSON.stringify(res, null, 2));
console.log('Page errors:', pageErrs.length);
pageErrs.slice(0, 8).forEach(e => console.log('  ', e.slice(0, 200)));
await browser.close();
