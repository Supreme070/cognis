#!/usr/bin/env python3
"""
Brute-force string discovery inside a .framercms chunk.

Strategy: scan the whole byte stream. For every position i, read u32 at i as a
potential length prefix, then check whether the N bytes at i+4 form a valid
UTF-8 string of printable ASCII. If yes, treat it as a candidate and emit it.

This bypasses the need to fully parse the binary structure — all editable
strings in Framer CMS chunks use the same `u32_len + utf8_bytes` layout
regardless of whether they're tagged 0x0c (plain string), 0x0a (JSON), or 0x0b
(rich text), so the scan catches them all.

We filter to strings of length >= 3 that contain at least one letter, to reduce
noise from things like image dimensions or tiny tokens.
"""
import struct
import sys
import pathlib

def scan(path, min_len=3, max_len=4000):
    data = pathlib.Path(path).read_bytes()
    total = len(data)
    print(f"\n=== {path} ({total} bytes) ===")

    found = []
    i = 0
    while i + 4 < total:
        n = struct.unpack(">I", data[i:i+4])[0]
        if min_len <= n <= max_len and i + 4 + n <= total:
            candidate = data[i+4:i+4+n]
            try:
                s = candidate.decode("utf-8")
            except UnicodeDecodeError:
                i += 1
                continue
            has_letter = any(c.isalpha() for c in s)
            mostly_printable = sum(1 for c in s if c.isprintable() or c in "\n\t") >= n * 0.9
            if has_letter and mostly_printable:
                found.append((i+4, n, s))
                i += 4 + n
                continue
        i += 1

    for offset, length, s in found:
        snippet = s if len(s) < 120 else s[:100] + "...[+{} chars]".format(len(s) - 100)
        print(f"  @{offset:5d} len={length:5d}  {snippet!r}")

    print(f"  total strings: {len(found)}")
    return found

if __name__ == "__main__":
    paths = sys.argv[1:] or sorted(str(p) for p in pathlib.Path("cms-raw").glob("*chunk*.framercms"))
    for p in paths:
        scan(p)
