#!/usr/bin/env python3
"""Polish the homepage testimonials section (Framer content we can't edit
statically). Idempotent, sentinel-bounded, injected before </body> on the
homepage; re-applies through Framer's SPA re-renders via a MutationObserver.

Fixes the "unfinished template" tells in #testimonials:
  1. White box  → the `tdesign:quote-filled` icon ships as an empty white-
     filled div (its mask never loads). Replace it with a real, brand-lime
     quotation mark.
  2. Placeholder client logos ("Network", "Umbrella", "Vision") — leftover
     Framer template brands that contradict the real attributions. Hidden.
  3. Heading "Our operating principles" doesn't match the eyebrow
     ("Testimonials") or dek ("what our clients share") → "What our clients say".
  4. Carousel transition re-tuned to a smooth, premium glide.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START = "<!-- cognis-testimonials:start -->"
END = "<!-- cognis-testimonials:end -->"

# Remix-icon "double-quotes-l" — a clean, recognisable opening quote.
QUOTE_PATH = ("M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 "
             "1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 "
             "3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 "
             "13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 "
             "1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 "
             "0-2.099-.49-2.748-1.179z")

BLOCK = f"""{START}
<style data-cognis-testimonials>
  /* Hide leftover Framer template client logos inside the testimonial cards. */
  #testimonials [data-framer-name="logo"] {{ display: none !important; }}
  /* Smooth, premium carousel glide (was a snappier default). */
  #testimonials .framer-slideshow-axis-x ul,
  #testimonials [data-framer-name="slideshow"] ul {{
    transition: transform .62s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }}
  /* The broken quote icon: drop its white fill and let our SVG show. */
  #testimonials [data-framer-name="tdesign:quote-filled"] {{ background: transparent !important; }}
  #testimonials [data-framer-name="tdesign:quote-filled"] svg {{ width: 100%; height: 100%; display: block; }}
  /* Continuous, seamless marquee — driven by rAF in the script below. */
  #testimonials .cgt-track {{
    display: flex; align-items: stretch; width: max-content; will-change: transform;
  }}
  #testimonials .cgt-track > * {{ flex: 0 0 auto; }}
  /* A continuous loop makes the step arrows redundant. */
  #testimonials [data-framer-name*="arrow" i],
  #testimonials [aria-label*="next" i],
  #testimonials [aria-label*="previous" i] {{ display: none !important; }}
</style>
<script data-cognis-testimonials>
(function () {{
  var QUOTE = '<svg viewBox="0 0 24 24" fill="#cdfb56" aria-hidden="true"><path d="{QUOTE_PATH}"></path></svg>';
  function hideUl(ul) {{
    ul.style.position = 'absolute';
    ul.style.opacity = '0';
    ul.style.pointerEvents = 'none';
    ul.setAttribute('aria-hidden', 'true');
  }}
  function setupMarquee() {{
    var sec = document.getElementById('testimonials');
    if (!sec) return;
    var ul = sec.querySelector('.framer-slideshow-axis-x ul');
    if (!ul) return;
    var vp = ul.parentElement;
    if (!vp) return;
    // Framer wins the transform fight on its own <ul>, so don't animate it.
    // Build a separate track Framer never touches, fill it with card clones,
    // hide the original — our CSS animation then runs cleanly.
    if (sec.querySelector('.cgt-track')) {{ hideUl(ul); return; }}
    // The <li> wrappers are display:contents (0-box); the real sized card is
    // the element inside each. Clone those.
    var origs = Array.prototype.slice.call(ul.children)
      .map(function (li) {{ return li.firstElementChild || li; }})
      .filter(Boolean);
    if (!origs.length) return;
    // Measure real card sizes BEFORE hiding the original (Framer cards have no
    // intrinsic width — they'd collapse to 0 in a plain container).
    var dims = origs.map(function (c) {{ var r = c.getBoundingClientRect(); return {{ w: Math.round(r.width), h: Math.round(r.height) }}; }});
    var totalW = dims.reduce(function (s, d) {{ return s + d.w; }}, 0);
    if (totalW < 80) return; // not laid out yet — a later retry will catch it
    var gap = parseFloat(getComputedStyle(ul).columnGap) || parseFloat(getComputedStyle(ul).gap) || 0;
    var track = document.createElement('div');
    track.className = 'cgt-track';
    track.style.gap = gap + 'px';
    for (var rep = 0; rep < 2; rep++) {{
      origs.forEach(function (c, i) {{
        var cl = c.cloneNode(true);
        cl.style.flex = '0 0 ' + dims[i].w + 'px';
        cl.style.width = dims[i].w + 'px';
        if (dims[i].h) cl.style.height = dims[i].h + 'px';
        if (rep === 1) cl.setAttribute('aria-hidden', 'true');
        track.appendChild(cl);
      }});
    }}
    hideUl(ul);
    vp.appendChild(track);
    var mid = track.children[origs.length];
    var shift = (mid && mid.offsetLeft > 80) ? mid.offsetLeft : (totalW + origs.length * gap);
    // Drive the loop with rAF — deterministic, and Framer never touches our
    // element. Pause on hover; respect reduced-motion.
    var paused = false;
    sec.addEventListener('mouseenter', function () {{ paused = true; }});
    sec.addEventListener('mouseleave', function () {{ paused = false; }});
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var x = 0, last = null, SPEED = 55; // px/s — calm, readable
    function tick(ts) {{
      if (!document.body.contains(track)) return; // stop if Framer wiped it
      if (last == null) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      if (!paused && !reduce) {{
        x -= SPEED * dt;
        if (x <= -shift) x += shift;
        track.style.transform = 'translateX(' + x + 'px)';
      }}
      requestAnimationFrame(tick);
    }}
    requestAnimationFrame(tick);
  }}
  function fix() {{
    var sec = document.getElementById('testimonials');
    if (!sec) return;
    // 1. Replace each broken white quote box with a real lime quote mark.
    sec.querySelectorAll('[data-framer-name="tdesign:quote-filled"]').forEach(function (box) {{
      if (box.getAttribute('data-cognis-quote')) return;
      box.setAttribute('data-cognis-quote', '');
      box.style.background = 'transparent';
      box.innerHTML = QUOTE;
    }});
    // 2. Make the heading match the eyebrow + dek.
    sec.querySelectorAll('h2').forEach(function (h) {{
      if (/operating principles/i.test(h.textContent)) h.textContent = 'What our clients say';
    }});
    // 3. Turn the discrete slideshow into a seamless continuous marquee.
    setupMarquee();
  }}
  if (document.readyState !== 'loading') fix();
  else document.addEventListener('DOMContentLoaded', fix);
  try {{
    var mo = new MutationObserver(function () {{
      if (window.__cgtRAF) return;
      window.__cgtRAF = requestAnimationFrame(function () {{ window.__cgtRAF = 0; fix(); }});
    }});
    mo.observe(document.documentElement, {{ childList: true, subtree: true }});
  }} catch (e) {{}}
  [400, 1200, 2500].forEach(function (t) {{ setTimeout(fix, t); }});
}})();
</script>
{END}"""


def main() -> int:
    home = ROOT / "index.html"
    if not home.exists():
        print("index.html not found")
        return 1
    html = home.read_text(encoding="utf-8")
    html = re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END) + r"\s*", "", html)
    if "</body>" not in html:
        print("no </body>")
        return 1
    home.write_text(html.replace("</body>", BLOCK + "\n</body>", 1), encoding="utf-8")
    print("  injected: index.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
