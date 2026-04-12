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
from blog_bodies import BODY_GOVERNANCE, BODY_ROI, BODY_NATIVE


# Text replacements for all 6 blog items (titles, slugs, excerpts, bodies).
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
        "Most corporate AI training is a 90-minute tool demo. Here is what actually builds lasting AI capability across an organization \u2014 and what measurable outcomes look like six months after the Cognis Group training programme ends.",

    # --- Item 4: "The Future of Automation for Creative Teams" → AI Governance ---
    "The Future of Automation for Creative Teams":
        "AI Governance for African Enterprises: Building Trust Before Scale",
    "future-automation-creative-teams":
        "ai-governance-african-enterprises",
    "Automation often conjures images of factories and spreadsheets, but its future lies deeply within creative industries. AI-powered tools are emerging not to replace artists or designers, but to act as powerful co-pilots.":
        "The EU AI Act is already reshaping global supply chains. The AU Continental AI Strategy is setting the agenda for Africa. Nigerian, Kenyan and South African regulators are moving. Here is the governance framework Cognis Group builds into every engagement \u2014 so you scale AI with trust, not liability.",

    # --- Item 5: "How Consultants Can Leverage AI" → Measuring AI ROI ---
    "How Consultants Can Leverage AI to Deliver Deeper Insights":
        "Measuring AI ROI: The Framework That Separates Real Impact from Expensive Experiments",
    "consultants-leverage-ai":
        "measuring-ai-roi-framework",
    "AI is an essential tool for the modern consultant, transforming the speed and depth of insights delivered to clients. By leveraging AI, consultants can move past basic data crunching and focus on complex strategic guidance.":
        "Most enterprise AI projects cannot answer a simple question: what is the return? Cognis Group measures every engagement against four dimensions \u2014 hours saved, error rates reduced, throughput gained, and capability transferred. Here is the framework, and here is how to apply it to your own AI investments.",

    # --- Item 6: "Why AI Is the Missing Piece" → AI-Native Operations in Africa ---
    "Why AI Is the Missing Piece in Traditional Consulting":
        "Why Africa\u2019s Next Competitive Advantage Is AI-Native Operations",
    "ai-missing-piece-consulting":
        "ai-native-operations-africa",
    "Traditional consulting models often struggle with the sheer volume and velocity of modern data, leading to recommendations that can sometimes lag behind market realities. AI provides the real-time velocity these models lack.":
        "African enterprises have a structural advantage most global competitors do not: they can build AI-native from the start, without decades of legacy systems to migrate. Here is why the leapfrog opportunity is real \u2014 and what Cognis Group sees on the ground across Lagos, Nairobi and Johannesburg.",
}

# Body content replacements for items 4-6 (loaded from blog_bodies.py).
# These are JSON rich-text arrays — matched as length-prefixed strings just
# like titles/excerpts.
_OLD_BODY_4 = '[1,[4,"p",null,[5,"Automation is the ultimate tool for liberation, removing the technical barriers that stifle original thinking. It takes the repetitive work out of production and gives creators the clarity they need to innovate. Here\u2019s how creative automation can unlock new possibilities for your business:"]],[4,"h3",null,[5,"1. Why Creative Tech Matters"]],[4,"p",null,[5,"Modern creative teams generate massive amounts of assets\u2014versions, sizes, and formats for every platform. Without automation, your best designers stay stuck in \\\\"pixel pushing\\\\" while their big ideas stay locked away."]],[4,"h3",null,[5,"2. From Draft to Design"]],[4,"p",null,[5,"Ideas become powerful when they can be executed quickly. AI allows teams to identify which concepts work and where the biggest visual impact lies. Whether it\u2019s generating mood boards or scaling campaigns, automation enables teams to move from manual drafting to rapid iteration."]],[4,"h3",null,[5,"3. The Strategic Advantage"]],[4,"p",null,[5,"The companies that win today aren\u2019t the ones with the largest design budgets \u2014 but the ones who automate production. Automation empowers you to:"]],[4,"ul",null,[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Eliminate the fear of the blank canvas"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Scale global campaigns in seconds"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Validate visual ideas with real-time data"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Personalize content for every user segment"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Focus on deep, meaningful storytelling"]]]],[4,"p",null,[5,"It becomes the foundation of smarter, more strategic growth."]]]'

_OLD_BODY_5 = '[1,[4,"p",null,[5,"In the consulting world, AI allows a shift from time-consuming research to high-level strategic advisory. It takes the manual work out of discovery and gives experts the insights they need to lead. Here\u2019s how AI-driven consulting can unlock new possibilities for your business:"]],[4,"h3",null,[5,"1. Why AI in Consulting Matters"]],[4,"p",null,[5,"Modern consultants handle massive amounts of client information\u2014interviews, documents, and market trends. Without AI, all of this valuable intelligence stays buried in long reports and unused spreadsheets."]],[4,"h3",null,[5,"2. From Research to Results"]],[4,"p",null,[5,"Expertise becomes powerful when it\u2019s backed by real-time evidence. AI allows consultants to identify hidden patterns and where the biggest client opportunities lie. Whether it\u2019s auditing workflows or predicting market shifts, AI enables teams to move from static advice to dynamic solutions."]],[4,"h3",null,[5,"3. The Strategic Advantage"]],[4,"p",null,[5,"The consultants that win today aren\u2019t the ones with the most billable hours \u2014 but the ones who use AI. AI empowers you to:"]],[4,"ul",null,[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Automate the discovery and audit phase"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Deliver evidence-based strategic roadmaps"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Provide real-time ROI tracking for clients"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Identify market trends before competitors"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Scale your expertise to more accounts"]]]],[4,"p",null,[5,"It becomes the foundation of smarter, more strategic growth."]]]'

