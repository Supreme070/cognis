import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:3001/about-us?cb=' + Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
await p.waitForTimeout(5000);
const section = await p.locator('section:has-text("Meet our team")').first();
await section.scrollIntoViewIfNeeded();
await p.waitForTimeout(1500);
// clip to section
const box = await section.boundingBox();
await p.screenshot({path: 'playwright-screenshots/meet-team.png', clip: box});
console.log('section bounds:', box);
await b.close();
