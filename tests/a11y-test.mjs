import { chromium } from 'playwright';
const b = await chromium.launch();
for (const path of ['/products/','/']) {
  const ctx = await b.newContext({viewport:{width:1280,height:850}});
  const p = await ctx.newPage();
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,80));});
  await p.goto('http://127.0.0.1:3997'+path,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3500);
  // keyboard: first Tab should focus the skip link
  await p.keyboard.press('Tab');
  const focused = await p.evaluate(()=>{ const a=document.activeElement; return {cls:a.className, text:(a.textContent||'').slice(0,30), visible: a.className==='cognis-skip' ? getComputedStyle(a).transform : null}; });
  // axe-core
  await p.addScriptTag({url:'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js'}).catch(()=>{});
  const axe = await p.evaluate(async()=>{ if(!window.axe) return {err:'axe not loaded'}; const r= await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}); return { violations: r.violations.length, critical: r.violations.filter(v=>v.impact==='critical').length, serious: r.violations.filter(v=>v.impact==='serious').length, top: r.violations.slice(0,6).map(v=>`${v.impact}:${v.id}(${v.nodes.length})`) }; });
  const skip = await p.evaluate(()=>{ const s=document.querySelector('a.cognis-skip'); const m=document.querySelector('#'+ (s? s.getAttribute('href').slice(1):'x')); return {skipPresent:!!s, target:!!m, mainTabindex: m?m.getAttribute('tabindex'):null}; });
  console.log(`\n=== ${path} ===`);
  console.log('  first-Tab focuses skip link:', JSON.stringify(focused));
  console.log('  skip link wiring:', JSON.stringify(skip));
  console.log('  axe (wcag2a/aa+):', JSON.stringify(axe));
  console.log('  console errors:', errs.length);
  await ctx.close();
}
await b.close();
