#!/usr/bin/env python3
"""
Apply content edits to both the SSR HTML and the relevant Framer .mjs bundles.

Why both: Framer hydrates React components from the bundle code, which hardcodes
text as JS string literals (``…``). SSR HTML has the same text statically
rendered. If we change only one side, React throws hydration errors #418/#423
and re-renders from the bundle, silently reverting visible HTML edits. Keeping
them in sync is the entire game.
"""
import pathlib
import re

HTML = pathlib.Path("cognis_base.html")
BUNDLE_DIR = pathlib.Path("framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD")

# Plain string replacements applied to BOTH HTML and the .mjs bundle that
# contains the original. We list every occurrence with enough context for
# uniqueness. HTML whitespace (leading spaces from indentation) is not in
# the bundle, so the HTML side uses separate patterns where needed.

# (old, new) pairs for bundle .mjs files
BUNDLE_REPLACEMENTS = {
    # Hero H1 — word splits exactly as bundle encodes them
    "Building the future with  ": "Cognis helps organizations become  ",
    "AI and strategy": "permanently more intelligent",
    "Building the future with AI and strategy": "Cognis helps organizations become permanently more intelligent",
    # Hero subtitle
    "We help organizations unlock growth and efficiency through data-driven consulting and intelligent automation.":
        "Cognis Group helps organizations understand, adopt, deploy, and govern artificial intelligence — from strategy to production.",
    # Hero CTAs (View demo → Book a consultation, Get Started → Our practice areas)
    "View demo": "Book a consultation",
    # Nav
    "Blog": "Insights",
}

# Bundle-specific: file-scoped replacements (avoid touching unrelated files)
BUNDLE_FILES = {
    "InvS17SM-NgHMgCCGqMQ2B4DzhSjCbqxQaMHtenca_I.BTbblbbR.mjs": [
        "Building the future with  ",
        "AI and strategy",
        "Building the future with AI and strategy",
        "We help organizations unlock growth and efficiency through data-driven consulting and intelligent automation.",
        "View demo",
    ],
    "script_main.DuQsiV3H.mjs": [
        "Blog",
    ],
}


def rewrite_bundle(path: pathlib.Path, keys: list[str]) -> int:
    txt = path.read_text()
    orig = txt
    n = 0
    for k in keys:
        new = BUNDLE_REPLACEMENTS[k]
        if k == "Blog":
            # Only replace `Blog` backtick literals (nav label), not substrings
            old_lit = f"`{k}`"
            new_lit = f"`{new}`"
            count = txt.count(old_lit)
            txt = txt.replace(old_lit, new_lit)
            n += count
        else:
            count = txt.count(k)
            txt = txt.replace(k, new)
            n += count
    if txt != orig:
        path.write_text(txt)
    return n


def rewrite_html() -> dict:
    txt = HTML.read_text()
    orig = txt
    stats = {}

    # Hero H1 word spans — HTML uses per-word <span> wrappers.
    # Replace exact word tokens only inside the H1 containing the original.
    # The H1 block runs from 'framer-siqre2' opening to '</h1>'.
    m = re.search(
        r'<div class="framer-siqre2"[^>]*>\s*<h1[^>]*>(.*?)</h1>',
        txt,
        re.DOTALL,
    )
    assert m, "hero H1 block not found"
    h1_inner = m.group(1)
    h1_start, h1_end = m.start(1), m.end(1)

    # Word tokens inside H1 spans, ordered: Building / the / future / with
    # then two empty spacer spans, then accent wrapper with AI / and / strategy
    word_pairs = [
        ("Building", "Cognis"),
        ("the", "helps"),
        ("future", "organizations"),
        ("with", "become"),
        ("AI", "permanently"),
        ("and", "more"),
        ("strategy", "intelligent"),
    ]
    new_inner = h1_inner
    for old, new in word_pairs:
        # Each word sits alone on its own line after heavy indentation.
        # Pattern: >INDENT OLDWORD\n (word is surrounded by whitespace + newline)
        pat = re.compile(r"(>\s+)" + re.escape(old) + r"(\s*\n)")
        found = pat.findall(new_inner)
        assert len(found) == 1, f"expected 1 match for {old!r} in H1, got {len(found)}"
        new_inner = pat.sub(lambda mo, n=new: mo.group(1) + n + mo.group(2), new_inner, count=1)
    txt = txt[:h1_start] + new_inner + txt[h1_end:]
    stats["hero_h1_words"] = 7

    # Update H1 container's data-framer-name to match new text
    old_dfn = 'data-framer-name="Building the future with AI and strategy"'
    new_dfn = 'data-framer-name="Cognis helps organizations become permanently more intelligent"'
    c = txt.count(old_dfn)
    txt = txt.replace(old_dfn, new_dfn)
    stats["hero_h1_data_framer_name"] = c

    # Hero subtitle (3 responsive variants: same text, different class wrappers)
    old_sub = "We help organizations unlock growth and efficiency through data-driven consulting and intelligent automation."
    new_sub = "Cognis Group helps organizations understand, adopt, deploy, and govern artificial intelligence — from strategy to production."
    stats["hero_subtitle"] = txt.count(old_sub)
    txt = txt.replace(old_sub, new_sub)

    # CTA button text
    stats["cta_view_demo"] = txt.count("View demo")
    txt = txt.replace("View demo", "Book a consultation")

    # Nav label Blog → Insights
    # Only replace inside nav <p> text nodes — use boundary pattern ">Blog<" / ">    Blog\n"
    pat_nav = re.compile(r"(>\s*)Blog(\s*<)")
    stats["nav_blog"] = len(pat_nav.findall(txt))
    txt = pat_nav.sub(lambda mo: mo.group(1) + "Insights" + mo.group(2), txt)

    # Nav hrefs: ./about-us → #about, ./our-services → #services,
    # ./blog → #insights, ./contact → #contact. Keep ./ (current page) alone.
    href_map = {
        'href="./about-us"': 'href="#about"',
        'href="./our-services"': 'href="#services"',
        'href="./blog"': 'href="#insights"',
        'href="./contact"': 'href="#contact"',
    }
    for old, new in href_map.items():
        stats[f"href_{old[6:-1]}"] = txt.count(old)
        txt = txt.replace(old, new)

    # Add section ids for anchor targets. Match the section by data-framer-name.
    section_anchors = [
        ('data-framer-name="about"', "about"),
        ('data-framer-name="services"', "services"),
        ('data-framer-name="expertise"', "insights"),
    ]
    for marker, anchor in section_anchors:
        occurrences = txt.count(marker)
        if occurrences == 0:
            stats[f"anchor_{anchor}"] = 0
            continue
        # Only inject id attribute on sections that don't already have one nearby
        pat = re.compile(r'(<section\b[^>]*?)' + re.escape(marker) + r'(?![^<>]*\bid=)')
        new_txt, count = pat.subn(r'\1' + marker + f' id="{anchor}"', txt, count=1)
        if count:
            txt = new_txt
        stats[f"anchor_{anchor}"] = count

    if txt != orig:
        HTML.write_text(txt)
    return stats


def main():
    print("=== bundle rewrites ===")
    for fname, keys in BUNDLE_FILES.items():
        p = BUNDLE_DIR / fname
        if not p.exists():
            print(f"  MISSING: {fname}")
            continue
        n = rewrite_bundle(p, keys)
        print(f"  {fname}: {n} replacements")

    print("=== HTML rewrites ===")
    stats = rewrite_html()
    for k, v in stats.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
