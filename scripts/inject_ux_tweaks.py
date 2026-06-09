#!/usr/bin/env python3
"""Inject small CSS tweaks that Framer's runtime won't clobber.

Two issues these address:
  1. Mobile scroll-lock on about-us "team" slideshow — Framer's horizontal
     slideshow captures touch events on the card area and traps vertical
     page scroll. `touch-action: pan-y` lets the browser keep vertical
     scroll while the component handles horizontal swipes.
  2. Testimonials slideshow transition feels too snappy — the 0.25s
     default slide transform snaps rather than glides. We force a softer
     CSS transition on the inner track. If Framer's motion layer uses
     JS-driven springs instead of CSS transitions on a given page, the
     rule is a no-op, not a regression.

Idempotent via sentinel comments. Wired into `npm run prerender`.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START = "<!-- cognis-ux-tweaks:start -->"
END = "<!-- cognis-ux-tweaks:end -->"

BLOCK = f"""{START}
<style data-cognis-ux-tweaks>
  /* Let vertical page scroll pass through horizontal Framer slideshows
     on mobile (e.g. the testimonials carousel). */
  .framer-slideshow,
  .framer-slideshow-axis-x,
  [data-framer-name="slideshow"] {{
    touch-action: pan-y;
  }}
  .framer-slideshow > div,
  .framer-slideshow-axis-x > div {{
    touch-action: pan-y;
  }}

  /* Soften testimonials transition — Framer default of 0.25s snaps when
     you release a swipe. 0.55s cubic-bezier glides into place. */
  .framer-slideshow-axis-x ul {{
    transition: transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) !important;
  }}

  /* About-us "Meet our team": the team slideshow was frozen at slide 0 (a
     leftover from hiding a 4th member) and rendered 1-up on phones, so only
     the first card (Supreme) showed and the track couldn't be swiped to the
     rest. Convert the carousel into a responsive wrapping grid — 3-up on
     desktop, 2-up on tablet, stacked on mobile — so every member is visible
     with normal page scroll and no swipe. The carousel's looped clone slides
     (4 sets of [Supreme, Kola, Fisayo, hidden 4th]) collapse to the first
     three real cards. */
  [data-framer-name="team"] [data-framer-name="Desktop"],
  [data-framer-name="team"] .framer-slideshow-axis-x,
  [data-framer-name="team"] .framer-slideshow-axis-x > div,
  [data-framer-name="team"] .framer-slideshow-axis-x ul {{
    position: relative !important;
    inset: auto !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    perspective: none !important;
  }}
  [data-framer-name="team"] .framer-slideshow-axis-x ul {{
    flex-wrap: wrap !important;
    justify-content: center;
    align-items: stretch;
    gap: 24px !important;
    /* The Framer slideshow JS stays live and otherwise drifts the track
       (~15px translateX) and animates it via the inherited 0.55s transition.
       Pin it still — a stylesheet !important always beats the JS's inline
       (non-important) transform, so no MutationObserver freeze is needed. */
    transform: none !important;
    transition: none !important;
  }}
  /* The slideshow also marks "off-view" slides visibility:hidden inline —
     that was blanking the 3rd card (Fisayo). Force every grid card visible
     (hidden clones stay gone via the display:none rule below, which wins). */
  [data-framer-name="team"] .framer-slideshow-axis-x ul > li,
  [data-framer-name="team"] .framer-slideshow-axis-x ul > li * {{
    visibility: visible !important;
  }}
  /* Let vertical page scroll pass through the (now static) team grid. */
  [data-framer-name="team"] .framer-slideshow-axis-x,
  [data-framer-name="team"] .framer-slideshow-axis-x * {{
    touch-action: pan-y;
  }}
  [data-framer-name="team"] .framer-slideshow-axis-x ul > li:nth-child(n+4) {{
    display: none !important;
  }}
  [data-framer-name="team"] .framer-slideshow-axis-x ul > li > div {{
    width: calc(33.333% - 16px) !important;
    height: auto !important;
  }}
  @media (max-width: 809px) {{
    [data-framer-name="team"] .framer-slideshow-axis-x ul > li > div {{ width: calc(50% - 12px) !important; }}
  }}
  @media (max-width: 539px) {{
    [data-framer-name="team"] .framer-slideshow-axis-x ul > li > div {{ width: 100% !important; }}
  }}
  /* hide the now-dead carousel prev/next arrows (the "Contact us" CTA is an <a>) */
  [data-framer-name="team"] button {{
    display: none !important;
  }}
  /* Fisayo Oludare's photo is a stock placeholder, not a real headshot —
     leave the image slot empty until a real photo is supplied. */
  [data-framer-name="team"] img[src*="il73eZeVzET6bn72svJVyQpD4"] {{
    display: none !important;
  }}
</style>
{END}"""


def snapshot_paths() -> list[Path]:
    paths: list[Path] = []
    skip = {
        "privacy-policy", "terms", "faq", "how-we-work", "case-studies",
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


def inject(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    html = re.sub(
        re.escape(START) + r"[\s\S]*?" + re.escape(END) + r"\s*",
        "",
        html,
    )
    if "</head>" not in html:
        return False
    new_html = html.replace("</head>", f"  {BLOCK}\n</head>", 1)
    if new_html == html:
        return False
    path.write_text(new_html, encoding="utf-8")
    return True


def main() -> int:
    changed = 0
    paths = snapshot_paths()
    for p in paths:
        if inject(p):
            changed += 1
            print(f"  injected: {p.relative_to(ROOT)}")
    print(f"\n{changed}/{len(paths)} snapshots updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
