#!/usr/bin/env python3
"""Inject longform body content into prerendered blog snapshots.

Framer CMS bodies render at ~300 words — too thin for AIO/GEO. This
walks each /blog/<slug>/index.html, finds the `<!-- Start of bodyEnd -->`
marker, and injects a styled <article> containing lead, author byline,
H2-question sections, and a related-services CTA block.

Idempotent: wraps output in sentinel comments so re-runs replace the
prior injection cleanly.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from longform_blog import BLOG  # noqa: E402

START = "<!-- cognis-longform:start -->"
END = "<!-- cognis-longform:end -->"
MARKER = "<!-- Start of bodyEnd -->"

# Paint guard (FOUC fix). Framer static exports paint the prerendered HTML
# before the stylesheet finishes applying, so for ~1-2 frames every element
# collapses to the top-left and stacks on top of the previous page's content.
# That momentary pile of overlapping text is the "muffled/crash" flash when
# you open a post. We hold #main invisible until the browser has computed
# layout (two rAFs after DOMContentLoaded), then soft-fade it in. Guards:
#   - a 1.5s hard timeout so JS trouble can never leave the page blank
#   - a <noscript> reveal so JS-off crawlers still get the content
# Injected into Framer's empty headEnd slot so it parses before #main renders.
HEAD_START = "<!-- cognis-fouc:start -->"
HEAD_END = "<!-- cognis-fouc:end -->"
HEAD_MARKER = "<!-- Start of headEnd -->"
HEAD_GUARD = """<!-- cognis-fouc:start -->
<style data-cognis-fouc>#main{opacity:0}html.cognis-ready #main{opacity:1;transition:opacity .25s ease}
/* The shared hero-portal script flashes its fixed full-screen video (a body
   child, outside #main) while Framer briefly renders home content during
   hydration. Hold it hidden until reveal; after that the script keeps it at
   opacity 0 on blog routes, and SPA-nav to home is unaffected. */
