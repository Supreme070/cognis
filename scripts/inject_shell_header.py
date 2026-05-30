#!/usr/bin/env python3
"""P1-3 / P1-4 — one consistent header (with a working mobile menu) on every
hand-built shell page.

The hand-built shells (products, why-cognis, how-we-work, case-studies, faq,
legal, thanks) each shipped a bespoke `<header class="site-nav">` whose nav set
diverged from the global Framer header (no Home, no CTA, an extra "How We Work",
different order) and whose mobile rule simply `display:none`-d every non-current
link with no hamburger — a navigation dead-end (audit P1-3/P1-4).

This replaces that header, on every shell, with a single standardized header
that mirrors the global header's items (Home / About Us / Services / Products /
Insights + a "Work With Us" pill) and adds a real hamburger drawer for mobile.
The current page is highlighted at runtime from the path. Idempotent.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {
    "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy",
    "scripts", "playwright-screenshots", "stock", "tests", ".git", ".claude",
}
START = "<!-- cognis-gnav:start -->"
END = "<!-- cognis-gnav:end -->"

OLD_HEADER_RE = re.compile(r'<header class="site-nav">[\s\S]*?</header>', re.IGNORECASE)

BRAND_SVG = (
    '<svg class="cgnav-mark" viewBox="0 0 40 30" aria-hidden="true">'
    '<path d="M 36.968 20.426 L 33.716 26.059 L 24.189 26.048 L 27.223 20.794 L 18.262 5.293 L 28.346 5.337 Z"/>'
    '<path d="M 9.807 5.266 L 16.312 5.266 L 21.066 13.522 L 14.999 13.521 L 6.055 29.033 L 1.051 20.277 Z"/></svg>'
)

LINKS = [
    ("/", "Home"), ("/about-us", "About Us"), ("/our-services", "Services"),
    ("/products", "Products"), ("/blog", "Insights"),
]


def _links_html(cls: str) -> str:
    return "".join(f'<a href="{href}">{label}</a>' for href, label in LINKS) if cls == "" else \
        "".join(f'<a href="{href}">{label}</a>' for href, label in LINKS)


HEADER = f"""<header class="cgnav" data-cognis-gnav>
  <div class="cgnav-in">
    <a class="cgnav-brand" href="/" aria-label="Cognis Group">{BRAND_SVG}<span class="cgnav-word">Cognis</span></a>
    <nav class="cgnav-links" aria-label="Primary">{_links_html("")}</nav>
    <a class="cgnav-cta" href="/contact">Work With Us</a>
    <button class="cgnav-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="cgnav-drawer"><span></span><span></span><span></span></button>
  </div>
  <div class="cgnav-drawer" id="cgnav-drawer" hidden>{_links_html("")}<a class="cgnav-cta" href="/contact">Work With Us</a></div>
