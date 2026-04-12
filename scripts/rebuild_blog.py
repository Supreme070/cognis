#!/usr/bin/env python3
"""
Rebuild the BLOG CMS collection (6 items, 10 fields) with local image URLs.

Mirrors rebuild_services.py but for the rAjl8lYSc collection. Blog does NOT
need text rewrites at launch (we keep the template blog content and rename the
nav link Blog -> Insights elsewhere). Only the image URL blobs need to be
swapped from framerusercontent.com to /framer-runtime/images/.

Same shape as services rebuild:
  1. Parse ID segment to get item (offset, length) pairs
  2. Per item: rewrite image URL blobs, item bytes shrink, repack
  3. Rebuild chunk, compute new V pointers
  4. Substitute old V patterns with new ones throughout raw indexes
  5. Rewrite JSON blobs inside each indexes segment (length changes)
  6. Concat new segments, emit new indexes
  7. Patch the 11 range:{from:X,to:Y} literals in rAjl8lYSc.DS3b7BJb.mjs
"""
import pathlib
import re
import struct

from rewrite_json_blobs import rewrite_image_blobs


# Text replacements for first 3 blog items (titles, slugs, excerpts).
# Applied to each item's bytes as length-prefixed substitutions.
REPLACEMENTS = {
    # --- Item 1 ---
    "Turning Data into Strategy: The Power of Analytics":
        "Why Most Enterprise AI Deployments Fail — and What Separates the Ones That Succeed",
    "turning-data-into-strategy":
        "why-enterprise-ai-deployments-fail",
    "In today’s digital landscape, data is no longer just a byproduct — it’s one of the most valuable assets a business can have. But raw numbers alone don’t create impact. The real power comes from understanding what those numbers mean, turning insights into direction, and transforming information into intelligent strategy.":
        "Five years of production AI data shows the same failure patterns. Here is what separates the enterprises whose AI works from the ones whose AI ends up as a slide deck — and what Cognis Group does differently on every engagement to ship systems that actually go live.",

    # --- Item 2 ---
    "5 Ways AI Can Streamline Business Operations":
        "AI Agents Are the New Operating System for Enterprise Teams",
    "5-ways-ai-streamline-operations":
        "ai-agents-new-operating-system",
    "AI is moving from a futuristic concept to a necessity for modern business efficiency. Its ability to handle repetitive, high-volume tasks is freeing up human capital and dramatically reducing operational costs across various industries.":
        "Agents are not chatbots. They are a new computing primitive that sits between human operators and enterprise systems — and every serious organization will run on them within three years. Here is how Cognis Group designs agent-native workflows that ship.",

    # --- Item 3 ---
    "Human+Machine: Finding the Perfect Balance":
        "Building an AI-Ready Workforce: What Effective Training Actually Looks Like",
    "human-machine-balance":
        "ai-ready-workforce-training",
    "The greatest success in the age of AI does not come from choosing between humans or machines, but from mastering their collaboration. The 'Human+Machine' dynamic is about pairing cognitive strengths with computational speed.":
        "Most corporate AI training is a 90-minute tool demo. Here is what actually builds lasting AI capability across an organization — and what measurable outcomes look like six months after the Cognis Group training programme ends.",
}


def apply_text_replacements(data: bytes, reps: dict) -> bytes:
    """Apply length-prefixed string substitutions to item bytes.

    For each (old, new), scan for UTF-8 bytes of `old`, verify the u32 BE at
    idx-4 equals len(old), and splice in new bytes + new length prefix.
    """
    out = bytearray(data)
    for old, new in reps.items():
        old_b = old.encode("utf-8")
        new_b = new.encode("utf-8")
        if old_b == new_b:
            continue
        i = 0
        while True:
            idx = out.find(old_b, i)
            if idx < 0:
                break
            if idx >= 4 and struct.unpack(">I", bytes(out[idx - 4 : idx]))[0] == len(old_b):
                out[idx - 4 : idx + len(old_b)] = struct.pack(">I", len(new_b)) + new_b
                i = idx + len(new_b)
            else:
                i = idx + 1
    return bytes(out)

RAW_CHUNK = pathlib.Path("framer-cms-raw/rAjl8lYSc-chunk-default-0.framercms")
RAW_INDEX = pathlib.Path("framer-cms-raw/rAjl8lYSc-indexes-default-0.framercms")
OUT_CHUNK = pathlib.Path("cognis-cms/blog-chunk.framercms")
OUT_INDEX = pathlib.Path("cognis-cms/blog-indexes.framercms")
MJS = pathlib.Path("framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/rAjl8lYSc.DS3b7BJb.mjs")

# 11 hardcoded ranges from rAjl8lYSc.DS3b7BJb.mjs
ORIG_RANGES = [
    (0, 169), (169, 337), (337, 501), (501, 873), (873, 1245),
    (1245, 1657), (1657, 1939), (1939, 2085), (2085, 4527),
    (4527, 6104), (6104, 16290),
]


