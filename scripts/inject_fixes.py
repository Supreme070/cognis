#!/usr/bin/env python3
"""Post-prerender correctness fixes from the 2026-05-30 site audit.

Idempotent string fixes applied across every snapshot, safe to re-run as the
last step of `npm run prerender`:

  P1-1  Repoint stale blog slugs (re-slugged articles whose CMS cards / related
        grids / featured CTA still pointed at 404 URLs) to their live slugs.
  P1-2  Repoint the dead flagship "Cognis AI" CTA (ai.cognis.group is NXDOMAIN)
        to /products until the product domain is provisioned.
  P1-5  Contact form: enforce HTML5 validation (email format + required message)
        before the manual form.submit(), so empty/invalid leads are blocked.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {
    "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy",
    "scripts", "playwright-screenshots", "stock", "tests", ".git", ".claude",
}

# P1-1 — dead slug -> live slug (matched on the `blog/<slug>` path segment so it
# covers ./blog/x, /blog/x and absolute URLs alike).
BLOG_SLUGS = {
    "why-enterprise-ai-deployments-fail": "why-most-enterprise-ai-strategies-fail-before-they-start",
    "ai-agents-new-operating-system": "building-ai-agents-that-actually-ship",
    "ai-ready-workforce-training": "making-your-workforce-ai-ready",
    "ai-governance-african-enterprises": "ai-governance-is-not-optional",
    "measuring-ai-roi-framework": "the-real-roi-of-ai",
    "ai-native-operations-africa": "ai-native-operations-for-african-enterprises",
}

# P1-2 — dead product domain -> interim destination.
AI_DEAD = "https://ai.cognis.group"
AI_INTERIM = "/products"

# P1-5 — contact form validation. The handler bailed only when the email was
# empty, then called form.submit() (which skips constraint validation), so an
# invalid email or empty message still posted. Enforce validity first.
FORM_OLD = "if (!emailEl || !emailEl.value) { return; /* let browser show required */ }"
FORM_NEW = (
    "var msgEl = form.querySelector('textarea');"
    " if (emailEl) emailEl.required = true;"
    " if (msgEl) msgEl.required = true;"
    " if (!form.checkValidity()) { form.reportValidity(); return; }"
)


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


# P2-1 — footer social links are placeholders (generic platform roots) with no
# accessible name and no target/rel (they'd replace the current tab). Real
# profiles will be supplied later; for now make the placeholders safe: add an
# aria-label, open in a new tab, and harden rel.
SOCIAL = {
    "https://www.facebook.com/": "Facebook",
    "https://www.instagram.com/": "Instagram",
    "https://www.linkedin.com/": "LinkedIn",
    "https://x.com/": "X",
}


def fix(html: str) -> str:
    for dead, live in BLOG_SLUGS.items():
        html = html.replace(f"blog/{dead}", f"blog/{live}")
    # Repoint the dead product domain. Match both the bare host and any path.
    html = html.replace(f'href="{AI_DEAD}"', f'href="{AI_INTERIM}"')
    html = html.replace(f'"{AI_DEAD}/"', f'"{AI_INTERIM}"')
    html = html.replace(FORM_OLD, FORM_NEW)
    for url, name in SOCIAL.items():
        marker = f'href="{url}"'
        safe = f'aria-label="{name}" target="_blank" rel="noopener noreferrer" href="{url}"'
        if marker in html and 'aria-label="' + name not in html:
            html = html.replace(marker, safe)
    return html


def main() -> int:
    changed = 0
    for p in snapshot_paths():
        html = p.read_text(encoding="utf-8")
        new = fix(html)
        if new != html:
            p.write_text(new, encoding="utf-8")
            changed += 1
            print(f"  fixed: {p.relative_to(ROOT)}")
    print(f"\n{changed} snapshots updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
