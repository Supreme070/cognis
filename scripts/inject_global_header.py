#!/usr/bin/env python3
"""The ONE global header. Defined here once, stamped onto every page.

The markup is the landing-page header (logo, Home / About Us / Services /
Products / Insights, the Explore dropdown, the lime "Work With Us" pill,
hover roll, fade-up on load). Every page gets byte-identical markup except:

  * skin  — text colour only. WHITE on pages whose hero is dark (the header
            sits over a photo/black surface); DARK (#131313) everywhere else.
  * current page — the matching nav link gets aria-current + the lime
            underline (Explore is underlined for its child pages).

Mobile: cognis.js builds the hamburger + slide-in menu from these links and
responsive.css hides the desktop row under 992px, exactly as on the landing
page — so both are linked on any page that lacks them.

Run after every other injector (it is last in `npm run prerender`):

    python3 scripts/inject_global_header.py

Idempotent. Replaces any previous header it finds: the prerendered
`data-dc-tpl="7"` block, the old hand-built shells (`header.cgx`, `.site`,
`.head`), and — on the three Framer service pages — hides Framer's own nav.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {
    "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy", "scripts",
    "playwright-screenshots", "qa_evidence", "stock", "tests", "workers", "og",
    "assets", ".git", ".claude",
}

# Pages whose header sits on a dark surface -> white text. Everything else is dark text.
WHITE_SKIN = {
    "index.html",
    "our-services/index.html",
    "why-cognis/index.html",
    "how-we-work/index.html",
    "case-studies/index.html",
    "research/state-of-ai-african-enterprises-2026/index.html",
    "best-ai-consulting-firms-africa/index.html",
    "thanks/index.html",
    "thanks-subscribe/index.html",
    "confirm-subscription/index.html",
}

NAV = [("home", "/", "Home"), ("about", "/about-us/", "About Us"), ("services", "/our-services/", "Services"),
       ("products", "/products/", "Products"), ("insights", "/blog/", "Insights")]
EXPLORE = [("/why-cognis/", "Why Cognis", "The case for working with us"),
           ("/case-studies/", "Case Studies", "AI shipped to governed production"),
           ("/how-we-work/", "How We Work", "Six phases, designed to ship")]

SKIN = {
    "white": {"TEXT": "rgb(255, 255, 255)", "LINK": "rgba(255, 255, 255, 0.8)", "CHEV": "#FFFFFF"},
    "dark":  {"TEXT": "rgb(19, 19, 19)",    "LINK": "rgba(19, 19, 19, 0.8)",    "CHEV": "#131313"},
}

FONT = 'font-family: &quot;Plus Jakarta Sans&quot;, sans-serif; font-weight: 500; font-size: 14px; line-height: 20px; letter-spacing: 1.68px; text-transform: uppercase; white-space: nowrap;'


def current_key(rel: str) -> str | None:
    """Which nav item is 'here' for this page path."""
    if rel == "index.html":
        return "home"
    top = rel.split("/")[0]
    return {"about-us": "about", "our-services": "services", "products": "products", "blog": "insights",
            "why-cognis": "explore", "case-studies": "explore", "how-we-work": "explore",
            "contact": "contact"}.get(top)


def header_html(skin: str, current: str | None) -> str:
    c = SKIN[skin]
    links = []
    for key, href, label in NAV:
        cur = ' aria-current="page"' if key == current else ""
        cls = "cg-gh-link cg-gh-current" if key == current else "cg-gh-link"
        links.append(
            f'        <a class="{cls}" href="{href}"{cur} style="color: {c["LINK"]}; {FONT}">'
            f'<span class="cgRoll"><b>{label}</b><b>{label}</b></span></a>')
    explore_items = "".join(
        f'\n              <a href="{href}"><span class="t">{t}</span><span class="d">{d}</span></a>'
        for href, t, d in EXPLORE)
    exp_cls = "cg-exp cg-gh-current" if current == "explore" else "cg-exp"
    cta_cur = ' aria-current="page"' if current == "contact" else ""
    return f'''<div data-dc-tpl="7" class="cg-gh" data-cg-skin="{skin}" style="position: absolute; top: 12px; left: 12px; right: 12px; z-index: 1000; padding: 24px clamp(16px, 3.33vw, 48px);">
    <div style="max-width: 1280px; margin: 0px auto; display: flex; align-items: center; justify-content: space-between; animation: 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0s 1 normal both running cgFadeUp;">
      <a class="cg-gh-logo" href="/" aria-label="Cognis Group" style="display: flex; align-items: center; gap: 9px; color: {c["TEXT"]};">
        <svg class="cg-mark-hero" viewBox="0 0 48 48" aria-hidden="true" style="width: 28px; height: 28px; fill: currentcolor; display: block;"><path d="M 42.66 12.34 A 22 22 0 1 0 42.66 35.66 L 33.19 31.71 A 12 12 0 1 1 33.19 16.29 Z"></path><rect x="36" y="19" width="10" height="10" fill="#D6FD70"></rect></svg>
        <span style="font-family: &quot;Plus Jakarta Sans&quot;, sans-serif; font-weight: 600; font-size: 23px; color: {c["TEXT"]}; letter-spacing: -0.04em;">Cognis</span>
      </a>
      <div style="display: flex; align-items: center; gap: 24px;">
{chr(10).join(links)}
        <div class="{exp_cls}" tabindex="0" style="height: 20px; color: {c["LINK"]}; {FONT} cursor: default;">
          <span style="display: inline-flex; align-items: center; gap: 5px;">Explore
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="opacity: 0.85;"><path d="M2 3.5L5 6.5L8 3.5" stroke="{c["CHEV"]}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          </span>
          <div class="cg-exp-panel">
            <div class="cg-exp-menu">{explore_items}
            </div>
          </div>
        </div>
      </div>
      <a class="cg-gh-cta" href="/contact/"{cta_cur} style="background: rgb(214, 253, 112); color: rgb(19, 19, 19); {FONT} padding: 12px 22px; border-radius: 100px; transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), background-color 0.3s;">Work With Us</a>
    </div>
  </div>'''


# Everything the header needs that the landing page defines in its own <style>.
STYLE = """<style data-cognis-gheader>
  @keyframes cgFadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
  .cg-gh .cgRoll { display: inline-block; overflow: hidden; height: 20px; vertical-align: top; }
  .cg-gh .cgRoll b { display: block; font-weight: inherit; transition: transform 0.18s cubic-bezier(0.33,1,0.68,1); }
  .cg-gh a:hover > .cgRoll b { transform: translateY(-20px); }
  .cg-gh[data-cg-skin="white"] a.cg-gh-link:hover { color: #FFFFFF !important; }
  .cg-gh[data-cg-skin="dark"] a.cg-gh-link:hover { color: #131313 !important; }
  .cg-gh a.cg-gh-cta:hover { background: #FFFFFF !important; transform: scale(0.95); }
  .cg-gh .cg-gh-current { box-shadow: rgb(214, 253, 112) 0px -2px 0px inset; padding-bottom: 4px; }
  .cg-gh .cg-exp { position: relative; }
  .cg-gh .cg-exp-panel { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); padding-top: 16px; opacity: 0; visibility: hidden; transition: opacity .22s ease; z-index: 30; }
  .cg-gh .cg-exp:hover .cg-exp-panel, .cg-gh .cg-exp:focus-within .cg-exp-panel { opacity: 1; visibility: visible; }
  .cg-gh .cg-exp-menu { background: #131313; border: 1px solid rgba(255,255,255,0.10); border-radius: 16px; padding: 8px; min-width: 236px; display: flex; flex-direction: column; gap: 2px; box-shadow: 0 28px 60px rgba(0,0,0,0.45); transform: translateY(8px); transition: transform .22s cubic-bezier(.22,1,.36,1); }
  .cg-gh .cg-exp:hover .cg-exp-menu, .cg-gh .cg-exp:focus-within .cg-exp-menu { transform: translateY(0); }
  .cg-gh .cg-exp-menu a { display: flex; flex-direction: column; gap: 2px; padding: 11px 14px; border-radius: 11px; text-transform: none; letter-spacing: -0.01em; transition: background .15s ease; text-decoration: none; }
  .cg-gh .cg-exp-menu a:hover { background: rgba(255,255,255,0.06); }
  .cg-gh .cg-exp-menu .t { font-weight: 600; font-size: 14px; color: #FFFFFF; }
  .cg-gh .cg-exp-menu .d { font-weight: 400; font-size: 12px; color: rgba(255,255,255,0.5); }
  .cg-gh a { text-decoration: none; }
  /* Pages where the header is a direct child of <body> (no prerendered hero
     wrapper) need their content pushed clear of the absolute header. */
  body > .cg-gh ~ main { padding-top: 108px; }
  body > .cg-gh ~ div > .sc-host { padding-top: 108px; } /* brand manual: its runtime renders the doc into a shadow host */
  /* Prerendered pages whose hero card starts with a 12px margin: keep that margin
     inside the wrapper (no collapse) so the absolute header measures from the page top. */
  .sc-host > div:has(> .cg-gh) { display: flow-root; }
  /* Framer service pages: the global header replaces Framer's own nav. */
  div:has(> nav.framer-AZa26), nav.framer-AZa26 { display: none !important; }
</style>"""

FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet" data-cognis-gheader-font>'
CSS_LINK = '<link rel="stylesheet" href="/responsive.css">'
JS_TAG = '<script src="/cognis.js" defer></script>'

OLD_SHELL_RE = re.compile(r'<header class="(?:cgx|site-nav|cgnav|site|head)"[^>]*>[\s\S]*?</header>\s*', re.IGNORECASE)
OLD_GNAV_SCRIPT_RE = re.compile(r'<script data-cognis-gnav>[\s\S]*?</script>\s*')


def dc_block(html: str) -> tuple[int, int] | None:
    """Span of the balanced <div data-dc-tpl="7" ...>...</div> block, if present."""
    start = html.find('<div data-dc-tpl="7"')
    if start < 0:
        return None
    depth = 0
    for m in re.finditer(r"<div\b|</div>", html[start:]):
        depth += 1 if m.group(0) == "<div" else -1
        if depth == 0:
            return start, start + m.end()
    return None


def pages() -> list[Path]:
    out = []
    for p in sorted(ROOT.rglob("index.html")):
        rel = p.relative_to(ROOT)
        if rel.parts[0] in SKIP_DIRS or any(part.startswith(".") for part in rel.parts):
            continue
        out.append(p)
    return out


def process(p: Path) -> str:
    rel = p.relative_to(ROOT).as_posix()
    html = p.read_text(encoding="utf-8")
    skin = "white" if rel in WHITE_SKIN else "dark"
    hdr = header_html(skin, current_key(rel))
    framer = 'nav class="framer-AZa26' in html

    span = dc_block(html)
    if span:
        html = html[:span[0]] + hdr + html[span[1]:]
        how = "replaced prerendered header"
    elif OLD_SHELL_RE.search(html):
        html = OLD_SHELL_RE.sub(hdr + "\n", html, count=1)
        html = OLD_GNAV_SCRIPT_RE.sub("", html)
        how = "replaced shell header"
    else:
        # No header at all (thank-you pages, brand manual, Framer pages): first thing in <body>.
        body = re.compile(r"<body[^>]*>").search(html, html.find("</head>"))
        html = html[:body.end()] + "\n" + hdr + "\n" + html[body.end():]
        how = "inserted header"

    if framer and 'data-cg-no-reveal' not in html:
        # Framer runs its own appear animations; keep cognis.js to the nav only.
        html = re.sub(r"<html\b", '<html data-cg-no-reveal', html, count=1)

    # Head: shared style (refresh), fonts, responsive layer, nav script — each once.
    html = re.sub(r"<style data-cognis-gheader>[\s\S]*?</style>\n?", "", html)
    add = [STYLE]
    if "Plus+Jakarta" not in html:
        add.insert(0, FONT_LINK)
    if "/responsive.css" not in html:
        add.append(CSS_LINK)
    if "/cognis.js" not in html:
        add.append(JS_TAG)
    html = html.replace("</head>", "\n".join(add) + "\n</head>", 1)
    p.write_text(html, encoding="utf-8")
    return f"{how:28} {skin:5} {rel}"


def main() -> int:
    for p in pages():
        print(process(p))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
