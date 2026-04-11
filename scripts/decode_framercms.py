#!/usr/bin/env python3
"""
Decode a .framercms binary chunk and dump every plain-string (tag 0x0c),
rich-text (tag 0x0b), and JSON (tag 0x0a) field with its offset, key, and value.

Format (empirically decoded, verified against services/blog/plans chunks):
  Header:
    u32 BE  item_count
    u16 BE  field_count_per_item
  Per field (item_count * field_count_per_item times):
    u32 BE  key_len
    utf8    key_bytes        (e.g. "id", "createdAt", or 9-char Framer field ID)
    u8      type_tag
    value   (depends on tag)

  Tags:
    0x00 = null (no value)
    0x01 = bool  (1 byte)
    0x04 = u64 BE timestamp
    0x08 = f64 BE double
    0x0a = JSON:      u32 len + utf8 bytes
    0x0b = rich-text: u8 flag + u32 len + utf8 bytes
    0x0c = string:    u32 len + utf8 bytes
    0x0d = ref: 16-24 bytes (partially decoded — skip to next field header by length)

This decoder may fail on unknown tags; it prints whatever it finds and warns.
"""
import struct
import sys
import pathlib
import json

def read_u32(data, idx):
    return struct.unpack(">I", data[idx:idx+4])[0]
def read_u16(data, idx):
    return struct.unpack(">H", data[idx:idx+2])[0]
def read_u64(data, idx):
    return struct.unpack(">Q", data[idx:idx+8])[0]
def read_f64(data, idx):
    return struct.unpack(">d", data[idx:idx+8])[0]

def safe_utf8(b):
    try:
        return b.decode("utf-8")
    except UnicodeDecodeError:
        return repr(b)

def decode(path):
    data = pathlib.Path(path).read_bytes()
    total = len(data)
    print(f"\n=== {path} ({total} bytes) ===")
    if total < 6:
        print("  Too small.")
        return

    item_count = read_u32(data, 0)
    field_count = read_u16(data, 4)
    print(f"  header: item_count={item_count}, field_count={field_count}")

    idx = 6
    item = 0
    field = 0
    known_tags = {0x00, 0x01, 0x04, 0x08, 0x0a, 0x0b, 0x0c, 0x0d}

    while idx < total and item < item_count:
        if idx + 4 > total:
            print(f"  !! truncated at idx={idx}")
            break
        key_len = read_u32(data, idx)
        idx += 4
        if key_len > 200 or idx + key_len > total:
            print(f"  !! suspicious key_len={key_len} at idx={idx-4}, stopping")
            break
        key = data[idx:idx+key_len].decode("utf-8", errors="replace")
        idx += key_len

        if idx >= total:
            print(f"  !! missing tag at idx={idx}")
            break
        tag = data[idx]
        idx += 1

        val_repr = None
        value_offset = None  # for 0x0c, the offset of the length prefix
        if tag == 0x00:
            val_repr = "null"
        elif tag == 0x01:
            val_repr = f"bool({data[idx]})"
            idx += 1
        elif tag == 0x04:
            val_repr = f"u64({read_u64(data, idx)})"
            idx += 8
        elif tag == 0x08:
            val_repr = f"f64({read_f64(data, idx)})"
            idx += 8
        elif tag == 0x0a:
            vlen = read_u32(data, idx)
            value_offset = idx  # length prefix starts here
            vbytes = data[idx+4:idx+4+vlen]
            val_repr = f"json[{vlen}]={safe_utf8(vbytes)[:120]!r}"
            idx += 4 + vlen
        elif tag == 0x0b:
            flag = data[idx]
            idx += 1
            vlen = read_u32(data, idx)
            value_offset = idx  # length prefix starts here (after 1-byte flag)
            vbytes = data[idx+4:idx+4+vlen]
            val_repr = f"rt[flag={flag},{vlen}]={safe_utf8(vbytes)[:120]!r}"
            idx += 4 + vlen
        elif tag == 0x0c:
            vlen = read_u32(data, idx)
            value_offset = idx  # length prefix starts here
            vbytes = data[idx+4:idx+4+vlen]
            val_repr = f"str[{vlen}]={safe_utf8(vbytes)[:120]!r}"
            idx += 4 + vlen
        elif tag == 0x0d:
            # variable-length reference — empirically 16 bytes for simple refs
            val_repr = f"ref[?] (guessed 16 bytes)"
            idx += 16
        else:
            print(f"  !! unknown tag 0x{tag:02x} at idx={idx-1}, item={item}, field={field}, key={key}")
            break

        show_offset = f"@{value_offset}" if value_offset is not None else ""
        print(f"  item{item}.f{field} {key!r:14s} tag=0x{tag:02x} {show_offset} -> {val_repr}")

        field += 1
        if field >= field_count:
            field = 0
            item += 1

    remaining = total - idx
    print(f"  parsed: item={item}, remaining_bytes={remaining}")

if __name__ == "__main__":
    paths = sys.argv[1:]
    if not paths:
        paths = sorted(str(p) for p in pathlib.Path("framer-cms-raw").glob("*.framercms"))
    for p in paths:
        decode(p)