def parse_id_segment(seg: bytes) -> list[tuple[str, int, int, int]]:
    """Parse indexes segment 0 (the ID index) into [(item_id, chunk_id, offset, length)].

    Format (same as services):
      u32 header_len + `{"type":1}` + u8 subtype
      u32 key_len + key (=id)
      u32 entry_count
      per entry: 0x0c + u32 str_len + item_id + u16 chunkId + u32 offset + u32 length
    """
    head_len = struct.unpack(">I", seg[0:4])[0]
    ptr = 4 + head_len
    assert seg[4 : 4 + head_len] == b'{"type":1}', f"unexpected header {seg[4:4+head_len]!r}"
    ptr += 1  # subtype byte
    key_len = struct.unpack(">I", seg[ptr : ptr + 4])[0]
    ptr += 4
    key = seg[ptr : ptr + key_len].decode("utf-8")
    ptr += key_len
    assert key == "id", f"expected 'id' field, got {key!r}"
    entry_count = struct.unpack(">I", seg[ptr : ptr + 4])[0]
    ptr += 4

    items = []
    for _ in range(entry_count):
        assert seg[ptr] == 0x0c, f"expected 0x0c at {ptr}, got {seg[ptr]:#x}"
        ptr += 1
        slen = struct.unpack(">I", seg[ptr : ptr + 4])[0]
        ptr += 4
        item_id = seg[ptr : ptr + slen].decode("utf-8")
        ptr += slen
        chunk_id = struct.unpack(">H", seg[ptr : ptr + 2])[0]
        offset = struct.unpack(">I", seg[ptr + 2 : ptr + 6])[0]
        length = struct.unpack(">I", seg[ptr + 6 : ptr + 10])[0]
        ptr += 10
        items.append((item_id, chunk_id, offset, length))
    return items


def v_ptr(cid: int, off: int, ln: int) -> bytes:
    return struct.pack(">HII", cid, off, ln)


def main():
    raw_chunk = RAW_CHUNK.read_bytes()
    raw_index = RAW_INDEX.read_bytes()
    print(f"blog chunk: {len(raw_chunk)} bytes, indexes: {len(raw_index)} bytes")

    seg0 = raw_index[ORIG_RANGES[0][0] : ORIG_RANGES[0][1]]
    items = parse_id_segment(seg0)
    print(f"parsed {len(items)} items from blog ID index")
    for it in items:
        print(f"  {it}")

    item_count = struct.unpack(">I", raw_chunk[0:4])[0]
    assert item_count == len(items)

    # Rewrite each item's image URL blobs + text replacements
    new_items = {}
    for item_id, cid, off, ln in items:
        orig = raw_chunk[off : off + ln]
        new = rewrite_image_blobs(orig)
        new = apply_text_replacements(new, REPLACEMENTS)
        new_items[item_id] = new
        print(f"  item {item_id}: {ln} -> {len(new)} ({len(new)-ln:+d})")

    # Repack chunk in original item ordering (by original offset)
    items_by_offset = sorted(items, key=lambda it: it[2])
    new_chunk = bytearray()
    # Preserve the original chunk header — for blog it's u32 item_count + u16 field_count
    # then items start. Items start at offset 6 in the raw file.
    header_len = items_by_offset[0][2]  # first item's original offset
    new_chunk += raw_chunk[:header_len]
    pointer_map = {}
    cursor = len(new_chunk)
    for item_id, cid, off, ln in items_by_offset:
        data = new_items[item_id]
        new_off = cursor
        new_len = len(data)
        new_chunk += data
        cursor += new_len
        pointer_map[(cid, off, ln)] = (cid, new_off, new_len)

    OUT_CHUNK.parent.mkdir(parents=True, exist_ok=True)
    OUT_CHUNK.write_bytes(bytes(new_chunk))
    print(f"chunk: {len(raw_chunk)} -> {len(new_chunk)} ({len(new_chunk)-len(raw_chunk):+d})")

    # V pointer substitution throughout indexes
    ptr_map = {v_ptr(*old): v_ptr(*new) for old, new in pointer_map.items()}

    # Per-segment: V pointer substitute + image URL blob rewrite
    new_segments = []
    new_ranges = []
    cursor = 0
    total_ptr_subs = 0
    for (a, b) in ORIG_RANGES:
        seg = raw_index[a:b]
        data = bytearray(seg)
        for old_p, new_p in ptr_map.items():
            i = 0
            while True:
                idx = data.find(old_p, i)
                if idx < 0:
                    break
                data[idx : idx + 10] = new_p
                total_ptr_subs += 1
                i = idx + 10
        rewritten = rewrite_image_blobs(bytes(data))
        rewritten = apply_text_replacements(rewritten, REPLACEMENTS)
        new_segments.append(rewritten)
        new_ranges.append((cursor, cursor + len(rewritten)))
        cursor += len(rewritten)

    print(f"V pointer substitutions: {total_ptr_subs}")
    new_index = b"".join(new_segments)
    OUT_INDEX.write_bytes(new_index)
    print(f"indexes: {len(raw_index)} -> {len(new_index)} ({len(new_index)-len(raw_index):+d})")

    # Patch .mjs ranges — regex-based re-scan so this is idempotent across runs.
    # Find all `range:{from:X,to:Y}` literals in source order, replace in REVERSE
    # order with the newly computed ranges so offsets don't drift.
    mjs_text = MJS.read_text()
    orig_len = len(mjs_text)
    pattern = re.compile(r"range:\{from:(\d+),to:(\d+)\}")
    matches = list(pattern.finditer(mjs_text))
    if len(matches) != len(new_ranges):
        raise SystemExit(
            f"expected {len(new_ranges)} range literals in {MJS.name}, found {len(matches)}"
        )
    changed = 0
    for m, (na, nb) in zip(reversed(matches), reversed(new_ranges)):
        new_lit = f"range:{{from:{na},to:{nb}}}"
        if m.group(0) == new_lit:
            continue
        mjs_text = mjs_text[: m.start()] + new_lit + mjs_text[m.end() :]
        changed += 1
    MJS.write_text(mjs_text)
    print(f"patched {changed} ranges in {MJS.name} ({orig_len} -> {len(mjs_text)} bytes)")


if __name__ == "__main__":
    main()
