#!/usr/bin/env python3
"""Inject small CSS tweaks that Framer's runtime won't clobber.

Two issues these address:
  1. About-us "Meet our team" — the native Framer block is a horizontal
     slideshow that froze at slide 0 and, after Fisayo & Eugene were
     retired, only loops two real members (Supreme, Kola): it rendered a
     duplicate Supreme on desktop and dropped out entirely on the phone
     breakpoint. We hide the native slideshow at every breakpoint and style
     a clean, self-contained 2-member grid (`.cognis-team`) that the
     about-us inline script (`ensureTeamGrid()`) builds and re-asserts.
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

  /* About-us "Meet our team": the native Framer block is a horizontal
     slideshow that froze at slide 0 and only loops two real members
     (Supreme, Kola) after Fisayo & Eugene were retired — so it showed a
     duplicate Supreme on desktop and disappeared on the phone breakpoint
     (Framer's mobile layout omits the section). Hide it on the about-us
     snapshot only (scoped so a "team"-named element on any other route is
     never touched) and let `ensureTeamGrid()` render the clean grid below. */
  [data-cognis-snapshot="/about-us"] [data-framer-name="team"] {{
    display: none !important;
  }}

  /* Injected replacement: a self-contained, deduplicated team grid that
     renders identically at every breakpoint (2-up desktop/tablet, stacked
     on mobile). On-brand: Royal/ink heading, lime accent, surface cards. */
  .cognis-team {{
    background: #fff;
    padding: 80px max(24px, 5vw) 96px;
  }}
  .cognis-team-inner {{
    max-width: 1280px;
    margin: 0 auto;
  }}
  .cognis-team-eyebrow {{
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #131313;
  }}
  .cognis-team-eyebrow::before {{
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #131313;
  }}
  .cognis-team-title {{
    margin: 0 0 28px;
    font-size: clamp(34px, 5vw, 56px);
    line-height: 1.02;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #131313;
  }}
  .cognis-team-cta {{
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 44px;
    padding: 12px 22px;
    border-radius: 999px;
    background: #131313;
    color: #d6fd70;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
  }}
  /* All four members fit on one row — no horizontal scroll. Responsive grid:
     4-up on desktop, 2-up on tablet, stacked on phones. minmax(0,1fr) lets
     the columns share the row evenly and shrink without overflowing. */
  .cognis-team-grid {{
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
  }}
  .cognis-team-card {{
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 22px 22px 20px;
    border-radius: 18px;
    background: #f2f2f2;
    color: #131313;
    text-decoration: none;
    transition: transform 0.25s ease, background 0.25s ease;
  }}
  a.cognis-team-card:hover {{
    background: #ececec;
    transform: translateY(-4px);
  }}
  .cognis-team-card-top {{
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }}
  .cognis-team-name {{
    font-size: clamp(20px, 1.5vw, 30px);
    line-height: 1.08;
    font-weight: 600;
    letter-spacing: -0.01em;
  }}
  .cognis-team-go {{
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #131313;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.25s ease, color 0.25s ease;
  }}
  a.cognis-team-card:hover .cognis-team-go {{
    background: #d6fd70;
    color: #131313;
  }}
  .cognis-team-go svg {{
    width: 18px;
    height: 18px;
    display: block;
  }}
  .cognis-team-role {{
    margin: 6px 0 16px;
    font-size: 14px;
    color: #7b7b7b;
  }}
  .cognis-team-photo {{
    margin-top: auto;
    overflow: hidden;
    border-radius: 14px;
    aspect-ratio: 5 / 4;
    background: #ddd;
  }}
  .cognis-team-photo img {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }}
  @media (max-width: 1099px) {{
    .cognis-team-grid {{ grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }}
  }}
  @media (max-width: 809px) {{
    .cognis-team {{ padding: 56px max(20px, 5vw) 64px; }}
  }}
  @media (max-width: 539px) {{
    .cognis-team-grid {{ grid-template-columns: 1fr; }}
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
