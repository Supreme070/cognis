#!/usr/bin/env python3
"""
Replace fake testimonial content (names, company, quotes) with Cognis
operating principles. Applies to both HTML (SSR) and the dVykPcZrU bundle
to keep hydration in sync.

Quotes become philosophy statements, names become principle headings, and
company fields show "Cognis Group" — effectively converting the visual
"testimonial cards" into "principle cards". Avatar images are retained
because they're stock imagery, read as abstract, and swapping them is
out of scope for this pass.
"""
import pathlib
import re

HTML = pathlib.Path("aeline_framer_website.html")
BUNDLE = pathlib.Path(
    "framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/dVykPcZrU.BFMM7EGF.mjs"
)

# Original → replacement. Order matters only for quotes (replace one-at-a-time).
NAMES = {
    "Mark Rilley": "Our Approach",
    "Elara Vance": "Our Philosophy",
    "Darius Jones": "Our Promise",
}

COMPANIES = {
    "Network Corp.": "Cognis Group",
    "Umbrella Co.": "Cognis Group",
    "Vision Tech": "Cognis Group",
}

# Exact original quotes → Cognis principles (same assignment as names above)
QUOTES = {
    '"They brought clarity to complex problems, breaking down barriers and delivering innovative solutions.”':
        '"We deploy, we don\'t theorize. Every engagement leaves the organization permanently more capable."',
    '"They offered clear insights on tough projects, removing limits and providing sharp, key solutions now."':
        '"We don\'t replace people with AI — we make people extraordinary with AI."',
    '"They gave key clarity to hard issues, tearing down walls and producing smart, new quick answers."':
        '"Built in Lagos. Serving African enterprises and the firms working with them. What we touch, we change."',
}


def rewrite(path: pathlib.Path, is_html: bool) -> int:
    txt = path.read_text()
    orig = txt
    n = 0
    for old, new in {**NAMES, **COMPANIES}.items():
        c = txt.count(old)
        if c:
            txt = txt.replace(old, new)
            n += c
    for old, new in QUOTES.items():
        c = txt.count(old)
        if c:
            txt = txt.replace(old, new)
            n += c
        else:
            # HTML may use plain ASCII quotes for the same text; try that variant
            alt = old.replace("”", '"')
            c2 = txt.count(alt)
            if c2:
                txt = txt.replace(alt, new)
                n += c2
    if txt != orig:
        path.write_text(txt)
    return n


def main():
    for p, is_html in [(HTML, True), (BUNDLE, False)]:
        n = rewrite(p, is_html)
        print(f"{p.name}: {n} replacements")


if __name__ == "__main__":
    main()
