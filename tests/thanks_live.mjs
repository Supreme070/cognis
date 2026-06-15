import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const path of ['/thanks', '/thanks-subscribe']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://cognis.group' + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('load', { timeout: 30000 }).catch(()=>{});
  await page.waitForTimeout(2000);
  const shot = `/tmp/LIVE${path.replace(/\W+/g,'_')}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(()=>null);
  const body = (await page.locator('body').innerText().catch(()=>'')).replace(/\s+/g,' ').slice(0, 300);
  console.log(`\n${path}  (${page.url()})`);
  console.log('  title:', title);
  console.log('  h1   :', h1);
  console.log('  body :', body);
  console.log('  shot :', shot);
  await ctx.close();
}
await browser.close();
