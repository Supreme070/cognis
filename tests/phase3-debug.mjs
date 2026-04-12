import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('console', m => console.log('[' + m.type() + ']', m.text().slice(0, 200)));
await p.goto('http://127.0.0.1:3001/blog/ai-ready-workforce-training?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);

const postHydrate = await p.evaluate(() => {
  const hrefs = Array.from(document.querySelectorAll('a.framer-1kqwkg9'))
    .map(a => ({ href: a.getAttribute('href'), visible: a.getBoundingClientRect().width > 0 }));
  return {
    deferredSlug: window.__cognisDeferredBlogSlug,
    anchorHrefs: hrefs,
    matchCount: document.querySelectorAll('a.framer-1kqwkg9[href$="/blog/ai-agents-new-operating-system"]').length,
  };
});
console.log('POST HYDRATE:', JSON.stringify(postHydrate, null, 2));

await p.waitForTimeout(5000);
const final = await p.evaluate(() => ({
  pathname: location.pathname,
  title: document.title,
  h1: document.querySelector('h1')?.innerText?.replace(/\s+/g, ' ').trim(),
}));
console.log('FINAL:', JSON.stringify(final, null, 2));
await b.close();