_OLD_BODY_6 = '[1,[4,"p",null,[5,"AI is the bridge that turns theoretical strategy into measurable, real-world business impact. It takes the guesswork out of transformation and gives clients the clarity they need to change. Here\u2019s how this \\\\"missing piece\\\\" can unlock new possibilities for your business:"]],[4,"h3",null,[5,"1. Why Implementation Matters"]],[4,"p",null,[5,"Modern consulting projects generate massive amounts of advice\u2014but often lack the tools to execute it. Without AI, the best strategies stay as PDFs on a shelf and never reach their full potential."]],[4,"h3",null,[5,"2. From Paper to Performance"]],[4,"p",null,[5,"Strategy becomes powerful when it\u2019s connected with automated execution. AI allows firms to identify what\u2019s being adopted, what isn\u2019t, and where the biggest implementation gaps lie. Whether it\u2019s tracking KPIs or adjusting tactics, AI enables teams to move from theory-driven to results-driven."]],[4,"h3",null,[5,"3. The Strategic Advantage"]],[4,"p",null,[5,"The firms that win today aren\u2019t the ones with the best presentations \u2014 but the ones who deliver the missing piece. AI empowers you to:"]],[4,"ul",null,[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Bridge the gap between strategy and action"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Personalize transformation for every client"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Spot new growth opportunities in real-time"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Reduce the risk of failed implementations"]]],[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Continuously improve based on performance"]]]],[4,"p",null,[5,"It becomes the foundation of smarter, more strategic growth."]]]'

REPLACEMENTS[_OLD_BODY_4] = BODY_GOVERNANCE
REPLACEMENTS[_OLD_BODY_5] = BODY_ROI
REPLACEMENTS[_OLD_BODY_6] = BODY_NATIVE


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

RAW_CHUNK = pathlib.Path("cms-raw/rAjl8lYSc-chunk-default-0.framercms")
RAW_INDEX = pathlib.Path("cms-raw/rAjl8lYSc-indexes-default-0.framercms")
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


def resort_map_indexes(seg: bytes, resort_keys: set[str]) -> bytes:
    """Re-sort entries in every type-1 subtype-0x02 map whose primary key is
    in `resort_keys`. Framer uses binary search on these maps; when a text
    replacement rewrites the stored value of the key field (e.g. the slug),
    the entries can drift out of sorted order and lookups silently fail.

    Structure of a map section:
      u32 header_len + `{"type":1}` + u8 subtype(0x02)
      u32 k1_len + k1 + u32 k2_len + k2 + u32 entry_count
      for each entry:
        0x0c u32 key_val_len key_val 0x0c u32 id_len id u16 cid u32 off u32 len

    Re-sorting swaps entries in place — segment byte length is preserved.
    """
    data = bytearray(seg)
    i = 0
    while True:
        j = data.find(b'\x00\x00\x00\x0a{"type":1}\x02', i)
        if j < 0:
            break
        p = j + 15  # past header_len + '{"type":1}' + subtype byte
        try:
            klen = struct.unpack(">I", data[p : p + 4])[0]
            p += 4
            k1 = bytes(data[p : p + klen]).decode("utf-8")
            p += klen
            k2len = struct.unpack(">I", data[p : p + 4])[0]
            p += 4
            k2 = bytes(data[p : p + k2len]).decode("utf-8")
            p += k2len
            cnt = struct.unpack(">I", data[p : p + 4])[0]
            p += 4
        except Exception:
            i = j + 1
            continue

        if k1 not in resort_keys:
            i = p
            continue

        entries_start = p
        entries = []
        for _ in range(cnt):
            s = p
            if data[p] != 0x0c:
                break
            p += 1
            slen = struct.unpack(">I", data[p : p + 4])[0]
            p += 4
            key_val = bytes(data[p : p + slen]).decode("utf-8", errors="replace")
            p += slen
            if data[p] != 0x0c:
                break
            p += 1
            ilen = struct.unpack(">I", data[p : p + 4])[0]
            p += 4
            p += ilen  # item id (opaque for sort)
            p += 10  # chunk pointer
            entries.append((key_val, bytes(data[s:p])))
        else:
            entries.sort(key=lambda e: e[0])
            new_bytes = b"".join(e[1] for e in entries)
            assert len(new_bytes) == p - entries_start
            data[entries_start:p] = new_bytes
            print(f"  re-sorted map k1={k1} k2={k2} ({cnt} entries)")
        i = p
    return bytes(data)


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
    # Fields whose stored values were rewritten above — any sorted index
    # keyed on one of these must be re-sorted so binary search still works.
    resort_keys = {"CqVvgMUzo", "FzEtguNp1"}
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
        rewritten = resort_map_indexes(rewritten, resort_keys)
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
