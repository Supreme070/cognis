#!/usr/bin/env python3
"""Surface the Products destination across the site.

Two injections, both idempotent behind sentinel comments and safe to re-run
as part of `npm run prerender`:

  1. NAV_SCRIPT — a tiny client-side script appended before </body> on every
     snapshot. After Framer hydrates (or immediately, on the hand-coded
     shells) it adds a flat "Products" link to the primary header nav. This
     is the same post-hydration DOM-patch approach the homepage already uses
     for anchors, images, and logos (see index.html `apply()`), so it is
     consistent with how this site augments Framer's output. The header link
     is a progressive enhancement; crawlers that don't run JS still reach
     /products via the homepage products band (below), the footer site-links
     strip (inject_site_links.py), and the /products page itself.

  2. PRODUCTS_BAND — a static, crawler-visible "Products" section injected
     into the homepage only, immediately above the footer site-links strip.
     It lives outside Framer's React root (before </body>), so hydration
     never touches it.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NAV_START = "<!-- cognis-products-nav:start -->"
NAV_END = "<!-- cognis-products-nav:end -->"
BAND_START = "<!-- cognis-products-band:start -->"
BAND_END = "<!-- cognis-products-band:end -->"
SCHEMA_START = "<!-- cognis-products-schema:start -->"
SCHEMA_END = "<!-- cognis-products-schema:end -->"
LINKS_START = "<!-- cognis-site-links:start -->"

# Product entity graph for the homepage — links each product to the Organization
# (@id matches the homepage Organization node). Consistent with the visible
# products band, so no schema drift. Plain string (not an f-string).
PRODUCTS_SCHEMA = SCHEMA_START + """
<script type="application/ld+json" data-cognis-products-schema>
{"@context":"https://schema.org","@graph":[
{"@type":"SoftwareApplication","@id":"https://cognis.group/#product-cognis-ai","name":"Cognis AI","applicationCategory":"BusinessApplication","operatingSystem":"Web","url":"https://ai.cognis.group","description":"A workforce of specialised AI workers — hire one for support, voice, knowledge, ops, or trade.","publisher":{"@id":"https://cognis.group/#organization"}},
{"@type":"SoftwareApplication","@id":"https://cognis.group/#product-marketsage","name":"MarketSage","applicationCategory":"BusinessApplication","operatingSystem":"Web","url":"https://www.marketsage.africa","description":"Autonomous marketing and sales intelligence — plans campaigns, runs them across channels, and turns activity into pipeline.","publisher":{"@id":"https://cognis.group/#organization"}},
{"@type":"SoftwareApplication","@id":"https://cognis.group/#product-migratio","name":"Migratio","applicationCategory":"BusinessApplication","operatingSystem":"Web","url":"https://migratio.cognis.group","description":"The data-migration platform for banks, ministries, and regulated enterprises — reconcile before cutover, audit every record.","publisher":{"@id":"https://cognis.group/#organization"}},
{"@type":"ItemList","name":"Cognis Group products","itemListElement":[
{"@type":"ListItem","position":1,"item":{"@id":"https://cognis.group/#product-cognis-ai"}},
{"@type":"ListItem","position":2,"item":{"@id":"https://cognis.group/#product-marketsage"}},
{"@type":"ListItem","position":3,"item":{"@id":"https://cognis.group/#product-migratio"}}
]}
]}
</script>
""" + SCHEMA_END

# ── 1. Header "Products" link (runtime) ──────────────────────────────────
NAV_SCRIPT = f"""{NAV_START}
<script data-cognis-products-nav>
(function () {{
  // Add a "Products" item to whichever primary nav this page has:
  //   • Framer pages  -> the [data-framer-name="menu"] container
  //   • hand shells    -> header.site-nav > nav
  function addToFramer(menu) {{
    if (menu.querySelector('a[data-cognis-products]')) return;
    var sample = null, kids = menu.children;
    for (var i = kids.length - 1; i >= 0; i--) {{
      if (kids[i].querySelector && kids[i].querySelector('a[href]')) {{ sample = kids[i]; break; }}
    }}
    if (!sample) return;
    var clone = sample.cloneNode(true);
    var a = clone.querySelector('a');
    if (!a) return;
    a.setAttribute('href', '/products');
    a.setAttribute('data-cognis-products', '');
    a.removeAttribute('data-framer-page-link-current');
    var ps = clone.querySelectorAll('p');
    for (var j = 0; j < ps.length; j++) ps[j].textContent = 'Products';
    // Place "Products" right after the Services item; fall back to the end.
    var after = null;
    for (var k = 0; k < menu.children.length; k++) {{
      if (menu.children[k].querySelector && menu.children[k].querySelector('a[href*="our-services"]')) {{ after = menu.children[k]; break; }}
    }}
    if (after) after.parentNode.insertBefore(clone, after.nextSibling);
    else sample.parentNode.appendChild(clone);
  }}
  function addToShell(nav) {{
    if (nav.querySelector('a[href="/products"]')) return;
    var services = nav.querySelector('a[href="/our-services"]');
    var link = document.createElement('a');
    link.setAttribute('href', '/products');
    link.setAttribute('data-cognis-products', '');
    link.textContent = 'Products';
    if (services && services.parentNode) services.parentNode.insertBefore(link, services.nextSibling);
    else nav.appendChild(link);
  }}
  function run() {{
    document.querySelectorAll('nav [data-framer-name="menu"]').forEach(addToFramer);
    document.querySelectorAll('header.site-nav nav').forEach(addToShell);
  }}
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
  // Framer is a SPA: re-apply when it re-renders the nav. rAF-debounced.
  try {{
    var mo = new MutationObserver(function () {{
      if (window.__cognisNavRAF) return;
      window.__cognisNavRAF = requestAnimationFrame(function () {{ window.__cognisNavRAF = 0; run(); }});
    }});
    mo.observe(document.documentElement, {{ childList: true, subtree: true }});
  }} catch (e) {{}}
  [400, 1200, 2500].forEach(function (t) {{ setTimeout(run, t); }});
}})();
</script>
{NAV_END}"""

# ── 2. Homepage products band (static) ───────────────────────────────────
PRODUCTS_BAND = f"""{BAND_START}
<style data-cognis-products-band>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800&display=swap');
  .cgp-band {{
    background: #f2f2f2; color: #131313; padding: 72px 24px 80px;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-top: 1px solid #e6e6e6;
  }}
  .cgp-inner {{ max-width: 1180px; margin: 0 auto; }}
  .cgp-eyebrow {{ color: #7b7b7b; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; font-weight: 600; margin: 0 0 14px; }}
  .cgp-eyebrow::before {{ content: ""; display: inline-block; width: 28px; height: 2px; background: #cdfb56; vertical-align: middle; margin-right: 12px; }}
  .cgp-head {{ display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: baseline; justify-content: space-between; margin-bottom: 36px; }}
  .cgp-head h2 {{ font-size: 36px; line-height: 1.08; letter-spacing: -0.025em; margin: 0; font-weight: 700; max-width: 620px; }}
  .cgp-all {{ font-weight: 600; font-size: 15px; color: #131313; text-decoration: none; white-space: nowrap; }}
  .cgp-all:hover {{ color: #131313; box-shadow: inset 0 -2px 0 #cdfb56; }}
  .cgp-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }}
  .cgp-card {{
    position: relative; display: flex; flex-direction: column; text-decoration: none; color: inherit;
    background: #fff; border: 1px solid #e6e6e6; border-radius: 18px; padding: 28px; overflow: hidden; isolation: isolate; min-height: 232px;
    transition: transform .28s cubic-bezier(.2,.7,.2,1), box-shadow .28s ease, border-color .28s ease;
  }}
  .cgp-card > * {{ position: relative; z-index: 1; }}
  .cgp-card::before {{
    content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none; border-radius: inherit;
    background: radial-gradient(320px circle at var(--mx, 50%) var(--my, -10%), var(--glow, rgba(66,133,244,.14)), transparent 60%);
    opacity: 0; transition: opacity .4s ease;
  }}
  .cgp-card:hover::before {{ opacity: 1; }}
  .cgp-card:hover {{ transform: translateY(-5px); box-shadow: 0 22px 50px -26px rgba(19,19,19,.32); border-color: var(--c, #cdfb56); }}
  .cgp-card .cgp-line {{ position: absolute; top: 0; left: 0; right: 0; height: 4px; z-index: 2; background: var(--c, #cdfb56); transform: scaleX(0); transform-origin: left; transition: transform .35s cubic-bezier(.2,.7,.2,1); }}
  .cgp-card:hover .cgp-line {{ transform: scaleX(1); }}
  .cgp-kick {{ font-size: 11px; letter-spacing: .1em; text-transform: uppercase; font-weight: 600; color: #7b7b7b; margin: 0 0 16px; }}
  .cgp-name {{ font-size: 24px; font-weight: 700; letter-spacing: -0.01em; margin: 0 0 8px; }}
  .cgp-name.cog {{ font-family: 'Nunito', sans-serif; font-weight: 800; }}
  .cgp-name.cog .ai {{ color: #4285f4; }}
  .cgp-card img {{ transition: transform .35s cubic-bezier(.2,.7,.2,1); }}
  .cgp-card:hover img {{ transform: scale(1.06); }}
  .ms-logo {{ display: flex; align-items: center; gap: 10px; margin: 0 0 10px; }}
  .ms-logo img {{ width: 32px; height: 32px; display: block; }}
  .ms-logo .wm {{ font-weight: 700; font-size: 20px; letter-spacing: -0.02em; }}
  .ms-logo .mk {{ color: #5f6fff; }}
  .ms-logo .sg {{ color: #06b6d4; }}
  .ms-card .cgp-line {{ background: linear-gradient(90deg, #5f6fff, #06b6d4); }}
  .mig-logo {{ height: 40px; width: auto; max-width: 100%; display: block; margin: 2px 0 14px; }}
  .cog-card {{ background: linear-gradient(180deg, #ffffff, #f4f8ff); }}
  .ms-card {{ background: linear-gradient(180deg, #ffffff, #f5f8ff); }}
  .mig-card {{ background: linear-gradient(160deg, #242c63, #1a2049); border-color: #1a2049; color: #f1f2f8; }}
  .mig-card .cgp-kick {{ color: #8993a8; }}
  .mig-card .cgp-desc {{ color: #b3bbd0; }}
  .mig-card .cgp-go {{ color: #ffffff; }}
  .spog-card {{ background: linear-gradient(180deg, #fdfee8, #fbfbf3); }}
  .cgp-desc {{ font-size: 14.5px; line-height: 1.55; color: #2f2f2f; margin: 0 0 20px; }}
  .cgp-go {{ margin-top: auto; font-weight: 600; font-size: 14px; color: #131313; }}
  .cgp-go .a {{ transition: margin-left .2s ease; }}
  .cgp-card:hover .cgp-go .a {{ margin-left: 5px; }}
  @media (max-width: 1040px) {{ .cgp-grid {{ grid-template-columns: repeat(2, 1fr); }} }}
  @media (max-width: 560px) {{ .cgp-grid {{ grid-template-columns: 1fr; }} .cgp-head h2 {{ font-size: 28px; }} }}
</style>
<template id="cgp-band-tpl"><section class="cgp-band" aria-label="Products">
  <div class="cgp-inner">
    <p class="cgp-eyebrow">Products</p>
    <div class="cgp-head">
      <h2>Software we build and run, not just advise on.</h2>
      <a class="cgp-all" href="/products">All products &rarr;</a>
    </div>
    <div class="cgp-grid">
      <a class="cgp-card cog-card" href="https://ai.cognis.group" target="_blank" rel="noopener" style="--c:#4285f4;--glow:rgba(66,133,244,.14)">
        <span class="cgp-line"></span>
        <p class="cgp-kick">Live &middot; AI workforce</p>
        <p class="cgp-name cog">Cognis<span class="ai">Ai</span>.</p>
        <p class="cgp-desc">A workforce of specialised AI workers. Hire one for support, voice, knowledge, ops, or trade.</p>
        <span class="cgp-go">Visit Cognis AI <span class="a">&rarr;</span></span>
      </a>
      <a class="cgp-card ms-card" href="https://www.marketsage.africa" target="_blank" rel="noopener" style="--c:#5f6fff;--glow:rgba(95,111,255,.13)">
        <span class="cgp-line"></span>
        <p class="cgp-kick">Live &middot; Marketing AI</p>
        <div class="ms-logo"><img src="/assets/products/marketsage-logo.png" alt="MarketSage" /><span class="wm"><span class="mk">MΛRKET</span><span class="sg">SΛGE</span></span></div>
        <p class="cgp-desc">Autonomous marketing and sales intelligence. Plans campaigns, runs them across channels, and turns activity into pipeline.</p>
        <span class="cgp-go">Visit MarketSage <span class="a">&rarr;</span></span>
      </a>
      <a class="cgp-card mig-card" href="https://migratio.cognis.group" target="_blank" rel="noopener" style="--c:#5bb04f;--glow:rgba(91,176,79,.18)">
        <span class="cgp-line"></span>
        <p class="cgp-kick">Live &middot; Data migration</p>
        <img class="mig-logo" src="/assets/products/migratio-logo-horizontal-dark.svg" alt="Migratio by Cognis" />
        <p class="cgp-desc">The migration platform for banks, ministries, and regulated enterprises. Reconcile before cutover.</p>
        <span class="cgp-go">Visit Migratio <span class="a">&rarr;</span></span>
      </a>
      <a class="cgp-card spog-card" href="/products" style="--c:#cdfb56;--glow:rgba(205,251,86,.22)">
        <span class="cgp-line"></span>
        <p class="cgp-kick">Coming soon</p>
        <p class="cgp-name">SPOG</p>
        <p class="cgp-desc">A new product from Cognis Group, in development. Details soon.</p>
        <span class="cgp-go">Learn more <span class="a">&rarr;</span></span>
      </a>
    </div>
  </div>
</section></template>
<script data-cognis-products-band-js>
(function () {{
  // Place the products band directly above the testimonials section, inside
  // Framer's content flow. Runs after hydration (and re-runs on SPA renders),
  // so it covers every responsive variant of #testimonials.
  function bindSpotlight(card) {{
    if (card.__cgpBound) return;
    card.__cgpBound = true;
    card.addEventListener('pointermove', function (e) {{
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    }});
  }}
  function place() {{
    var tpl = document.getElementById('cgp-band-tpl');
    if (!tpl) return;
    // Framer puts id="testimonials" on the section's wrapper div; insert the
    // band immediately before it so it lands just above the testimonials block.
    var anchor = document.getElementById('testimonials');
    if (!anchor || !anchor.parentNode) return;
    var prev = anchor.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('cgp-band')) {{
      prev.querySelectorAll('.cgp-card').forEach(bindSpotlight);
      return;
    }}
    var node = tpl.content.firstElementChild.cloneNode(true);
    anchor.parentNode.insertBefore(node, anchor);
    node.querySelectorAll('.cgp-card').forEach(bindSpotlight);
  }}
  if (document.readyState !== 'loading') place();
  else document.addEventListener('DOMContentLoaded', place);
  try {{
    var mo = new MutationObserver(function () {{
      if (window.__cgpBandRAF) return;
      window.__cgpBandRAF = requestAnimationFrame(function () {{ window.__cgpBandRAF = 0; place(); }});
    }});
    mo.observe(document.documentElement, {{ childList: true, subtree: true }});
  }} catch (e) {{}}
  [400, 1200, 2500].forEach(function (t) {{ setTimeout(place, t); }});
}})();
</script>
{BAND_END}"""


def snapshot_paths() -> list[Path]:
    paths: list[Path] = []
    skip = {
        "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy",
        "scripts", "playwright-screenshots", "stock", "tests", ".git", ".claude",
    }
    if (ROOT / "index.html").exists():
        paths.append(ROOT / "index.html")
    for sub in sorted(ROOT.iterdir()):
        if not sub.is_dir() or sub.name.startswith(".") or sub.name in skip:
            continue
        if (sub / "index.html").exists():
            paths.append(sub / "index.html")
        for child in sorted(sub.iterdir()):
            if child.is_dir() and (child / "index.html").exists():
                paths.append(child / "index.html")
    return paths


def strip_block(html: str, start: str, end: str) -> str:
    return re.sub(re.escape(start) + r"[\s\S]*?" + re.escape(end) + r"\s*", "", html)


def inject(path: Path, is_home: bool) -> bool:
    html = path.read_text(encoding="utf-8")
    original = html

    # 1. Header nav script — every page.
    html = strip_block(html, NAV_START, NAV_END)
    if "</body>" in html:
        html = html.replace("</body>", NAV_SCRIPT + "\n</body>", 1)

    # 2. Products band — homepage only, just above the footer links strip.
    html = strip_block(html, BAND_START, BAND_END)
    if is_home:
        if LINKS_START in html:
            html = html.replace(LINKS_START, PRODUCTS_BAND + "\n" + LINKS_START, 1)
        elif "</body>" in html:
            html = html.replace("</body>", PRODUCTS_BAND + "\n</body>", 1)

    # 3. Product entity schema — homepage only (links products to the org).
    html = strip_block(html, SCHEMA_START, SCHEMA_END)
    if is_home and "</body>" in html:
        html = html.replace("</body>", PRODUCTS_SCHEMA + "\n</body>", 1)

    if html == original:
        return False
    path.write_text(html, encoding="utf-8")
    return True


def main() -> int:
    changed = 0
    paths = snapshot_paths()
    home = (ROOT / "index.html").resolve()
    for p in paths:
        if inject(p, is_home=(p.resolve() == home)):
            changed += 1
            print(f"  injected: {p.relative_to(ROOT)}")
    print(f"\n{changed}/{len(paths)} snapshots updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
