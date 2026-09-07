#!/usr/bin/env python3
"""The ONE global footer. Defined here once, stamped onto every page.

The markup is the landing-page footer: brand + descriptor, COMPANY /
SERVICES / EXPLORE link columns, the newsletter form (posts to /api/form),
copyright and legal links. Byte-identical on every page — nothing varies.

Runs last in `npm run prerender`, right after inject_global_header.py:

    python3 scripts/inject_global_footer.py

Idempotent. Replaces whatever footer a page has (prerendered, the old shell
replica `footer.cgxf`, team/expert templates), hides Framer's own footer on
the Framer service pages, and removes the old "site links" strip that only
existed because those pages had no footer.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {
    "node_modules", "framer-runtime", "cms-raw", "cognis-cms", "deploy", "scripts",
    "playwright-screenshots", "qa_evidence", "stock", "tests", "workers", "og",
    "assets", "content", ".git", ".claude",
}

FOOTER = """<footer class="cg-gf" data-screen-label="Footer" style="background: rgb(13, 13, 12); margin: 12px; border-radius: 24px; padding: 56px clamp(16px, 3.33vw, 48px) 32px;">
    <div style="max-width: 1280px; margin: 0px auto;">
      <div style="display: grid; grid-template-columns: 1.4fr 0.7fr 0.7fr 0.7fr 1.2fr; gap: 48px;">
        <div>
          <a class="cg-gf-logo" href="/" aria-label="Cognis Group" style="display: inline-flex; align-items: center; gap: 9px; color: rgb(255, 255, 255);">
            <svg viewBox="0 0 48 48" aria-hidden="true" style="width: 28px; height: 28px; fill: rgb(255, 255, 255); display: block;"><path d="M 42.66 12.34 A 22 22 0 1 0 42.66 35.66 L 33.19 31.71 A 12 12 0 1 1 33.19 16.29 Z"></path><rect x="36" y="19" width="10" height="10" fill="#D6FD70"></rect></svg>
            <span style="font-family: Inter, sans-serif; font-weight: 400; font-size: 24px; line-height: 28.8px; color: rgb(255, 255, 255); letter-spacing: -1.44px;">Cognis</span>
          </a>
          <div style="height: 20px;"></div>
          <div style="font-size: 14px; line-height: 1.65; color: rgba(255, 255, 255, 0.6); max-width: 320px;">Cognis Group helps organisations use AI to improve how people work. We plan, build and manage practical systems, then prepare your team to use them with confidence. Quod Tango Muto: what we touch, we change.</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="font-family: Inter, sans-serif; font-weight: 600; font-size: 11px; color: rgba(255, 255, 255, 0.45); letter-spacing: 0.88px; text-transform: uppercase;">COMPANY</div>
          <a class="cg-gf-link" href="/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Home</a>
          <a class="cg-gf-link" href="/about-us/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">About Us</a>
          <a class="cg-gf-link" href="/our-services/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Services</a>
          <a class="cg-gf-link" href="/products/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Products</a>
          <a class="cg-gf-link" href="/blog/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Insights</a>
          <a class="cg-gf-link" href="/careers/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Careers</a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="font-family: Inter, sans-serif; font-weight: 600; font-size: 11px; color: rgba(255, 255, 255, 0.45); letter-spacing: 0.88px; text-transform: uppercase;">SERVICES</div>
          <a class="cg-gf-link" href="/our-services/ai-strategy-advisory/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Strategy</a>
          <a class="cg-gf-link" href="/our-services/ai-training-workforce-development/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Training</a>
          <a class="cg-gf-link" href="/our-services/ai-agent-automation-engineering/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Agent Engineering</a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="font-family: Inter, sans-serif; font-weight: 600; font-size: 11px; color: rgba(255, 255, 255, 0.45); letter-spacing: 0.88px; text-transform: uppercase;">EXPLORE</div>
          <a class="cg-gf-link" href="/why-cognis/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Why Cognis</a>
          <a class="cg-gf-link" href="/case-studies/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Case Studies</a>
          <a class="cg-gf-link" href="/how-we-work/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">How We Work</a>
          <a class="cg-gf-link" href="/faq/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">FAQ</a>
          <a class="cg-gf-link" href="/contact/" style="font-family: Inter, sans-serif; font-weight: 500; font-size: 14px; line-height: 22.4px; color: rgba(255, 255, 255, 0.75);">Contact</a>
        </div>
        <div>
          <div style="font-family: Inter, sans-serif; font-weight: 600; font-size: 11px; color: rgba(255, 255, 255, 0.45); letter-spacing: 0.88px; text-transform: uppercase;">GET AI INTELLIGENCE IN YOUR INBOX</div>
          <div style="height: 16px;"></div>
          <form action="/api/form" method="POST" style="display: flex; gap: 8px;"><input type="text" name="company" value="" style="display:none !important" tabindex="-1" autocomplete="off" aria-hidden="true">
            <input type="hidden" name="from_name" value="cognis.group newsletter">
            <input type="hidden" name="subject" value="New newsletter signup — cognis.group">
            <input type="hidden" name="redirect" value="https://cognis.group/thanks-subscribe/">
            <input type="email" name="email" required="" placeholder="Your work email" style="flex: 1 1 0%; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 100px; padding: 12px 18px; font-size: 14px; color: rgb(255, 255, 255); outline: none; font-family: &quot;Plus Jakarta Sans&quot;, sans-serif;">
            <button type="submit" class="cg-gf-btn" style="background: rgb(214, 253, 112); color: rgb(13, 13, 12); border-width: medium; border-style: none; border-color: currentcolor; border-image: initial; border-radius: 100px; padding: 12px 22px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: &quot;Plus Jakarta Sans&quot;, sans-serif;">Subscribe</button>
          </form>
        </div>
      </div>
      <div style="height: clamp(28px, 3.89vw, 56px);"></div>
      <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.45);">© 2024–2026 Cognis Group. All rights reserved.</div>
        <div style="display: flex; gap: 24px;">
          <a class="cg-gf-link" href="/privacy-policy/" style="font-size: 13px; color: rgba(255, 255, 255, 0.45);">Privacy</a>
          <a class="cg-gf-link" href="/terms/" style="font-size: 13px; color: rgba(255, 255, 255, 0.45);">Terms</a>
          <a class="cg-gf-link" href="/contact/" style="font-size: 13px; color: rgba(255, 255, 255, 0.45);">Contact</a>
        </div>
      </div>
    </div>
  </footer>"""

STYLE = """<style data-cognis-gfooter>
  .cg-gf a { text-decoration: none; }
  .cg-gf a.cg-gf-link:hover { color: #FFFFFF !important; }
  .cg-gf .cg-gf-btn:hover { background: #E5FF9B !important; }
  /* Framer service pages: the global footer replaces Framer's own. */
  div:has(> footer.framer-uOBZL), footer.framer-uOBZL { display: none !important; }
</style>"""

INTER_LINK = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet" data-cognis-gfooter-font>'
PJS_LINK = '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet" data-cognis-gheader-font>'

# Any footer that is not Framer's (Framer's stays in the React tree, hidden by CSS).
FOOTER_RE = re.compile(r'<footer\b(?![^>]*class="framer-)[^>]*>[\s\S]*?</footer>\s*')
STRIP_RE = re.compile(r"<!-- cognis-site-links:start -->[\s\S]*?<!-- cognis-site-links:end -->\s*")
OLD_SHELL_CSS_RE = re.compile(r"<!-- cognis-gnav:start -->[\s\S]*?<!-- cognis-gnav:end -->\s*")
OLD_COPY_SCRIPT_RE = re.compile(r"<script data-cognis-copyright>[\s\S]*?</script>\s*")


def pages() -> list[Path]:
    out = []
    for p in sorted(ROOT.rglob("index.html")):
        rel = p.relative_to(ROOT)
        if rel.parts[0] in SKIP_DIRS or any(part.startswith(".") for part in rel.parts):
            continue
        out.append(p)
    return out


def process(p: Path) -> str:
    rel = p.relative_to(ROOT).as_posix()
    html = p.read_text(encoding="utf-8")
    html = STRIP_RE.sub("", html)
    html = OLD_SHELL_CSS_RE.sub("", html)
    html = OLD_COPY_SCRIPT_RE.sub("", html)
    if FOOTER_RE.search(html):
        html = FOOTER_RE.sub(FOOTER + "\n", html, count=1)
        how = "replaced footer"
    else:
        html = html.replace("</body>", FOOTER + "\n</body>", 1)
        how = "inserted footer"
    html = re.sub(r"<style data-cognis-gfooter>[\s\S]*?</style>\n?", "", html)
    add = [STYLE]
    if "family=Inter" not in html and "Inter:" not in html:
        add.insert(0, INTER_LINK)
    if "Plus+Jakarta" not in html:
        add.insert(0, PJS_LINK)
    html = html.replace("</head>", "\n".join(add) + "\n</head>", 1)
    p.write_text(html, encoding="utf-8")
    return f"{how:18} {rel}"


def main() -> int:
    for p in pages():
        print(process(p))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
