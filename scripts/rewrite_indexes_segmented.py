#!/usr/bin/env python3
"""
Segmented rewrite of the QSCEvOCzd indexes file.

Why this exists: the Framer runtime bundle QSCEvOCzd.BEpRMyCY.mjs hardcodes
26 absolute byte ranges (range:{from:X,to:Y}) pointing into the indexes file.
Each range is a separate field-index payload (collation tree). A monolithic
rewrite of the indexes file shifts content and invalidates every range past
the first edit, which manifests as "Unterminated string in JSON at position
196" when the runtime parses a mid-payload byte window.

Fix: rewrite each segment independently so segments stay self-contained,
then emit a new indexes file = concat(rewritten segments) and patch the .mjs
ranges to reflect the new cumulative offsets.

Segments are independent because each one starts with its own
`{"type":N}` header and contains its own length-prefixed strings. No
cross-segment pointers. Verified by inspecting boundary bytes.
"""
import re
import struct
import pathlib

from rewrite_framercms import SERVICES

RAW = pathlib.Path("framer-cms-raw/QSCEvOCzd-indexes-default-0.framercms")
OUT = pathlib.Path("cognis-cms/services-indexes.framercms")
MJS = pathlib.Path("framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/QSCEvOCzd.BEpRMyCY.mjs")

ORIG_RANGES = [
    (0, 97), (97, 193), (193, 285), (285, 453), (453, 621),
    (621, 743), (743, 863), (863, 940), (940, 1240), (1240, 2229),
    (2229, 3735), (3735, 3922), (3922, 4410), (4410, 4580), (4580, 5052),
    (5052, 5219), (5219, 5648), (5648, 5814), (5814, 6277), (6277, 6438),
    (6438, 6849), (6849, 8453), (8453, 8877), (8877, 8988), (8988, 9781),
    (9781, 9894),
]


def rewrite_segment(seg: bytes, replacements: dict) -> bytearray:
    """Apply length-prefixed string replacements inside a single segment."""
    data = bytearray(seg)
    for old, new in replacements.items():
        old_b = old.encode("utf-8")
        new_b = new.encode("utf-8")
        if old_b == new_b:
            continue
        i = 0
        while True:
            idx = data.find(old_b, i)
            if idx < 0:
                break
            if idx >= 4 and struct.unpack(">I", bytes(data[idx - 4 : idx]))[0] == len(old_b):
                data[idx - 4 : idx + len(old_b)] = struct.pack(">I", len(new_b)) + new_b
                i = idx + len(new_b)
            else:
                i = idx + 1
    return data


def main():
    raw = RAW.read_bytes()
    assert len(raw) == 9894, f"unexpected raw indexes size {len(raw)}"

    # Sanity: original ranges partition the file contiguously
    assert ORIG_RANGES[0][0] == 0
    assert ORIG_RANGES[-1][1] == len(raw)
    for (a, b), (c, d) in zip(ORIG_RANGES, ORIG_RANGES[1:]):
        assert b == c, f"non-contiguous: {b} != {c}"

    new_segments = []
    new_ranges = []
    cursor = 0
    for (a, b) in ORIG_RANGES:
        seg = raw[a:b]
        rewritten = bytes(rewrite_segment(seg, SERVICES))
        new_segments.append(rewritten)
        new_ranges.append((cursor, cursor + len(rewritten)))
        cursor += len(rewritten)

    new_bytes = b"".join(new_segments)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(new_bytes)
    print(f"indexes: {len(raw)} -> {len(new_bytes)} bytes ({len(new_bytes) - len(raw):+d})")

    # Patch the .mjs: replace each original range with its new counterpart.
    # Preserve exact "range:{from:X,to:Y}" formatting; the 26 ranges appear
    # once each and in the same numeric ordering as ORIG_RANGES.
    mjs_text = MJS.read_text()
    orig_size = len(mjs_text)
    changed = 0
    for (oa, ob), (na, nb) in zip(ORIG_RANGES, new_ranges):
        old_literal = f"range:{{from:{oa},to:{ob}}}"
        new_literal = f"range:{{from:{na},to:{nb}}}"
        if old_literal == new_literal:
            continue
        # Must match exactly once — guards against accidental collisions
        count = mjs_text.count(old_literal)
        if count != 1:
            raise SystemExit(f"expected 1 occurrence of {old_literal}, found {count}")
        mjs_text = mjs_text.replace(old_literal, new_literal)
        changed += 1
    MJS.write_text(mjs_text)
    print(f"patched {changed} ranges in {MJS.name} ({orig_size} -> {len(mjs_text)} bytes)")

    # Report the new range table for sanity
    print("new ranges:")
    for (a, b) in new_ranges:
        print(f"  ({a},{b}) len={b - a}")


if __name__ == "__main__":
    main()
