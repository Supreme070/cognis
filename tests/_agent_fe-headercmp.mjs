import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/fe-network';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

// Global header (home) desktop
await p.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
await p.waitForTimeout(2000);
await p.screenshot({ path: out + '/header-global-desktop.png', clip: { x:0, y:0, width:1440, height:120 } });

// Products header desktop
await p.goto(BASE + '/products/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
await p.waitForTimeout(1500);
await p.screenshot({ path: out + '/header-products-desktop.png', clip: { x:0, y:0, width:1440, height:120 } });

// Mobile 390
await ctx2_run();
async function ctx2_run() {
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  const m = await ctx2.newPage();
  await m.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
  await m.waitForTimeout(2000);
  await m.screenshot({ path: out + '/header-global-mobile.png', clip: { x:0, y:0, width:390, height:90 } });
  await m.goto(BASE + '/products/', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
  await m.waitForTimeout(1500);
  await m.screenshot({ path: out + '/header-products-mobile.png', clip: { x:0, y:0, width:390, height:90 } });
  // also count visible nav links on products mobile
  const navLinks = await m.evaluate(() => {
    const links = [...document.querySelectorAll('header.site-nav nav a')];
    return links.map(a => ({ text: a.textContent.trim(), visible: a.offsetParent !== null }));
  });
  console.log('PRODUCTS MOBILE NAV LINKS:', JSON.stringify(navLinks));
  await ctx2.close();
}
await b.close();
