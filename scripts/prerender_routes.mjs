/* Prerender Cognis routes into per-route static HTML snapshots.
 *
 * Why: Framer's SSR handover is single-route (homepage). Direct loads of
 * other routes rely on `cognis-deferred-nav` (index.html:5–36) which
 * rewrites the URL to `/`, lets Framer hydrate as home, then clicks the
 * target nav link. That round-trip is the visible homepage flash — and
 * AI crawlers (GPTBot, ClaudeBot, PerplexityBot) don't execute JS, so
 * they only ever see the homepage.
 *
 * This script spawns the local dev server, points Playwright at each
 * route, waits for Framer to finish rendering it, captures the HTML,
 * strips the deferred-nav rewrite, injects route-specific <title>,
 * description, canonical, og:*, and JSON-LD schema, then writes the
 * snapshot to disk. Cloudflare Pages serves these files for direct
 * loads; Framer's client router continues to handle in-app navigation
 * unchanged.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { ROUTES, ORIGIN } from './seo-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const PORT = 3997;
const LOCAL = `http://127.0.0.1:${PORT}`;

function waitForPort(port, host = '127.0.0.1', timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    (function probe() {
      const sock = net.connect(port, host);
      sock.once('connect', () => { sock.end(); resolve(); });
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() > deadline) reject(new Error(`port ${port} never ready`));
        else setTimeout(probe, 150);
      });
    })();
  });
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// Rewrite a single tag matching `regex` with `replacement`, or append
// `replacement` before </head> if the tag isn't present.
function replaceOrAppend(html, regex, replacement) {
  if (regex.test(html)) return html.replace(regex, replacement);
  return html.replace(/<\/head>/, `  ${replacement}\n  </head>`);
}

function transform(html, route) {
  const canonical = ORIGIN + route.path;

  // Neutralise deferred-nav — a prerendered page must not rewrite URL.
  let out = html.replace(
    /<script id="cognis-deferred-nav">[\s\S]*?<\/script>/,
    `<script id="cognis-deferred-nav">/* stripped for snapshot ${route.path} */</script>`
  );

  // Mark snapshot + fix lang.
  out = out.replace(
    /<html([^>]*)>/,
    (_m, attrs) => {
      let a = attrs.replace(/\slang="[^"]*"/, '');
      return `<html${a} lang="en-GB" data-cognis-snapshot="${route.path}">`;
    }
  );

  // Pin relative URLs to origin root. Detail snapshots are served at
  // /<section>/<slug>/, so a Framer-emitted href like ../our-services
  // would resolve to /<section>/our-services in the browser. <base href="/">
  // forces every relative URL in the document to resolve from the site root,
  // matching how the same hrefs behave on the homepage.
  out = replaceOrAppend(
    out,
    /<base[^>]*\/?>/,
    `<base href="/" />`
  );

  // Core head tags.
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escAttr(route.title)}</title>`);

  out = replaceOrAppend(
    out,
    /<meta\s+name="description"[^>]*\/?>/,
    `<meta name="description" content="${escAttr(route.description)}" />`
  );

  out = replaceOrAppend(
    out,
    /<link\s+rel="canonical"[^>]*\/?>/,
    `<link rel="canonical" href="${canonical}" />`
  );

  // Open Graph.
  out = replaceOrAppend(
    out,
    /<meta\s+property="og:url"[^>]*\/?>/,
    `<meta property="og:url" content="${canonical}" />`
  );
  out = replaceOrAppend(
    out,
    /<meta\s+property="og:title"[^>]*\/?>/,
    `<meta property="og:title" content="${escAttr(route.title)}" />`
  );
  out = replaceOrAppend(
    out,
    /<meta\s+property="og:description"[^>]*\/?>/,
    `<meta property="og:description" content="${escAttr(route.description)}" />`
  );
  if (route.ogImage) {
    out = replaceOrAppend(
      out,
      /<meta\s+property="og:image"[^>]*\/?>/,
      `<meta property="og:image" content="${escAttr(route.ogImage)}" />`
    );
  }

  // Twitter.
  out = replaceOrAppend(
    out,
    /<meta\s+name="twitter:title"[^>]*\/?>/,
    `<meta name="twitter:title" content="${escAttr(route.title)}" />`
  );
  out = replaceOrAppend(
    out,
    /<meta\s+name="twitter:description"[^>]*\/?>/,
    `<meta name="twitter:description" content="${escAttr(route.description)}" />`
  );
  if (route.ogImage) {
    out = replaceOrAppend(
      out,
      /<meta\s+name="twitter:image"[^>]*\/?>/,
      `<meta name="twitter:image" content="${escAttr(route.ogImage)}" />`
    );
  }

  // Per-route JSON-LD @graph — injected before </head>, after homepage schema.
  if (route.extraSchema && route.extraSchema.length) {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': route.extraSchema,
    };
    const block = `<script type="application/ld+json" data-cognis-route-schema>${JSON.stringify(graph)}</script>`;
    out = out.replace(/<\/head>/, `  ${block}\n  </head>`);
  }

  return out;
}

async function snapshotRoute(browser, route) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });

  await page.goto(LOCAL + route.path, { waitUntil: 'networkidle', timeout: 60000 });

  // Wait for deferred-nav to land the URL on the right path (or accept
  // it if Framer routed us there directly).
  try {
    await page.waitForFunction(
      (expected) => location.pathname.replace(/\/+$/, '') === expected,
      route.path,
      { timeout: 30000 }
    );
  } catch {
    // Detail pages may not have a client-side route; snapshot whatever
    // content Framer rendered. The injected meta + schema still carry
    // canonical per-route identity for crawlers.
    console.warn(`  path didn't settle on ${route.path} — snapshotting anyway`);
  }

  await page.waitForTimeout(2500);
  const html = await page.content();
  await ctx.close();

  if (errors.length) {
    console.warn(`  warnings on ${route.path}:`);
    for (const e of errors.slice(0, 3)) console.warn('    ' + e);
  }
  return html;
}

async function main() {
  console.log(`starting dev server on :${PORT}`);
  const server = spawn('python3', ['scripts/spa_server.py', String(PORT)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});

  let exitCode = 0;
  try {
    await waitForPort(PORT);
    console.log('dev server ready');

    // Nuke prior detail-page snapshots — otherwise spa_server finds them
    // on disk and serves the stale copy instead of falling through to
    // index.html for a fresh render.
    for (const sub of ['blog', 'our-services', 'about-us', 'contact', 'teams']) {
      const dir = path.join(root, sub);
      try { rmSync(dir, { recursive: true, force: true }); } catch {}
    }

    const browser = await chromium.launch();
    for (const route of ROUTES) {
      console.log(`snapshotting ${route.path} -> ${route.out}`);
      const rawHtml = await snapshotRoute(browser, route);
      const html = transform(rawHtml, route);
      const outPath = path.join(root, route.out);
      mkdirSync(path.dirname(outPath), { recursive: true });
      writeFileSync(outPath, html);
      console.log(`  wrote ${outPath} (${html.length.toLocaleString()} bytes)`);
    }
    await browser.close();
  } catch (e) {
    console.error('FAILED:', e);
    exitCode = 1;
  } finally {
    server.kill('SIGTERM');
  }
  process.exit(exitCode);
}

main();
