#!/usr/bin/env python3
"""
Sole sanctioned entry point for rebuilding the Cognis CMS chunks.

Runs the per-collection round-trip encoders (`rebuild_services`,
`rebuild_blog`, `rebuild_teams`) in order. Each encoder reads pristine
Framer-exported bytes from `cms-raw/`, applies declarative rewrites,
repacks items, rewrites V pointers in the indexes, and patches the
`range:{from,to}` literals in its consuming `.mjs` bundle. The output
lives in `cognis-cms/` and the patched bundles in `framer-runtime/`.

Never byte-patch `cognis-cms/*.framercms` directly. Drive-by edits on top
of rebuild output (the pattern that caused the "Unexpected value: 110"
failure on /our-services) silently break container-length and V-pointer
invariants. Add new content rewrites to `rewrite_cms.{SERVICES,BLOG,TEAMS}`
or the per-item maps in the respective `rebuild_*.py` script, and re-run
this script.

Usage:
  python3 scripts/build_cms.py           # rebuild in place
  python3 scripts/build_cms.py --check   # rebuild into a temp dir and
                                         # diff against the committed
                                         # cognis-cms/ — non-zero exit
                                         # if they differ. Intended for CI.
"""
import argparse
import filecmp
import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
CMS_OUT = ROOT / "cognis-cms"

# Order matters: rebuild_services imports from rebuild_blog, so blog
# module must be importable. Order of execution is independent because
# each rebuild operates on disjoint chunk/index files.
REBUILDS = [
    "rebuild_services.py",
    "rebuild_blog.py",
    "rebuild_teams.py",
]


def run(script: str, cwd: pathlib.Path) -> None:
    r = subprocess.run([sys.executable, str(SCRIPTS / script)], cwd=cwd)
    if r.returncode != 0:
        print(f"!! {script} exited {r.returncode}", file=sys.stderr)
        sys.exit(r.returncode)


def build() -> None:
    for script in REBUILDS:
        print(f"=== {script} ===")
        run(script, ROOT)


def check() -> None:
    """Rebuild into a temp mirror of the repo, diff cognis-cms/ against
    the committed copy. Fails if any chunk differs — which means either
    `cms-raw/` + `rewrite_cms.py` + `rebuild_*.py` drifted from
    `cognis-cms/`, or `cognis-cms/` was hand-edited. Both cases require
    operator attention."""
    with tempfile.TemporaryDirectory() as tmp:
        mirror = pathlib.Path(tmp) / "cognis"
        # Mirror the minimum tree rebuild_* touches: scripts/, cms-raw/,
        # framer-runtime/sites/.../QSCEvOCzd.BEpRMyCY.mjs (services),
        # rAjl8lYSc.DS3b7BJb.mjs (blog), and an empty cognis-cms/.
        for sub in ["scripts", "cms-raw"]:
            shutil.copytree(ROOT / sub, mirror / sub)
        fr = "framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD"
        (mirror / fr).mkdir(parents=True)
        for mjs in [
            "QSCEvOCzd.BEpRMyCY.mjs",
            "rAjl8lYSc.DS3b7BJb.mjs",
        ]:
            src = ROOT / fr / mjs
            if src.exists():
                shutil.copy2(src, mirror / fr / mjs)
        (mirror / "cognis-cms").mkdir()

        for script in REBUILDS:
            print(f"=== {script} (check) ===")
            run(script, mirror)

        # Diff every chunk.
        diffs = []
        for name in sorted(p.name for p in (ROOT / "cognis-cms").glob("*.framercms")):
            a = ROOT / "cognis-cms" / name
            b = mirror / "cognis-cms" / name
            if not b.exists():
                diffs.append(f"  missing in rebuild: {name}")
            elif not filecmp.cmp(a, b, shallow=False):
                diffs.append(f"  drift: {name} ({a.stat().st_size} vs {b.stat().st_size} bytes)")
        if diffs:
            print("!! cognis-cms/ drifts from cms-raw/ + rewrite_cms:", file=sys.stderr)
            for d in diffs:
                print(d, file=sys.stderr)
            print("Fix: run `npm run cms:build`, review diff, commit.", file=sys.stderr)
            sys.exit(1)
        print("OK: cognis-cms/ matches cms-raw/ + rewrite_cms exactly.")


def main() -> None:
    ap = argparse.ArgumentParser(description="Cognis CMS build orchestrator")
    ap.add_argument("--check", action="store_true", help="drift check only, no writes")
    args = ap.parse_args()
    if args.check:
        check()
    else:
        build()


if __name__ == "__main__":
    main()
