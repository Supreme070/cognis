#!/usr/bin/env python3
"""Defer the 1.6 MB hero clip (hero-afr5.mp4) on every route except home.

The site uses a single persistent "hero portal" <video> (created by the inline
script in the page shell) that tracks the home hero image through Framer's
animations. The bug: that script sets the video `src` on EVERY page, so the
1.6 MB clip downloads even on routes where the hero image doesn't exist and the
video sits at opacity:0 forever. There's also a static, prerendered copy of the
portal <video src> on non-home snapshots that fetches at parse time.

Both are fixed here WITHOUT touching the fragile closure script:

  1. A small guard script (injected on every page) keys off the very same
     signal the original code uses — the presence of a real hero <img>
     (src/srcset containing the home hero token). If that image exists (home),
     it makes sure the portal video has its src (so a SPA return to home still
     plays). If it doesn't (any other route), it strips src/autoplay so the
     clip never downloads. Being re-evaluated on mutations, it stays correct
     across SPA navigation.

  2. On non-home snapshots only, the static prerendered portal <video> tag has
     its `src` renamed and `autoplay` removed so there is no parse-time fetch.
     Scoped to the portal tag, so a real autoplay video (e.g. services-hero.mp4)
     is never touched.

Idempotent and safe to re-run as part of `npm run prerender`.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START = "<!-- cognis-hero-video:start -->"
END = "<!-- cognis-hero-video:end -->"
HERO_TOKEN = "Yz08gMSk8HCg9OI0jQXkoDm7t7Y"
HERO_SRC = "/framer-runtime/assets/hero-afr5.mp4"

SKIP_DIRS = {
    "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy",
    "scripts", "playwright-screenshots", "stock", "tests", ".git", ".claude",
}

GUARD = f"""{START}
<script data-cognis-hero-video>
(function () {{
  var SRC = '{HERO_SRC}';
  function norm(pth) {{ return pth.replace(/\\/index\\.html$/, '').replace(/\\/+$/, ''); }}
  function isHomePath() {{ return norm(location.pathname) === ''; }}
  // The page's own <link rel=canonical> is the reliable signal for WHICH route
  // this snapshot is: it's baked in per route and never flickers. We can't use
  // location.pathname during initial load because an early inline script
  // (deferred-nav bootstrap) does history.replaceState(..., '/') on every page,
  // and Framer briefly renders home content — both would falsely read as home
  // and trigger a wasted 1.6 MB fetch on non-home routes. After things settle
  // we switch to the live path so SPA navigation is handled too.
  function canonicalIsHome() {{
    var l = document.querySelector('link[rel="canonical"]');
    if (!l) return isHomePath();
    try {{ return norm(new URL(l.href).pathname) === ''; }} catch (e) {{ return isHomePath(); }}
  }}
  var settled = false;
  setTimeout(function () {{ settled = true; }}, 4000);
  function wantVideo() {{ return settled ? isHomePath() : canonicalIsHome(); }}
  function tick() {{
    var on = wantVideo();
    document.querySelectorAll('video[data-cognis-hero-portal]').forEach(function (v) {{
      if (on) {{
        if (!v.getAttribute('src')) {{
          v.setAttribute('preload', 'metadata');
          v.src = SRC;
          var p = v.play(); if (p && p.catch) p.catch(function () {{}});
        }}
      }} else if (v.getAttribute('src')) {{
        try {{ v.pause(); }} catch (e) {{}}
        v.removeAttribute('autoplay');
        v.setAttribute('preload', 'none');
        v.removeAttribute('src');
        try {{ v.load(); }} catch (e) {{}}  // abort any in-flight fetch
      }}
    }});
  }}
  if (document.readyState !== 'loading') tick();
  else document.addEventListener('DOMContentLoaded', tick);
  try {{
    var mo = new MutationObserver(function () {{
      if (window.__cghvRAF) return;
      window.__cghvRAF = requestAnimationFrame(function () {{ window.__cghvRAF = 0; tick(); }});
    }});
    mo.observe(document.documentElement, {{ childList: true, subtree: true }});
  }} catch (e) {{}}
  [0, 50, 150, 400, 1000, 2500, 4200, 6000].forEach(function (t) {{ setTimeout(tick, t); }});
}})();
</script>
{END}"""

PORTAL_TAG_RE = re.compile(r"<video\b[^>]*data-cognis-hero-portal[^>]*>", re.IGNORECASE)


def neutralize_static_portal(html: str) -> str:
    def repl(m: re.Match) -> str:
        tag = m.group(0)
        tag = tag.replace(
            f'src="{HERO_SRC}"', f'data-cognis-portal-src="{HERO_SRC}"'
        )
        tag = re.sub(r'\sautoplay(="[^"]*")?', " ", tag)
        tag = tag.replace('preload="metadata"', 'preload="none"')
        return tag
    return PORTAL_TAG_RE.sub(repl, html)


def snapshot_paths() -> list[Path]:
    paths: list[Path] = []
    if (ROOT / "index.html").exists():
        paths.append(ROOT / "index.html")
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
    home = (ROOT / "index.html").resolve()
    changed = 0
    for p in snapshot_paths():
        html = p.read_text(encoding="utf-8")
        original = html
        is_home = p.resolve() == home

        # 1. (Re)inject the guard — every page, just before </head> (early), else </body>.
        html = strip_block(html, START, END)
        if "</head>" in html:
            html = html.replace("</head>", GUARD + "\n</head>", 1)
        elif "</body>" in html:
            html = html.replace("</body>", GUARD + "\n</body>", 1)

        # 2. Stop the inline closure from eagerly setting the video src on
        #    creation (it did so on EVERY route). With this removed, the guard
        #    above is the single owner of the src: it sets it only when the
        #    home hero image is present, and never elsewhere — so non-home
        #    routes do zero runtime fetches (not just an after-the-fact abort).
        html = html.replace(
            f"v.src = '{HERO_SRC}';",
            "/* hero src is set lazily by the cognis-hero-video guard */",
        )

        # 3. Neutralize the static prerendered portal video — non-home only.
        if not is_home:
            html = neutralize_static_portal(html)

        if html != original:
            p.write_text(html, encoding="utf-8")
            changed += 1
            print(f"  patched: {p.relative_to(ROOT)}")
    print(f"\n{changed} snapshots patched")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
