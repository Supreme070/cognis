import { chromium } from 'playwright';
const SITE = 'https://cognis.group';
const EMAIL = 'supremeoye@outlook.com';

async function run(browser, label, startPath, formSelector, fillFn) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  console.log(`\n=== ${label} (LIVE) ===`);
  await page.goto(SITE + startPath, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('load', { timeout: 30000 }).catch(()=>{}); await page.waitForTimeout(6000);
  await fillFn(page);
  await Promise.all([
    page.waitForURL(u => u.includes('/thanks') || u.includes('web3forms'), { timeout: 30000 }).catch(()=>null),
    page.click(`${formSelector} button[type="submit"]`),
  ]);
  await page.waitForLoadState('networkidle').catch(()=>{});
  const finalUrl = page.url();
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(()=>null);
  const bodyText = (await page.locator('body').innerText().catch(()=>'')).slice(0, 500);
  console.log('  final URL:', finalUrl);
  console.log('  title    :', title);
  console.log('  h1       :', h1);
  console.log('  body     :', bodyText.replace(/\s+/g,' '));
  const shot = `/tmp/LIVE_${label.replace(/\W+/g,'_')}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  console.log('  screenshot:', shot);
  await ctx.close();
  return finalUrl.includes('/thanks');
}

const browser = await chromium.launch({ headless: false, slowMo: 400 });
let passC, passN;
try {
  passC = await run(browser, 'CONTACT', '/contact', 'form.framer-1h74s3j', async page => {
    await page.evaluate(e => {
      const f = document.querySelector('form.framer-1h74s3j');
      const name = f.querySelector('input[type="text"]:not([name="botcheck"])');
      name.value = 'Preme'; name.dispatchEvent(new Event('input',{bubbles:true}));
      const em = f.querySelector('input[type="email"]');
      em.value = e; em.dispatchEvent(new Event('input',{bubbles:true}));
      const ta = f.querySelector('textarea');
      ta.value = 'Playwright live test — please ignore.'; ta.dispatchEvent(new Event('input',{bubbles:true}));
    }, EMAIL);
  });
  passN = await run(browser, 'NEWSLETTER', '/', 'form.framer-1yovbvh', async page => {
    await page.evaluate(e => {
      const f = document.querySelector('form.framer-1yovbvh');
      const em = f.querySelector('input[type="email"]');
      em.value = e; em.dispatchEvent(new Event('input',{bubbles:true}));
    }, EMAIL);
  });
} finally {
  await browser.close();
}
console.log(`\nRESULT: contact=${passC?'PASS':'FAIL'}  newsletter=${passN?'PASS':'FAIL'}`);
process.exit(passC && passN ? 0 : 1);
