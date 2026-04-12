#!/usr/bin/env python3
"""Local dev server for the Cognis static site.

Adds two behaviors the stdlib SimpleHTTPRequestHandler lacks:

1. SPA fallback — paths that don't resolve to a file fall through to
   /index.html, matching the nginx `try_files $uri $uri/ /index.html;` rule.
2. HTTP Range requests — single range (bytes=a-b) returns 206 with the
   requested slice; multi-range (bytes=a-b,c-d,...) returns 206
   multipart/byteranges. Framer's CMS loader makes multi-range requests
   against the `.framercms` chunks; without this, it throws
   "Unexpected response length".
"""
import mimetypes
import os
import re
import sys
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


RANGE_RE = re.compile(r"^bytes=(.+)$")


def parse_ranges(header: str, filesize: int):
    """Parse a Range header into a list of (start, end) inclusive tuples.

    Returns None if the header is invalid or fully unsatisfiable.
    """
    m = RANGE_RE.match(header.strip())
    if not m:
        return None
    specs = [s.strip() for s in m.group(1).split(",") if s.strip()]
    out = []
    for spec in specs:
        if "-" not in spec:
            return None
        a, b = spec.split("-", 1)
        if a == "":
            # suffix: last N bytes
            try:
                n = int(b)
            except ValueError:
                return None
            if n <= 0:
                continue
            start = max(0, filesize - n)
            end = filesize - 1
        else:
            try:
                start = int(a)
            except ValueError:
                return None
            if b == "":
                end = filesize - 1
            else:
                try:
                    end = int(b)
                except ValueError:
                    return None
                end = min(end, filesize - 1)
        if start > end or start >= filesize:
            continue
        out.append((start, end))
    return out or None


class CognisDevHandler(SimpleHTTPRequestHandler):
    def do_HEAD(self):
        self._maybe_fallback()
        return super().do_HEAD()

    def do_GET(self):
        self._maybe_fallback()
        range_header = self.headers.get("Range")
        if range_header is None:
            return super().do_GET()

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().do_GET()

        try:
            filesize = os.path.getsize(path)
        except OSError:
            return super().do_GET()

        ranges = parse_ranges(range_header, filesize)
        if not ranges:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{filesize}")
            self.end_headers()
            return

        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        try:
            with open(path, "rb") as f:
                if len(ranges) == 1:
                    start, end = ranges[0]
                    length = end - start + 1
                    self.send_response(206)
                    self.send_header("Content-Type", ctype)
                    self.send_header("Content-Length", str(length))
                    self.send_header("Content-Range", f"bytes {start}-{end}/{filesize}")
                    self.send_header("Accept-Ranges", "bytes")
                    self.end_headers()
                    f.seek(start)
                    remaining = length
                    while remaining > 0:
                        buf = f.read(min(64 * 1024, remaining))
                        if not buf:
                            break
                        self.wfile.write(buf)
                        remaining -= len(buf)
                    return

                # multipart/byteranges
                boundary = uuid.uuid4().hex
                parts = []
                body_len = 0
                for start, end in ranges:
                    header = (
                        f"\r\n--{boundary}\r\n"
                        f"Content-Type: {ctype}\r\n"
                        f"Content-Range: bytes {start}-{end}/{filesize}\r\n\r\n"
                    ).encode("latin-1")
                    parts.append((header, start, end))
                    body_len += len(header) + (end - start + 1)
                tail = f"\r\n--{boundary}--\r\n".encode("latin-1")
                body_len += len(tail)

                self.send_response(206)
                self.send_header("Content-Type", f"multipart/byteranges; boundary={boundary}")
                self.send_header("Content-Length", str(body_len))
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                for header, start, end in parts:
                    self.wfile.write(header)
                    f.seek(start)
                    remaining = end - start + 1
                    while remaining > 0:
                        buf = f.read(min(64 * 1024, remaining))
                        if not buf:
                            break
                        self.wfile.write(buf)
                        remaining -= len(buf)
                self.wfile.write(tail)
        except BrokenPipeError:
            pass

    # Asset extensions that must 404 cleanly when missing — SPA-falling-back
    # to index.html would serve them with Content-Type: text/html, which
    # browsers reject for <script type=module> with a strict MIME error that
    # masks the real "missing bundle" signal during testing.
    _ASSET_EXT_RE = re.compile(
        r"\.(mjs|js|css|map|framercms|json|wasm|woff2?|ttf|otf|eot|"
        r"png|jpe?g|webp|gif|svg|ico|avif|mp4|webm|mov|m4v|mp3|wav|ogg|pdf)$",
        re.IGNORECASE,
    )

    def _maybe_fallback(self):
        raw = self.path.split("?", 1)[0].split("#", 1)[0]
        disk_path = self.translate_path(raw)
        if os.path.isfile(disk_path):
            return
        if os.path.isdir(disk_path) and os.path.isfile(os.path.join(disk_path, "index.html")):
            return
        if self._ASSET_EXT_RE.search(raw):
            return  # leave path alone → SimpleHTTPRequestHandler returns a real 404
        self.path = "/index.html"

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3001
    srv = ThreadingHTTPServer(("127.0.0.1", port), CognisDevHandler)
    print(f"cognis dev server on http://127.0.0.1:{port}")
    srv.serve_forever()
