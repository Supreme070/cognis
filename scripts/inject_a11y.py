#!/usr/bin/env python3
"""P2-5 — accessibility pass (WCAG 2.2 AA), applied on every snapshot.

Adds the high-value, low-risk improvements the audit flagged, following current
best practice (WebAIM skip-nav; WCAG 2.4.1 Bypass Blocks; 2.4.7/2.4.11/2.4.13
Focus Appearance; 1.4.3 Contrast; 1.3.1/4.1.2 Name, Role, Value):

  • Skip-to-main-content link — visually-hidden-focusable (off-screen, slides in
    on keyboard focus; never display:none so it stays in the a11y tree),
    targeting the page's <main> (which we make focusable).
  • Visible keyboard focus via :focus-visible (3px ring + 2px offset, >=3:1),
    so the hand-built shells finally have a focus indicator.
  • Lift low-contrast tokens to AA: the muted #7b7b7b (3.78:1) -> #636363
    (~5.8:1) and the compare-table amber #b26a00 (3.79:1) -> #8a5200.
  • Give placeholder-only form fields an accessible name from their placeholder.

Framer-locked items (hero-over-video contrast, per-word animated headings,
ticker list semantics) are not addressed here — they require the Framer source.
Idempotent; safe as a late step of `npm run prerender`.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {
    "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy",
    "scripts", "playwright-screenshots", "stock", "tests", ".git", ".claude",
}
START = "<!-- cognis-a11y:start -->"
END = "<!-- cognis-a11y:end -->"

BLOCK = f"""{START}
<style data-cognis-a11y>
  .cognis-skip {{ position: fixed; top: 10px; left: 10px; z-index: 100000; background: #131313; color: #fff; padding: 12px 20px; border-radius: 10px; font: 600 14px/1.2 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; text-decoration: none; transform: translateY(-160%); transition: transform .16s ease; }}
  .cognis-skip:focus {{ transform: translateY(0); outline: 3px solid #cdfb56; outline-offset: 2px; }}
  :focus-visible {{ outline: 3px solid #1769ff; outline-offset: 2px; }}
  .cognis-skip:focus-visible {{ outline-color: #cdfb56; }}
  /* Contrast lifts (only affect the hand-built shells where these exist). */
  :root {{ --mute: #636363 !important; }}
  table.compare .mid {{ color: #8a5200 !important; }}
</style>
<script data-cognis-a11y>
(function () {{
  function main() {{
    return document.querySelector('main') || document.querySelector('[data-framer-name="main"]') || document.querySelector('[role="main"]');
  }}
  function run() {{
    var m = main();
    if (m) {{
      if (!m.id) m.id = 'cognis-main';
      if (m.getAttribute('tabindex') === null) m.setAttribute('tabindex', '-1');
    }}
    if (!document.querySelector('a.cognis-skip')) {{
      var s = document.createElement('a');
      s.className = 'cognis-skip';
      s.href = '#' + (m && m.id ? m.id : 'cognis-main');
      s.textContent = 'Skip to main content';
      document.body.insertBefore(s, document.body.firstChild);
    }}
    // Ticker/slideshow marquees use <ul role="group"> which strips the list
    // role from their <li> children (WCAG 1.3.1). Restore list semantics.
    document.querySelectorAll('ul[role="group"]').forEach(function (ul) {{
      if (ul.querySelector(':scope > li')) ul.setAttribute('role', 'list');
    }});
    // Accessible name for placeholder-only fields (WCAG 1.3.1 / 4.1.2).
    document.querySelectorAll('input, textarea, select').forEach(function (el) {{
      var t = (el.getAttribute('type') || '').toLowerCase();
      if (t === 'hidden' || el.getAttribute('aria-hidden') === 'true') return;
      var labelled = (el.labels && el.labels.length) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if (!labelled) {{
        var ph = el.getAttribute('placeholder');
        if (ph) el.setAttribute('aria-label', ph);
      }}
    }});
  }}
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
  [400, 1200, 2500].forEach(function (t) {{ setTimeout(run, t); }});
}})();
</script>
{END}"""


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


def strip_block(html: str, start: str, end: str) -> str:
    return re.sub(re.escape(start) + r"[\s\S]*?" + re.escape(end) + r"\s*", "", html)


def main() -> int:
    changed = 0
    for p in snapshot_paths():
        html = p.read_text(encoding="utf-8")
        new = strip_block(html, START, END)
        if "</body>" in new:
            new = new.replace("</body>", BLOCK + "\n</body>", 1)
        if new != html:
            p.write_text(new, encoding="utf-8")
            changed += 1
    print(f"a11y block injected into {changed} snapshots")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
