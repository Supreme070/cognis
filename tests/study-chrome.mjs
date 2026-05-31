import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const B='http://127.0.0.1:3997';
const b = await chromium.launch();
const O='test-results/chrome';
import {mkdirSync} from 'node:fs'; mkdirSync(O,{recursive:true});

// DESKTOP
const ctx = await b.newContext({viewport:{width:1440,height:900}});
const p = await ctx.newPage();
await p.goto(B+'/',{waitUntil:'load'}); await p.waitForTimeout(4500);

// ---- HEADER ----
await p.locator('nav').first().screenshot({path:`${O}/header-desktop.png`}).catch(()=>{});
const header = await p.evaluate(()=>{
  function st(el, props){ if(!el) return null; const c=getComputedStyle(el); const o={}; props.forEach(k=>o[k]=c[k]); const r=el.getBoundingClientRect(); o._box={h:Math.round(r.height),y:Math.round(r.y)}; return o; }
  const nav = document.querySelector('nav');
  const bar = nav ? nav.closest('[data-framer-name]') || nav.parentElement : null;
  const menu = document.querySelector('nav [data-framer-name="menu"]');
  const link = menu ? menu.querySelector('a[href]') : null;
  const linkP = link ? link.querySelector('p') : null;
  // CTA: the Work With Us pill
  let cta=null; document.querySelectorAll('nav a').forEach(a=>{ if(/work with us/i.test(a.textContent||'')) cta=a; });
  return {
    barPos: bar? getComputedStyle(bar).position : null,
    barBg: bar? getComputedStyle(bar).backgroundColor : null,
    barBackdrop: bar? getComputedStyle(bar).backdropFilter||getComputedStyle(bar).webkitBackdropFilter : null,
    barBox: bar? {h:Math.round(bar.getBoundingClientRect().height)}:null,
    menuStyle: st(menu,['display','gap','columnGap','alignItems']),
    linkStyle: st(link,['padding','height','display','alignItems','color']),
    linkPStyle: st(linkP,['fontFamily','fontSize','fontWeight','letterSpacing','textTransform','color','lineHeight']),
    linkText: link? link.textContent.trim():null,
    linkPcount: link? link.querySelectorAll('p').length:0,
    ctaStyle: st(cta,['backgroundColor','color','fontFamily','fontSize','fontWeight','letterSpacing','textTransform','padding','borderRadius']),
    ctaText: cta? cta.textContent.trim():null,
  };
});
// hover animation: capture transform of the inner wrap before/after hover
const hover = await p.evaluate(async ()=>{
  const link = document.querySelector('nav [data-framer-name="menu"] a[href]');
  if(!link) return null;
  const wrap = link.querySelector('div, span'); 
  const before = wrap? getComputedStyle(wrap).transform : null;
  return {before, ps: link.querySelectorAll('p').length, linkHtml: link.outerHTML.slice(0,300)};
});

// ---- FOOTER ----
await p.evaluate(()=>{ const f=document.querySelector('footer'); f&&f.scrollIntoView(); });
await p.waitForTimeout(1200);
await p.locator('footer').first().screenshot({path:`${O}/footer-desktop.png`}).catch(()=>{});
const footer = await p.evaluate(()=>{
  const f = document.querySelector('footer');
  if(!f) return null;
  const cs = getComputedStyle(f);
  // collect link columns: groups of links with headings
  const links = [...f.querySelectorAll('a[href]')].map(a=>({t:a.textContent.trim().slice(0,30), href:a.getAttribute('href')})).filter(x=>x.t);
  const headings = [...f.querySelectorAll('h1,h2,h3,h4,h5,h6,p')].map(h=>h.textContent.trim()).filter(t=>t && t.length<40).slice(0,30);
  return { bg:cs.backgroundColor, color:cs.color, padding:cs.padding, box:{h:Math.round(f.getBoundingClientRect().height)}, linkCount:links.length, links:links.slice(0,40), texts:headings };
});
writeFileSync(`${O}/study.json`, JSON.stringify({header, hover, footer}, null, 2));
await ctx.close();

// MOBILE header + footer
const m = await b.newContext({viewport:{width:390,height:844}});
const mp = await m.newPage();
await mp.goto(B+'/',{waitUntil:'load'}); await mp.waitForTimeout(4000);
await mp.screenshot({path:`${O}/mobile-top.png`});
await mp.evaluate(()=>{const f=document.querySelector('footer');f&&f.scrollIntoView();}); await mp.waitForTimeout(1000);
await mp.screenshot({path:`${O}/mobile-footer.png`,fullPage:false});
await m.close();
await b.close();
console.log('study done');
