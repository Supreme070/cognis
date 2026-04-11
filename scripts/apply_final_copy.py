#!/usr/bin/env python3
"""
Final content pass: rewrite remaining template copy in both SSR HTML and the
Framer .mjs bundles so that React hydration matches. Each entry is a literal
string swap — longest strings are applied first to avoid prefix collisions.
"""
import pathlib

HTML = pathlib.Path("aeline_framer_website.html")
BUNDLE_DIR = pathlib.Path("framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD")

# Plain string replacements. Order is long-to-short to prevent partial overlap.
REPLACEMENTS = [
    # About section H2 — 4 literal parts preserving accent-word split
    ("A global consulting partner ", "A Lagos-based AI advisory "),
    ("dedicated to building", "helping organizations build"),
    ("more adaptive", "more intelligent"),

    # Services section H2
    ("Comprehensive consulting and intelligent innovation",
     "Six practice areas, one mission"),
    ("Comprehensive consulting", "Six practice areas"),
    ("intelligent innovation", "one mission"),

    # Expertise section H2
    ("Where human insight meets intelligent technology",
     "Where African context meets AI engineering"),
    ("Where human insight ", "Where African context "),
    ("meets intelligent technology", "meets AI engineering"),

    # Featured / testimonial section H2 + description (script_main.DuQsiV3H)
    ("We combine human insight with artificial intelligence",
     "What we touch, we permanently change"),
    ("We combine human insight ", "What we touch, "),
    ("with artificial intelligence", "we permanently change"),
    ("Trusted over 5,000+", "Built in Lagos · Serving Africa"),
    ("Our consulting team bridges strategic thinking and advanced AI technologies to help companies streamline processes, improve decision-making, and create intelligent digital experiences.",
     "Cognis Group bridges deep African market knowledge with global AI engineering capability. We do not replace people with AI — we make people extraordinary with AI."),

    # Footer
    ("Easily adapt to changes and scale your operations with our flexible infrastructure, designed to support your business growth.",
     "Cognis Group is a Nigerian AI advisory firm. Quod Tango Muto — what we touch, we change."),
    ("Subscribe our newsletter", "Subscribe to our insights"),

    # Testimonial heading
    ("What they say about us?", "Our operating principles"),

    # CTA buttons
    ("Get Started", "Talk to us"),
]


def rewrite_file(path: pathlib.Path) -> int:
    txt = path.read_text()
    orig = txt
    n = 0
    for old, new in REPLACEMENTS:
        if old in txt:
            c = txt.count(old)
            txt = txt.replace(old, new)
            n += c
    if txt != orig:
        path.write_text(txt)
    return n


def main():
    total = 0
    # HTML
    n = rewrite_file(HTML)
    print(f"{HTML.name}: {n}")
    total += n
    # Bundles (only the ones known to contain relevant strings)
    for fname in [
        "InvS17SM-NgHMgCCGqMQ2B4DzhSjCbqxQaMHtenca_I.BTbblbbR.mjs",
        "script_main.DuQsiV3H.mjs",
        "dVykPcZrU.BFMM7EGF.mjs",
        "csw22u1fM.DvknQo2m.mjs",
    ]:
        p = BUNDLE_DIR / fname
        n = rewrite_file(p)
        print(f"{fname}: {n}")
        total += n
    print(f"total replacements: {total}")


if __name__ == "__main__":
    main()
