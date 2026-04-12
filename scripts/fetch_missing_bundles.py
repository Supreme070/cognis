#!/usr/bin/env python3
"""BFS-fetch missing Framer route bundles from framerusercontent.com.

Framer only exports the .mjs bundles referenced by the statically rendered
pages. Non-home routes (e.g. /about-us, /our-services) and their detail
variants lazy-load their own bundles at runtime, which are absent from the
local static export. They live on Framer's CDN at:

    https://framerusercontent.com/sites/<siteId>/<bundle>.mjs

Seeded with the 8 bundles that script_main.DuQsiV3H.mjs dynamically imports
but are missing on disk, this script fetches each, scans it for nested
./NAME.HASH.mjs references, and recurses until the dependency closure is
stable. Idempotent: re-running skips anything already on disk.
"""
import argparse
import pathlib
import re
import shutil
import subprocess
import sys
import time


SITE_ID = "3RYFpGbtMJS5XyuENcvikD"
REMOTE_BASE = f"https://framerusercontent.com/sites/{SITE_ID}/"
OUT_DIR = pathlib.Path(f"framer-runtime/sites/{SITE_ID}")

# Bundles referenced by script_main.DuQsiV3H.mjs via dynamic import() but
# absent from the local static export. Verified 2026-04-11 by diffing
# `grep -oE "['\"\`]\./[^'\"\`]+\.mjs['\"\`]"` against the directory listing.
DEFAULT_SEEDS = [
    "QaJNDfNMG5C7JwHIw-sBm1Ys-NaZyVo7n9B49pO4X_Q.BfZeDgI1.mjs",  # /about-us
    "cJ1xuMkLTjw-x2vTqK43D546Q19G_AQcRRmTRca7GeY.CBHzrIGZ.mjs",  # /contact
    "DaISNe0vXimYl7L-iYMx-Zb_StOfaNQRA98vcvMbT8M.HiBPkWXm.mjs",  # /our-services
    "RaXx-lARreqCyGhqVI6ltzqeLKhMkz4-PKhFjbfC-90.DcWlAPzU.mjs",  # /blog
    "rnSBpFlaRt2OIUuV4LeiOWnZGoVabaE58lWviCEenEM.BGuy1nvm.mjs",  # /our-services/:slug
    "s9_qRQGKG6KioBAaHIvXSlJUEZbOxoJqp2uKZqdFXZU.BbyOPG8m.mjs",  # /teams/:id
    "6UqGyVA04HchAsLh4XDFmX_QX0uOBiSFczYB8pphvSA.Bvof1aXz.mjs",  # QSCEvOCzd utils
    "1z7hKh1uf1R1sGYkSjIEGIKUl8ZSIDe3MevM4Khbm6I.pAJ2IbA6.mjs",  # nrURXlajq utils
]

# Matches static imports, re-exports, and dynamic import() calls:
#   import './X.mjs'; from './X.mjs'; import(`./X.mjs`)
# Bundle names are base64url-ish: [A-Za-z0-9_-]+.[A-Za-z0-9_-]+.mjs
IMPORT_RE = re.compile(r"""['"`]\./([A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.mjs)['"`]""")

# Safety rail: any fetched filename must match this.
NAME_RE = re.compile(r"^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.mjs$")


class FetchResult:
    __slots__ = ("body", "status")

    def __init__(self, body: bytes | None, status: int):
        self.body = body
        self.status = status  # HTTP status (200, 404, ...) or 0 for network error


def fetch(name: str, retries: int = 3) -> FetchResult:
    """Fetch via curl — uses the system trust store to avoid the macOS
    python3 certifi-missing SSL error."""
    url = REMOTE_BASE + name
    delay = 1.0
    last_status = 0
    for attempt in range(retries):
        try:
            proc = subprocess.run(
                [
                    "curl", "-sS", "-L",
                    "-A", "cognis-fetcher/1",
                    "-w", "\n%{http_code}",
                    "--max-time", "30",
                    url,
                ],
                capture_output=True,
                check=False,
            )
        except FileNotFoundError:
            raise SystemExit("curl not found — install curl or edit this script to use urllib")
        out = proc.stdout
        # http_code is appended after a trailing newline; body is everything before.
        nl = out.rfind(b"\n")
        if nl < 0:
            last_status = 0
        else:
            try:
                last_status = int(out[nl + 1:].decode().strip() or "0")
            except ValueError:
                last_status = 0
            body = out[:nl]
        if last_status == 200:
            return FetchResult(body, 200)
        if last_status == 404:
            return FetchResult(None, 404)
        if attempt < retries - 1:
            time.sleep(delay)
            delay *= 3
            continue
        print(f"  curl {url} → status={last_status} stderr={proc.stderr[:200]!r}")
    return FetchResult(None, last_status)


def scan_imports(body: bytes) -> set[str]:
    try:
        text = body.decode("utf-8", errors="replace")
    except Exception:
        return set()
    return set(IMPORT_RE.findall(text))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds-file", type=pathlib.Path,
                    help="Optional file with one bundle name per line; overrides defaults")
    ap.add_argument("--out", type=pathlib.Path, default=OUT_DIR)
    args = ap.parse_args()

    out_dir = args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.seeds_file:
        seeds = [
            s.strip() for s in args.seeds_file.read_text().splitlines()
            if s.strip() and not s.startswith("#")
        ]
    else:
        seeds = list(DEFAULT_SEEDS)

    queue: list[str] = list(seeds)
    seen: set[str] = set(seeds)
    stats = {"fetched": 0, "skipped": 0, "not_found": 0, "error": 0}

    while queue:
        name = queue.pop(0)
        if not NAME_RE.match(name):
            print(f"  SKIP (invalid name): {name}")
            stats["error"] += 1
            continue

        dest = out_dir / name
        if dest.exists():
            stats["skipped"] += 1
            # Still scan existing bundles so we can close the dep graph even
            # when a seed was fetched in a prior run.
            body = dest.read_bytes()
        else:
            print(f"  FETCH {name}")
            result = fetch(name)
            if result.status == 200 and result.body is not None:
                tmp = dest.with_suffix(dest.suffix + ".tmp")
                tmp.write_bytes(result.body)
                tmp.replace(dest)
                stats["fetched"] += 1
                body = result.body
                time.sleep(0.2)  # polite
            elif result.status == 404:
                print(f"  404   {name}")
                stats["not_found"] += 1
                continue
            else:
                print(f"  ERROR (status={result.status}) {name}")
                stats["error"] += 1
                continue

        for ref in scan_imports(body):
            if ref in seen:
                continue
            seen.add(ref)
            if (out_dir / ref).exists():
                stats["skipped"] += 1
                # Recurse into existing deps too (closes graph on re-runs).
                queue.append(ref)
            else:
                queue.append(ref)

    print()
    print(f"fetched:   {stats['fetched']}")
    print(f"skipped:   {stats['skipped']} (already on disk)")
    print(f"not_found: {stats['not_found']}")
    print(f"error:     {stats['error']}")
    print(f"total in closure: {len(seen)}")
    return 0 if stats["not_found"] == 0 and stats["error"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
