import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = 'test-results/site-audit/evidence/e2e-contact-funnel';
mkdirSync(OUT, { recursive: true });
const BASE = 'https://www.cognis.group';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const log = (...a) => console.log(...a);

// ---------- TEST 1: fresh direct load of /contact/ ----------
log('=== TEST 1: fresh /contact/ load + form wiring ===');
await page.goto(BASE + '/contact/', { waitUntil: 'load' });
await page.waitForTimeout(4000);
await page.screenshot({ path: OUT + '/x1-contact-fresh-top.png' });
await page.screenshot({ path: OUT + '/x1-contact-fresh-full.png', fullPage: true });

const formInfo = await page.evaluate(() => {
  const out = { forms: [] };
  document.querySelectorAll('form').forEach((f, i) => {
    const email = f.querySelector('input[type="email"]');
    if (!email) return;
    const hid = {};
    f.querySelectorAll('input[type="hidden"]').forEach(h => hid[h.name] = h.value);
    const btn = f.querySelector('button[type="submit"]');
    out.forms.push({
      idx: i,
      class: f.className,
      action: f.getAttribute('action'),
      method: f.getAttribute('method'),
      emailName: email.getAttribute('name'),
      emailRequired: email.required,
      hasTextarea: !!f.querySelector('textarea'),
      textareaRequired: f.querySelector('textarea')?.required ?? null,
      nameInput: (() => { const t = f.querySelector('input[type="text"]:not([name="botcheck"])'); return t ? { name: t.getAttribute('name'), required: t.required } : null; })(),
      hidden: hid,
      btnText: btn ? btn.innerText.trim() : null,
      wired: f.dataset.cognisWired,
    });
  });
  return out;
});
log('FORMS:', JSON.stringify(formInfo, null, 2));

// HTML5 validity check: submit empty contact form -> does browser block?
log('\n=== TEST 1b: native required validation (empty submit) ===');
const validityEmpty = await page.evaluate(() => {
  const f = document.querySelector('form.framer-1h74s3j') || [...document.querySelectorAll('form')].find(x => x.querySelector('textarea'));
  if (!f) return { err: 'no contact form found' };
  const email = f.querySelector('input[type="email"]');
  const ta = f.querySelector('textarea');
  const name = f.querySelector('input[type="text"]:not([name="botcheck"])');
  return {
    formValid: f.checkValidity(),
    emailValid: email ? email.checkValidity() : null,
    emailValue: email ? email.value : null,
    textareaValid: ta ? ta.checkValidity() : null,
    nameValid: name ? name.checkValidity() : null,
  };
});
log('EMPTY VALIDITY:', JSON.stringify(validityEmpty));

// email format check: set a bad email, check validity
log('\n=== TEST 1c: bad email format ===');
const badEmail = await page.evaluate(() => {
  const f = document.querySelector('form.framer-1h74s3j') || [...document.querySelectorAll('form')].find(x => x.querySelector('textarea'));
  const email = f.querySelector('input[type="email"]');
  email.value = 'notanemail';
  return { valid: email.checkValidity(), type: email.type };
});
log('BAD EMAIL:', JSON.stringify(badEmail));

// Fill only email (no name/message), inspect what the click handler would send.
// We intercept the Web3Forms POST to capture the body WITHOUT a real submit
// by aborting the request.
log('\n=== TEST 1d: intercept POST body (email-only, name+msg blank) ===');
let captured = null;
await page.route('https://api.web3forms.com/**', async (route) => {
  const req = route.request();
  captured = { method: req.method(), postData: req.postData(), headers: req.headers() };
  await route.abort();
});
await page.evaluate(() => {
  const f = document.querySelector('form.framer-1h74s3j') || [...document.querySelectorAll('form')].find(x => x.querySelector('textarea'));
  f.querySelector('input[type="email"]').value = 'lead@example.com';
  // leave name + textarea blank intentionally
});
// click the submit button
await page.evaluate(() => {
  const f = document.querySelector('form.framer-1h74s3j') || [...document.querySelectorAll('form')].find(x => x.querySelector('textarea'));
  const btn = f.querySelector('button[type="submit"]');
  btn && btn.click();
});
await page.waitForTimeout(2500);
log('CAPTURED POST:', JSON.stringify(captured));
await page.unroute('https://api.web3forms.com/**');

// ---------- TEST 2: redirect host check ----------
log('\n=== TEST 2: redirect target host ===');
const redir = await page.evaluate(() => {
  const f = document.querySelector('form.framer-1h74s3j') || [...document.querySelectorAll('form')].find(x => x.querySelector('textarea'));
  const r = f.querySelector('input[name="redirect"]');
  return r ? r.value : null;
});
log('REDIRECT:', redir, '| current host:', BASE);

// ---------- TEST 3: SPA nav scatter — Products -> Home ----------
log('\n=== TEST 3: Products -> Home scatter ===');
const p2 = await ctx.newPage();
await p2.goto(BASE + '/products/', { waitUntil: 'load' });
await p2.waitForTimeout(3000);
await p2.screenshot({ path: OUT + '/x3a-products.png' });
// find a Home link and click it (SPA)
const homeClicked = await p2.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find(x => /^\s*Home\s*$/i.test(x.textContent) && x.getAttribute('href'));
  if (a) { a.click(); return a.getAttribute('href'); }
  return null;
});
log('home link clicked href:', homeClicked);
await p2.waitForTimeout(4000);
await p2.screenshot({ path: OUT + '/x3b-after-home.png', fullPage: false });
log('p2 url after:', p2.url());

// ---------- TEST 4: SPA nav Service -> Contact (reproduce the broken contact) ----------
log('\n=== TEST 4: Home -> Contact via in-page link (SPA) ===');
const p3 = await ctx.newPage();
await p3.goto(BASE + '/', { waitUntil: 'load' });
await p3.waitForTimeout(4000);
const contactHref = await p3.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find(x => /contact/i.test(x.getAttribute('href') || '') );
  if (a) { a.click(); return a.getAttribute('href'); }
  return null;
});
log('contact link href:', contactHref);
await p3.waitForTimeout(5000);
await p3.screenshot({ path: OUT + '/x4-contact-via-spa.png' });
log('p3 url after:', p3.url());

// ---------- TEST 5: Products page header vs global header ----------
log('\n=== TEST 5: Products header structure ===');
const ph = await p2.evaluate(() => null); // p2 already navigated away
const p4 = await ctx.newPage();
await p4.goto(BASE + '/products/', { waitUntil: 'load' });
await p4.waitForTimeout(2500);
const prodHeader = await p4.evaluate(() => {
  const nav = document.querySelector('header, nav');
  const links = [...document.querySelectorAll('header a, nav a')].map(a => a.textContent.trim()).filter(Boolean).slice(0, 12);
  return { hasFramerHeader: !!document.querySelector('[data-framer-name="Navigation"], [data-framer-name*="Nav"]'), navLinks: links };
});
log('PRODUCTS HEADER:', JSON.stringify(prodHeader));
await p4.screenshot({ path: OUT + '/x5-products-header.png' });

const homeHeader = await p3.goto(BASE + '/', { waitUntil: 'load' }).then(async () => {
  await p3.waitForTimeout(2500);
  return p3.evaluate(() => ({
    hasFramerHeader: !!document.querySelector('[data-framer-name="Navigation"], [data-framer-name*="Nav"]'),
    navLinks: [...document.querySelectorAll('header a, nav a')].map(a => a.textContent.trim()).filter(Boolean).slice(0, 12),
  }));
});
log('HOME HEADER:', JSON.stringify(homeHeader));

await browser.close();
log('\nDONE');
