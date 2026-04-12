import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
const routes = [
  '/teams/supreme-oyewumi',
  '/teams/kola-olatunde',
  '/teams/fisayo-oludare',
  '/our-services/ai-training-workforce-development',
  '/our-services/ai-agent-automation-engineering',
  '/our-services/ai-advisory-strategy',
];
for (const r of routes) {
  await p.goto('http://127.0.0.1:3001'+r+'?cb='+Date.now(), {waitUntil:'domcontentloaded', timeout:60000});
  await p.waitForTimeout(7000);
  const info = await p.evaluate(() => ({
    path: location.pathname,
    h1: document.querySelector('h1')?.innerText?.slice(0,80),
    title: document.title.slice(0,80),
  }));
  console.log(r, '=>', JSON.stringify(info));
}
await b.close();
