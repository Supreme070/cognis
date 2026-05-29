#!/usr/bin/env python3
"""Lightweight, outside-Framer performance pass over the prerendered snapshots.

We can't touch the Framer project, so this trims the *initial* load that the
browser's preload scanner kicks off before any JS runs:

  • Adds `loading="lazy"` + `decoding="async"` to <img> tags that don't already
    declare a loading strategy, SKIPPING the first two images on the page (the
    hero / first logo are usually above the fold and shouldn't be deferred —
    deferring the LCP image would hurt, not help).

This only edits the static HTML the browser parses first; once Framer hydrates
it manages its own images. Idempotent: it never double-adds an attribute, so it
is safe to re-run as part of `npm run prerender`.

Run with the regular audit afterwards to confirm hydration-error count hasn't
regressed (changing prerendered attributes can in principle add mismatches).
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_FIRST = 2  # leave the hero / first image eager

SKIP_DIRS = {
    "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy",
    "scripts", "playwright-screenshots", "stock", "tests", ".git", ".claude",
}

IMG_RE = re.compile(r"<img\b([^>]*)>", re.IGNORECASE)


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


def process(html: str) -> tuple[str, int]:
    seen = 0
    changed = 0

    def repl(m: re.Match) -> str:
        nonlocal seen, changed
        attrs = m.group(1)
        idx = seen
        seen += 1
        if idx < SKIP_FIRST:
            return m.group(0)
        if re.search(r"\bloading\s*=", attrs, re.IGNORECASE):
            return m.group(0)  # already has a strategy — leave it
        add = ' loading="lazy"'
        if not re.search(r"\bdecoding\s*=", attrs, re.IGNORECASE):
            add += ' decoding="async"'
        changed += 1
        return "<img" + attrs + add + ">"

    return IMG_RE.sub(repl, html), changed


def main() -> int:
    total = 0
    pages = 0
    for p in snapshot_paths():
        html = p.read_text(encoding="utf-8")
        new, n = process(html)
        if n and new != html:
            p.write_text(new, encoding="utf-8")
            pages += 1
            total += n
            print(f"  {p.relative_to(ROOT)}: +{n} lazy")
    print(f"\nlazy-loaded {total} images across {pages} snapshots")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
