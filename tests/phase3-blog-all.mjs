import { chromium } from 'playwright';
const b = await chromium.launch();
const slugs = [
  'why-enterprise-ai-deployments-fail',
  'ai-agents-new-operating-system',
  'ai-ready-workforce-training',
];
const out = [];
for (const slug of slugs) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const pageErrors = [];
  const failedReqs = [];
  p.on('pageerror', e => pageErrors.push(e.message));
  p.on('requestfailed', r => failedReqs.push(r.url()));
  await p.goto(`http://127.0.0.1:3001/blog/${slug}?cb=${Date.now()}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(6000);
  const info = await p.evaluate(() => ({
    url: location.pathname,
    title: document.title,
    h1: document.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim()?.slice(0, 90),
    bodyLen: document.body.innerText.length,
  }));
  await p.screenshot({ path: `playwright-screenshots/blog-${slug}.png`, fullPage: false });
  out.push({ slug, ...info, pageErrors: pageErrors.length, failedReqs: failedReqs.length });
  await p.close();
}
console.log(JSON.stringify(out, null, 2));
await b.close();
