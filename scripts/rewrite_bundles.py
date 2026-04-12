#!/usr/bin/env python3
"""Rewrite hardcoded template copy in Framer .mjs bundles.

Each bundle hardcodes strings that hydration splats over our SSR HTML edits.
We replace them here so the rendered page matches the new Cognis copy.

Only touches bundles listed in BUNDLES dict. Each entry is a list of
(old, new, expected_count) tuples. expected_count asserts we replace exactly
that many occurrences — prevents silent over-replacement.
"""
import pathlib
import sys

BASE = pathlib.Path("framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD")

BUNDLES = {
    "script_main.DuQsiV3H.mjs": [
        ("1,540+ happy designers", "Quod Tango Muto", 3),
        ("130+ Premium Templates", "Cognis Group", 4),
        ("Built in Lagos · Serving Africa",
         "Trusted by forward-thinking organizations across three continents", 2),
        ("Subscribe to our insights", "Get AI intelligence in your inbox", 1),
        ("Temlis", "Cognis", 1),
    ],

    "InvS17SM-NgHMgCCGqMQ2B4DzhSjCbqxQaMHtenca_I.BTbblbbR.mjs": [
        ("Book a consultation", "Work With Us", 1),
        ("Talk to us", "Start the Conversation", 3),
        # Expertise cards (5 occurrences = 2 SSR variants × desktop/tablet/mobile)
        ("Automation & optimization", "AI Agent & Automation Engineering", 5),
        ("Experience intelligence", "AI Governance, Risk & Compliance", 1),
        # Stat labels
        ("Data Points", "Decisions Transformed", 2),
        ("Continents", "Markets Served", 2),
        # About headline accent word (only the `children:` literal)
        ("children:`smarter`", "children:`sharper`", 1),
    ],

    "csw22u1fM.DvknQo2m.mjs": [
        ("Talk to us", "Start the Conversation", 1),
    ],

    "ngJEIVI2a.DHBFJa2j.mjs": [
        ("Blog and articles", "Insights & Perspectives", 1),
        # Blog SSR headline — the JS has "Latest insights and trends" as display text
        ("Latest insights and trends",
         "Latest thinking on AI consulting, intelligent systems and organizational transformation", 2),
        ("View All", "All Insights", 1),
    ],

    "dVykPcZrU.BFMM7EGF.mjs": [
        ("Here\u2019s what they shared about their experience working with our team.",
         "From AI strategy engagements to agent deployments and enterprise-wide training programs — this is what our clients share.", 2),
        ("Our Approach", "Leadership team", 1),
        ("Our Philosophy", "Operations lead", 1),
        ("Our Promise", "Chief People Officer", 1),
        ("Built in Lagos · Serving Africa",
         "Trusted by forward-thinking organizations across three continents", 1),
    ],

    "sJISsrSnv.C9FLvC4v.mjs": [
        ("In the past 7 days", "Active Engagement", 4),
        ("Monthly  expanse", "AI Adoption Rate", 2),
    ],
}


def main() -> int:
    errors = 0
    for name, reps in BUNDLES.items():
        path = BASE / name
        if not path.exists():
            print(f"SKIP {name}: not found")
            errors += 1
            continue
        text = path.read_text()
        before = len(text)
        for old, new, expected in reps:
            count = text.count(old)
            if count != expected:
                print(f"  !! {name}: {old!r}: expected {expected}, found {count}")
                errors += 1
                continue
            text = text.replace(old, new)
            print(f"  {name}: {old!r} -> {new!r} ({count}x)")
        path.write_text(text)
        print(f"WROTE {name}: {before} -> {len(text)} bytes")
    return errors


if __name__ == "__main__":
    sys.exit(main())
