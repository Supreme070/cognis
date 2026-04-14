/* Live form-submit probe against https://cognis.group/.
 *
 * Submits both forms with a probe email and captures:
 *   - all network requests/responses to api.web3forms.com
 *   - any console errors
 *   - JS errors thrown during click
 *   - final URL after submission (Web3Forms redirects to /thanks on success)
 *   - whether buttons even respond to click events
 */
import { chromium } from 'playwright';

const EMAIL = 'supremeoye@outlook.com';
const BASE = process.env.BASE || 'https://cognis.group';

async function probe(page, label, url, fillFn, submitSelector) {
  console.log(`\n===== ${label}: ${url} =====`);

  const events = [];
  page.on('request', (req) => {
    if (req.url().includes('web3forms')) {
      events.push(`REQ  ${req.method()} ${req.url()}`);
      const pd = req.postData();
      if (pd) events.push(`     body: ${pd.slice(0, 400)}`);
    }
  });
  page.on('response', async (res) => {
    if (res.url().includes('web3forms')) {
      let body = '';
      try { body = (await res.text()).slice(0, 400); } catch {}
      events.push(`RES  ${res.status()} ${res.url()}  ${body}`);
    }
  });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      events.push(`CON  [${m.type()}] ${m.text().slice(0, 300)}`);
    }
  });
  page.on('pageerror', (e) => events.push(`ERR  ${e.message}`));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000); // let hydration + ensureForms run

  const beforeUrl = page.url();
  console.log(`  loaded: ${beforeUrl}`);

  const inputsSnap = await page.evaluate(() => Array.from(document.querySelectorAll('input, textarea')).map(el => ({tag: el.tagName, type: el.type, name: el.name, placeholder: el.placeholder, visible: !!(el.offsetWidth || el.offsetHeight)})));
  console.log('  inputs:', JSON.stringify(inputsSnap, null, 2));
  await fillFn(page);
  await page.waitForTimeout(500);

  // Inspect the form state just before submit
  const formState = await page.evaluate(() => {
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.map((f) => ({
      cls: f.className,
      action: f.getAttribute('action'),
      method: f.getAttribute('method'),
      wired: f.dataset.cognisWired,
      fields: Array.from(f.querySelectorAll('input, textarea, button')).map((el) => ({
        type: el.type, name: el.name, value: el.value ? el.value.slice(0, 80) : '',
      })),
    }));
  });
  console.log(`  form state:`);
  for (const f of formState) {
    console.log(`    .${f.cls.slice(0, 40)} action=${f.action} wired=${f.wired}`);
    for (const fl of f.fields) {
      if (fl.name || fl.type === 'submit') {
        console.log(`       ${fl.type} name=${fl.name} value=${fl.value.slice(0, 50)}`);
      }
    }
  }

  // Click submit
  const btn = await page.$(submitSelector);
  if (!btn) {
    console.log(`  !! submit button NOT FOUND: ${submitSelector}`);
    return events;
  }
  console.log(`  clicking: ${submitSelector}`);
  await btn.click();

  await page.waitForTimeout(5000);
  console.log(`  url after: ${page.url()}`);

  return events;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// --- Test 1: Contact form on /contact ---
const ev1 = await probe(
  page,
  'CONTACT FORM',
  `${BASE}/contact`,
  async (p) => {
    await p.fill('input[placeholder="Your full name"]', 'Playwright Probe');
    await p.fill('input[placeholder="Your email address"]', EMAIL);
    await p.fill('textarea[placeholder="Your message here..."]', 'Test submission from Playwright live probe.');
  },
  'form.framer-1h74s3j button[type="submit"]'
);
console.log('\n--- events ---');
for (const e of ev1) console.log(e);

// --- Test 2: Newsletter form on homepage ---
const ev2 = await probe(
  page,
  'NEWSLETTER FORM',
  `${BASE}/`,
  async (p) => {
    // Find the first visible newsletter email input
    await p.evaluate((email) => {
      const inp = document.querySelector('form.framer-1yovbvh input[type="email"]');
      if (inp) { inp.focus(); inp.value = email; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    }, EMAIL);
    await p.waitForTimeout(300);
  },
  'form.framer-1yovbvh button[type="submit"]'
);
console.log('\n--- events ---');
for (const e of ev2) console.log(e);

await browser.close();