html:not(.cognis-ready) video[data-cognis-hero-portal],html:not(.cognis-ready) div[data-cognis-hero-scrim]{opacity:0!important;visibility:hidden!important}</style>
<noscript><style>#main{opacity:1!important}</style></noscript>
<script data-cognis-fouc>
(function(){
  var d=document,done=false;
  function reveal(){if(done)return;done=true;d.documentElement.classList.add('cognis-ready');}
  // Framer paints the prerendered HTML stacked at the top-left, then rewrites
  // #main in a burst of mutations as it hydrates and lays the page out. The
  // RIGHT moment is when that burst goes quiet — but only the real burst
  // counts: the longform reposition script touches #main once early, and a
  // single record followed by quiet must not trigger the reveal. Hydration
  // produces hundreds of records, so require >=30 before arming the
  // quiet-detector. Framer also transiently renders HOME content mid-
  // hydration (the deferred-nav bootstrap replaceStates to '/' and Framer
  // renders home before navigating back), with lulls that can pass the
  // quiet check — so treat any frame where the URL is still '/' or the
  // home hero image is in #main as not-quiet. Hard 1.5s fallback.
  function watch(){
    var main=d.getElementById('main');
    if(!main){requestAnimationFrame(watch);return;}
    var dirty=false,records=0,clean=0;
    var obs=new MutationObserver(function(m){dirty=true;records+=m.length;});
    obs.observe(main,{childList:true,subtree:true});
    (function tick(){
      if(done)return;
      var bad=location.pathname==='/'||d.querySelector('#main img[src*="Yz08gMSk8HCg9OI0jQXkoDm7t7Y"]');
      if(dirty||bad){dirty=false;clean=0;}
      else if(records>=30){if(++clean>=3){obs.disconnect();reveal();return;}}
      requestAnimationFrame(tick);
    })();
  }
  watch();
  setTimeout(reveal,1500);
})();
</script>
<!-- cognis-fouc:end -->"""

STYLE = """
<style data-cognis-longform-style>
  article.cognis-longform {
    max-width: 760px;
    margin: 48px auto 96px;
    padding: 0 24px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #131313;
    font-size: 17px;
    line-height: 1.72;
  }
  article.cognis-longform .lf-lead {
    font-size: 20px; line-height: 1.55; color: #2f2f2f;
    margin: 0 0 24px; font-weight: 500;
  }
  article.cognis-longform .lf-byline {
    color: #7b7b7b; font-size: 14px; margin: 0 0 40px;
    padding-bottom: 24px; border-bottom: 1px solid #e6e6e6;
  }
  article.cognis-longform .lf-byline a { color: #131313; text-decoration: none; font-weight: 600; }
  article.cognis-longform .lf-byline a:hover { background: #cdfb56; }
  article.cognis-longform h2 {
    font-size: 26px; line-height: 1.25; letter-spacing: -0.01em;
    margin: 40px 0 14px; font-weight: 700;
  }
  article.cognis-longform p { margin: 0 0 16px; }
  article.cognis-longform ul, article.cognis-longform ol { padding-left: 22px; margin: 0 0 18px; }
  article.cognis-longform li { margin-bottom: 8px; }
  article.cognis-longform a { color: #131313; text-decoration: underline; text-underline-offset: 3px; }
  article.cognis-longform a:hover { background: #cdfb56; }
  article.cognis-longform .lf-related {
    margin-top: 56px; padding: 28px; background: #ffffff;
    border: 1px solid #e6e6e6; border-radius: 12px;
  }
  article.cognis-longform .lf-related h3 {
    margin: 0 0 12px; font-size: 16px; letter-spacing: 0.04em;
    text-transform: uppercase; color: #7b7b7b; font-weight: 600;
  }
  article.cognis-longform .lf-related ul { list-style: none; padding: 0; margin: 0; }
  article.cognis-longform .lf-related li { margin: 0 0 8px; }
</style>
"""


def render(slug: str, data: dict) -> str:
    a = data["author"]
    byline = (
        f'By <a href="/teams/{a["slug"]}">{a["name"]}</a> · {a["role"]}'
    )
    sections = "\n".join(
        f'<h2>{s["q"]}</h2>\n{s["body"].strip()}' for s in data["sections"]
    )
    related_items = "\n".join(
        f'  <li><a href="{href}">{label} →</a></li>' for href, label in data["related"]
    )
    related = (
        '<aside class="lf-related">\n'
        '  <h3>Related services</h3>\n'
        f'  <ul>\n{related_items}\n  </ul>\n'
        '</aside>'
    )
    return (
        f'{START}\n{STYLE}\n'
        f'<article class="cognis-longform" data-cognis-slug="{slug}">\n'
        f'  <p class="lf-lead">{data["lead"]}</p>\n'
        f'  <p class="lf-byline">{byline}</p>\n'
        f'  {sections}\n'
        f'  {related}\n'
        f'</article>\n{REPOSITION}\n{END}'
    )


# The article is injected at Framer's bodyEnd slot (after #main and its
# footer) so it survives Framer hydration and is visible to crawlers with JS
# off. For real visitors this moves it into #main, immediately above the
# footer, so the page reads hero -> article -> footer instead of dumping the
# article below the footer (which looked like "another post by the founder").
#
# Framer hydrates #main with React; a node moved INTO #main during that
# hydration window gets reconciled away. We can't lose the node when that
# happens, so we capture the article reference ONCE and re-insert that same
# node on a short interval. During hydration React may keep removing it; the
# interval keeps putting it back, and once hydration settles the placement
# sticks (verified: post-hydration inserts into #main are stable across
# scrolls/re-renders). place() is a no-op once the article is connected and
# already sits above the footer, so it costs nothing after it settles.
REPOSITION = """
<script data-cognis-longform-reposition>
(function () {
  var art = document.querySelector('article.cognis-longform');
  if (!art) return;
  function place() {
    var footer = document.querySelector('#main footer');
    if (!footer) return;
    var after = footer.compareDocumentPosition(art) & Node.DOCUMENT_POSITION_FOLLOWING;
    if (!art.isConnected || after) footer.parentNode.insertBefore(art, footer);
  }
  place();
  var n = 0;
  var iv = setInterval(function () { place(); if (++n > 80) clearInterval(iv); }, 100);
  window.addEventListener('load', place);
})();
</script>"""


def inject(path: Path, block: str) -> bool:
    html = path.read_text(encoding="utf-8")
    # Strip prior injections (longform body + head paint guard).
    html = re.sub(
        re.escape(START) + r"[\s\S]*?" + re.escape(END) + r"\s*",
        "",
        html,
    )
    html = re.sub(
        re.escape(HEAD_START) + r"[\s\S]*?" + re.escape(HEAD_END) + r"\s*",
        "",
        html,
    )
    if MARKER not in html:
        return False
    new_html = html.replace(MARKER, MARKER + "\n" + block + "\n", 1)
    if HEAD_MARKER in new_html:
        new_html = new_html.replace(
            HEAD_MARKER, HEAD_MARKER + "\n" + HEAD_GUARD, 1
        )
    path.write_text(new_html, encoding="utf-8")
    return True


def main() -> int:
    changed = 0
    for slug, data in BLOG.items():
        path = ROOT / "blog" / slug / "index.html"
        if not path.exists():
            print(f"  missing: {path.relative_to(ROOT)}")
            continue
        block = render(slug, data)
        if inject(path, block):
            changed += 1
            print(f"  injected: {path.relative_to(ROOT)}")
        else:
            print(f"  no marker: {path.relative_to(ROOT)}")
    print(f"\n{changed}/{len(BLOG)} blog snapshots updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
