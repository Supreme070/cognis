/**
 * Comprehensive Visual Audit for https://cognis.pages.dev
 * Tests rendering quality, animations, content, and responsiveness.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const SITE = 'https://cognis.pages.dev';
const SCREENSHOTS = '/Users/supreme/Desktop/cognis/playwright-screenshots';

const report = {
  timestamp: new Date().toISOString(),
  desktop: {},
  mobile: {},
  issues: [],
  warnings: [],
  passed: [],
};

function log(msg) { console.log(`[AUDIT] ${msg}`); }
function issue(msg) { report.issues.push(msg); console.log(`  [ISSUE] ${msg}`); }
function warn(msg) { report.warnings.push(msg); console.log(`  [WARN]  ${msg}`); }
function pass(msg) { report.passed.push(msg); console.log(`  [PASS]  ${msg}`); }

async function slowScroll(page, stepPx = 300, delayMs = 400) {
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  let scrolled = 0;
  while (scrolled < totalHeight) {
    scrolled += stepPx;
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), scrolled);
    await page.waitForTimeout(delayMs);
  }
  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(500);
}

async function auditViewport(browser, viewportName, width, height) {
  log(`--- ${viewportName} (${width}x${height}) ---`);
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  // Track network failures
  const failedRequests = [];
  page.on('requestfailed', (req) => {
    failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
  });
  const responseErrors = [];
  page.on('response', (resp) => {
    if (resp.status() >= 400) {
      responseErrors.push({ url: resp.url(), status: resp.status() });
    }
  });

  // 1. Navigate and wait for hydration
  log('Navigating to site...');
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
  log('Network idle reached. Waiting 3s for Framer animations...');
  await page.waitForTimeout(3000);

  // 2. Scroll through entire page to trigger intersection-observer animations
  log('Scrolling through entire page...');
  await slowScroll(page, 300, 350);
  // Wait for animations to settle after full scroll
  await page.waitForTimeout(2000);

  // 3. Take full-page screenshot
  const screenshotPath = `${SCREENSHOTS}/audit-${viewportName}-fullpage.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`Full-page screenshot saved: ${screenshotPath}`);

  // Also take viewport-only hero screenshot
  const heroScreenshot = `${SCREENSHOTS}/audit-${viewportName}-hero.png`;
  await page.screenshot({ path: heroScreenshot });
  log(`Hero screenshot saved: ${heroScreenshot}`);

  const data = {};

  // ---- CHECK 4a: Elements stuck at opacity:0 or near-zero ----
  log('Checking for elements stuck at low opacity...');
  const stuckElements = await page.evaluate(() => {
    const results = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const style = getComputedStyle(el);
      const opacity = parseFloat(style.opacity);
      if (opacity >= 0 && opacity <= 0.1 && el.offsetWidth > 0 && el.offsetHeight > 0) {
        const rect = el.getBoundingClientRect();
        // Only flag visible-sized elements (not tiny dots)
        if (rect.width > 20 && rect.height > 10) {
          const tag = el.tagName.toLowerCase();
          const cls = el.className?.toString()?.slice(0, 80) || '';
          const text = el.textContent?.trim()?.slice(0, 60) || '';
          results.push({
            tag,
            cls,
            text,
            opacity,
            rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          });
        }
      }
    }
    return results;
  });
  data.stuckOpacityElements = stuckElements;
  if (stuckElements.length > 0) {
    issue(`${viewportName}: ${stuckElements.length} element(s) stuck at opacity <= 0.1`);
    for (const el of stuckElements.slice(0, 10)) {
      console.log(`    opacity=${el.opacity} <${el.tag}> cls="${el.cls}" text="${el.text}" at (${el.rect.x},${el.rect.y}) ${el.rect.w}x${el.rect.h}`);
    }
  } else {
    pass(`${viewportName}: No elements stuck at low opacity`);
  }

  // ---- CHECK 4b: Overlapping text ----
  log('Checking for overlapping text...');
  const overlaps = await page.evaluate(() => {
    const textEls = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,button'));
    const visible = textEls.filter(el => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.1 && el.textContent.trim().length > 0;
    });
    const rects = visible.map(el => ({ el, rect: el.getBoundingClientRect(), text: el.textContent.trim().slice(0, 40) }));
    const overlapping = [];
    for (let i = 0; i < rects.length && i < 200; i++) {
      for (let j = i + 1; j < rects.length && j < 200; j++) {
        const a = rects[i].rect;
        const b = rects[j].rect;
        if (a.width === 0 || a.height === 0 || b.width === 0 || b.height === 0) continue;
        // Check if they overlap significantly
        const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const overlapArea = overlapX * overlapY;
        const minArea = Math.min(a.width * a.height, b.width * b.height);
        if (overlapArea > minArea * 0.5 && minArea > 100) {
          // Check they're not parent-child
          if (!rects[i].el.contains(rects[j].el) && !rects[j].el.contains(rects[i].el)) {
            overlapping.push({
              text1: rects[i].text,
              text2: rects[j].text,
              overlapPct: Math.round(overlapArea / minArea * 100),
            });
          }
        }
      }
    }
    return overlapping.slice(0, 10);
  });
  data.overlappingText = overlaps;
  if (overlaps.length > 0) {
    issue(`${viewportName}: ${overlaps.length} overlapping text pair(s) found`);
    for (const o of overlaps) {
      console.log(`    "${o.text1}" overlaps "${o.text2}" (${o.overlapPct}%)`);
    }
  } else {
    pass(`${viewportName}: No overlapping text detected`);
  }

  // ---- CHECK 4c: Broken images ----
  log('Checking for broken images...');
  const brokenImages = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    const broken = [];
    for (const img of imgs) {
      if (!img.complete || img.naturalWidth === 0) {
        broken.push({ src: img.src?.slice(0, 120), alt: img.alt || '' });
      }
    }
    return broken;
  });
  data.brokenImages = brokenImages;
  if (brokenImages.length > 0) {
    issue(`${viewportName}: ${brokenImages.length} broken image(s)`);
    for (const img of brokenImages) {
      console.log(`    src="${img.src}" alt="${img.alt}"`);
    }
  } else {
    pass(`${viewportName}: All images loaded successfully`);
  }

  // ---- CHECK 5: Text contrast ----
  log('Checking text contrast...');
  const contrastIssues = await page.evaluate(() => {
    function parseColor(str) {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3] };
    }
    function luminance(c) {
      const [rs, gs, bs] = [c.r / 255, c.g / 255, c.b / 255].map(v =>
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      );
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    function contrastRatio(c1, c2) {
      const l1 = luminance(c1), l2 = luminance(c2);
      const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    const textEls = document.querySelectorAll('h1,h2,h3,h4,h5,p,a,span,li,button,label');
    const issues = [];
    for (const el of textEls) {
      const text = el.textContent?.trim();
      if (!text || text.length < 2) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (parseFloat(style.opacity) < 0.1) continue;

      const fg = parseColor(style.color);
      const bg = parseColor(style.backgroundColor);
      if (fg && bg && bg.r + bg.g + bg.b > 0) { // only if bg is non-transparent-black
        const ratio = contrastRatio(fg, bg);
        if (ratio < 2.0) {
          issues.push({
            text: text.slice(0, 50),
            fg: style.color,
            bg: style.backgroundColor,
            ratio: ratio.toFixed(2),
            tag: el.tagName.toLowerCase(),
          });
        }
      }
    }
    return issues.slice(0, 15);
  });
  data.contrastIssues = contrastIssues;
  if (contrastIssues.length > 0) {
    warn(`${viewportName}: ${contrastIssues.length} low-contrast text element(s)`);
    for (const c of contrastIssues) {
      console.log(`    ratio=${c.ratio} <${c.tag}> "${c.text}" fg=${c.fg} bg=${c.bg}`);
    }
  } else {
    pass(`${viewportName}: Text contrast looks acceptable`);
  }

  // ---- CHECK 6: Hero section video ----
  log('Checking hero section video...');
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(500);

  const videoInfo = await page.evaluate(() => {
    const videos = document.querySelectorAll('video');
    if (videos.length === 0) return { found: false };
    const results = [];
    for (const v of videos) {
      const rect = v.getBoundingClientRect();
      const style = getComputedStyle(v);
      results.push({
        src: v.src || v.querySelector('source')?.src || 'no-src',
        playing: !v.paused,
        muted: v.muted,
        autoplay: v.autoplay,
        loop: v.loop,
        currentTime: v.currentTime,
        duration: v.duration,
        readyState: v.readyState,
        width: rect.width,
        height: rect.height,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0,
        inViewport: rect.top < window.innerHeight && rect.bottom > 0,
        zIndex: style.zIndex,
        position: style.position,
      });
    }
    return { found: true, count: videos.length, videos: results };
  });
  data.video = videoInfo;

  if (videoInfo.found) {
    pass(`${viewportName}: Found ${videoInfo.count} video element(s)`);
    for (let i = 0; i < videoInfo.videos.length; i++) {
      const v = videoInfo.videos[i];
      console.log(`    Video ${i + 1}:`);
      console.log(`      src: ${v.src}`);
      console.log(`      playing: ${v.playing}, muted: ${v.muted}, autoplay: ${v.autoplay}, loop: ${v.loop}`);
      console.log(`      currentTime: ${v.currentTime?.toFixed(1)}s, duration: ${v.duration?.toFixed(1)}s`);
      console.log(`      size: ${v.width}x${v.height}, visible: ${v.visible}, inViewport: ${v.inViewport}`);
      console.log(`      zIndex: ${v.zIndex}, position: ${v.position}`);
    }

    // Check if video is hidden behind other elements
    const videoObscured = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) return null;
      const rect = video.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const topEl = document.elementFromPoint(cx, cy);
      if (!topEl) return { obscured: false };
      const isVideo = topEl === video || topEl.tagName === 'VIDEO' || video.contains(topEl);
      return {
        obscured: !isVideo,
        topElement: topEl.tagName + (topEl.className ? '.' + topEl.className.toString().slice(0, 50) : ''),
      };
    });
    if (videoObscured?.obscured) {
      warn(`${viewportName}: Video may be obscured by ${videoObscured.topElement}`);
    } else {
      pass(`${viewportName}: Video is not obscured`);
    }
  } else {
    warn(`${viewportName}: No video element found in hero`);
  }

  // ---- CHECK 7: Footer ----
  log('Checking footer...');
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }));
  await page.waitForTimeout(1000);

  const footerInfo = await page.evaluate(() => {
    // Try to find footer
    const footer = document.querySelector('footer') || document.querySelector('[class*="footer" i]')
      || document.querySelector('[data-framer-name*="Footer" i]');
    if (!footer) {
      // Look for the last major section
      const sections = document.querySelectorAll('section, [data-framer-name]');
      const last = sections[sections.length - 1];
      if (last) {
        const text = last.textContent || '';
        return { found: false, lastSectionText: text.slice(0, 300) };
      }
      return { found: false };
    }
    const text = footer.textContent || '';
    const links = Array.from(footer.querySelectorAll('a')).map(a => ({
      href: a.href,
      text: a.textContent?.trim()?.slice(0, 40),
    }));
    return {
      found: true,
      text: text.slice(0, 500),
      hasAdvisoryPhrase: text.includes('more than an advisory firm'),
      linkCount: links.length,
      links,
    };
  });
  data.footer = footerInfo;

  if (footerInfo.found) {
    pass(`${viewportName}: Footer found`);
    console.log(`    Contains "more than an advisory firm": ${footerInfo.hasAdvisoryPhrase}`);
    if (!footerInfo.hasAdvisoryPhrase) {
      warn(`${viewportName}: Footer does NOT contain "more than an advisory firm"`);
      console.log(`    Footer text: ${footerInfo.text}`);
    }
    console.log(`    ${footerInfo.linkCount} links in footer`);
    for (const l of footerInfo.links) {
      console.log(`      [${l.text}] -> ${l.href}`);
    }
  } else {
    warn(`${viewportName}: No <footer> element found. Searching page body...`);
    // Search full page for the phrase
    const bodySearch = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasAdvisoryPhrase: body.includes('more than an advisory firm'),
        allLinks: Array.from(document.querySelectorAll('a')).length,
      };
    });
    console.log(`    "more than an advisory firm" anywhere on page: ${bodySearch.hasAdvisoryPhrase}`);

    // Get all text near bottom of page
    const bottomText = await page.evaluate(() => {
      const all = document.querySelectorAll('*');
      const bottomEls = [];
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        const scrollH = document.body.scrollHeight;
        if (rect.top > scrollH - window.innerHeight - 200 && el.children.length === 0 && el.textContent.trim()) {
          bottomEls.push(el.textContent.trim().slice(0, 80));
        }
      }
      return [...new Set(bottomEls)].slice(0, 20);
    });
    console.log(`    Bottom-of-page text elements:`);
    for (const t of bottomText) {
      console.log(`      "${t}"`);
    }
  }

  // ---- CHECK 8: Services section ----
  log('Checking services section...');
  const servicesInfo = await page.evaluate(() => {
    const expectedServices = [
      'AI Strategy & Advisory',
      'AI Training & Workforce Development',
      'AI Agent & Automation Engineering',
    ];

    // Look for service cards by various strategies
    const allText = document.body.textContent;
    const foundServices = expectedServices.map(name => ({
      name,
      found: allText.includes(name),
    }));

    // Try to find service card containers
    const cards = document.querySelectorAll('[data-framer-name*="Service" i], [data-framer-name*="Card" i], [class*="service" i]');

    // Also look for h3/h4 elements containing service names
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span'));
    const serviceHeadings = headings.filter(h => {
      const t = h.textContent?.trim();
      return expectedServices.some(s => t?.includes(s));
    }).map(h => ({
      tag: h.tagName,
      text: h.textContent.trim().slice(0, 80),
    }));

    return {
      framerCards: cards.length,
      serviceHeadings,
      foundServices,
      allFound: foundServices.every(s => s.found),
    };
  });
  data.services = servicesInfo;

  if (servicesInfo.allFound) {
    pass(`${viewportName}: All 3 expected services found on page`);
  } else {
    issue(`${viewportName}: Not all expected services found`);
  }
  for (const s of servicesInfo.foundServices) {
    console.log(`    ${s.found ? '[OK]' : '[MISSING]'} ${s.name}`);
  }
  console.log(`    Framer card elements: ${servicesInfo.framerCards}`);
  console.log(`    Service headings found: ${servicesInfo.serviceHeadings.length}`);
  for (const h of servicesInfo.serviceHeadings) {
    console.log(`      <${h.tag}> "${h.text}"`);
  }

  // ---- CHECK 9: Already done above (opacity check) ----

  // ---- CHECK 10: 404 assets ----
  log('Checking for 404 network errors...');
  data.failedRequests = failedRequests;
  data.responseErrors = responseErrors;

  const asset404s = responseErrors.filter(r => r.status === 404);
  if (asset404s.length > 0) {
    issue(`${viewportName}: ${asset404s.length} asset(s) returned 404`);
    for (const r of asset404s) {
      console.log(`    404: ${r.url}`);
    }
  } else {
    pass(`${viewportName}: No 404 errors`);
  }

  if (failedRequests.length > 0) {
    warn(`${viewportName}: ${failedRequests.length} failed network request(s)`);
    for (const r of failedRequests) {
      console.log(`    FAILED: ${r.url} (${r.error})`);
    }
  }

  const otherErrors = responseErrors.filter(r => r.status !== 404 && r.status >= 400);
  if (otherErrors.length > 0) {
    warn(`${viewportName}: ${otherErrors.length} non-404 HTTP error(s)`);
    for (const r of otherErrors) {
      console.log(`    ${r.status}: ${r.url}`);
    }
  }

  // ---- EXTRA: Page metrics ----
  const metrics = await page.evaluate(() => {
    return {
      totalElements: document.querySelectorAll('*').length,
      totalImages: document.querySelectorAll('img').length,
      totalVideos: document.querySelectorAll('video').length,
      totalLinks: document.querySelectorAll('a').length,
      totalSections: document.querySelectorAll('section, [data-framer-name]').length,
      scrollHeight: document.body.scrollHeight,
      title: document.title,
    };
  });
  data.metrics = metrics;
  console.log(`    Page title: "${metrics.title}"`);
  console.log(`    Total elements: ${metrics.totalElements}`);
  console.log(`    Images: ${metrics.totalImages}, Videos: ${metrics.totalVideos}, Links: ${metrics.totalLinks}`);
  console.log(`    Scroll height: ${metrics.scrollHeight}px`);

  await context.close();
  return data;
}

async function main() {
  log('Starting visual audit of ' + SITE);
  const browser = await chromium.launch({ headless: true });

  try {
    // Desktop audit
    report.desktop = await auditViewport(browser, 'desktop-1440', 1440, 900);

    // Mobile audit
    report.mobile = await auditViewport(browser, 'mobile-375', 375, 812);

  } catch (err) {
    console.error('FATAL ERROR:', err);
    report.issues.push(`Fatal error: ${err.message}`);
  } finally {
    await browser.close();
  }

  // ---- FINAL REPORT ----
  console.log('\n' + '='.repeat(70));
  console.log('  VISUAL AUDIT REPORT');
  console.log('='.repeat(70));
  console.log(`  Site: ${SITE}`);
  console.log(`  Date: ${report.timestamp}`);
  console.log('');

  console.log(`  PASSED: ${report.passed.length}`);
  for (const p of report.passed) console.log(`    [OK] ${p}`);
  console.log('');

  console.log(`  WARNINGS: ${report.warnings.length}`);
  for (const w of report.warnings) console.log(`    [!!] ${w}`);
  console.log('');

  console.log(`  ISSUES: ${report.issues.length}`);
  for (const i of report.issues) console.log(`    [XX] ${i}`);
  console.log('');

  console.log(`  Screenshots saved to: ${SCREENSHOTS}/`);
  console.log('='.repeat(70));

  // Save JSON report
  const jsonPath = `${SCREENSHOTS}/audit-report.json`;
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`  JSON report saved to: ${jsonPath}`);
}

main();
