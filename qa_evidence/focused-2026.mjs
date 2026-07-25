import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('qa_evidence/2026-07-25/focused');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: false, slowMo: 50 });
const report = { console: [], landing: {}, interactions: {} };
const style = e => {
  const s = getComputedStyle(e), r = e.getBoundingClientRect();
  return { tag:e.tagName, cls:e.className, text:(e.textContent||'').trim().slice(0,100),
    top:r.top, left:r.left, width:r.width, height:r.height, position:s.position,
    background:s.backgroundColor, color:s.color, transform:s.transform, shadow:s.boxShadow,
    opacity:s.opacity, border:s.border };
};
function watch(page, label) {
  page.on('console', m => { if (m.type()==='error') report.console.push({label, text:m.text()}); });
  page.on('pageerror', e => report.console.push({label, text:e.message}));
}
async function firstVisible(page, selector) {
  const set = page.locator(selector);
  for (let i=0;i<await set.count();i++) if (await set.nth(i).isVisible().catch(()=>false)) return set.nth(i);
  throw new Error(`No visible match: ${selector}`);
}

for (const [name, viewport] of Object.entries({
  desktop: {width:1440,height:900}, mobile:{width:390,height:844}
})) {
  const c = await browser.newContext({viewport});
  const p = await c.newPage(); watch(p, `landing-${name}`);
  await p.goto('http://127.0.0.1:8099/', {waitUntil:'networkidle'});
  await p.waitForTimeout(1000);
  await p.evaluate(() => {
    const candidates=[...document.querySelectorAll('body *')].filter(e=>{
      const s=getComputedStyle(e),r=e.getBoundingClientRect();
      return (s.position==='fixed'||s.position==='sticky') && r.width>innerWidth*.6 && r.height>30 && r.height<180 && r.bottom>0 && r.top<100;
    });
    (candidates.sort((a,b)=>a.getBoundingClientRect().height-b.getBoundingClientRect().height)[0]||document.body).setAttribute('data-qa-visible-header','');
  });
  const visibleHeader = p.locator('[data-qa-visible-header]');
  const before = await visibleHeader.evaluate(style);
  await p.screenshot({path:path.join(out,`landing-${name}__top.png`)});
  await p.mouse.wheel(0, 1500); await p.waitForTimeout(900);
  const after = await visibleHeader.evaluate(style);
  const scrollY = await p.evaluate(()=>scrollY);
  await p.screenshot({path:path.join(out,`landing-${name}__scrolled.png`)});
  report.landing[name]={before,after,scrollY,bodyWidth:await p.evaluate(()=>document.body.scrollWidth)};
  await c.close();
}

async function interaction(label, url, findTarget, wholeTarget) {
  const c = await browser.newContext({viewport:{width:1440,height:900}});
  const p = await c.newPage(); watch(p,label);
  await p.goto(url,{waitUntil:'networkidle',timeout:60000}); await p.waitForTimeout(1500);
  const target = await findTarget(p);
  await target.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  const box = wholeTarget ? await wholeTarget(target) : target;
  const before = await box.evaluate(style);
  await p.screenshot({path:path.join(out,`${label}__before.png`)});
  await target.hover(); await p.waitForTimeout(800);
  const after = await box.evaluate(style);
  await p.screenshot({path:path.join(out,`${label}__after.png`)});
  report.interactions[label]={before,after,target:await target.evaluate(style)};
  await c.close();
}
const byText = async (p, re) => {
  const set=p.getByRole('link',{name:re});
  for(let i=0;i<await set.count();i++) if(await set.nth(i).isVisible().catch(()=>false)) return set.nth(i);
  throw new Error(`No visible link ${re}`);
};
await interaction('local-hero-cta','http://127.0.0.1:8099/',p=>byText(p,/start the conversation|work with us/i));
await interaction('aeline-hero-cta','https://aeline.webflow.io',p=>byText(p,/get started|start/i));
await interaction('local-blog-whole-card','http://127.0.0.1:8099/blog/',
  p=>firstVisible(p,'a[href*="/blog/"]'),
  async a=>a);
await interaction('aeline-service-whole-card','https://aeline.webflow.io',
  async p=>{ const set=p.getByText('AI strategy',{exact:true}); for(let i=0;i<await set.count();i++) if(await set.nth(i).isVisible().catch(()=>false)) return set.nth(i); throw new Error('No AI strategy card'); },
  async t=>t.locator('xpath=ancestor::*[self::a or contains(@class,"card")][1]'));

await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
await browser.close();
console.log(JSON.stringify(report,null,2));
