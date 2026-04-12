import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
await p.goto('http://127.0.0.1:3001/contact?cb=' + Date.now(), { waitUntil: 'networkidle' });
await p.waitForTimeout(5000);
const info = await p.evaluate(() => {
  const forms = Array.from(document.querySelectorAll('form'));
  return forms.map(f => ({
    action: f.getAttribute('action') || '',
    method: f.getAttribute('method') || '',
    inputs: Array.from(f.querySelectorAll('input, textarea, select')).map(el => ({
      name: el.getAttribute('name') || '',
      type: el.getAttribute('type') || el.tagName.toLowerCase(),
    })),
  }));
});
console.log('forms on /contact:');
console.log(JSON.stringify(info, null, 2));
console.log('errs:', errs.length);
errs.forEach(e => console.log('  ERR:', e));
const web3 = info.filter(f => /web3forms/i.test(f.action));
console.log('web3forms-wired:', web3.length);
const hasEmail = web3.some(f => f.inputs.some(i => i.type === 'email' || i.name === 'email'));
console.log('has-email-input:', hasEmail);
const hasAccessKey = web3.some(f => f.inputs.some(i => i.name === 'access_key'));
console.log('has-access_key:', hasAccessKey);
await b.close();
