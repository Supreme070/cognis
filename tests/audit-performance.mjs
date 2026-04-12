/**
 * Performance Audit: https://cognis.pages.dev
 * Measures TTFB, FCP, LCP, DOMContentLoaded, Load, CLS, hero video visibility,
 * FOUC detection, resource timings, console errors, failed requests, and page weight.
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const URL = 'https://cognis.pages.dev';
const SCREENSHOT_DIR = '/Users/supreme/Desktop/cognis/playwright-screenshots';
const TIMEOUT = 60_000;

// Ensure screenshot dir exists
mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ── Collectors ──────────────────────────────────────────────────────────────
const consoleMessages = [];       // errors & warnings
const failedRequests = [];        // 4xx / 5xx
const resourceTimings = [];       // all resources with size + duration
let totalTransferSize = 0;

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // ── Listen for console messages ──────────────────────────────────────────
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleMessages.push({ type, text: msg.text(), location: msg.location() });
    }
  });

  // ── Listen for page errors ───────────────────────────────────────────────
  page.on('pageerror', err => {
    consoleMessages.push({ type: 'pageerror', text: err.message });
  });

  // ── Track network requests ───────────────────────────────────────────────
  page.on('response', async response => {
    const status = response.status();
    const url = response.url();
    try {
      const headers = response.headers();
      const contentLength = parseInt(headers['content-length'] || '0', 10);
      const transferSize = contentLength || 0;
      totalTransferSize += transferSize;

      // Determine resource type from URL
      let type = 'other';
      if (/\.js(\?|$)/i.test(url)) type = 'js';
      else if (/\.css(\?|$)/i.test(url)) type = 'css';
      else if (/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)(\?|$)/i.test(url)) type = 'image';
      else if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) type = 'font';
      else if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) type = 'video';
      else if (url.includes('/document') || url.endsWith('/')) type = 'document';

      resourceTimings.push({ url, status, type, transferSize });

      if (status >= 400) {
        failedRequests.push({ url, status, statusText: response.statusText() });
      }
    } catch { /* ignore */ }
  });

  // ── Navigate & capture timed screenshots ─────────────────────────────────
  const screenshotDelays = [500, 1000, 2000, 3000, 5000];
  const screenshotPromises = [];

  // Record navigation start time
  const navStart = Date.now();

  // Start navigation (don't await full load yet)
  const navPromise = page.goto(URL, { waitUntil: 'commit', timeout: TIMEOUT });

  // Schedule screenshots relative to navigation start
  for (const ms of screenshotDelays) {
    screenshotPromises.push(
      (async () => {
        const elapsed = Date.now() - navStart;
        const wait = ms - elapsed;
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
        const actualTime = Date.now() - navStart;
        try {
          const path = join(SCREENSHOT_DIR, `audit-load-${ms / 1000}s.png`);
          await page.screenshot({ path, timeout: 5000 });
          return { target: ms, actual: actualTime, path, ok: true };
        } catch (e) {
          return { target: ms, actual: actualTime, ok: false, error: e.message };
        }
      })()
    );
  }

  // Wait for navigation commit
  await navPromise;

  // Wait for load event
  await page.waitForLoadState('load', { timeout: TIMEOUT }).catch(() => {});

  // Wait for network idle
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

  // Wait for all screenshots
  const screenshotResults = await Promise.all(screenshotPromises);

  // ── Collect Performance Metrics via CDP ──────────────────────────────────
  const perfData = await page.evaluate(() => {
    return new Promise(resolve => {
      const result = {};

      // Navigation timing
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        result.ttfb = nav.responseStart - nav.requestStart;
        result.domContentLoaded = nav.domContentLoadedEventEnd - nav.startTime;
        result.loadEvent = nav.loadEventEnd - nav.startTime;
        result.dnsLookup = nav.domainLookupEnd - nav.domainLookupStart;
        result.tcpConnect = nav.connectEnd - nav.connectStart;
        result.tlsHandshake = nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0;
        result.serverResponse = nav.responseEnd - nav.requestStart;
        result.domParsing = nav.domInteractive - nav.responseEnd;
        result.transferSize = nav.transferSize;
        result.encodedBodySize = nav.encodedBodySize;
        result.decodedBodySize = nav.decodedBodySize;
      }

      // Resource timings with durations
      const resources = performance.getEntriesByType('resource');
      result.resources = resources.map(r => ({
        name: r.name,
        type: r.initiatorType,
        duration: Math.round(r.duration),
        transferSize: r.transferSize,
        encodedBodySize: r.encodedBodySize,
        startTime: Math.round(r.startTime),
      }));

      // Observe FCP + LCP (they may already be buffered)
      result.fcp = null;
      result.lcp = null;
      result.cls = 0;

      const paintEntries = performance.getEntriesByType('paint');
      for (const e of paintEntries) {
        if (e.name === 'first-contentful-paint') result.fcp = e.startTime;
      }

      // LCP — try buffered entries
      try {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length) {
          result.lcp = lcpEntries[lcpEntries.length - 1].startTime;
        }
      } catch {}

      // Use PerformanceObserver for LCP + CLS if not already captured
      let resolved = false;
      const tryResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      // LCP observer (buffered)
      try {
        const lcpObs = new PerformanceObserver(list => {
          const entries = list.getEntries();
          if (entries.length) {
            result.lcp = entries[entries.length - 1].startTime;
          }
        });
        lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}

      // CLS observer (buffered)
      try {
        const clsObs = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              result.cls += entry.value;
            }
          }
        });
        clsObs.observe({ type: 'layout-shift', buffered: true });
      } catch {}

      // Give observers a moment to fire, then resolve
      setTimeout(tryResolve, 1500);
    });
  });

  // ── Hero Video Visibility ────────────────────────────────────────────────
  let heroVideoTime = null;
  try {
    const heroStart = Date.now();
    // Framer sites often use <video> in hero sections
    await page.waitForSelector('video', { state: 'visible', timeout: 15_000 });
    heroVideoTime = Date.now() - navStart;
  } catch {
    // Try alternate selectors
    try {
      const heroStart2 = Date.now();
      await page.waitForSelector('[data-framer-name*="Hero"] video, section:first-of-type video, .hero video', { state: 'visible', timeout: 5_000 });
      heroVideoTime = Date.now() - navStart;
    } catch {
      heroVideoTime = null; // no hero video found
    }
  }

  // ── FOUC / Blank Screen Detection ────────────────────────────────────────
  const foucData = await page.evaluate(() => {
    // Check if body has visibility hidden, opacity 0, or display none at any point
    const body = document.body;
    const style = window.getComputedStyle(body);
    const bodyVisible = style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity) > 0;

    // Check for Framer's loading overlay
    const framerOverlay = document.querySelector('[data-framer-page-optimized]');
    const hasFramerOptimized = !!framerOverlay;

    // Check if main content is rendered
    const mainContent = document.querySelector('main, [data-framer-name], #main');
    const hasMainContent = !!mainContent;

    // Count rendered elements
    const allElements = document.querySelectorAll('*').length;

    // Check for style elements
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]').length;

    return {
      bodyVisible,
      hasFramerOptimized,
      hasMainContent,
      totalElements: allElements,
      styleElements,
    };
  });

  // ── Compute resource-level page weight from Performance API ──────────────
  let pageWeightFromPerf = 0;
  let pageWeightDecoded = 0;
  for (const r of perfData.resources || []) {
    pageWeightFromPerf += r.transferSize || 0;
    pageWeightDecoded += r.encodedBodySize || 0;
  }
  // Add document itself
  pageWeightFromPerf += perfData.transferSize || 0;

  // ── Build Report ─────────────────────────────────────────────────────────
  const totalElapsed = Date.now() - navStart;

  console.log('\n' + '='.repeat(72));
  console.log('  PERFORMANCE AUDIT REPORT: ' + URL);
  console.log('  ' + new Date().toISOString());
  console.log('='.repeat(72));

  // -- Core Web Vitals --
  console.log('\n--- CORE WEB VITALS ---');
  console.log(`  TTFB (Time to First Byte):    ${fmt(perfData.ttfb)}`);
  console.log(`  FCP  (First Contentful Paint): ${fmt(perfData.fcp)}`);
  console.log(`  LCP  (Largest Contentful Paint): ${fmt(perfData.lcp)}`);
  console.log(`  CLS  (Cumulative Layout Shift): ${perfData.cls?.toFixed(4) ?? 'N/A'}`);

  // -- Navigation Timing --
  console.log('\n--- NAVIGATION TIMING ---');
  console.log(`  DNS Lookup:          ${fmt(perfData.dnsLookup)}`);
  console.log(`  TCP Connect:         ${fmt(perfData.tcpConnect)}`);
  console.log(`  TLS Handshake:       ${fmt(perfData.tlsHandshake)}`);
  console.log(`  Server Response:     ${fmt(perfData.serverResponse)}`);
  console.log(`  DOM Parsing:         ${fmt(perfData.domParsing)}`);
  console.log(`  DOMContentLoaded:    ${fmt(perfData.domContentLoaded)}`);
  console.log(`  Load Event:          ${fmt(perfData.loadEvent)}`);

  // -- Hero Video --
  console.log('\n--- HERO VIDEO ---');
  if (heroVideoTime !== null) {
    console.log(`  Hero video visible at: ${heroVideoTime}ms after nav start`);
  } else {
    console.log('  No hero <video> element detected');
  }

  // -- FOUC --
  console.log('\n--- FOUC / BLANK SCREEN CHECK ---');
  console.log(`  Body visible:         ${foucData.bodyVisible}`);
  console.log(`  Framer optimized:     ${foucData.hasFramerOptimized}`);
  console.log(`  Main content present: ${foucData.hasMainContent}`);
  console.log(`  Total DOM elements:   ${foucData.totalElements}`);
  console.log(`  Style elements/links: ${foucData.styleElements}`);
  if (perfData.fcp && perfData.fcp > 1000) {
    console.log(`  ** WARNING: FCP > 1s (${Math.round(perfData.fcp)}ms) — user will see blank/white screen`);
  } else if (perfData.fcp && perfData.fcp > 500) {
    console.log(`  ** NOTE: FCP between 500ms-1s (${Math.round(perfData.fcp)}ms) — noticeable delay`);
  } else if (perfData.fcp) {
    console.log(`  FCP is fast (${Math.round(perfData.fcp)}ms) — minimal blank screen`);
  }

  // Analyze gap between FCP and LCP for "flash" detection
  if (perfData.fcp && perfData.lcp) {
    const gap = perfData.lcp - perfData.fcp;
    console.log(`  FCP-to-LCP gap:       ${Math.round(gap)}ms`);
    if (gap > 500) {
      console.log(`  ** WARNING: ${Math.round(gap)}ms gap between FCP and LCP — content shifts/repaints during hydration`);
    }
  }

  // -- Console Errors & Warnings --
  console.log('\n--- CONSOLE ERRORS & WARNINGS ---');
  if (consoleMessages.length === 0) {
    console.log('  None detected');
  } else {
    for (const msg of consoleMessages) {
      const loc = msg.location ? ` (${msg.location.url}:${msg.location.lineNumber})` : '';
      console.log(`  [${msg.type.toUpperCase()}] ${msg.text.substring(0, 200)}${loc}`);
    }
  }

  // -- Failed Network Requests --
  console.log('\n--- FAILED NETWORK REQUESTS (4xx/5xx) ---');
  if (failedRequests.length === 0) {
    console.log('  None detected');
  } else {
    for (const req of failedRequests) {
      console.log(`  [${req.status}] ${req.url.substring(0, 120)}`);
    }
  }

  // -- Slow Resources --
  console.log('\n--- SLOW RESOURCES (> 1000ms) ---');
  const slowResources = (perfData.resources || []).filter(r => r.duration > 1000);
  if (slowResources.length === 0) {
    console.log('  None — all resources loaded in < 1s');
  } else {
    slowResources.sort((a, b) => b.duration - a.duration);
    for (const r of slowResources) {
      const name = r.name.length > 80 ? '...' + r.name.slice(-77) : r.name;
      console.log(`  ${r.duration}ms | ${fmtBytes(r.transferSize)} | ${r.type} | ${name}`);
    }
  }

  // -- Resource Breakdown --
  console.log('\n--- RESOURCE BREAKDOWN BY TYPE ---');
  const byType = {};
  for (const r of perfData.resources || []) {
    const t = r.type || 'other';
    if (!byType[t]) byType[t] = { count: 0, totalSize: 0, totalDuration: 0 };
    byType[t].count++;
    byType[t].totalSize += r.transferSize || 0;
    byType[t].totalDuration += r.duration || 0;
  }
  console.log(`  ${'Type'.padEnd(12)} ${'Count'.padStart(6)} ${'Size'.padStart(12)} ${'Avg Time'.padStart(10)}`);
  console.log('  ' + '-'.repeat(42));
  for (const [type, data] of Object.entries(byType).sort((a, b) => b[1].totalSize - a[1].totalSize)) {
    const avgTime = data.count > 0 ? Math.round(data.totalDuration / data.count) : 0;
    console.log(`  ${type.padEnd(12)} ${String(data.count).padStart(6)} ${fmtBytes(data.totalSize).padStart(12)} ${(avgTime + 'ms').padStart(10)}`);
  }

  // -- Page Weight --
  console.log('\n--- PAGE WEIGHT ---');
  console.log(`  Total transferred (Performance API): ${fmtBytes(pageWeightFromPerf)}`);
  console.log(`  Total transferred (response headers): ${fmtBytes(totalTransferSize)}`);
  console.log(`  Document size (transferred): ${fmtBytes(perfData.transferSize || 0)}`);
  console.log(`  Document size (decoded):     ${fmtBytes(perfData.decodedBodySize || 0)}`);

  if (pageWeightFromPerf > 5 * 1024 * 1024) {
    console.log(`  ** WARNING: Page weight > 5MB — consider optimization`);
  } else if (pageWeightFromPerf > 3 * 1024 * 1024) {
    console.log(`  ** NOTE: Page weight > 3MB — moderately heavy`);
  }

  // -- Top 10 Largest Resources --
  console.log('\n--- TOP 10 LARGEST RESOURCES ---');
  const sorted = [...(perfData.resources || [])].sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0));
  for (const r of sorted.slice(0, 10)) {
    const name = r.name.length > 70 ? '...' + r.name.slice(-67) : r.name;
    console.log(`  ${fmtBytes(r.transferSize).padStart(10)} | ${(r.duration + 'ms').padStart(8)} | ${name}`);
  }

  // -- Screenshots --
  console.log('\n--- TIMED SCREENSHOTS ---');
  for (const s of screenshotResults) {
    const label = `${s.target / 1000}s`;
    if (s.ok) {
      console.log(`  ${label} -> captured at ~${s.actual}ms (${s.path.split('/').pop()})`);
    } else {
      console.log(`  ${label} -> FAILED: ${s.error}`);
    }
  }

  // -- Summary / Diagnosis --
  console.log('\n--- DIAGNOSIS: "MILLISECOND DELAY" ON INITIAL RENDER ---');
  if (perfData.fcp) {
    console.log(`  The page shows first content at ${Math.round(perfData.fcp)}ms (FCP).`);
  }
  if (perfData.lcp) {
    console.log(`  The largest content element paints at ${Math.round(perfData.lcp)}ms (LCP).`);
  }
  if (perfData.fcp && perfData.lcp) {
    const hydrationGap = perfData.lcp - perfData.fcp;
    if (hydrationGap > 200) {
      console.log(`  There is a ${Math.round(hydrationGap)}ms gap between FCP and LCP.`);
      console.log('  This is likely the Framer SPA hydration phase where JS bundles execute');
      console.log('  and the page transitions from static HTML shell to fully rendered content.');
      console.log('  This is the "millisecond delay" the user is experiencing.');
    } else {
      console.log(`  FCP-to-LCP gap is only ${Math.round(hydrationGap)}ms — hydration is fast.`);
      console.log('  The perceived delay may be from TTFB or network latency instead.');
    }
  }
  if (perfData.domContentLoaded && perfData.loadEvent) {
    const domToLoad = perfData.loadEvent - perfData.domContentLoaded;
    console.log(`  DOMContentLoaded-to-Load gap: ${Math.round(domToLoad)}ms (subresource loading).`);
  }

  console.log('\n' + '='.repeat(72));
  console.log('  AUDIT COMPLETE');
  console.log('='.repeat(72) + '\n');

  await browser.close();
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(ms) {
  if (ms == null || isNaN(ms)) return 'N/A';
  return `${Math.round(ms)}ms`;
}

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Run ────────────────────────────────────────────────────────────────────
run().catch(err => {
  console.error('AUDIT FAILED:', err);
  process.exit(1);
});
