#!/usr/bin/env python3
"""Rewrite Framer CDN image URLs in .mjs bundles to local paths.

Framer bundles hardcode `https://framerusercontent.com/images/<id>.<ext>` in
`src` and multi-resolution `srcSet` strings. <img> tags bypass the runtime
fetch interceptor, so the browser hits the remote CDN and paints the stale
asset for one frame before our post-hydration JS swaps it. Rewriting the
bundle here means the correct local URL is rendered on first paint — no
flash, no wasted round-trip.

Idempotent: re-running after a successful rewrite is a no-op.
"""
import pathlib
import re
import sys

BASE = pathlib.Path("framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD")

# asset_id -> (bundle filename, local replacement path)
MAPPINGS = {
    "Vq8dEluyeLa4kXCSmljlRQfNxIw": (
        "DaISNe0vXimYl7L-iYMx-Zb_StOfaNQRA98vcvMbT8M.HiBPkWXm.mjs",
        "/framer-runtime/images/why-us-impact.jpg",
    ),
    "Vyfo3xCm2mXciLK38EvtcSz9M": (
        "QaJNDfNMG5C7JwHIw-sBm1Ys-NaZyVo7n9B49pO4X_Q.BfZeDgI1.mjs",
        "/framer-runtime/images/about-hero.jpg",
    ),
}


def main() -> int:
    errors = 0
    for asset_id, (bundle, local) in MAPPINGS.items():
        path = BASE / bundle
        if not path.exists():
            print(f"SKIP {bundle}: not found")
            errors += 1
            continue
        text = path.read_text()
        # Match the full Framer CDN URL including any query string up to the
        # next quote/backtick/space. This collapses the srcSet variants to a
        # single local URL — <img> falls back to src when srcSet resolves to
        # the same path for every width, which is fine.
        pattern = re.compile(
            r"https://framerusercontent\.com/images/"
            + re.escape(asset_id)
            + r"[^\"'`\s]*"
        )
        matches = pattern.findall(text)
        if not matches:
            if local in text:
                print(f"  {bundle}: {asset_id} already rewritten")
                continue
            print(f"  !! {bundle}: no matches for {asset_id}")
            errors += 1
            continue
        new_text = pattern.sub(local, text)
        # Backup sidecar on first rewrite.
        bak = path.with_suffix(path.suffix + ".bak")
        if not bak.exists():
            bak.write_bytes(path.read_bytes())
        path.write_text(new_text)
        print(f"  {bundle}: {asset_id} -> {local} ({len(matches)}x)")
    return errors


if __name__ == "__main__":
    sys.exit(main())
