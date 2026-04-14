#!/usr/bin/env python3
"""Retrofit hreflang tags onto existing prerendered snapshots.

Idempotent: removes any existing rel=alternate hreflang tags on the page
before inserting a fresh en + x-default pair immediately after the
canonical link. Future prerenders get hreflang directly from
`prerender_routes.mjs`; this script is for the current snapshot set.

Usage:
    python3 scripts/inject_hreflang.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = "https://cognis.group"

CANONICAL_RE = re.compile(
    r'(<link\s+rel="canonical"\s+href="([^"]+)"[^>]*/?>)', re.IGNORECASE
)
EXISTING_HREFLANG_RE = re.compile(
    r'<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*/?>\s*', re.IGNORECASE
)


def snapshot_paths() -> list[Path]:
    paths: list[Path] = []
    skip = {"node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy", "scripts", "playwright-screenshots", "stock", "tests", ".git"}
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
    m = CANONICAL_RE.search(html)
    if not m:
        return False
    canonical_tag = m.group(1)
    canonical_url = m.group(2)
    # Strip any pre-existing hreflang alternates.
    cleaned = EXISTING_HREFLANG_RE.sub("", html)
    # Re-find canonical in cleaned output (indices may have shifted).
    m2 = CANONICAL_RE.search(cleaned)
    if not m2:
        return False
    hreflang_block = (
        f'\n    <link rel="alternate" hreflang="en" href="{canonical_url}" />'
        f'\n    <link rel="alternate" hreflang="x-default" href="{canonical_url}" />'
    )
    new_html = cleaned[: m2.end()] + hreflang_block + cleaned[m2.end():]
    if new_html != html:
        path.write_text(new_html, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed = 0
    total = 0
    for p in snapshot_paths():
        total += 1
        if inject(p):
            changed += 1
            print(f"  updated: {p.relative_to(ROOT)}")
        else:
            print(f"  skipped: {p.relative_to(ROOT)} (no canonical or already current)")
    print(f"\n{changed}/{total} snapshots updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
