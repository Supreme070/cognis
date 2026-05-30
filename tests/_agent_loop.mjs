import { chromium } from 'playwright';
const BASE = 'https://www.cognis.group';
const path = process.env.LOOPPATH || process.argv[2] || '/blog/';
const browser = await chromium.launch({ executablePath: 'C:\\Users\\supre\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const navs = [];
page.on('framenavigated', f => { if (f === page.mainFrame()) navs.push({ t: Date.now(), url: f.url() }); });
const t0 = Date.now();
await page.goto(BASE + path, { waitUntil: 'commit', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(12000);
const rel = navs.map(n => ({ ms: n.t - t0, url: n.url.replace(BASE,'') || '/' }));
console.log('PATH', path, 'navCount', navs.length);
console.log(JSON.stringify(rel.slice(0,40)));
// is it a loop? count distinct transitions in last 8s
const late = navs.filter(n => n.t - t0 > 4000);
console.log('navs after 4s (steady-state):', late.length, '=> LOOPING' );
await browser.close();
