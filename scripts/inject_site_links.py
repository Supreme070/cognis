#!/usr/bin/env python3
"""Inject a site-links strip into Framer snapshots for pages Framer's nav
doesn't know about.

Framer's CMS nav covers About / Services / Insights / Contact. Our
standalone shells — Case Studies, How We Work, FAQ, Privacy, Terms — do
not exist in Framer's CMS, so its client-side router cannot link to them
and any direct edit to Framer's header gets clobbered on hydration.

Solution: append a lightweight, brand-matched links strip immediately
before </body> in every Framer snapshot. Sits below Framer's own footer,
serves crawlers and AI bots regardless of JS state, and is fully
idempotent behind sentinel comments.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START = "<!-- cognis-site-links:start -->"
END = "<!-- cognis-site-links:end -->"

BLOCK = f"""{START}
<style data-cognis-site-links>
  .cognis-site-links {{
    background: #0A0A0A; color: #C1C1C1;
    padding: 32px 24px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px; line-height: 1.6; border-top: 1px solid #222;
  }}
  .cognis-site-links .csl-inner {{
    max-width: 1100px; margin: 0 auto;
    display: flex; flex-wrap: wrap; gap: 20px 32px; align-items: center; justify-content: space-between;
  }}
  .cognis-site-links .csl-group {{ display: flex; flex-wrap: wrap; gap: 18px; }}
  .cognis-site-links a {{ color: #C1C1C1; text-decoration: none; font-weight: 500; }}
  .cognis-site-links a:hover {{ color: #CDFB56; }}
  .cognis-site-links .csl-label {{
    font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
    color: #7b7b7b; font-weight: 600; margin-right: 8px;
  }}
</style>
<nav class="cognis-site-links" aria-label="Secondary site navigation">
  <div class="csl-inner">
    <div class="csl-group">
      <span class="csl-label">Explore</span>
      <a href="/case-studies">Case Studies</a>
      <a href="/how-we-work">How We Work</a>
      <a href="/faq">FAQ</a>
    </div>
    <div class="csl-group">
      <span class="csl-label">Legal</span>
      <a href="/privacy-policy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/contact">Contact</a>
    </div>
  </div>
</nav>
{END}"""


def snapshot_paths() -> list[Path]:
    paths: list[Path] = []
    skip_roots = {
        # Standalone shells already carry these links in their own footer.
        "privacy-policy", "terms", "faq", "how-we-work", "case-studies",
        # Non-snapshot directories.
        "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy",
        "scripts", "playwright-screenshots", "stock", "tests", ".git", ".claude",
    }
    if (ROOT / "index.html").exists():
        paths.append(ROOT / "index.html")
    for sub in sorted(ROOT.iterdir()):
        if not sub.is_dir() or sub.name.startswith(".") or sub.name in skip_roots:
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
    if "</body>" not in html:
        return False
    new_html = html.replace("</body>", BLOCK + "\n</body>", 1)
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
