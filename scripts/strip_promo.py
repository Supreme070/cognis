#!/usr/bin/env python3
"""
Neutralize Framer/Temlis promo strings in both the SSR HTML and the runtime
bundles, in lockstep, so React hydration still matches.

The CSS hide block already makes them visually invisible, but search
engines still see the text and `temlis.com` URLs in the DOM. We replace
the strings with empty/benign equivalents in both places so the
Temlis marketplace card and Framer badge hydrate as empty hidden elements.
"""
import pathlib

HTML = pathlib.Path("index.html")
BUNDLES = [
    pathlib.Path("framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/PX9hIOIVM.BMVen0oq.mjs"),
    pathlib.Path("framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/script_main.DuQsiV3H.mjs"),
]

# Exact strings to neutralize. Replacements keep same byte counts where
# possible to avoid shifting offsets, though length changes are fine
# since both sides are edited consistently.
REPLACEMENTS = [
    # Framer badge tooltip + visible fallback text
    (
        "Create a free website with Framer, the website builder loved by startups, designers and agencies.",
        "",
    ),
    # Temlis marketplace card URLs
    (
        "https://www.temlis.com/templates/aeline?utm_source=organic&utm_medium=widgetspreview",
        "",
    ),
    (
        "https://www.temlis.com/all-templates/?utm_source=organic&utm_medium=widgetspreview",
        "",
    ),
    (
        "https://www.temlis.com/?utm_source=organic&utm_medium=widgetspreview",
        "",
    ),
    # HTML-encoded variants (SSR emits &amp;)
    (
        "https://www.temlis.com/templates/aeline?utm_source=organic&amp;utm_medium=widgetspreview",
        "",
    ),
    (
        "https://www.temlis.com/all-templates/?utm_source=organic&amp;utm_medium=widgetspreview",
        "",
    ),
    (
        "https://www.temlis.com/?utm_source=organic&amp;utm_medium=widgetspreview",
        "",
    ),
    # Marketplace card button labels
    ("See all templates", ""),
]


def patch(path: pathlib.Path) -> int:
    if not path.exists():
        return 0
    txt = path.read_text()
    total = 0
    for old, new in REPLACEMENTS:
        c = txt.count(old)
        if c:
            txt = txt.replace(old, new)
            total += c
    path.write_text(txt)
    return total


def main():
    for p in [HTML, *BUNDLES]:
        n = patch(p)
        print(f"{p}: {n} replacements")


if __name__ == "__main__":
    main()
