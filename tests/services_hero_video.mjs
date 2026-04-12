import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/our-services?cb='+Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(8000);
const info = await p.evaluate(() => {
  const v = document.querySelector('video[src*="services-hero"]');
  const img = document.querySelector('img[src*="dDHWc7fTUArNa7BYM23naUGmg"]');
  return {hasVideo: !!v, videoRect: v?v.getBoundingClientRect():null, imgHidden: img?img.style.display:null};
});
console.log(JSON.stringify(info, null, 2));
await p.screenshot({path:'playwright-screenshots/services-hero-video.png'});
await b.close();
