#!/usr/bin/env python3
"""
CI guard: make regressing to drive-by byte-patching of `.framercms` chunks
a loud, fast, pre-prerender failure instead of a "Unexpected value: N"
that only surfaces when a crawler hits the services page.

Three checks, any of which fails the build:

1. Forbidden scripts present. `apply_service_testimonials.py` was the
   direct cause of the chunk corruption we fixed in April 2026. Any
   future `scripts/apply_*{testimonial,cms}*.py` is flagged by default.

2. Early-field corruption in services chunk. If `decode_cms.py` aborts
   with `suspicious key_len` before reaching item 0 field 6, that is
   the exact signature of the prior bug — the chunk has been edited
   outside the rebuild pipeline.

3. Committed `cognis-cms/` drift from `cms-raw/` + `rewrite_cms.py` +
   `rebuild_*.py`. If `build_cms.py --check` reports drift, something
   hand-edited the chunks after build. Either re-run `cms:build` and
   commit, or track down the offending script.

To bypass intentionally (e.g. a verified new `apply_*` script that
legitimately doesn't touch chunks), add its filename to ALLOW.
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"

# Scripts authorized to write `cognis-cms/*.framercms`. Anything else that
# contains `.framercms` write patterns is flagged as a drive-by patcher.
CHUNK_WRITERS_ALLOWED: set[str] = {
    "build_cms.py",
    "rebuild_services.py",
    "rebuild_blog.py",
    "rebuild_teams.py",
    "rewrite_cms.py",
    "rewrite_indexes_segmented.py",
    "rewrite_json_blobs.py",  # library, read-only helper
    "decode_cms.py",           # read-only validator
    "scan_strings.py",         # read-only
    "guard_no_chunk_patching.py",
    "build_cms.py",
}

# Patterns indicating a script writes a .framercms file.
WRITE_PATTERNS = [
    re.compile(r"\.framercms['\"]?\s*\)?\s*\.write_bytes"),
    re.compile(r"CHUNK\.write_bytes"),
    re.compile(r"open\([^)]*\.framercms[^)]*['\"]\s*w"),
]


def check_forbidden_scripts() -> list[str]:
    hits = []
    for p in SCRIPTS.glob("*.py"):
        if p.name in CHUNK_WRITERS_ALLOWED:
            continue
        try:
            text = p.read_text()
        except Exception:
            continue
        if ".framercms" not in text:
            continue
        if any(pat.search(text) for pat in WRITE_PATTERNS):
            hits.append(str(p.relative_to(ROOT)))
    return hits


def check_services_chunk_decodes() -> str | None:
    r = subprocess.run(
        [sys.executable, str(SCRIPTS / "decode_cms.py"),
         str(ROOT / "cognis-cms" / "services-chunk.framercms")],
        capture_output=True, text=True,
    )
    out = r.stdout + r.stderr
    # Reaching item 0 field 6 means the first six fields decoded cleanly
    # — that's enough to confirm no early-field misalignment of the kind
    # the bug produced. (Decoder bails at the 0x0d ref; that's expected.)
    if "item0.f6" not in out:
        return out.strip()
    if "suspicious key_len" in out and out.index("suspicious key_len") < out.index("item0.f6"):
        return out.strip()
    return None


def check_drift() -> int:
    r = subprocess.run(
        [sys.executable, str(SCRIPTS / "build_cms.py"), "--check"],
        cwd=ROOT,
    )
    return r.returncode


def main() -> int:
    failed = False

    forbidden = check_forbidden_scripts()
    if forbidden:
        print("!! forbidden byte-patcher scripts present:", file=sys.stderr)
        for p in forbidden:
            print(f"    {p}", file=sys.stderr)
        print(
            "   these scripts mutate cognis-cms/*.framercms outside the\n"
            "   rebuild pipeline and can silently corrupt the binary.\n"
            "   move their edits into rewrite_cms.{SERVICES,BLOG,TEAMS}\n"
            "   or scripts/rebuild_*.py, then delete the script.",
            file=sys.stderr,
        )
        failed = True

    corruption = check_services_chunk_decodes()
    if corruption:
        print("!! services-chunk.framercms failed early-field decode:", file=sys.stderr)
        print(corruption, file=sys.stderr)
        print(
            "   the chunk was likely hand-edited after rebuild.\n"
            "   run `npm run cms:build` to regenerate from cms-raw/.",
            file=sys.stderr,
        )
        failed = True

    # Drift check is last — it's the most expensive (temp tree copy + rebuild).
    if not failed and check_drift() != 0:
        failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
