#!/usr/bin/env python3
"""Inject longform body content into prerendered blog snapshots.

Framer CMS bodies render at ~300 words — too thin for AIO/GEO. This
walks each /blog/<slug>/index.html, finds the `<!-- Start of bodyEnd -->`
marker, and injects a styled <article> containing lead, author byline,
H2-question sections, and a related-services CTA block.

Idempotent: wraps output in sentinel comments so re-runs replace the
prior injection cleanly.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from longform_blog import BLOG  # noqa: E402

START = "<!-- cognis-longform:start -->"
END = "<!-- cognis-longform:end -->"
MARKER = "<!-- Start of bodyEnd -->"

STYLE = """
<style data-cognis-longform-style>
  article.cognis-longform {
    max-width: 760px;
    margin: 48px auto 96px;
    padding: 0 24px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #131313;
    font-size: 17px;
    line-height: 1.72;
  }
  article.cognis-longform .lf-lead {
    font-size: 20px; line-height: 1.55; color: #2f2f2f;
    margin: 0 0 24px; font-weight: 500;
  }
  article.cognis-longform .lf-byline {
    color: #7b7b7b; font-size: 14px; margin: 0 0 40px;
    padding-bottom: 24px; border-bottom: 1px solid #e6e6e6;
  }
  article.cognis-longform .lf-byline a { color: #131313; text-decoration: none; font-weight: 600; }
  article.cognis-longform .lf-byline a:hover { background: #cdfb56; }
  article.cognis-longform h2 {
    font-size: 26px; line-height: 1.25; letter-spacing: -0.01em;
    margin: 40px 0 14px; font-weight: 700;
  }
  article.cognis-longform p { margin: 0 0 16px; }
  article.cognis-longform ul, article.cognis-longform ol { padding-left: 22px; margin: 0 0 18px; }
  article.cognis-longform li { margin-bottom: 8px; }
  article.cognis-longform a { color: #131313; text-decoration: underline; text-underline-offset: 3px; }
  article.cognis-longform a:hover { background: #cdfb56; }
  article.cognis-longform .lf-related {
    margin-top: 56px; padding: 28px; background: #ffffff;
    border: 1px solid #e6e6e6; border-radius: 12px;
  }
  article.cognis-longform .lf-related h3 {
    margin: 0 0 12px; font-size: 16px; letter-spacing: 0.04em;
    text-transform: uppercase; color: #7b7b7b; font-weight: 600;
  }
  article.cognis-longform .lf-related ul { list-style: none; padding: 0; margin: 0; }
  article.cognis-longform .lf-related li { margin: 0 0 8px; }
</style>
"""


def render(slug: str, data: dict) -> str:
    a = data["author"]
    byline = (
        f'By <a href="/teams/{a["slug"]}">{a["name"]}</a> · {a["role"]}'
    )
    sections = "\n".join(
        f'<h2>{s["q"]}</h2>\n{s["body"].strip()}' for s in data["sections"]
    )
    related_items = "\n".join(
        f'  <li><a href="{href}">{label} →</a></li>' for href, label in data["related"]
    )
    related = (
        '<aside class="lf-related">\n'
        '  <h3>Related services</h3>\n'
        f'  <ul>\n{related_items}\n  </ul>\n'
        '</aside>'
    )
    return (
        f'{START}\n{STYLE}\n'
        f'<article class="cognis-longform" data-cognis-slug="{slug}">\n'
        f'  <p class="lf-lead">{data["lead"]}</p>\n'
        f'  <p class="lf-byline">{byline}</p>\n'
        f'  {sections}\n'
        f'  {related}\n'
        f'</article>\n{END}'
    )


def inject(path: Path, block: str) -> bool:
    html = path.read_text(encoding="utf-8")
    # Strip prior injection.
    html = re.sub(
        re.escape(START) + r"[\s\S]*?" + re.escape(END) + r"\s*",
        "",
        html,
    )
    if MARKER not in html:
        return False
    new_html = html.replace(MARKER, MARKER + "\n" + block + "\n", 1)
    path.write_text(new_html, encoding="utf-8")
    return True


def main() -> int:
    changed = 0
    for slug, data in BLOG.items():
        path = ROOT / "blog" / slug / "index.html"
        if not path.exists():
            print(f"  missing: {path.relative_to(ROOT)}")
            continue
        block = render(slug, data)
        if inject(path, block):
            changed += 1
            print(f"  injected: {path.relative_to(ROOT)}")
        else:
            print(f"  no marker: {path.relative_to(ROOT)}")
    print(f"\n{changed}/{len(BLOG)} blog snapshots updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
