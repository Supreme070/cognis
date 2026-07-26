#!/usr/bin/env python3
"""Add a clean handoff for the three Explore routes and prioritize their heroes."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
START = "<!-- cognis-route-handoff:start -->"
END = "<!-- cognis-route-handoff:end -->"

ROUTES = {
    "/why-cognis/": ("why-cognis/index.html", "why-hero"),
    "/case-studies/": ("case-studies/index.html", "cases-hero"),
    "/how-we-work/": ("how-we-work/index.html", "process-hero"),
}

BLOCK = f"""{START}
<style data-cognis-route-handoff>
  html::after {{
    content: "";
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: #0d0d0c;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }}
  html.cognis-route-leaving::after {{ opacity: 1; visibility: visible; }}
</style>
<script type="speculationrules">
{{
  "prefetch": [{{
    "where": {{"or": [
      {{"href_matches": "/why-cognis/*"}},
      {{"href_matches": "/case-studies/*"}},
      {{"href_matches": "/how-we-work/*"}}
    ]}},
    "eagerness": "eager"
  }}],
  "prerender": [{{
    "where": {{"or": [
      {{"href_matches": "/why-cognis/*"}},
      {{"href_matches": "/case-studies/*"}},
      {{"href_matches": "/how-we-work/*"}}
    ]}},
    "eagerness": "moderate"
  }}]
}}
</script>
<script data-cognis-route-handoff>
(function () {{
  var routes = {{
    "/why-cognis/": "/assets/why-hero-1920-v2.webp",
    "/case-studies/": "/assets/cases-hero-1920-v2.webp",
    "/how-we-work/": "/assets/process-hero-1920-v2.webp"
  }};

  function normalize(pathname) {{
    return pathname.endsWith("/") ? pathname : pathname + "/";
  }}

  function warmImages() {{
    Object.keys(routes).forEach(function (route) {{
      if (!document.querySelector('link[data-cognis-route-image="' + route + '"]')) {{
        var link = document.createElement("link");
        link.rel = "prefetch";
        link.as = "image";
        link.href = routes[route];
        link.setAttribute("data-cognis-route-image", route);
        document.head.appendChild(link);
      }}
    }});
  }}

  document.addEventListener("click", function (event) {{
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var anchor = event.target.closest && event.target.closest("a[href]");
    if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
    var url = new URL(anchor.href, location.href);
    var route = normalize(url.pathname);
    if (url.origin !== location.origin || !routes[route] || route === normalize(location.pathname)) return;
    event.preventDefault();
    document.documentElement.classList.add("cognis-route-leaving");
    requestAnimationFrame(function () {{
      requestAnimationFrame(function () {{ location.assign(url.href); }});
    }});
  }}, true);

  addEventListener("pageshow", function () {{
    document.documentElement.classList.remove("cognis-route-leaving");
  }});
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", warmImages, {{ once: true }});
  else warmImages();
}})();
</script>
{END}"""


def strip_block(html: str) -> str:
    return re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END) + r"\s*", "", html)


def add_handoff(path: Path) -> None:
    html = strip_block(path.read_text(encoding="utf-8"))
    if "</head>" not in html:
        raise RuntimeError(f"missing </head>: {path}")
    path.write_text(html.replace("</head>", f"  {BLOCK}\n</head>", 1), encoding="utf-8")


def prioritize_hero(path: Path, stem: str) -> None:
    html = path.read_text(encoding="utf-8")
    preload_marker = f'data-cognis-hero-preload="{stem}"'
    html = re.sub(r'<link[^>]+data-cognis-hero-preload="[^"]+"[^>]*>\s*', "", html)
    preload = (
        f'<link rel="preload" as="image" href="/assets/{stem}-1920-v2.webp" '
        f'imagesrcset="/assets/{stem}-960-v2.webp 960w, /assets/{stem}-1920-v2.webp 1920w" '
        f'imagesizes="100vw" fetchpriority="high" {preload_marker}>\n'
    )
    html = html.replace("</head>", preload + "</head>", 1)
    pattern = re.compile(rf'<img([^>]*?)src="/assets/{re.escape(stem)}(?:-1920-v2\.webp|\.jpg)"([^>]*)>')
    replacement = (
        f'<img\\1src="/assets/{stem}-1920-v2.webp" '
        f'srcset="/assets/{stem}-960-v2.webp 960w, /assets/{stem}-1920-v2.webp 1920w" '
        f'sizes="100vw" loading="eager" fetchpriority="high" decoding="async"\\2>'
    )
    html, count = pattern.subn(replacement, html, count=1)
    if count != 1:
        raise RuntimeError(f"hero image not found exactly once: {path}")
    path.write_text(html, encoding="utf-8")


def main() -> int:
    pages = [ROOT / "index.html"] + [ROOT / rel for rel, _ in ROUTES.values()]
    for page in pages:
        add_handoff(page)
    for rel, stem in ROUTES.values():
        prioritize_hero(ROOT / rel, stem)
    for page in pages:
        print(f"updated: {page.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
