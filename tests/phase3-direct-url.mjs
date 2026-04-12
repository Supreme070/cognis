import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const pe = []; const fr = []; const ce = [];
p.on('pageerror', e => pe.push(e.message));
p.on('requestfailed', r => fr.push(r.url()));
p.on('console', m => { if (m.type() === 'error') ce.push(m.text().slice(0, 300)); });
await p.goto('http://127.0.0.1:3001/blog/why-enterprise-ai-deployments-fail?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(8000);
const info = await p.evaluate(() => ({
  pathname: location.pathname,
  title: document.title,
  h1: document.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim(),
  bodyLen: document.body.innerText.length,
  firstBodyChars: document.body.innerText.slice(0, 200),
}));
console.log('pageErrors:', pe.length, pe.slice(0, 3));
console.log('failedReqs:', fr.length, fr.slice(0, 5));
console.log('consoleErrs:', ce.length, ce.slice(0, 5));
console.log(JSON.stringify(info, null, 2));
await b.close();
