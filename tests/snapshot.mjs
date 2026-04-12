import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = 'file://' + path.join(root, 'cognis_base.html');

const label = process.argv[2] || 'snap';
const breakpoints = [
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '375', width: 375, height: 812 },
];

const browser = await chromium.launch();
const report = { label, url: fileUrl, breakpoints: [] };

for (const bp of breakpoints) {
  const ctx = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedReqs = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('requestfailed', (r) => {
    const f = r.failure();
    failedReqs.push(`${r.url()} :: ${f ? f.errorText : 'unknown'}`);
  });

  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => {
    pageErrors.push('goto: ' + e.message);
  });
  await page.waitForTimeout(2500);

  const out = path.join(root, 'playwright-screenshots', `${label}-${bp.name}.png`);
  await page.screenshot({ path: out, fullPage: true });

  const checks = await page.evaluate(() => {
    const h1 = document.querySelectorAll('h1');
    const h1Text = h1[0] ? h1[0].innerText.trim().slice(0, 200) : null;
    const title = document.title;
    const canonical = document.querySelector('link[rel=canonical]')?.href || null;
    const ldJson = document.querySelectorAll('script[type="application/ld+json"]').length;
    const aeline = (document.body.innerText.match(/Aeline|Ailine/g) || []).length;
    const cognis = (document.body.innerText.match(/Cognis/g) || []).length;
    const framerPromo = document.querySelectorAll('#__framer-badge-container, #template-overlay').length;
    const forms = document.querySelectorAll('form').length;
    const formsWithAction = document.querySelectorAll('form[action*="web3forms"]').length;
    const pricing = document.querySelectorAll('[data-framer-name="pricing"]').length;
    const navLinks = document.querySelectorAll('nav a').length;
    const invisible = Array.from(document.querySelectorAll('[data-framer-appear-id]'))
      .filter((el) => {
        const cs = window.getComputedStyle(el);
        return parseFloat(cs.opacity) < 0.01;
      }).length;
    return { title, h1Count: h1.length, h1Text, canonical, ldJson, aeline, cognis, framerPromo, forms, formsWithAction, pricing, navLinks, invisibleAppearEls: invisible };
  });

  report.breakpoints.push({ bp: bp.name, checks, consoleErrors, pageErrors, failedReqCount: failedReqs.length, screenshot: out });
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
