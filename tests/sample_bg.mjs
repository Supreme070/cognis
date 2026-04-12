import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);

// Sample color at center-left and center-right of each image
const samples = await p.evaluate(async () => {
  const results = {};
  for (const key of ['QnjDKI0euXnnnPi4GtTEaqYDJLo', 'QTiI3J2XXGOwJw3fyXhxuB92fl0']) {
    const img = document.querySelector(`img[src*="${key}"]`);
    if (!img) { results[key] = null; continue; }
    await img.decode().catch(()=>{});
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    // sample vertical center row, 5% from left, 95% from left
    const midY = Math.floor(img.naturalHeight / 2);
    const x1 = Math.floor(img.naturalWidth * 0.03);
    const x2 = Math.floor(img.naturalWidth * 0.97);
    const sample = (x, y) => {
      const d = ctx.getImageData(x, y, 1, 1).data;
      return `rgb(${d[0]}, ${d[1]}, ${d[2]})`;
    };
    results[key] = {
      left: sample(x1, midY),
      right: sample(x2, midY),
      top: sample(Math.floor(img.naturalWidth/2), Math.floor(img.naturalHeight*0.03)),
    };
  }
  return results;
});
console.log(JSON.stringify(samples, null, 2));
await b.close();
