#!/usr/bin/env python3
"""Tighten weak, cliché copy on the About page so it reads with Fortune-500
confidence instead of filler. Static replace (crawlers) + runtime re-apply
(humans, post-hydration / SPA nav), idempotent. Wired into `npm run prerender`.

Edits (fragment-level, each appears once and contiguous in the snapshot):
  • "…think smarter, move faster, and grow stronger."  (generic cliché)
        → "…ship AI into production and operate it with confidence."
  • "…forward-thinking organisations to operationalise AI."  ("forward-thinking" filler)
        → "…banks, ministries, and enterprises to put AI into production — and govern it."

The hero ("What We Touch, We Change." / the three named practices) is already
strong and is deliberately left unchanged.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START = "<!-- cognis-copy:start -->"
END = "<!-- cognis-copy:end -->"

# old fragment -> new fragment
REPL = {
    "think smarter, move faster, and grow stronger":
        "ship AI into production and operate it with confidence",
    "forward-thinking organisations to operationalise AI":
        "banks, ministries, and enterprises to put AI into production — and govern it",
}

SCRIPT = f"""{START}
<script data-cognis-copy>
(function () {{
  var REPL = {json.dumps(REPL)};
  function fix() {{
    var ps = document.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) {{
      var p = ps[i], t = p.textContent;
      for (var k in REPL) {{
        if (t.indexOf(k) !== -1) {{ p.textContent = t.split(k).join(REPL[k]); t = p.textContent; }}
      }}
    }}
  }}
  if (document.readyState !== 'loading') fix();
  else document.addEventListener('DOMContentLoaded', fix);
  try {{
    var mo = new MutationObserver(function () {{
      if (window.__cgcRAF) return;
      window.__cgcRAF = requestAnimationFrame(function () {{ window.__cgcRAF = 0; fix(); }});
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
    for old, new in REPL.items():
        html = html.replace(old, new)
    html = re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END) + r"\s*", "", html)
    if "</body>" in html:
        html = html.replace("</body>", SCRIPT + "\n</body>", 1)
    if html == original:
        return False
    path.write_text(html, encoding="utf-8")
    return True


def main() -> int:
    changed = 0
    for p in snapshot_paths():
        if inject(p):
            changed += 1
            print(f"  injected: {p.relative_to(ROOT)}")
    print(f"\n{changed} snapshots updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
