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
    # Previously applied entries removed — they ran in an earlier session.

    "dVykPcZrU.BFMM7EGF.mjs": [
        ("Mei Lin", "Partner CTO", 1),
        ("Cactus Global", "Enterprise client", 1),
    ],

    "sJISsrSnv.C9FLvC4v.mjs": [
        ("Vit premium", "Enterprise", 6),
        ("November 14, 2025", "Ongoing", 6),
        ("$10,000", "\u2014", 2),
        ("$120", "\u2014", 6),
        ("+5,000 customers", "Trusted partners", 2),
        ("Smart. Simple. Strategic.", "Strategy. Agents. Training.", 1),
    ],

    # --- Contact page ---
    "cJ1xuMkLTjw-x2vTqK43D546Q19G_AQcRRmTRca7GeY.CBHzrIGZ.mjs": [
        ("consulting@aeline.com", "consulting@cognis.group", 4),
        ("+1 (123) 456-7890", "+2349080001101", 2),
        ("456 Business Ave, New York, NY 10001", "Lagos, Nigeria", 1),
        ("456 Business Ave, New York", "Lagos, Nigeria", 1),
        ("https://maps.app.goo.gl/fypBBWRAtpepS5vT8", "", 1),
        ("Learn about our journey, mission, and the team driving innovation.",
         "Let\u2019s discuss how AI can transform your organization.", 1),
    ],

    # --- About page ---
    "QaJNDfNMG5C7JwHIw-sBm1Ys-NaZyVo7n9B49pO4X_Q.BfZeDgI1.mjs": [
        ("Trusted over 5,000+", "Trusted across Africa", 2),
        ("+2.5%", "\u2014", 2),
        ("Business growth", "Impact delivered", 2),
        ("Commitment to measurable", "Commitment to delivery", 2),
        ("Collaborating with leading AI and cloud technology providers.",
         "Partnering with forward-thinking organisations to operationalise AI.", 2),
        ("A global consulting partner", "An AI advisory firm", 6),
        ("dedicated to building", "committed to building", 6),
        ("From our early days as a small consulting team to becoming a trusted AI partner for global organizations, our journey has been driven by curiosity, collaboration, and impact.",
         "From founding in Lagos to serving organisations across three continents, our journey has been driven by one conviction: AI should ship, not sit in slide decks.", 2),
        ("We started as a small consulting team focused on business strategy and process optimization.",
         "Founded as a strategy and AI advisory practice in Lagos, Nigeria.", 6),
        ("Delivered first enterprise AI strategy engagements and agent deployments across West Africa.",
         "Conducted AI trainings in partnership with state government.", 1),
        ("Expanded into AI agent engineering, workforce training, and governance advisory.",
         "Launched workforce training programs across enterprise and public-sector teams.", 1),
        ("Serving forward-thinking organisations across three continents with production-first AI.",
         "Shipped agent and automation builds and deployed ML models for a SaaS martech company.", 1),
        ("`2017`", "`Q2 2025`", 5),
        ("`2019`", "`Q3 2025`", 1),
        ("`2021`", "`Q1 2026`", 1),
        ("`2023`", "`Q3 2026`", 1),
    ],

    # --- Services landing ---
    "DaISNe0vXimYl7L-iYMx-Zb_StOfaNQRA98vcvMbT8M.HiBPkWXm.mjs": [
        ("Rated 4.9/5 by 4.900+ clients",
         "Trusted by forward-thinking organisations", 2),
    ],

    # --- Team card component (default/fallback values) ---
    "CT0TXHUvF.iOqYZryg.mjs": [
        ("Zaire Dorwart", "Supreme Oyewumi", 4),
        ("Chief Financial Officer", "Founder & CEO", 4),
    ],

    "Dj9QoTIdF.-nt0DdeQ.mjs": [
        ("Zaire Dorwart", "Supreme Oyewumi", 2),
    ],

    "s9_qRQGKG6KioBAaHIvXSlJUEZbOxoJqp2uKZqdFXZU.BbyOPG8m.mjs": [
        ("Zaire Dorwart", "Supreme Oyewumi", 1),
    ],

    # --- Homepage stat-band copy & counters ---
    "InvS17SM-NgHMgCCGqMQ2B4DzhSjCbqxQaMHtenca_I.BTbblbbR.mjs": [
        ("Commitment to measurable", "Production-first delivery", 2),
        ("Collaborating with leading AI and cloud technology providers.",
         "Integrating with the AI and cloud ecosystems our clients already run on \u2014 Google, AWS, Microsoft, OpenAI, and partners like MarketSage.", 2),
        ("Decisions Transformed", "Disciplines under one roof", 2),
        ("Analyzed monthly to power smarter business strategies.",
         "Strategy, agent engineering, workforce training, and AI governance \u2014 no handoffs, no gaps.", 2),
        ("Markets Served", "Continents engaged", 2),
        ("\u201cTheir automation strategy completely reshaped how we work. It\u2019s efficient, intelligent, and seamless.\u201d",
         "\u201cCognis Group did not just advise us. They fundamentally changed how our leadership team thinks about artificial intelligence, automation, and decision-making.\u201d", 2),
        # Counter end values
        ("end:120,font:", "end:5,font:", 1),
        ("end:520,font:", "end:4,font:", 1),
        ("end:20,font:", "end:3,font:", 1),
        # Drop the 'k+' suffix on the former 520k+ counter
        ("suffix:`k+`", "suffix:`+`", 1),
    ],

    # --- Homepage route bundle (title + meta) ---
    "augiA20Il._IgiNCyN.mjs": [
        ("Cognis Group \u2014 AI Consulting & Engineering for Enterprises",
         "Cognis Group | AI Consulting, Strategy & Agent Engineering", 1),
        ("Cognis Group builds, deploys, and governs AI systems \u2014 agents, chatbots, workflows, governance, and training. Lagos-headquartered, globally engaged.",
         "Cognis Group is a global AI consulting firm. We design AI strategy, deploy intelligent agents, and build AI governance frameworks. Quod Tango Muto.", 1),
        ("robots:`max-image-preview:large`",
         "robots:`index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1`", 1),
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
        changed = 0
        for old, new, expected in reps:
            if old == new:
                continue
            count = text.count(old)
            if count == 0 and text.count(new) >= expected:
                continue
            if count != expected:
                print(f"  !! {name}: {old!r}: expected {expected}, found {count}")
                errors += 1
                continue
            text = text.replace(old, new)
            changed += count
            print(f"  {name}: {old!r} -> {new!r} ({count}x)")
        if changed:
            path.write_text(text)
            print(f"WROTE {name}: {before} -> {len(text)} bytes")
        else:
            print(f"  {name}: already up to date")
    return errors


if __name__ == "__main__":
    sys.exit(main())
