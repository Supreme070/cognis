import { chromium } from 'playwright';
const LOCAL = 'http://localhost:8000';
const EMAIL = 'supremeoye@outlook.com';

async function testContact(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('err: ' + e.message));
  console.log('\n=== CONTACT FORM ===');
  await page.goto(LOCAL + '/contact', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Inspect form state
  const state = await page.evaluate(() => {
    const f = document.querySelector('form.framer-1h74s3j') || document.querySelector('form textarea')?.closest('form');
    if (!f) return { error: 'no contact form' };
    const hidden = {};
    f.querySelectorAll('input[type="hidden"]').forEach(i => hidden[i.name] = i.value);
    return {
      action: f.getAttribute('action'),
      method: f.getAttribute('method'),
      wired: f.dataset.cognisWired,
      hidden,
      inputs: Array.from(f.querySelectorAll('input,textarea')).map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder }))
    };
  });
  console.log('form state:', JSON.stringify(state, null, 2));

  // Fill fields
  const nameSel = 'form.framer-1h74s3j input[type="text"]:not([name="botcheck"]), form input[placeholder*="name" i]';
  await page.fill(nameSel, 'Preme');
  await page.fill('form.framer-1h74s3j input[type="email"], form textarea ~ * input[type="email"]', EMAIL).catch(()=>{});
  // fallback email fill
  await page.evaluate(e => {
    const f = document.querySelector('form.framer-1h74s3j') || document.querySelector('form textarea')?.closest('form');
    const em = f.querySelector('input[type="email"]'); if (em && !em.value) em.value = e; em?.dispatchEvent(new Event('input',{bubbles:true}));
    const ta = f.querySelector('textarea'); if (ta) { ta.value = 'Test from Playwright — please ignore.'; ta.dispatchEvent(new Event('input',{bubbles:true})); }
  }, EMAIL);

  // Intercept submit to avoid actually hitting web3forms? No — user wants end-to-end.
  // But we should NOT submit real form if we don't want spam. User said use these credentials — they want real test.
  const navPromise = page.waitForURL(/thanks|web3forms/, { timeout: 20000 }).catch(e => 'timeout: ' + e.message);
  await page.click('form.framer-1h74s3j button[type="submit"]');
  const navResult = await navPromise;
  console.log('after submit URL:', page.url());
  console.log('nav result:', navResult);
  if (errors.length) console.log('errors:', errors.slice(0,3));
  await ctx.close();
}

async function testNewsletter(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  console.log('\n=== NEWSLETTER (homepage) ===');
  await page.goto(LOCAL + '/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const state = await page.evaluate(() => {
    const fs = Array.from(document.querySelectorAll('form.framer-1yovbvh'));
    return fs.map(f => {
      const hidden = {};
      f.querySelectorAll('input[type="hidden"]').forEach(i => hidden[i.name] = i.value);
      return { action: f.getAttribute('action'), wired: f.dataset.cognisWired, hidden };
    });
  });
  console.log('newsletter forms:', JSON.stringify(state, null, 2));

  await page.evaluate(e => {
    const f = document.querySelector('form.framer-1yovbvh');
    const em = f.querySelector('input[type="email"]'); em.value = e; em.dispatchEvent(new Event('input',{bubbles:true}));
  }, EMAIL);
  const navPromise = page.waitForURL(/thanks|web3forms/, { timeout: 20000 }).catch(e => 'timeout: ' + e.message);
  await page.click('form.framer-1yovbvh button[type="submit"]');
  const navResult = await navPromise;
  console.log('after submit URL:', page.url());
  console.log('nav result:', navResult);
  await ctx.close();
}

const browser = await chromium.launch();
try {
  await testContact(browser);
  await testNewsletter(browser);
} finally {
  await browser.close();
}
