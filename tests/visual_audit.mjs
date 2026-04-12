import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const badImgs = [];
page.on('response', (r) => {
  if (r.status() >= 400 && /\.(png|jpg|jpeg|webp|svg)/.test(r.url())) {
    badImgs.push({ url: r.url(), status: r.status() });
  }
});
await page.goto('http://localhost:8765/cognis_base.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);

const stats = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  const loaded = imgs.filter(i => i.complete && i.naturalWidth > 0);
  const broken = imgs.filter(i => i.complete && i.naturalWidth === 0);
  const sections = Array.from(document.querySelectorAll('section, [data-framer-name]')).map(s => ({
    name: s.getAttribute('data-framer-name') || s.tagName,
    h: s.getBoundingClientRect().height,
    visible: s.getBoundingClientRect().height > 0,
    textLen: (s.innerText||'').length,
  }));
  const bodyText = document.body.innerText;
  return {
    imgs: imgs.length,
    loaded: loaded.length,
    broken: broken.length,
    bodyTextLen: bodyText.length,
    bodyHeight: document.body.scrollHeight,
    brokenSrcs: broken.slice(0, 10).map(i => i.src),
    sections: sections.filter(s => s.textLen < 20 && s.h > 100).slice(0, 10),
  };
});
console.log(JSON.stringify(stats, null, 2));
console.log('badImgs:', badImgs.length);
badImgs.slice(0,5).forEach(b => console.log(' ', b.status, b.url.slice(0,120)));
await browser.close();
