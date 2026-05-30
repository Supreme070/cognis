import { chromium } from 'playwright';
const b = await chromium.launch();
// Fresh context per URL to rule out cross-test contamination
for (const u of ['/about-us/', '/blog/']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const navs = [];
  p.on('framenavigated', (f) => { if (f === p.mainFrame()) navs.push(f.url().replace('https://www.cognis.group','')); });
  try { await p.goto('https://www.cognis.group' + u, { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch(e){}
  await p.waitForTimeout(6000).catch(()=>{});
  const fin = await p.evaluate(() => ({ url: location.pathname, title: document.title })).catch(e=>({err:String(e).slice(0,40)}));
  console.log('FRESH CONTEXT', u, '=> final', JSON.stringify(fin), '| navs:', JSON.stringify(navs));
  await ctx.close();
}
await b.close();
