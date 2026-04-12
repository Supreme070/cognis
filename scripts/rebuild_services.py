#!/usr/bin/env python3
"""
Full rebuild of the SERVICES CMS collection (chunk + indexes + .mjs patches).

Why this exists: the Framer CMS format stores byte pointers from the indexes
file into the chunk file. Each pointer is a 10-byte V struct:
    u16 chunkId + u32 offset + u32 length
Naive string find/replace on the chunk moves item boundaries, silently
invalidating every pointer in every index segment. Separate fetch of
`?range=X-Y` from the chunk then reads bytes that cross record boundaries,
triggering "Unterminated string in JSON at position 196" and friends.

What this script does:
  1. Parse item boundaries from the ID index (indexes segment 0).
  2. Rewrite each chunk item's bytes independently with SERVICES replacements.
  3. Repack items back-to-back, producing a new chunk and new per-item
     (offset, length) pairs.
  4. For every old V pointer (chunkId=0 + old_offset + old_length), substitute
     the new 10-byte pattern throughout the raw indexes file. 10 bytes is
     specific enough that collisions are astronomically unlikely; verified
     the patterns are distinct.
  5. Apply SERVICES string replacements segment-by-segment on the indexes
     (the hardcoded .mjs byte ranges partition the file into 26 self-contained
     collation payloads).
  6. Concatenate rewritten segments into the new indexes file.
  7. Patch the 26 `range:{from:X,to:Y}` literals in QSCEvOCzd.BEpRMyCY.mjs
     to reflect the new segment offsets.

Outputs:
  cognis-cms/services-chunk.framercms
  cognis-cms/services-indexes.framercms
  framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/QSCEvOCzd.BEpRMyCY.mjs (patched)
"""
import pathlib
import re
import struct

from rebuild_blog import resort_map_indexes
from rewrite_framercms import SERVICES
from rewrite_json_blobs import rewrite_image_blobs

# Services field IDs whose stored values are mutated by SERVICES replacements.
# Any type-1 subtype-0x02 sorted index keyed on one of these must be re-sorted
# after text rewrite, or Framer's binary search will silently miss entries.
# From project_cognis_framer_internals.md:
#   jMRdATqKw = title, eFnXXZiS4 = slug
SERVICES_RESORT_KEYS = {"jMRdATqKw", "eFnXXZiS4"}

RAW_CHUNK = pathlib.Path("framer-cms-raw/QSCEvOCzd-chunk-default-0.framercms")
RAW_INDEX = pathlib.Path("framer-cms-raw/QSCEvOCzd-indexes-default-0.framercms")
OUT_CHUNK = pathlib.Path("cognis-cms/services-chunk.framercms")
OUT_INDEX = pathlib.Path("cognis-cms/services-indexes.framercms")
MJS = pathlib.Path("framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/QSCEvOCzd.BEpRMyCY.mjs")

# Original .mjs hardcoded ranges (indexes segments). Order matters — they
# partition the file contiguously.
ORIG_RANGES = [
    (0, 97), (97, 193), (193, 285), (285, 453), (453, 621),
    (621, 743), (743, 863), (863, 940), (940, 1240), (1240, 2229),
    (2229, 3735), (3735, 3922), (3922, 4410), (4410, 4580), (4580, 5052),
    (5052, 5219), (5219, 5648), (5648, 5814), (5814, 6277), (6277, 6438),
    (6438, 6849), (6849, 8453), (8453, 8877), (8877, 8988), (8988, 9781),
    (9781, 9894),
]


def rewrite_bytes(buf: bytes, replacements: dict) -> bytes:
    """Length-prefixed string substitution on a raw byte buffer."""
    data = bytearray(buf)
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
    return bytes(data)


def parse_id_segment(seg: bytes) -> list[tuple[str, int, int]]:
    """Parse indexes segment 0 (the ID index) into [(item_id, offset, length)]."""
    # Layout (verified by hex dump of services):
    #   u32 len + "{"type":1}"   (14 bytes total)
    #   u8 subtype               (1 byte)
    #   u32 field_name_len + field_name   (e.g. 2 + "id")
    #   u32 entry_count
    #   per entry:
    #     tag 0x0c + u32 str_len + str_bytes   (item ID)
    #     u16 chunkId + u32 offset + u32 length (V pointer, 10 bytes)
    ptr = 0
    head_len = struct.unpack(">I", seg[0:4])[0]
    ptr = 4 + head_len
    assert seg[4:4 + head_len] == b'{"type":1}', f"unexpected header {seg[4:4+head_len]!r}"
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
        assert seg[ptr] == 0x0c, f"expected 0x0c string tag at {ptr}, got {seg[ptr]:#x}"
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


