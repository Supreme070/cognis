#!/usr/bin/env python3
"""P1-3 / P1-4 — faithful replica of the GLOBAL Framer header AND footer on the
hand-built shell pages.

The shells (products, why-cognis, how-we-work, case-studies, faq, legal, thanks)
were built outside Framer with their own bespoke header/footer. The brand has no
Framer access, so we can't reach the real components — instead we study the live
global chrome and replicate it faithfully (structure, type, colour, motion):

  HEADER (global): fixed, transparent bar; logo (mark + "Cognis"); uppercase
  nav 14px/500, letter-spacing 1.68px, with a two-line vertical roll on hover;
  a lime "Work With Us" pill (radius 48px); a lime hamburger -> drawer on
  mobile. On the light shell pages the nav ink is #131313 (the global header's
  own colour over light content).

  FOOTER (global): a near-black rounded card inset in white; logo + descriptor;
  a "Get AI intelligence in your inbox" newsletter (real Web3Forms POST -> the
  newsletter key, redirect /thanks-subscribe); a two-column nav (Home / About
  Us / Services / Insights / Contact); and the copyright line.

Idempotent; replaces the old shell header/footer in place.
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

# Match the original shell chrome AND any prior replica (so re-runs upgrade in place).
OLD_HEADER_RE = re.compile(r'<header class="(?:site-nav|cgnav|cgx)"[^>]*>[\s\S]*?</header>', re.IGNORECASE)
OLD_FOOTER_RE = re.compile(r'<footer class="(?:site-foot|cgxf)"[^>]*>[\s\S]*?</footer>', re.IGNORECASE)

# Cognis mark — fill:currentColor so the same path is dark in the header and
# white in the footer.
MARK = (
    '<svg class="cgx-mark" viewBox="0 0 40 30" aria-hidden="true">'
    '<path d="M 36.968 20.426 L 33.716 26.059 L 24.189 26.048 L 27.223 20.794 L 18.262 5.293 L 28.346 5.337 Z"/>'
    '<path d="M 9.807 5.266 L 16.312 5.266 L 21.066 13.522 L 14.999 13.521 L 6.055 29.033 L 1.051 20.277 Z"/></svg>'
)
NAV = [("/", "Home"), ("/about-us", "About Us"), ("/our-services", "Services"), ("/products", "Products"), ("/blog", "Insights")]
FOOT_NAV = [("/", "Home"), ("/about-us", "About Us"), ("/our-services", "Services"), ("/blog", "Insights"), ("/contact", "Contact")]


def _roll(label: str) -> str:
    return f'<span class="cgx-roll"><span>{label}</span><span aria-hidden="true">{label}</span></span>'


HEADER = (
    '<header class="cgx" data-cognis-gnav>'
    '<div class="cgx-in">'
    f'<a class="cgx-logo" href="/" aria-label="Cognis Group">{MARK}<span class="cgx-word">Cognis</span></a>'
    '<nav class="cgx-nav" aria-label="Primary">'
    + "".join(f'<a href="{h}">{_roll(t)}</a>' for h, t in NAV)
    + "</nav>"
    f'<a class="cgx-cta" href="/contact">{_roll("Work With Us")}</a>'
    '<button class="cgx-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="cgx-drawer"><span></span><span></span><span></span></button>'
    "</div>"
    '<div class="cgx-drawer" id="cgx-drawer" hidden>'
    + "".join(f'<a href="{h}">{t}</a>' for h, t in NAV)
    + '<a class="cgx-cta" href="/contact">Work With Us</a>'
    "</div>"
    "</header>"
)

FOOTER = (
    '<footer class="cgxf">'
    '<div class="cgxf-card">'
    '<div class="cgxf-top">'
    '<div class="cgxf-brand">'
    f'<a class="cgxf-logo" href="/" aria-label="Cognis Group">{MARK}<span>Cognis</span></a>'
    '<p class="cgxf-desc">Cognis Group is more than an advisory firm — we build, deploy, and govern AI systems that permanently transform organizations. <em>Quod Tango Muto</em> — what we touch, we change.</p>'
    "</div>"
    '<nav class="cgxf-nav" aria-label="Footer">'
    + "".join(f'<a href="{h}">{t}</a>' for h, t in FOOT_NAV)
    + "</nav>"
    "</div>"
    '<div class="cgxf-sub">'
    '<p class="cgxf-subh">Get AI intelligence in your inbox</p>'
    '<form class="cgxf-form" action="https://api.web3forms.com/submit" method="POST">'
    '<input type="hidden" name="access_key" value="6e2d0eb5-2d17-4183-8662-83a3487d2703">'
    '<input type="hidden" name="from_name" value="cognis.group newsletter">'
    '<input type="hidden" name="subject" value="New newsletter signup — cognis.group">'
    '<input type="hidden" name="redirect" value="https://cognis.group/thanks-subscribe">'
    '<input class="cgxf-email" type="email" name="email" required placeholder="Enter your email" aria-label="Email address">'
    '<button class="cgxf-btn" type="submit">Subscribe<span class="cgxf-arrow" aria-hidden="true">→</span></button>'
    "</form>"
    "</div>"
    '<p class="cgxf-copy">© 2026 Cognis Group. All rights reserved.</p>'
    "</div>"
    "</footer>"
)

STYLE = """<style data-cognis-gnav>
  :root { --cgx-ink: #131313; --cgx-lime: #d6fd70; }
  /* ---- HEADER (faithful to the global: fixed, transparent, dark ink on light) ---- */
  header.cgx { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: transparent; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  header.cgx .cgx-in { max-width: 1280px; margin: 0 auto; padding: 18px 32px; display: flex; align-items: center; gap: 8px; }
  header.cgx .cgx-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; margin-right: auto; color: var(--cgx-ink); }
  header.cgx .cgx-mark { width: 32px; height: 24px; fill: currentColor; display: block; }
  header.cgx .cgx-word { font-weight: 600; letter-spacing: -0.04em; font-size: 23px; color: var(--cgx-ink); }
  header.cgx .cgx-nav { display: flex; align-items: center; }
  header.cgx .cgx-nav a { color: var(--cgx-ink); text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1.68px; text-transform: uppercase; padding: 12px 20px; }
  header.cgx .cgx-roll { position: relative; display: inline-block; overflow: hidden; height: 20px; line-height: 20px; vertical-align: top; }
  header.cgx .cgx-roll > span { display: block; transition: transform .34s cubic-bezier(.2,.7,.2,1); }
  header.cgx a:hover .cgx-roll > span { transform: translateY(-20px); }
  header.cgx .cgx-cta { margin-left: 14px; background: var(--cgx-lime); color: #131313; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; padding: 11px 20px; border-radius: 48px; white-space: nowrap; transition: transform .2s ease, box-shadow .2s ease; }
  header.cgx .cgx-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 26px -10px rgba(214,253,112,.95); }
  header.cgx .cgx-burger { display: none; flex-direction: column; gap: 5px; align-items: center; justify-content: center; width: 44px; height: 44px; background: var(--cgx-lime); border: 0; border-radius: 12px; cursor: pointer; }
  header.cgx .cgx-burger span { width: 20px; height: 2px; background: #131313; border-radius: 2px; transition: transform .25s ease, opacity .2s ease; }
  header.cgx.open .cgx-burger span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  header.cgx.open .cgx-burger span:nth-child(2) { opacity: 0; }
  header.cgx.open .cgx-burger span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
  header.cgx .cgx-drawer { display: none; flex-direction: column; gap: 2px; padding: 6px 32px 24px; }
  header.cgx .cgx-drawer a { color: #131313; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 4px; border-bottom: 1px solid rgba(19,19,19,.06); }
  header.cgx .cgx-drawer .cgx-cta { display: inline-block; margin: 16px 0 0; text-align: center; border-bottom: 0; }
  /* shells are light pages — push content clear of the fixed header */
  header.cgx ~ main, header.cgx + main { padding-top: 96px; }
  @media (max-width: 860px) {
    header.cgx .cgx-in { padding: 14px 20px; }
    header.cgx .cgx-nav, header.cgx .cgx-in > .cgx-cta { display: none; }
    header.cgx .cgx-burger { display: flex; }
    header.cgx { background: rgba(255,255,255,0.9); backdrop-filter: saturate(180%) blur(12px); -webkit-backdrop-filter: saturate(180%) blur(12px); }
    header.cgx.open { background: #fff; }
    header.cgx.open .cgx-drawer { display: flex; }
  }
  /* ---- FOOTER (faithful: dark rounded card inset in white) ---- */
  footer.cgxf { background: transparent; padding: 12px; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  footer.cgxf .cgxf-card { background: #0f0f0f; color: #fff; border-radius: 26px; padding: 56px 60px 40px; max-width: 1416px; margin: 0 auto; }
  footer.cgxf .cgxf-top { display: flex; justify-content: space-between; gap: 48px; flex-wrap: wrap; }
  footer.cgxf .cgxf-brand { max-width: 620px; }
  footer.cgxf .cgxf-logo { display: inline-flex; align-items: center; gap: 9px; text-decoration: none; color: #fff; }
  footer.cgxf .cgxf-logo .cgx-mark { width: 34px; height: 26px; fill: #fff; }
  footer.cgxf .cgxf-logo span { font-weight: 600; letter-spacing: -0.04em; font-size: 24px; }
  footer.cgxf .cgxf-desc { color: #aeb0b3; font-size: 15px; line-height: 1.62; margin: 22px 0 0; }
  footer.cgxf .cgxf-desc em { font-style: italic; color: #cfd1d4; }
  footer.cgxf .cgxf-nav { display: grid; grid-template-columns: repeat(2, auto); gap: 18px 64px; align-content: start; }
  footer.cgxf .cgxf-nav a { color: #fff; text-decoration: none; font-size: 15px; font-weight: 500; opacity: .92; }
  footer.cgxf .cgxf-nav a:hover { opacity: 1; box-shadow: inset 0 -2px 0 var(--cgx-lime); }
  footer.cgxf .cgxf-sub { margin-top: 46px; }
  footer.cgxf .cgxf-subh { font-size: 17px; font-weight: 600; margin: 0 0 16px; }
  footer.cgxf .cgxf-form { display: flex; align-items: center; background: #242424; border-radius: 999px; padding: 6px 6px 6px 4px; max-width: 420px; }
  footer.cgxf .cgxf-email { flex: 1; background: transparent; border: 0; outline: 0; color: #fff; font-size: 14px; padding: 12px 18px; }
  footer.cgxf .cgxf-email::placeholder { color: #9a9ca0; }
  footer.cgxf .cgxf-btn { display: inline-flex; align-items: center; gap: 8px; background: var(--cgx-lime); color: #131313; border: 0; border-radius: 999px; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 12px 22px; cursor: pointer; transition: transform .2s ease; }
  footer.cgxf .cgxf-btn:hover { transform: translateX(1px); }
  footer.cgxf .cgxf-copy { color: #949699; font-size: 13px; margin: 36px 0 0; }
  @media (max-width: 760px) {
    footer.cgxf .cgxf-card { padding: 40px 24px 30px; border-radius: 22px; }
    footer.cgxf .cgxf-top { flex-direction: column; gap: 32px; }
    footer.cgxf .cgxf-nav { grid-template-columns: 1fr; gap: 12px; }
    footer.cgxf .cgxf-form { max-width: none; }
  }
</style>"""

SCRIPT = """<script data-cognis-gnav>
(function () {
  var h = document.querySelector('header.cgx[data-cognis-gnav]');
  if (h) {
    var here = location.pathname.replace(/\\/index\\.html$/, '').replace(/\\/+$/, '') || '/';
    h.querySelectorAll('a[href]').forEach(function (a) {
      var p = (a.getAttribute('href') || '').replace(/\\/+$/, '') || '/';
      if (p === here) a.setAttribute('aria-current', 'page');
    });
    var burger = h.querySelector('.cgx-burger'), drawer = h.querySelector('.cgx-drawer');
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
  }
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
        if not OLD_HEADER_RE.search(html) and "data-cognis-gnav" not in html:
            continue
        new = OLD_HEADER_RE.sub(HEADER, html)
        new = OLD_FOOTER_RE.sub(FOOTER, new)
        new = strip_block(new, START, END)
        if "</body>" in new:
            new = new.replace("</body>", BLOCK + "\n</body>", 1)
        if new != html:
            p.write_text(new, encoding="utf-8")
            changed += 1
            print(f"  chrome replicated: {p.relative_to(ROOT)}")
    print(f"\n{changed} shells updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
