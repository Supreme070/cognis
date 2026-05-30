import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const out = 'test-results/site-audit/evidence/ux-responsive/scan';
import { mkdirSync } from 'node:fs';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();

async function audit(url, vp, tag) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5500);
  const ev = async (fn, arg) => { for (let i=0;i<3;i++){ try { return await page.evaluate(fn, arg); } catch(e){ await page.waitForTimeout(1200); } } return null; };
  // horizontal overflow check
  const overflow = await ev(() => {
    const de = document.documentElement;
    const res = { scrollW: de.scrollWidth, clientW: de.clientWidth, offenders: [] };
    if (de.scrollWidth > de.clientWidth + 1) {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > de.clientWidth + 2 && r.width > 8 && r.width < 4000) {
          res.offenders.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,60), right: Math.round(r.right), w: Math.round(r.width) });
          if (res.offenders.length >= 6) break;
        }
      }
    }
    return res;
  });
  // find testimonials section
  const testi = await ev(() => {
    const t = document.querySelector('#testimonials');
    if (!t) return null;
    const r = t.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: Math.round(r.height) };
  });
  let testiShot = null;
  if (testi) {
    await ev((y) => window.scrollTo(0, y - 60), testi.top);
    await page.waitForTimeout(2500);
    testiShot = `${out}/testi-${tag}.png`;
    await page.screenshot({ path: testiShot });
  }
  // full footer area
  await ev(() => window.scrollTo(0, document.body.scrollHeight||3000));
  await page.waitForTimeout(2500);
  const footShot = `${out}/foot-${tag}.png`;
  await page.screenshot({ path: footShot });
  console.log(JSON.stringify({ url, vp, tag, overflow, testi, testiShot, footShot }));
  await ctx.close();
}

await audit('/about-us/', { width:1440, height:900 }, 'about-1440');
await audit('/our-services/ai-strategy-advisory/', { width:1440, height:900 }, 'svc-1440');
await audit('/our-services/', { width:1280, height:900 }, 'services-1280');
await audit('/our-services/', { width:834, height:1112 }, 'services-834');
await audit('/about-us/', { width:390, height:844 }, 'about-390');
await audit('/contact/', { width:390, height:844 }, 'contact-390');
await audit('/blog/the-real-roi-of-ai/', { width:390, height:844 }, 'blog-390');
await audit('/blog/the-real-roi-of-ai/', { width:768, height:1024 }, 'blog-768');

await browser.close();
