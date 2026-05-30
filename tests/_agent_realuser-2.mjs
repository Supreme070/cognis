import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
// Keyboard-only: tab through homepage, capture focus ring visibility
await page.goto('https://www.cognis.group/', { waitUntil: 'networkidle' }).catch(()=>{});
await page.waitForTimeout(4000);
const focusInfo = [];
for (let i=0;i<8;i++){
  await page.keyboard.press('Tab');
  await page.waitForTimeout(150);
  const f = await page.evaluate(() => {
    const e = document.activeElement; if(!e) return null;
    const s = getComputedStyle(e);
    return { tag:e.tagName, text:(e.innerText||e.getAttribute('aria-label')||'').slice(0,30), outline:s.outlineStyle+' '+s.outlineWidth+' '+s.outlineColor, boxShadow:(s.boxShadow||'none').slice(0,30) };
  });
  focusInfo.push(f);
}
console.log('KEYBOARD_FOCUS', JSON.stringify(focusInfo,null,1));
await browser.close();
