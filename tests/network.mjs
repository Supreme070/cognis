import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileUrl = 'file://' + path.join(__dirname, '..', 'aeline_framer_website.html');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const requests = [];
page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), type: r.resourceType() }));

await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);

const external = requests.filter((r) => !r.url.startsWith('file://'));
console.log('Total requests:', requests.length);
console.log('External requests:', external.length);
console.log(JSON.stringify(external, null, 2));

await browser.close();
