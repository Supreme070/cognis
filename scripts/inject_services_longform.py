#!/usr/bin/env python3
"""Inject longform body + FAQPage schema into service page snapshots.

Mirrors inject_longform.py for /blog/<slug>/. For each service we emit:
  - a styled <section class="cognis-service-longform"> with What / How /
    Who / Outcomes / visible FAQs.
  - a <script type="application/ld+json"> FAQPage schema derived from
    the same FAQs (so the visible accordion and the schema cannot drift).

Idempotent: prior injections are wrapped in sentinel comments and
stripped before re-injection.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from longform_services import SERVICES  # noqa: E402

START = "<!-- cognis-service-longform:start -->"
END = "<!-- cognis-service-longform:end -->"
MARKER = "<!-- Start of bodyEnd -->"

STYLE = """
<style data-cognis-service-style>
  section.cognis-service-longform {
    max-width: 860px; margin: 48px auto 96px; padding: 0 24px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #131313; font-size: 17px; line-height: 1.72;
  }
  section.cognis-service-longform .sv-lead {
    font-size: 20px; line-height: 1.55; color: #2f2f2f;
    margin: 0 0 40px; font-weight: 500;
    padding-bottom: 24px; border-bottom: 1px solid #e6e6e6;
  }
  section.cognis-service-longform h2 {
    font-size: 26px; line-height: 1.25; letter-spacing: -0.01em;
    margin: 48px 0 14px; font-weight: 700;
  }
  section.cognis-service-longform h3 {
    font-size: 18px; line-height: 1.35; margin: 24px 0 8px; font-weight: 600;
  }
  section.cognis-service-longform p { margin: 0 0 16px; }
  section.cognis-service-longform ul, section.cognis-service-longform ol {
    padding-left: 22px; margin: 0 0 18px;
  }
  section.cognis-service-longform li { margin-bottom: 10px; }
  section.cognis-service-longform a {
    color: #131313; text-decoration: underline; text-underline-offset: 3px;
  }
  section.cognis-service-longform a:hover { background: #cdfb56; }
  section.cognis-service-longform details {
    border-top: 1px solid #e6e6e6; padding: 18px 0;
  }
  section.cognis-service-longform details:last-of-type {
    border-bottom: 1px solid #e6e6e6;
  }
  section.cognis-service-longform details summary {
    cursor: pointer; font-weight: 600; font-size: 17px;
    list-style: none; position: relative; padding-right: 28px;
  }
  section.cognis-service-longform details summary::-webkit-details-marker { display: none; }
  section.cognis-service-longform details summary::after {
    content: "+"; position: absolute; right: 0; top: 0;
    font-size: 22px; font-weight: 400; color: #7b7b7b;
  }
  section.cognis-service-longform details[open] summary::after { content: "−"; }
  section.cognis-service-longform details p {
    margin: 12px 0 0; color: #2f2f2f;
  }
  section.cognis-service-longform .sv-related {
    margin-top: 56px; padding: 28px; background: #ffffff;
    border: 1px solid #e6e6e6; border-radius: 12px;
  }
  section.cognis-service-longform .sv-related h3 {
    margin: 0 0 12px; font-size: 14px; letter-spacing: 0.04em;
    text-transform: uppercase; color: #7b7b7b; font-weight: 600;
  }
  section.cognis-service-longform .sv-related ul { list-style: none; padding: 0; margin: 0; }
  section.cognis-service-longform .sv-related li { margin: 0 0 8px; }
</style>
"""


def render_faqs(faqs: list[dict]) -> str:
    return "\n".join(
        f'  <details><summary>{f["q"]}</summary><p>{f["a"]}</p></details>'
        for f in faqs
    )


def render_schema(faqs: list[dict]) -> str:
    doc = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": f["q"],
                "acceptedAnswer": {"@type": "Answer", "text": f["a"]},
            }
            for f in faqs
        ],
    }
    return (
        '<script type="application/ld+json" data-cognis-service-faq>'
        + json.dumps(doc, ensure_ascii=False)
        + "</script>"
    )


def render(slug: str, data: dict) -> str:
    related_items = "\n".join(
        f'    <li><a href="{href}">{label} →</a></li>' for href, label in data["related"]
    )
    faqs_html = render_faqs(data["faqs"])
    schema = render_schema(data["faqs"])
    return (
        f"{START}\n{STYLE}\n"
        f'<section class="cognis-service-longform" data-cognis-slug="{slug}">\n'
        f'  <p class="sv-lead">{data["lead"]}</p>\n'
        f'  <h2>What this means</h2>\n{data["what"].strip()}\n'
        f'  <h2>How we deliver</h2>\n{data["how"].strip()}\n'
        f'  <h2>Who this is for</h2>\n{data["who"].strip()}\n'
        f'  <h2>Outcomes you can expect</h2>\n{data["outcomes"].strip()}\n'
        f'  <h2>Frequently asked questions</h2>\n{faqs_html}\n'
        '  <aside class="sv-related">\n'
        '    <h3>Related services</h3>\n'
        f'    <ul>\n{related_items}\n    </ul>\n'
        '  </aside>\n'
        '</section>\n'
        f'{schema}\n{END}'
    )


def inject(path: Path, block: str) -> bool:
    html = path.read_text(encoding="utf-8")
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
    for slug, data in SERVICES.items():
        path = ROOT / "our-services" / slug / "index.html"
        if not path.exists():
            print(f"  missing: {path.relative_to(ROOT)}")
            continue
        block = render(slug, data)
        if inject(path, block):
            changed += 1
            print(f"  injected: {path.relative_to(ROOT)}")
        else:
            print(f"  no marker: {path.relative_to(ROOT)}")
    print(f"\n{changed}/{len(SERVICES)} service snapshots updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
