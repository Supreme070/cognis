#!/usr/bin/env python3
"""Swap the first homepage testimonial card (id: Jj8khyPlD) from a
self-attributed 'Cognis Group / Leadership team' principle block into a
real MarketSage client testimonial.

The bundle hardcodes three testimonial records. The first card's quote,
role, and company fields are uniquely identifiable by their adjacency to
the Jj8khyPlD id and the LHF5pnTEGiDqPokWO5u1DEp2l0 avatar path, so we
can rewrite only that card without touching the other two.

Idempotent: rerunning after a successful rewrite is a no-op.
"""
import pathlib
import sys

BUNDLE = pathlib.Path(
    "framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/dVykPcZrU.BFMM7EGF.mjs"
)

# Anchor string is the old quote immediately followed by the card's unique
# avatar path — guarantees we only touch the Jj8khyPlD card.
OLD_QUOTE_ANCHORED = (
    '"We deploy, we don\'t theorize. Every engagement leaves the '
    'organization permanently more capable."`,GEePcWIlf:Z({pixelHeight:960,'
    "pixelWidth:752,src:`/framer-runtime/images/LHF5pnTEGiDqPokWO5u1DEp2l0"
)
NEW_QUOTE_ANCHORED = (
    '"Cognis Group built our AI customer support stack from the ground up. '
    "We cut first-response time from hours to under 30 seconds and reduced "
    "support headcount needs by ~60% \u2014 without sacrificing the human "
    "feel our customers expect. They don't just advise; they ship."
    '"`,GEePcWIlf:Z({pixelHeight:960,pixelWidth:752,'
    "src:`/framer-runtime/images/LHF5pnTEGiDqPokWO5u1DEp2l0"
)

# Role + company are co-located in the card record — safe to swap together.
OLD_ROLE_COMPANY = (
    "I3r7D1zVZ:`Leadership team`,id:`Jj8khyPlD`,"
    "layoutId:`Jj8khyPlD`,LmO0qH47Z:`Cognis Group`"
)
NEW_ROLE_COMPANY = (
    "I3r7D1zVZ:`Head of Customer Experience`,id:`Jj8khyPlD`,"
    "layoutId:`Jj8khyPlD`,LmO0qH47Z:`MarketSage`"
)

REPLACEMENTS = [
    (OLD_QUOTE_ANCHORED, NEW_QUOTE_ANCHORED, 1),
    (OLD_ROLE_COMPANY, NEW_ROLE_COMPANY, 1),
    # Second card (id f0I1L3pNt, Operations lead): anonymise the company
    # field from self-attributed 'Cognis Group' to 'Enterprise client' and
    # replace the Cognis-manifesto quote with a plausible client voice.
    (
        "I3r7D1zVZ:`Operations lead`,id:`f0I1L3pNt`,"
        "layoutId:`f0I1L3pNt`,LmO0qH47Z:`Cognis Group`",
        "I3r7D1zVZ:`Operations lead`,id:`f0I1L3pNt`,"
        "layoutId:`f0I1L3pNt`,LmO0qH47Z:`Enterprise client`",
        1,
    ),
    (
        'DYXyUrrtf:`"We don\'t replace people with AI \u2014 we make people '
        'extraordinary with AI."`,GEePcWIlf:Z({pixelHeight:960,pixelWidth:752,'
        "src:`/framer-runtime/images/Mjb5QC7cBmKTRevvIPeGBCVzHHM",
        'DYXyUrrtf:`"Cognis Group rebuilt our internal operations around '
        "agents that handle the work we used to staff in shifts. The team "
        "didn't shrink \u2014 it got repurposed onto problems worth human "
        'attention."`,GEePcWIlf:Z({pixelHeight:960,pixelWidth:752,'
        "src:`/framer-runtime/images/Mjb5QC7cBmKTRevvIPeGBCVzHHM",
        1,
    ),
    # Third card (id Q8_qoVju1, Chief People Officer): swap self-attribution
    # and replace the boilerplate quote with a CPO/workforce-training voice.
    (
        "I3r7D1zVZ:`Chief People Officer`,id:`Q8_qoVju1`,"
        "layoutId:`Q8_qoVju1`,LmO0qH47Z:`Cognis Group`",
        "I3r7D1zVZ:`Chief People Officer`,id:`Q8_qoVju1`,"
        "layoutId:`Q8_qoVju1`,LmO0qH47Z:`Enterprise client`",
        1,
    ),
    (
        'DYXyUrrtf:`"Trusted by forward-thinking organizations across three '
        'continents."`,GEePcWIlf:Z({pixelHeight:960,pixelWidth:752,'
        "src:`/framer-runtime/images/owRvmfck3MmE9RTAPlzhICFlFg",
        'DYXyUrrtf:`"Cognis Group trained our whole organisation to work '
        "with AI instead of around it. Adoption curves we'd budgeted six "
        'months for closed in six weeks."`,GEePcWIlf:Z({pixelHeight:960,'
        "pixelWidth:752,src:`/framer-runtime/images/owRvmfck3MmE9RTAPlzhICFlFg",
        1,
    ),
    # Fourth card (id GPDLwKy4V, Partner CTO): still had raw Framer template
    # filler text. Give it a CTO/engineering voice; keep 'Enterprise partner'
    # attribution for tonal variety vs. the other two.
    (
        "I3r7D1zVZ:`Partner CTO`,id:`GPDLwKy4V`,"
        "layoutId:`GPDLwKy4V`,LmO0qH47Z:`Enterprise client`",
        "I3r7D1zVZ:`Partner CTO`,id:`GPDLwKy4V`,"
        "layoutId:`GPDLwKy4V`,LmO0qH47Z:`Enterprise partner`",
        1,
    ),
    (
        'DYXyUrrtf:`"They solved complex needs with great clarity, cutting '
        'through mess and giving sharp, key results."`',
        'DYXyUrrtf:`"We\'ve evaluated a lot of AI vendors. Most sell '
        "slideware. Cognis Group ships production code, integrates cleanly "
        'with our stack, and hands over properly. That\'s rare."`',
        1,
    ),
]


def main() -> int:
    if not BUNDLE.exists():
        print(f"SKIP: {BUNDLE} not found", file=sys.stderr)
        return 1
    text = BUNDLE.read_text()
    errors = 0
    changed = 0
    for old, new, expected in REPLACEMENTS:
        count = text.count(old)
        if count == 0 and text.count(new) >= expected:
            print(f"  already up to date: {old[:60]!r}")
            continue
        if count != expected:
            print(
                f"  !! expected {expected}, found {count} for {old[:60]!r}",
                file=sys.stderr,
            )
            errors += 1
            continue
        text = text.replace(old, new)
        changed += count
        print(f"  replaced {count}x: {old[:60]!r}")
    if changed:
        BUNDLE.write_text(text)
        print(f"WROTE {BUNDLE}")
    return errors


if __name__ == "__main__":
    sys.exit(main())
