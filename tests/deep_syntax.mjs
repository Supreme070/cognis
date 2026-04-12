import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
// Override error capture inside the page
await page.addInitScript(() => {
  const origErr = window.onerror;
  window.__errs = [];
  window.onerror = (msg, src, line, col, err) => {
    window.__errs.push({ msg: String(msg), src, line, col, stack: err?.stack });
    return origErr?.apply(window, arguments);
  };
  window.addEventListener('error', (e) => {
    window.__errs.push({ msg: String(e.message), src: e.filename, line: e.lineno, col: e.colno, stack: e.error?.stack });
  });
});
await page.goto('http://localhost:8765/cognis_base.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);
const errs = await page.evaluate(() => window.__errs || []);
console.log(JSON.stringify(errs, null, 2));
await browser.close();
