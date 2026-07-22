#!/usr/bin/env python3
"""Generate standalone team profile pages for members who aren't in the
Framer CMS (the CMS only has 3 slots and can't be extended in this static
export). One shared template — site nav + footer + member hero — so all
generated pages stay consistent. Run manually after editing MEMBERS:

    python3 scripts/build_team_profiles.py

Writes teams/<slug>/index.html for each member. These are plain static
pages (no Framer runtime), served directly by Cloudflare Pages.
"""
from __future__ import annotations

import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# CMS-backed members (Supreme, Kola) keep their Framer pages — do NOT list
# them here. Only members without a CMS profile go below.
MEMBERS = [
    {
        "slug": "obruche-uwanoghor",
        "name": "Obruche Uwanoghor",
        "role": "Director of People & Culture",
        "img": "/framer-runtime/images/team-obruche-uwanoghor.jpg",
        "bio": "Obruche leads People & Culture at Cognis Group — building the "
               "team, shaping how we work day to day, and making sure our "
               "people grow as fast as the company does.",
    },
    {
        "slug": "tosin-salami",
        "name": "Tosin Salami",
        "role": "Executive Director, Product & Strategy",
        "img": "/framer-runtime/images/team-tosin-salami.jpg",
        "bio": "Tosin sets product direction and strategy at Cognis Group — "
               "turning where the market is heading into the products, "
               "roadmaps, and priorities that get us there.",
    },
]

NAV = [
    ("Home", "/"),
    ("About Us", "/about-us"),
    ("Services", "/our-services"),
    ("Products", "/products"),
    ("Insights", "/blog"),
]
FOOT = NAV + [("Contact", "/contact")]

TEMPLATE = """<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} — Cognis Group</title>
<meta name="description" content="{name}, {role_text} at Cognis Group.">
<link rel="canonical" href="https://cognis.group/teams/{slug}">
<meta property="og:type" content="profile">
<meta property="og:title" content="{name} — Cognis Group">
<meta property="og:description" content="{role_text} at Cognis Group.">
<meta property="og:url" content="https://cognis.group/teams/{slug}">
<meta property="og:image" content="https://cognis.group{img_path}">
<link rel="icon" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>
  :root{{--ink:#131313;--lime:#d6fd70;--surface:#f2f2f2;--muted:#7b7b7b}}
  *{{box-sizing:border-box}}
  html,body{{margin:0}}
  body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:#fff;-webkit-font-smoothing:antialiased}}
  a{{color:inherit}}
  .brand{{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:21px;text-decoration:none;letter-spacing:-.01em}}
  .brand img{{width:26px;height:26px;display:block}}
  header.site{{display:flex;align-items:center;gap:28px;padding:18px max(20px,5vw)}}
  .nav{{display:flex;gap:26px;margin-left:auto}}
  .nav a{{font-size:14px;font-weight:500;color:#2f2f2f;text-decoration:none}}
  .nav a:hover{{color:var(--ink)}}
  .nav-cta{{display:inline-flex;align-items:center;padding:11px 20px;border-radius:999px;background:var(--ink);color:var(--lime);font-size:13px;font-weight:600;letter-spacing:.04em;text-decoration:none}}
  main.profile{{display:grid;grid-template-columns:minmax(0,430px) minmax(0,1fr);gap:56px;align-items:center;max-width:1080px;margin:0 auto;padding:40px max(20px,5vw) 96px}}
  .photo{{border-radius:22px;overflow:hidden;aspect-ratio:4/5;background:var(--surface)}}
  .photo img{{width:100%;height:100%;object-fit:cover;display:block}}
  .eyebrow{{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);margin:0 0 16px}}
  .eyebrow::before{{content:"";width:6px;height:6px;border-radius:50%;background:var(--ink)}}
  h1{{font-size:clamp(38px,5vw,62px);line-height:1.01;letter-spacing:-.02em;margin:0 0 12px}}
  .role{{font-size:18px;color:var(--muted);margin:0 0 26px}}
  .bio{{font-size:17px;line-height:1.62;color:#2f2f2f;margin:0 0 34px;max-width:48ch}}
  .actions{{display:flex;gap:14px;flex-wrap:wrap}}
  .btn{{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:.04em;transition:transform .2s ease}}
  .btn:hover{{transform:translateY(-2px)}}
  .btn-primary{{background:var(--ink);color:var(--lime)}}
  .btn-ghost{{background:var(--surface);color:var(--ink)}}
  footer.site{{border-top:1px solid #ececec;padding:48px max(20px,5vw) 30px;color:var(--muted);font-size:14px}}
  .foot-top{{display:flex;justify-content:space-between;gap:40px;flex-wrap:wrap;max-width:1080px;margin:0 auto;padding-bottom:30px}}
  .foot-brand{{max-width:400px}}
  .foot-brand .brand{{margin-bottom:14px}}
  .foot-brand p{{margin:0;line-height:1.55;font-size:14px}}
  .foot-links{{display:flex;flex-direction:column;gap:12px}}
  .foot-links a{{color:#2f2f2f;text-decoration:none}}
  .foot-links a:hover{{color:var(--ink)}}
  .foot-bottom{{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;max-width:1080px;margin:0 auto;padding-top:22px;border-top:1px solid #ececec;font-size:13px}}
  @media(max-width:860px){{.nav{{display:none}}}}
  @media(max-width:760px){{main.profile{{grid-template-columns:1fr;gap:30px;padding-top:8px}}.photo{{max-width:380px}}}}
</style>
</head>
<body>
<header class="site">
  <a class="brand" href="/"><img src="/favicon.svg" alt=""> Cognis</a>
  <nav class="nav">{nav_links}</nav>
  <a class="nav-cta" href="/contact">Work With Us</a>
</header>
<main class="profile">
  <div class="photo"><img src="{img_path}" alt="{name}, {role_text}"></div>
  <div>
    <p class="eyebrow">Team</p>
    <h1>{name}</h1>
    <p class="role">{role_html}</p>
    <p class="bio">{bio_html}</p>
    <div class="actions">
      <a class="btn btn-primary" href="/contact">Contact us →</a>
      <a class="btn btn-ghost" href="/about-us">Back to team</a>
    </div>
  </div>
</main>
<footer class="site">
  <div class="foot-top">
    <div class="foot-brand">
      <a class="brand" href="/"><img src="/favicon.svg" alt=""> Cognis</a>
      <p>Cognis Group is more than an advisory firm — we build, deploy, and govern AI systems that permanently transform organizations.</p>
    </div>
    <nav class="foot-links">{foot_links}</nav>
  </div>
  <div class="foot-bottom"><span>© Cognis Group</span><span>Quod Tango Muto — what we touch, we change.</span></div>
</footer>
</body>
</html>
"""


def main() -> None:
    nav_links = "".join(f'<a href="{h}">{html.escape(t)}</a>' for t, h in NAV)
    foot_links = "".join(f'<a href="{h}">{html.escape(t)}</a>' for t, h in FOOT)
    for m in MEMBERS:
        page = TEMPLATE.format(
            name=html.escape(m["name"]),
            role_text=html.escape(m["role"]),
            role_html=html.escape(m["role"]),
            bio_html=html.escape(m["bio"]),
            slug=m["slug"],
            img_path=m["img"],
            nav_links=nav_links,
            foot_links=foot_links,
        )
        out = ROOT / "teams" / m["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page)
        print(f"  wrote {out.relative_to(ROOT)}")
    print(f"{len(MEMBERS)} profile pages generated")


if __name__ == "__main__":
    main()