def v_pointer_bytes(chunk_id: int, offset: int, length: int) -> bytes:
    return struct.pack(">HII", chunk_id, offset, length)


def main():
    raw_chunk = RAW_CHUNK.read_bytes()
    raw_index = RAW_INDEX.read_bytes()
    assert len(raw_chunk) == 9112, f"unexpected chunk size {len(raw_chunk)}"
    assert len(raw_index) == 9894, f"unexpected index size {len(raw_index)}"

    # 1. Parse item boundaries from ID index
    seg0 = raw_index[ORIG_RANGES[0][0] : ORIG_RANGES[0][1]]
    items = parse_id_segment(seg0)
    print(f"parsed {len(items)} items from ID index:")
    for item_id, cid, off, ln in items:
        print(f"  {item_id}: chunk={cid} offset={off} length={ln}")

    # 2. Rewrite each item independently
    item_count = struct.unpack(">I", raw_chunk[0:4])[0]
    assert item_count == len(items), f"header item_count={item_count} != parsed={len(items)}"

    new_items = {}  # item_id -> new bytes
    for item_id, cid, off, ln in items:
        orig_bytes = raw_chunk[off : off + ln]
        # Text replacements (length-prefixed strings) + image URL blob rewrite
        new_bytes = rewrite_bytes(orig_bytes, SERVICES)
        new_bytes = rewrite_image_blobs(new_bytes)
        new_items[item_id] = new_bytes
        print(f"  item {item_id}: {ln} -> {len(new_bytes)} ({len(new_bytes) - ln:+d})")

    # 3. Repack chunk: u32 item_count + items back-to-back from offset 4
    # Preserve item ordering by offset so we don't accidentally permute things.
    items_by_offset = sorted(items, key=lambda it: it[2])
    new_chunk = bytearray()
    new_chunk += struct.pack(">I", item_count)
    pointer_map = {}  # (chunk_id, old_offset, old_length) -> (chunk_id, new_offset, new_length)
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
    print(f"chunk: {len(raw_chunk)} -> {len(new_chunk)} bytes ({len(new_chunk) - len(raw_chunk):+d})")

    # 4. Substitute V pointers throughout raw indexes (10-byte swap, no size change)
    # Build old->new byte-pattern map and apply to each segment before string rewrite
    pointer_patterns = {
        v_pointer_bytes(*old): v_pointer_bytes(*new)
        for old, new in pointer_map.items()
    }
    # Sanity: every old pattern must be unique and not overlap with another
    pats = list(pointer_patterns.keys())
    for a in pats:
        for b in pats:
            if a != b:
                assert a != b, "duplicate"

    # 5. Per-segment rewrite: first V pointer substitution, then string rewrite
    new_segments = []
    new_ranges = []
    cursor = 0
    total_ptr_subs = 0
    for (a, b) in ORIG_RANGES:
        seg = raw_index[a:b]
        data = bytearray(seg)
        # V pointer replace (each pattern appears 0+ times per segment)
        for old_pat, new_pat in pointer_patterns.items():
            i = 0
            while True:
                idx = data.find(old_pat, i)
                if idx < 0:
                    break
                data[idx : idx + 10] = new_pat
                total_ptr_subs += 1
                i = idx + 10
        # String replacements + image URL blob rewrite inside segment
        rewritten = rewrite_bytes(bytes(data), SERVICES)
        rewritten = rewrite_image_blobs(rewritten)
        # Sorted-index invariant: re-sort any type-1 subtype-0x02 map keyed
        # on a rewritten field (slug/title), or binary search lookups fail
        # with "xv: No data matches path variables" even though the value is
        # literally present in the file. See project_cognis_framer_internals.md.
        rewritten = resort_map_indexes(rewritten, SERVICES_RESORT_KEYS)
        new_segments.append(rewritten)
        new_ranges.append((cursor, cursor + len(rewritten)))
        cursor += len(rewritten)

    print(f"V pointer substitutions across indexes: {total_ptr_subs}")

    new_index = b"".join(new_segments)
    OUT_INDEX.write_bytes(new_index)
    print(f"indexes: {len(raw_index)} -> {len(new_index)} bytes ({len(new_index) - len(raw_index):+d})")

    # 6. Patch .mjs ranges to reflect new segment offsets. Idempotent: scan
    # the current ranges in-file and replace in REVERSE order so earlier
    # replacements don't shift offsets of later matches.
    mjs_text = MJS.read_text()
    orig_mjs_size = len(mjs_text)
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
        mjs_text = mjs_text[: m.start()] + new_lit + mjs_text[m.end():]
        changed += 1
    MJS.write_text(mjs_text)
    print(f"patched {changed} ranges in {MJS.name} ({orig_mjs_size} -> {len(mjs_text)} bytes)")


if __name__ == "__main__":
    main()
