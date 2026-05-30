import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const EXE = 'C:\\Users\\supre\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const BASE = 'https://www.cognis.group';
const OUT = 'test-results/site-audit/evidence/ux-a11y';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE });
const result = {};

// products page at mobile width: is there any way to navigate? (custom header hides links)
{
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true });
  const page = await ctx.newPage();
  await page.goto(BASE+'/products/', { waitUntil:'domcontentloaded', timeout:45000 }).catch(()=>{});
  await page.waitForTimeout(2000);
  await page.screenshot({ path:`${OUT}/mobile-products-header.png` });
  result.productsMobile = await page.evaluate(() => {
    const nav = document.querySelector('header.site-nav nav');
    const links = nav ? [...nav.querySelectorAll('a')] : [];
    const visibleLinks = links.filter(a => a.offsetParent!==null && getComputedStyle(a).display!=='none');
    const hamburger = [...document.querySelectorAll('button, [role="button"], [aria-label*="menu" i], [class*="menu" i], [class*="burger" i], [class*="hamburger" i]')].filter(b=>b.offsetParent!==null);
    return { totalNavLinks: links.length, visibleNavLinks: visibleLinks.map(a=>a.textContent.trim()), hamburgerCandidates: hamburger.length };
  });
}

// global Framer header at mobile width (home): is there a hamburger?
{
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true });
  const page = await ctx.newPage();
  await page.goto(BASE+'/', { waitUntil:'domcontentloaded', timeout:45000 }).catch(()=>{});
  await page.waitForTimeout(3000);
  await page.screenshot({ path:`${OUT}/mobile-home-header.png` });
  result.homeMobile = await page.evaluate(() => {
    const burger = [...document.querySelectorAll('[aria-label*="menu" i],[class*="menu" i],[class*="burger" i],button')].filter(b=>b.offsetParent!==null).slice(0,6).map(b=>({tag:b.tagName,al:b.getAttribute('aria-label'),cls:(b.className||'').toString().slice(0,40)}));
    return { topElements: burger };
  });
}

// contrast: products eyebrow + global header link text color
{
  const ctx = await browser.newContext({ viewport:{width:1440,height:900} });
  const page = await ctx.newPage();
  await page.goto(BASE+'/products/', { waitUntil:'domcontentloaded', timeout:45000 }).catch(()=>{});
  await page.waitForTimeout(1500);
  result.productsContrast = await page.evaluate(() => {
    const get = sel => { const e=document.querySelector(sel); if(!e) return null; const cs=getComputedStyle(e); return { color:cs.color, bg:cs.backgroundColor }; };
    return { eyebrow:get('.eyebrow'), navLink:get('header.site-nav nav a'), kicker:get('.kicker') };
  });
  await ctx.close();
}

writeFileSync(`${OUT}/a11y-mobile.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