</header>"""

STYLE = """<style data-cognis-gnav>
  header.cgnav { position: sticky; top: 0; z-index: 1000; background: rgba(255,255,255,0.86); backdrop-filter: saturate(180%) blur(14px); -webkit-backdrop-filter: saturate(180%) blur(14px); border-bottom: 1px solid rgba(19,19,19,.08); font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  header.cgnav .cgnav-in { max-width: 1200px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; gap: 24px; }
  header.cgnav .cgnav-brand { display: flex; align-items: center; gap: 9px; text-decoration: none; margin-right: auto; }
  header.cgnav .cgnav-mark { width: 30px; height: 22px; fill: #131313; display: block; }
  header.cgnav .cgnav-word { font-weight: 700; letter-spacing: -0.05em; color: #131313; font-size: 23px; }
  header.cgnav .cgnav-links { display: flex; align-items: center; gap: 30px; }
  header.cgnav .cgnav-links a { position: relative; color: #4b4b4b; text-decoration: none; font-weight: 600; font-size: 12px; letter-spacing: .09em; text-transform: uppercase; transition: color .2s ease; }
  header.cgnav .cgnav-links a:hover { color: #131313; }
  header.cgnav .cgnav-links a[aria-current="page"] { color: #131313; }
  header.cgnav .cgnav-links a[aria-current="page"]::after { content: ""; position: absolute; left: 0; right: 0; bottom: -7px; height: 2px; background: #cdfb56; border-radius: 2px; }
  header.cgnav .cgnav-cta { background: #cdfb56; color: #131313; text-decoration: none; font-weight: 700; font-size: 12px; letter-spacing: .07em; text-transform: uppercase; padding: 11px 20px; border-radius: 999px; white-space: nowrap; transition: transform .2s ease, box-shadow .2s ease; }
  header.cgnav .cgnav-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -10px rgba(205,251,86,.9); }
  header.cgnav .cgnav-burger { display: none; flex-direction: column; gap: 5px; background: none; border: 0; padding: 8px; cursor: pointer; }
  header.cgnav .cgnav-burger span { width: 22px; height: 2px; background: #131313; border-radius: 2px; transition: transform .25s ease, opacity .2s ease; }
  header.cgnav.open .cgnav-burger span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  header.cgnav.open .cgnav-burger span:nth-child(2) { opacity: 0; }
  header.cgnav.open .cgnav-burger span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
  header.cgnav .cgnav-drawer { display: none; flex-direction: column; gap: 4px; padding: 8px 24px 22px; border-top: 1px solid rgba(19,19,19,.06); background: #fff; }
  header.cgnav .cgnav-drawer a { color: #131313; text-decoration: none; font-weight: 600; font-size: 16px; padding: 13px 4px; border-bottom: 1px solid rgba(19,19,19,.05); }
  header.cgnav .cgnav-drawer a[aria-current="page"] { color: #1769ff; }
  header.cgnav .cgnav-drawer .cgnav-cta { display: inline-block; margin-top: 14px; text-align: center; border-bottom: 0; }
  @media (max-width: 860px) {
    header.cgnav .cgnav-links, header.cgnav .cgnav-in > .cgnav-cta { display: none; }
    header.cgnav .cgnav-burger { display: flex; }
    header.cgnav.open .cgnav-drawer { display: flex; }
  }
</style>"""

SCRIPT = """<script data-cognis-gnav>
(function () {
  var h = document.querySelector('header.cgnav[data-cognis-gnav]');
  if (!h) return;
  // highlight the current page
  var here = location.pathname.replace(/\\/index\\.html$/, '').replace(/\\/+$/, '') || '/';
  h.querySelectorAll('a[href]').forEach(function (a) {
    var p = (a.getAttribute('href') || '').replace(/\\/+$/, '') || '/';
    if (p === here) a.setAttribute('aria-current', 'page');
  });
  var burger = h.querySelector('.cgnav-burger');
  var drawer = h.querySelector('.cgnav-drawer');
  function setOpen(o) {
    h.classList.toggle('open', o);
    if (burger) burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (drawer) { if (o) drawer.removeAttribute('hidden'); else drawer.setAttribute('hidden', ''); }
    document.documentElement.style.overflow = o ? 'hidden' : '';
  }
  if (burger) burger.addEventListener('click', function () { setOpen(!h.classList.contains('open')); });
  if (drawer) drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 860) setOpen(false); });
})();
</script>"""

BLOCK = f"{START}\n{STYLE}\n{SCRIPT}\n{END}"


def snapshot_paths() -> list[Path]:
    paths: list[Path] = []
    for sub in sorted(ROOT.iterdir()):
        if not sub.is_dir() or sub.name.startswith(".") or sub.name in SKIP_DIRS:
            continue
        if (sub / "index.html").exists():
            paths.append(sub / "index.html")
        for child in sorted(sub.iterdir()):
            if child.is_dir() and (child / "index.html").exists():
                paths.append(child / "index.html")
    return paths


def strip_block(html: str, start: str, end: str) -> str:
    return re.sub(re.escape(start) + r"[\s\S]*?" + re.escape(end) + r"\s*", "", html)


def main() -> int:
    changed = 0
    for p in snapshot_paths():
        html = p.read_text(encoding="utf-8")
        if '<header class="site-nav">' not in html and "data-cognis-gnav" not in html:
            continue
        new = OLD_HEADER_RE.sub(HEADER, html)
        new = strip_block(new, START, END)
        if "</body>" in new:
            new = new.replace("</body>", BLOCK + "\n</body>", 1)
        if new != html:
            p.write_text(new, encoding="utf-8")
            changed += 1
            print(f"  header unified: {p.relative_to(ROOT)}")
    print(f"\n{changed} shells updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
