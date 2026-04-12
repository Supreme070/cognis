import { chromium } from 'playwright';

const SITE = 'https://cognis.pages.dev';
const SCREENSHOT_DIR = '/Users/supreme/Desktop/cognis/playwright-screenshots';
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
];

// ── Report data ──────────────────────────────────────────────────────
const report = {
  pages: [],           // per-page results
  logoTests: [],       // logo-click-back results
  linkChecks: [],      // internal link 404 checks
  consoleErrors: [],   // all console errors across pages
  networkErrors: [],   // 404 / failed requests
};

function ms(t) { return `${Math.round(t)}ms`; }

async function sleep(page, t) { await page.waitForTimeout(t); }

// ── Main ─────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
  console.log(`${'='.repeat(70)}`);

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    userAgent: vp.name === 'mobile'
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      : undefined,
  });
  const page = await context.newPage();

  // Collect console errors & network failures globally
  const pageConsoleErrors = [];
  const pageNetworkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text().slice(0, 300);
      pageConsoleErrors.push(text);
    }
  });
  page.on('pageerror', err => {
    pageConsoleErrors.push(`[pageerror] ${err.message.slice(0, 300)}`);
  });
  page.on('response', resp => {
    if (resp.status() >= 400) {
      pageNetworkErrors.push({ url: resp.url(), status: resp.status() });
    }
  });

  // ── 1. Load homepage ──────────────────────────────────────────────
  console.log(`\n  Loading homepage: ${SITE}`);
  const t0 = performance.now();
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(page, 2000); // let SPA hydrate
  const homeLoadTime = performance.now() - t0;
  console.log(`  Homepage loaded in ${ms(homeLoadTime)}`);

  await page.screenshot({
    path: `${SCREENSHOT_DIR}/audit-homepage-${vp.name}.png`,
    fullPage: true,
  });

  // ── 2. Discover all nav links ─────────────────────────────────────
  const navLinks = await page.evaluate(() => {
    // Framer sites use <nav> or header-level links
    const anchors = Array.from(document.querySelectorAll('nav a, header a'));
    const seen = new Set();
    const results = [];
    for (const a of anchors) {
      const href = a.getAttribute('href');
      if (!href) continue;
      // Skip external, mailto, tel, anchor-only links
      if (href.startsWith('http') && !href.includes('cognis.pages.dev')) continue;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      if (href === '#' || href === '') continue;
      const label = a.innerText.trim().slice(0, 60) || href;
      const key = href;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ href, label });
    }
    return results;
  });

  console.log(`\n  Found ${navLinks.length} nav links:`);
  navLinks.forEach(l => console.log(`    - [${l.label}] -> ${l.href}`));

  // If no nav links found, also try to discover routes from all <a> tags
  if (navLinks.length === 0) {
    console.log('  No nav links found, scanning all page links...');
    const allLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      const seen = new Set();
      const results = [];
      for (const a of anchors) {
        const href = a.getAttribute('href');
        if (!href) continue;
        if (href.startsWith('http') && !href.includes('cognis.pages.dev')) continue;
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') continue;
        if (seen.has(href)) continue;
        seen.add(href);
        results.push({ href, label: a.innerText.trim().slice(0, 60) || href });
      }
      return results;
    });
    navLinks.push(...allLinks);
    console.log(`  Found ${allLinks.length} links from full page scan`);
    allLinks.forEach(l => console.log(`    - [${l.label}] -> ${l.href}`));
  }

  // ── 3. Visit each page via nav click ──────────────────────────────
  for (const link of navLinks) {
    const pageResult = {
      viewport: vp.name,
      label: link.label,
      href: link.href,
      loadTime: null,
      consoleErrors: [],
      networkErrors: [],
      hasContent: false,
      navVisible: false,
      screenshotPath: null,
    };

    console.log(`\n  ── Navigating to: [${link.label}] (${link.href}) ──`);

    // Clear per-page error tracking
    const errsBefore = pageConsoleErrors.length;
    const netErrsBefore = pageNetworkErrors.length;

    // Navigate back to homepage first so we can click the nav link
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(page, 1500);

    // Find and click the link
    const startTime = performance.now();
    let navigated = false;

    try {
      // Try clicking the nav link by href
      const selector = `nav a[href="${link.href}"], header a[href="${link.href}"]`;
      const el = await page.$(selector);
      if (el) {
        // For Framer SPA: watch for URL change or DOM mutation
        const urlBefore = page.url();
        await el.click();

        // Wait for either URL change or content change (SPA routing)
        try {
          await Promise.race([
            page.waitForURL(url => url.toString() !== urlBefore, { timeout: 8000 }),
            page.waitForTimeout(3000),
          ]);
        } catch (_) { /* timeout is ok for SPA */ }

        await sleep(page, 2000); // let SPA content render
        navigated = true;
      } else {
        // Fallback: if it's an absolute path, just goto it
        const fullUrl = link.href.startsWith('http')
          ? link.href
          : link.href.startsWith('/')
            ? `${SITE}${link.href}`
            : `${SITE}/${link.href.replace(/^\.\//, '')}`;
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await sleep(page, 2000);
        navigated = true;
      }
    } catch (err) {
      console.log(`    ERROR navigating: ${err.message.slice(0, 200)}`);
    }

    const loadTime = performance.now() - startTime;
    pageResult.loadTime = loadTime;

    if (navigated) {
      // Current URL
      const currentUrl = page.url();
      console.log(`    URL: ${currentUrl}`);
      console.log(`    Load time: ${ms(loadTime)}`);

      // Check for meaningful content
      const contentCheck = await page.evaluate(() => {
        const body = document.body;
        const text = body?.innerText?.trim() || '';
        const h1 = document.querySelector('h1')?.innerText?.trim()?.slice(0, 100) || '(no h1)';
        const images = document.querySelectorAll('img').length;
        const videos = document.querySelectorAll('video').length;
        return { textLen: text.length, h1, images, videos };
      });
      pageResult.hasContent = contentCheck.textLen > 50;
      console.log(`    Content: ${contentCheck.textLen} chars, h1="${contentCheck.h1}", ${contentCheck.images} images, ${contentCheck.videos} videos`);
      console.log(`    Has meaningful content: ${pageResult.hasContent}`);

      // Check nav is still visible
      const navCheck = await page.evaluate(() => {
        const nav = document.querySelector('nav') || document.querySelector('header');
        if (!nav) return { visible: false, reason: 'no nav/header element' };
        const rect = nav.getBoundingClientRect();
        const style = window.getComputedStyle(nav);
        return {
          visible: rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
          height: rect.height,
        };
      });
      pageResult.navVisible = navCheck.visible;
      console.log(`    Nav visible: ${navCheck.visible} (height: ${navCheck.height || 0}px)`);

      // Collect page-specific errors
      pageResult.consoleErrors = pageConsoleErrors.slice(errsBefore);
      pageResult.networkErrors = pageNetworkErrors.slice(netErrsBefore);
      if (pageResult.consoleErrors.length > 0) {
        console.log(`    Console errors: ${pageResult.consoleErrors.length}`);
        pageResult.consoleErrors.forEach(e => console.log(`      - ${e.slice(0, 150)}`));
      }
      if (pageResult.networkErrors.length > 0) {
        console.log(`    Network errors: ${pageResult.networkErrors.length}`);
        pageResult.networkErrors.forEach(e => console.log(`      - ${e.status} ${e.url.slice(0, 150)}`));
      }

      // Screenshot
      const safeName = link.label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 40) || 'unknown';
      const ssPath = `${SCREENSHOT_DIR}/audit-page-${safeName}-${vp.name}.png`;
      await page.screenshot({ path: ssPath, fullPage: true });
      pageResult.screenshotPath = ssPath;
      console.log(`    Screenshot: ${ssPath}`);

      // ── Collect ALL internal links on this page for 404 checking ──
      const internalLinks = await page.evaluate((siteBase) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        const links = [];
        for (const a of anchors) {
          const href = a.href; // resolved absolute URL
          if (!href) continue;
          if (href.startsWith(siteBase) || href.startsWith('/')) {
            links.push(href);
          }
        }
        return [...new Set(links)];
      }, SITE);

      for (const iLink of internalLinks) {
        // Only check links we haven't already checked
        if (report.linkChecks.find(c => c.url === iLink)) continue;
        try {
          const resp = await page.request.head(iLink, { timeout: 10000 });
          const status = resp.status();
          if (status >= 400) {
            report.linkChecks.push({ url: iLink, status, from: link.label, viewport: vp.name });
            console.log(`    BROKEN LINK: ${status} ${iLink}`);
          } else {
            report.linkChecks.push({ url: iLink, status, from: link.label, viewport: vp.name });
          }
        } catch (err) {
          report.linkChecks.push({ url: iLink, status: 'TIMEOUT', from: link.label, viewport: vp.name });
          console.log(`    LINK TIMEOUT: ${iLink}`);
        }
      }
    }

    report.pages.push(pageResult);

    // ── 6. Click LOGO to go back to homepage ────────────────────────
    console.log(`\n    Clicking logo to return to homepage...`);
    const logoResult = {
      viewport: vp.name,
      fromPage: link.label,
      returnTime: null,
      heroVideoPlaying: false,
      heroVideoDelay: null,
      flashDetected: false,
    };

    const logoStart = performance.now();
    try {
      // Find the logo — typically first link in header/nav pointing to / or homepage
      const logoClicked = await page.evaluate(() => {
        // Strategy 1: look for a link wrapping an img/svg in header/nav
        const headerLinks = Array.from(document.querySelectorAll('header a, nav a'));
        for (const a of headerLinks) {
          const href = a.getAttribute('href');
          // Logo link typically points to /, ./, or the homepage
          if (href === '/' || href === './' || href === '' || href === '#' ||
              (href && href.endsWith('.dev/')) || (href && href.endsWith('.dev'))) {
            // Check if it contains an image or SVG (logo indicator)
            if (a.querySelector('img, svg') || a.children.length === 0) {
              a.click();
              return true;
            }
          }
        }
        // Strategy 2: just click the first link in the header
        const firstHeaderLink = document.querySelector('header a, nav a');
        if (firstHeaderLink) {
          firstHeaderLink.click();
          return true;
        }
        return false;
      });

      if (logoClicked) {
        // Wait for navigation (SPA style)
        try {
          await Promise.race([
            page.waitForURL(url => {
              const u = url.toString();
              return u === SITE + '/' || u === SITE || u.endsWith('.dev/') || u.endsWith('.dev');
            }, { timeout: 8000 }),
            page.waitForTimeout(3000),
          ]);
        } catch (_) {}

        // Immediate screenshot
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/audit-logo-return-immediate-${link.label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 30)}-${vp.name}.png`,
        });

        const returnTime = performance.now() - logoStart;
        logoResult.returnTime = returnTime;
        console.log(`    Return time: ${ms(returnTime)}`);

        // Check hero video state immediately
        const videoCheck1 = await page.evaluate(() => {
          const video = document.querySelector('video');
          if (!video) return { exists: false };
          return {
            exists: true,
            paused: video.paused,
            currentTime: video.currentTime,
            readyState: video.readyState,
            src: video.src?.slice(0, 100) || video.querySelector('source')?.src?.slice(0, 100),
          };
        });
        console.log(`    Hero video (immediate): ${JSON.stringify(videoCheck1)}`);

        // Wait 2 seconds and check again
        await sleep(page, 2000);

        const videoCheck2 = await page.evaluate(() => {
          const video = document.querySelector('video');
          if (!video) return { exists: false };
          return {
            exists: true,
            paused: video.paused,
            currentTime: video.currentTime,
            readyState: video.readyState,
          };
        });
        console.log(`    Hero video (after 2s): ${JSON.stringify(videoCheck2)}`);

        // After-2s screenshot
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/audit-logo-return-2s-${link.label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 30)}-${vp.name}.png`,
        });

        if (videoCheck1.exists) {
          logoResult.heroVideoPlaying = !videoCheck2.paused;
          if (videoCheck1.paused && !videoCheck2.paused) {
            logoResult.heroVideoDelay = 'Video started playing between 0-2s after return';
          } else if (!videoCheck1.paused) {
            logoResult.heroVideoDelay = 'Video playing immediately on return';
          } else {
            logoResult.heroVideoDelay = 'Video still paused after 2s';
          }
        } else {
          logoResult.heroVideoDelay = 'No video element found';
        }

        // Check for rendering flash — compare immediate vs 2s screenshots
        // We approximate by checking if page content looks settled
        const renderCheck = await page.evaluate(() => {
          const body = document.body;
          const text = body?.innerText?.length || 0;
          const h1 = document.querySelector('h1')?.innerText?.slice(0, 80) || '(none)';
          return { textLen: text, h1 };
        });
        console.log(`    Homepage content after return: ${renderCheck.textLen} chars, h1="${renderCheck.h1}"`);
        logoResult.flashDetected = renderCheck.textLen < 100; // suspiciously little content = possible flash
      } else {
        console.log(`    Could not find logo to click`);
        logoResult.returnTime = null;
      }
    } catch (err) {
      console.log(`    Logo click error: ${err.message.slice(0, 200)}`);
    }

    report.logoTests.push(logoResult);
  }

  // ── Also try direct URL access for known Framer routes ────────────
  const knownRoutes = ['/about-us', '/our-services', '/blog', '/contact', '/pricing'];
  console.log(`\n  ── Testing direct URL access for known routes ──`);
  for (const route of knownRoutes) {
    const fullUrl = `${SITE}${route}`;
    // Skip if we already visited via nav
    if (report.pages.find(p => p.href === route || p.href === `.${route}` || p.href === `${SITE}${route}`)) {
      console.log(`  Already tested ${route} via nav, skipping direct test`);
      continue;
    }
    console.log(`  Testing direct URL: ${fullUrl}`);
    try {
      const t = performance.now();
      const resp = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
      await sleep(page, 2000);
      const elapsed = performance.now() - t;
      const status = resp?.status() || 'unknown';
      const content = await page.evaluate(() => ({
        textLen: document.body?.innerText?.trim()?.length || 0,
        h1: document.querySelector('h1')?.innerText?.trim()?.slice(0, 80) || '(none)',
        title: document.title,
      }));
      console.log(`    Status: ${status}, Load: ${ms(elapsed)}, Content: ${content.textLen} chars, h1="${content.h1}", title="${content.title}"`);
      const safeName = route.replace(/\//g, '-').replace(/^-/, '') || 'root';
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/audit-direct-${safeName}-${vp.name}.png`,
        fullPage: true,
      });

      report.pages.push({
        viewport: vp.name,
        label: `(direct) ${route}`,
        href: fullUrl,
        loadTime: elapsed,
        consoleErrors: [],
        networkErrors: [],
        hasContent: content.textLen > 50,
        navVisible: true,
        screenshotPath: `${SCREENSHOT_DIR}/audit-direct-${safeName}-${vp.name}.png`,
        directAccess: true,
        httpStatus: status,
      });
    } catch (err) {
      console.log(`    FAILED: ${err.message.slice(0, 200)}`);
    }
  }

  await page.close();
  await context.close();
}

await browser.close();

// ── FINAL REPORT ─────────────────────────────────────────────────────
console.log('\n');
console.log('='.repeat(70));
console.log('  FULL AUDIT REPORT');
console.log('='.repeat(70));

console.log('\n-- PAGES VISITED --');
for (const p of report.pages) {
  const status = p.hasContent ? 'OK' : 'WARNING: low content';
  const navStatus = p.navVisible ? 'nav OK' : 'NAV MISSING';
  console.log(`  [${p.viewport}] ${p.label} (${p.href})`);
  console.log(`    Load: ${ms(p.loadTime || 0)} | Content: ${status} | ${navStatus}`);
  if (p.httpStatus) console.log(`    HTTP Status: ${p.httpStatus}`);
  if (p.consoleErrors?.length) console.log(`    Console errors: ${p.consoleErrors.length}`);
  if (p.networkErrors?.length) console.log(`    Network errors: ${p.networkErrors.length}`);
  if (p.screenshotPath) console.log(`    Screenshot: ${p.screenshotPath}`);
}

console.log('\n-- LOGO CLICK TESTS --');
for (const l of report.logoTests) {
  console.log(`  [${l.viewport}] From "${l.fromPage}":`);
  console.log(`    Return time: ${l.returnTime ? ms(l.returnTime) : 'FAILED'}`);
  console.log(`    Video: ${l.heroVideoDelay}`);
  console.log(`    Flash detected: ${l.flashDetected}`);
}

console.log('\n-- BROKEN LINKS (404+) --');
const brokenLinks = report.linkChecks.filter(c => c.status >= 400 || c.status === 'TIMEOUT');
if (brokenLinks.length === 0) {
  console.log('  No broken links found!');
} else {
  for (const bl of brokenLinks) {
    console.log(`  [${bl.status}] ${bl.url} (found on: ${bl.from}, viewport: ${bl.viewport})`);
  }
}

console.log('\n-- ALL LINK CHECK SUMMARY --');
const totalLinks = report.linkChecks.length;
const okLinks = report.linkChecks.filter(c => c.status >= 200 && c.status < 400).length;
console.log(`  Total internal links checked: ${totalLinks}`);
console.log(`  OK (2xx/3xx): ${okLinks}`);
console.log(`  Broken (4xx+): ${brokenLinks.length}`);

console.log('\n-- SUMMARY --');
const totalPages = [...new Set(report.pages.map(p => p.href))].length;
const pagesWithErrors = report.pages.filter(p => (p.consoleErrors?.length || 0) > 0).length;
const pagesLowContent = report.pages.filter(p => !p.hasContent).length;
const pagesNavMissing = report.pages.filter(p => !p.navVisible).length;
console.log(`  Total unique pages tested: ${totalPages}`);
console.log(`  Pages with console errors: ${pagesWithErrors}`);
console.log(`  Pages with low content (possible blank): ${pagesLowContent}`);
console.log(`  Pages with missing nav: ${pagesNavMissing}`);
console.log(`  Broken links: ${brokenLinks.length}`);
console.log(`  Logo return tests: ${report.logoTests.length}`);
console.log(`\n  Audit complete.`);
