#!/usr/bin/env python3
"""Backdate the About-page "Our journey" timeline so every milestone falls
within Jan 2025 - April 2026 (the original ended at a FUTURE-dated "Q3 2026 —
Shipped…", which reads as fabricated to visitors and AI engines).

New sequence (ascending, all in range, and accurate — MarketSage/martech ship
landed ~Q1 2026):
    Founded ............................ Q2 2025  (unchanged, in range)
    AI trainings w/ state government ... Q3 2025  (unchanged)
    Launched workforce training ........ Q4 2025  (was Q1 2026)
    Shipped agent + ML builds .......... Q1 2026  (was Q3 2026 — the future date)

The visible dates live in `<p>` inside `[data-framer-name="year"]`; the layer
NAME on every block is the template default "Q2 2025", so we only touch the
visible `…</p>` text. Two layers of fix:
  • Static remap in the snapshot (crawlers see corrected dates) — gated on the
    future date being present, so it's idempotent and re-runnable.
  • A runtime script (humans, post-hydration / SPA nav) that sets each year's
    date from its milestone description — idempotent and re-applied via observer.
Wired into `npm run prerender`.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START = "<!-- cognis-journey:start -->"
END = "<!-- cognis-journey:end -->"

SCRIPT = f"""{START}
<script data-cognis-journey>
(function () {{
  // Set each milestone's visible year from its description — order-independent
  // and idempotent (safe to re-run through Framer's SPA re-renders).
  function fix() {{
    var years = document.querySelectorAll('[data-framer-name="year"]');
    if (!years.length) return;
    years.forEach(function (yd) {{
      var p = yd.querySelector('p');
      if (!p) return;
      var c = yd.nextElementSibling;
      if (!c || c.getAttribute('data-framer-name') !== 'content') {{
        c = yd.parentElement && yd.parentElement.querySelector('[data-framer-name="content"]');
      }}
      var desc = c ? c.textContent : '';
      var t = null;
      if (/Launched workforce/i.test(desc)) t = 'Q4 2025';
      else if (/Shipped agent/i.test(desc)) t = 'Q1 2026';
      else if (/Conducted AI trainings/i.test(desc)) t = 'Q3 2025';
      else if (/Founded/i.test(desc)) t = 'Q2 2025';
      if (t && p.textContent.trim() !== t) p.textContent = t;
    }});
  }}
  if (document.readyState !== 'loading') fix();
  else document.addEventListener('DOMContentLoaded', fix);
  try {{
    var mo = new MutationObserver(function () {{
      if (window.__cgjRAF) return;
      window.__cgjRAF = requestAnimationFrame(function () {{ window.__cgjRAF = 0; fix(); }});
    }});
    mo.observe(document.documentElement, {{ childList: true, subtree: true }});
  }} catch (e) {{}}
  [400, 1200, 2500].forEach(function (t) {{ setTimeout(fix, t); }});
}})();
</script>
{END}"""


def snapshot_paths() -> list[Path]:
    paths: list[Path] = []
    skip = {
        "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy",
        "scripts", "playwright-screenshots", "stock", "tests", ".git", ".claude",
    }
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
    original = html

    # Static remap — only when the future date is present (⇒ unpatched). This
    # makes the pass idempotent: a second run finds no "Q3 2026</p>" and skips.
    if "Q3 2026</p>" in html:
        html = html.replace("Q1 2026</p>", "Q4 2025</p>")  # milestone 3
        html = html.replace("Q3 2026</p>", "Q1 2026</p>")  # milestone 4 (future → in range)

    # Runtime script on every page (no-op where the timeline isn't present).
    html = re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END) + r"\s*", "", html)
    if "</body>" in html:
        html = html.replace("</body>", SCRIPT + "\n</body>", 1)

    if html == original:
        return False
    path.write_text(html, encoding="utf-8")
    return True


def main() -> int:
    changed = 0
    paths = snapshot_paths()
    for p in paths:
        if inject(p):
            changed += 1
            print(f"  injected: {p.relative_to(ROOT)}")
    print(f"\n{changed}/{len(paths)} snapshots updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
