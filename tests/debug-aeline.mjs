import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileUrl = 'file://' + path.join(__dirname, '..', 'aeline_framer_website.html');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2500);

const result = await page.evaluate(() => {
  const out = { hits: [], cognisHits: [] };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.nodeValue;
    if (/Aeline|Ailine/.test(t)) {
      let el = node.parentElement;
      const parentTag = el ? el.outerHTML.slice(0, 200) : '';
      out.hits.push({ text: t.trim(), parent: parentTag });
    }
    if (/Cognis/.test(t)) {
      let el = node.parentElement;
      out.cognisHits.push({ text: t.trim(), parentTag: el ? el.tagName : '', dataFramerName: el?.closest('[data-framer-name]')?.getAttribute('data-framer-name') || null });
    }
  }
  return out;
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
