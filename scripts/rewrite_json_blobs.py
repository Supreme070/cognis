#!/usr/bin/env python3
"""
Image URL rewriter for 0x0a JSON blobs inside .framercms data.

Framer stores image metadata as tag 0x0a blobs: `\x0a + u32 BE length + JSON`.
The JSON looks like `{"src":"https://framerusercontent.com/images/...","srcSet":"..."}`.
Our fetch monkey-patch only catches requests made via window.fetch — but <img>
elements rendered from these blobs bypass fetch entirely and hit the CDN.

Fix: rewrite the URL bytes inside each blob and update the blob's length prefix.
Detection pattern `\n\x00\x00..{"src":"` is specific enough (0x0a tag + 2 high
zero bytes of a sub-64KB length + opening `{"src":"`) that false positives on
real CMS data are astronomically unlikely.
"""
import re
import struct

IMG_OLD = b"https://framerusercontent.com/images/"
IMG_NEW = b"/framer-runtime/images/"
ASSETS_OLD = b"https://framerusercontent.com/assets/"
ASSETS_NEW = b"/framer-runtime/assets/"

_BLOB_START = re.compile(rb'\x0a\x00\x00.{2}\{"src":"', re.DOTALL)


def rewrite_image_blobs(data: bytes) -> bytes:
    """Rewrite framerusercontent.com image URLs in every 0x0a JSON blob.

    Returns the new buffer; length may shrink because the new URL prefix is
    shorter than the old one. Each blob's u32 length prefix is updated to
    reflect the new payload length.
    """
    buf = bytearray()
    i = 0
    n = len(data)
    while i < n:
        m = _BLOB_START.search(data, i)
        if not m:
            buf += data[i:]
            break
        start = m.start()
        buf += data[i:start]
        old_len = struct.unpack(">I", data[start + 1 : start + 5])[0]
        payload_start = start + 5
        payload_end = payload_start + old_len
        if payload_end > n:
            # corrupt/unexpected — bail out and copy rest verbatim
            buf += data[start:]
            break
        payload = data[payload_start:payload_end]
        new_payload = payload.replace(IMG_OLD, IMG_NEW).replace(ASSETS_OLD, ASSETS_NEW)
        buf.append(0x0a)
        buf += struct.pack(">I", len(new_payload))
        buf += new_payload
        i = payload_end
    return bytes(buf)


def count_blobs(data: bytes) -> int:
    return len(_BLOB_START.findall(data))
