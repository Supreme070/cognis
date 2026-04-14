#!/usr/bin/env python3
"""Post-prerender alt-text injector.

Walks every snapshot `index.html` in the repo and populates `alt=""` attributes
on `<img>` tags with descriptive text. Idempotent: non-empty alts are never
overwritten. Decorative icons (stars, chevrons, pagination arrows, SVG chrome)
are left as alt="" intentionally.

Rules applied, in priority order:

1. If the existing alt is non-empty, keep it.
2. If the image's source filename appears in CURATED_ALTS, use that.
3. If the nearest `data-framer-name` ancestor chain marks the image as
   decorative (star-icon, icon-arrow, pagination arrow, generic 'icon'),
   set alt="".
4. If the image sits under a logo grid (author wrap / Trusted by / logo
   container), alt="Cognis Group client logo".
5. If the image is part of a testimonial/review block, alt="Client
   testimonial portrait".
6. Otherwise fall back to a page-context alt derived from the page title.

Usage:
    python3 scripts/inject_alt_text.py          # apply in place
    python3 scripts/inject_alt_text.py --dry    # report counts only
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Curated filename -> alt map. Keyed by the bare filename (no path, no query).
# Evidence sourced from scripts/seo-data.mjs and DOM-context inventory.
CURATED_ALTS: dict[str, str] = {
    # Team — from seo-data.mjs TEAM_MEMBERS
    "QnjDKI0euXnnnPi4GtTEaqYDJLo.png": "Supreme Oyewumi — Founder & CEO, Cognis Group",
    "QTiI3J2XXGOwJw3fyXhxuB92fl0.png": "Kola Olatunde — AI Cybersecurity & Governance Lead, Cognis Group",
    "il73eZeVzET6bn72svJVyQpD4.png": "Fisayo Oludare — Executive Director, Partnerships & AI Enablement, Cognis Group",

    # Hero / scene images
    "Yz08gMSk8HCg9OI0jQXkoDm7t7Y.png": "Cognis Group — AI consulting and engineering team at work",
    "dDHWc7fTUArNa7BYM23naUGmg.png": "Cognis Group services — AI strategy, training, and agent engineering",
    "about-hero.jpg": "Cognis Group — building AI systems that permanently transform organisations",
    "why-us-impact.jpg": "Cognis Group — measurable impact across enterprise AI engagements",
    "G5Uz4bXXbIFjOESSpN9BmMOGMI.png": "Cognis Group — partnering with forward-thinking organisations to operationalise AI",
    "JGdNRl6jQUnlEAMYGOue2qDYts.png": "Cognis Group — a Lagos-based AI advisory building smarter organisations",
    "XWVgE6Ab2HA2NJq5oJGrl9ao0Fk.png": "AI strategy and integration — identifying opportunities and implementing the right solutions",

    # Blog featured image (shared OG)
    "W7a7pFrDjUXSx6Ldb2bKvhqgg.png": "Cognis Group Insights — enterprise AI strategy and engineering",
}

# Filename prefixes that always map to decorative (alt=""). Compact SVG icons.
DECORATIVE_FILE_PREFIXES: tuple[str, ...] = (
    "60JzO5Npt",         # star-icon
    "Ps1x9bigZ",         # pagination prev arrow
    "NKVDLvvL0",         # pagination next arrow
    "kll8hkXQa",         # ui icon
    "Rpk84Ki0m",         # ui icon
    "01KHeI91D",         # ui icon
    "GprGteIPH",         # ui icon
    "1I1DgpUu3",         # icon-arrow
)

# data-framer-name tokens that mean "decorative" when they appear on the img
# itself or the nearest ancestor.
DECORATIVE_NAME_TOKENS: tuple[str, ...] = (
    "star-icon",
    "icon-arrow",
    "chevron",
    "pagination",
)

# Tokens that indicate a logo / partner grid context.
LOGO_PARENT_TOKENS: tuple[str, ...] = (
    "author wrap",
    "Trusted by forward-thinking organizations",
    "Trusted across Africa",
)

# Tokens that indicate a testimonial/review context.
TESTIMONIAL_PARENT_TOKENS: tuple[str, ...] = (
    "reviews",
    "customers",
    "person",
)

# Page slug -> human page name for fallback alts.
PAGE_CONTEXTS: dict[str, str] = {
    "/": "Cognis Group — AI consulting, strategy, and agent engineering",
    "/about-us": "Cognis Group — about the firm",
    "/our-services": "Cognis Group — AI services",
    "/blog": "Cognis Group — insights on enterprise AI",
    "/contact": "Cognis Group — contact",
    "/our-services/ai-strategy-advisory": "AI strategy and advisory — Cognis Group",
    "/our-services/ai-training-workforce-development": "AI training and workforce development — Cognis Group",
    "/our-services/ai-agent-automation-engineering": "AI agent and automation engineering — Cognis Group",
    "/our-services/ai-governance-risk-compliance": "AI governance, risk, and compliance — Cognis Group",
    "/our-services/ml-data-intelligence": "Machine learning and data intelligence — Cognis Group",
    "/our-services/enterprise-digital-transformation": "Enterprise digital transformation — Cognis Group",
}

IMG_RE = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
ALT_RE = re.compile(r'\balt="([^"]*)"', re.IGNORECASE)
SRC_RE = re.compile(r'\bsrc="([^"]*)"', re.IGNORECASE)
FRAMER_NAME_RE = re.compile(r'data-framer-name="([^"]+)"')


def snapshot_paths() -> list[Path]:
    """Every prerendered `index.html` in the site tree."""
    paths: list[Path] = []
    if (ROOT / "index.html").exists():
        paths.append(ROOT / "index.html")
    for sub in sorted(ROOT.iterdir()):
        if not sub.is_dir() or sub.name.startswith((".", "_", "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy", "scripts", "playwright", "stock", "tests")):
            continue
        idx = sub / "index.html"
        if idx.exists():
            paths.append(idx)
        for child in sorted(sub.iterdir()):
            if child.is_dir():
                nested = child / "index.html"
                if nested.exists():
                    paths.append(nested)
    return paths


def derive_page_key(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        rel = rel[: -len("/index.html")]
    return "/" + rel


def build_alt(
    img_tag: str,
    html: str,
    img_start: int,
    page_key: str,
) -> str | None:
    """Return the alt text to use, or None to leave unchanged."""
    src_m = SRC_RE.search(img_tag)
    if not src_m:
        return None
    src = src_m.group(1)
    fn = src.split("?")[0].split("#")[0].split("/")[-1]

    # Rule 2: curated map wins.
    if fn in CURATED_ALTS:
        return CURATED_ALTS[fn]

    # Rule 3a: decorative by filename prefix.
    if any(fn.startswith(pref) for pref in DECORATIVE_FILE_PREFIXES):
        return ""

    # Rule 3b: decorative by framer-name on element or any recent ancestor.
    ancestor_names = FRAMER_NAME_RE.findall(html[max(0, img_start - 3000):img_start])
    self_name_m = FRAMER_NAME_RE.search(img_tag)
    name_stack = list(ancestor_names[-6:])
    if self_name_m:
        name_stack.append(self_name_m.group(1))
    name_blob = " | ".join(name_stack)
    if any(tok in name_blob for tok in DECORATIVE_NAME_TOKENS):
        return ""

    # Rule 4: logo grid / partner wall.
    if any(tok in name_blob for tok in LOGO_PARENT_TOKENS):
        return "Cognis Group client logo"

    # Rule 5: testimonial / review block.
    if any(tok in name_blob for tok in TESTIMONIAL_PARENT_TOKENS):
        return "Client testimonial portrait"

    # Rule 6: page-context fallback.
    return PAGE_CONTEXTS.get(page_key, "Cognis Group")


def inject_for_file(path: Path, dry: bool) -> tuple[int, int, int]:
    """Returns (imgs_total, imgs_updated, imgs_decorative)."""
    html = path.read_text(encoding="utf-8")
    page_key = derive_page_key(path)
    updated = 0
    decorative = 0
    total = 0
    out_parts: list[str] = []
    cursor = 0
    for m in IMG_RE.finditer(html):
        total += 1
        tag = m.group(0)
        alt_m = ALT_RE.search(tag)
        current_alt = alt_m.group(1) if alt_m else None
        if current_alt:  # non-empty → keep
            out_parts.append(html[cursor:m.end()])
            cursor = m.end()
            continue
        proposed = build_alt(tag, html, m.start(), page_key)
        if proposed is None:
            out_parts.append(html[cursor:m.end()])
            cursor = m.end()
            continue
        if proposed == "":
            decorative += 1
        # rewrite the tag
        if alt_m:
            new_tag = tag[:alt_m.start()] + f'alt="{proposed}"' + tag[alt_m.end():]
        else:
            # Inject alt just before the closing '>' (or '/>' self-close).
            if tag.endswith("/>"):
                new_tag = tag[:-2].rstrip() + f' alt="{proposed}" />'
            else:
                new_tag = tag[:-1].rstrip() + f' alt="{proposed}">'
        out_parts.append(html[cursor:m.start()])
        out_parts.append(new_tag)
        cursor = m.end()
        if proposed or proposed == "":
            updated += 1
    out_parts.append(html[cursor:])
    new_html = "".join(out_parts)
    if not dry and new_html != html:
        path.write_text(new_html, encoding="utf-8")
    return total, updated, decorative


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry", action="store_true", help="Report counts only.")
    args = parser.parse_args()

    paths = snapshot_paths()
    grand_total = 0
    grand_updated = 0
    grand_decor = 0
    for p in paths:
        total, updated, decor = inject_for_file(p, args.dry)
        grand_total += total
        grand_updated += updated
        grand_decor += decor
        rel = p.relative_to(ROOT)
        print(f"  {str(rel):60s} imgs={total:4d} updated={updated:4d} decorative={decor:4d}")

    print()
    print(f"Pages: {len(paths)}")
    print(f"Total <img>: {grand_total}")
    print(f"Alt text written: {grand_updated}")
    print(f"  of which decorative (alt=\"\"): {grand_decor}")
    print(f"  of which descriptive: {grand_updated - grand_decor}")
    if args.dry:
        print("(dry run — no files modified)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
