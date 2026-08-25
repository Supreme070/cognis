#!/usr/bin/env python3
"""Final 2026 SEO/GEO integrity pass for prerendered Cognis HTML.

Keeps visible content, metadata, authorship, dates, internal discovery and
JSON-LD aligned after the Framer snapshots and standalone shells are built.
Idempotent: every additive block has a stable marker.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = "https://cognis.group"

BLOG = {
    "why-most-enterprise-ai-strategies-fail-before-they-start": ("Supreme Oyewumi", "Founder & AI Engineer", "2026-03-18", "2026-07-24"),
    "building-ai-agents-that-actually-ship": ("Supreme Oyewumi", "Founder & AI Engineer", "2026-03-25", "2026-07-24"),
    "ai-governance-is-not-optional": ("Kola Olatunde", "AI Cybersecurity & Governance Lead", "2026-04-01", "2026-07-24"),
    "the-real-roi-of-ai": ("Supreme Oyewumi", "Founder & AI Engineer", "2026-04-03", "2026-07-24"),
    "making-your-workforce-ai-ready": ("Fisayo Oludare", "Executive Director, Partnerships & AI Enablement", "2026-04-06", "2026-07-24"),
    "ai-native-operations-for-african-enterprises": ("Supreme Oyewumi", "Founder & AI Engineer", "2026-04-08", "2026-07-24"),
}

CASE_NOTES = {
    "marketsage": (
        "Evidence note — updated 24 July 2026",
        "MarketSage is a Cognis-owned product, so this is an internal build record rather than independent client validation. "
        "The 14-week period runs from approved scope to internal v1; latency and citation checks refer to the evaluation conditions described above.",
    ),
    "claims-processing-automation": (
        "Evidence note — updated 24 July 2026",
        "The client is withheld under confidentiality. Results compare the pre-deployment operating baseline with the supervised-production period described above; "
        "1,200 historical claims were used for evaluation. Percentages are client-reported operational measures, not industry benchmarks.",
    ),
    "ai-training-programme": (
        "Evidence note — updated 24 July 2026",
        "The client is withheld under confidentiality. Coverage counts completed learners across the stated cohorts; assessment improvement compares the programme's "
        "pre- and post-training instruments. Article 4 refers to documented AI-literacy measures, not a claim of regulator certification.",
    ),
}

EVIDENCE_STYLE = """<!-- cognis-evidence-style:start -->
<style data-cognis-evidence-style>
  .cognis-evidence-note{max-width:860px;margin:40px auto 72px;padding:24px;border:1px solid #e6e6e6;border-radius:14px;background:#fff;font:14px/1.65 Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#4a4a4a}
  .cognis-evidence-note strong{display:block;margin-bottom:6px;color:#131313;font-size:13px;letter-spacing:.02em}
  .cognis-evidence-note a{color:#131313;text-decoration:underline;text-underline-offset:3px}
</style>
<!-- cognis-evidence-style:end -->"""


def replace_meta(html: str, key: str, value: str, *, prop: bool = False) -> str:
    attr = "property" if prop else "name"
    tag = f'<meta {attr}="{key}" content="{value}" />'
    pattern = rf'<meta\s+{attr}=["\']{re.escape(key)}["\'][^>]*>'
    if re.search(pattern, html, flags=re.I):
        return re.sub(pattern, tag, html, count=1, flags=re.I)
    return html.replace("</head>", f"{tag}\n</head>", 1)


def remove_irrelevant_homepage_node(doc: object, is_home: bool) -> object:
    if is_home or not isinstance(doc, dict):
        return doc
    graph = doc.get("@graph")
    if isinstance(graph, list):
        doc["@graph"] = [
            node for node in graph
            if not (
                isinstance(node, dict)
                and node.get("@type") == "WebPage"
                and node.get("@id") == f"{ORIGIN}/#webpage"
            )
        ]
    return doc


def rewrite_jsonld(html: str, rel: str) -> str:
    is_home = rel == "index.html"
    blog_slug = rel.split("/")[1] if rel.startswith("blog/") and rel.count("/") == 2 else None
    team_slug = rel.split("/")[1] if rel.startswith("teams/") and rel.count("/") == 2 else None

    def replace(match: re.Match[str]) -> str:
        opening, raw, closing = match.groups()
        try:
            doc = json.loads(raw)
        except json.JSONDecodeError:
            return match.group(0)
        doc = remove_irrelevant_homepage_node(doc, is_home)
        graph = doc.get("@graph") if isinstance(doc, dict) else None
        if isinstance(graph, list):
            for node in graph:
                if not isinstance(node, dict):
                    continue
                if node.get("@type") == "Organization" and node.get("@id") == f"{ORIGIN}/#organization":
                    node["founder"] = [
                        {"@type": "Person", "@id": f"{ORIGIN}/teams/supreme-oyewumi/#person", "name": "Supreme Oyewumi"},
                        {"@type": "Person", "@id": f"{ORIGIN}/teams/kola-olatunde/#person", "name": "Kola Olatunde"},
                    ]
                if node.get("@type") == "Person" and node.get("name") == "Fisayo Oludare":
                    node["jobTitle"] = "Executive Director, Partnerships & AI Enablement"
                    node["url"] = f"{ORIGIN}/teams/fisayo-oludare/"
        if isinstance(graph, list) and blog_slug in BLOG:
            author_name, role, published, modified = BLOG[blog_slug]
            author_slug = {
                "Supreme Oyewumi": "supreme-oyewumi",
                "Kola Olatunde": "kola-olatunde",
                "Fisayo Oludare": "fisayo-oludare",
            }[author_name]
            person_id = f"{ORIGIN}/teams/{author_slug}/#person"
            page_id = f"{ORIGIN}/blog/{blog_slug}/#webpage"
            for node in graph:
                if not isinstance(node, dict):
                    continue
                if node.get("@type") == "BlogPosting" and node.get("url", "").rstrip("/").endswith(blog_slug):
                    node["author"] = {
                        "@type": "Person", "@id": person_id, "name": author_name,
                        "jobTitle": role, "url": f"{ORIGIN}/teams/{author_slug}/",
                        "worksFor": {"@id": f"{ORIGIN}/#organization"},
                    }
                    node["datePublished"] = published
                    node["dateModified"] = modified
                    node["mainEntityOfPage"] = {"@id": page_id}
                    node.pop("breadcrumb", None)
                if node.get("@type") == "WebPage" and blog_slug in node.get("url", ""):
                    node["@id"] = page_id
            if not any(isinstance(n, dict) and n.get("@id") == page_id for n in graph):
                graph.append({
                    "@type": "WebPage", "@id": page_id,
                    "url": f"{ORIGIN}/blog/{blog_slug}/", "name": blog_slug.replace("-", " ").title(),
                    "isPartOf": {"@id": f"{ORIGIN}/#website"},
                })
            if any(isinstance(n, dict) and n.get("@type") == "BlogPosting" for n in graph) and not any(
                isinstance(n, dict) and n.get("@type") == "BreadcrumbList" for n in graph
            ):
                graph.append({
                    "@type": "BreadcrumbList", "@id": f"{ORIGIN}/blog/{blog_slug}/#breadcrumb",
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{ORIGIN}/"},
                        {"@type": "ListItem", "position": 2, "name": "Insights", "item": f"{ORIGIN}/blog/"},
                        {"@type": "ListItem", "position": 3, "name": blog_slug.replace("-", " ").title(), "item": f"{ORIGIN}/blog/{blog_slug}/"},
                    ],
                })
        if isinstance(graph, list) and team_slug in {"kola-olatunde", "supreme-oyewumi"}:
            target_name = "Kola Olatunde" if team_slug == "kola-olatunde" else "Supreme Oyewumi"
            person_id = f"{ORIGIN}/teams/{team_slug}/#person"
            for node in graph:
                if not isinstance(node, dict):
                    continue
                if node.get("@type") == "Person" and node.get("name") == target_name:
                    node["@id"] = person_id
                    node["url"] = f"{ORIGIN}/teams/{team_slug}/"
                if node.get("@type") == "ProfilePage":
                    node["mainEntity"] = {"@id": person_id}
        if isinstance(graph, list) and rel == "faq/index.html" and not any(
            isinstance(node, dict) and node.get("@type") == "BreadcrumbList" for node in graph
        ):
            graph.append({
                "@type": "BreadcrumbList", "@id": f"{ORIGIN}/faq/#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{ORIGIN}/"},
                    {"@type": "ListItem", "position": 2, "name": "Frequently Asked Questions", "item": f"{ORIGIN}/faq/"},
                ],
            })
        return opening + json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + closing

    return re.sub(
        r'(<script[^>]+type=["\']application/ld\+json["\'][^>]*>)([\s\S]*?)(</script>)',
        replace,
        html,
        flags=re.I,
    )


def add_case_note(html: str, slug: str) -> str:
    html = re.sub(r'<!-- cognis-evidence-note:start -->[\s\S]*?<!-- cognis-evidence-note:end -->\s*', "", html)
    title, text = CASE_NOTES[slug]
    block = (
        '<!-- cognis-evidence-note:start -->\n'
        f'<aside class="cognis-evidence-note"><strong>{title}</strong>{text}</aside>\n'
        '<!-- cognis-evidence-note:end -->\n'
    )
    if "cognis-evidence-style:start" not in html:
        html = html.replace("</head>", EVIDENCE_STYLE + "\n</head>", 1)
    return html.replace("<footer", block + "<footer", 1)


def add_case_card_link(html: str, heading: str, href: str, label: str) -> str:
    marker = f'data-cognis-card-link="{href}"'
    if marker in html:
        return html
    pos = html.find(heading)
    if pos < 0:
        return html
    start = html.rfind('<div data-dc-tpl="88"', 0, pos)
    end = html.find(">", start)
    if start < 0 or end < 0:
        return html
    opening = html[start:end + 1]
    if "position: relative" not in opening:
        opening = opening.replace("style=\"", 'style="position: relative; ', 1)
    overlay = (
        f'<a href="{href}" {marker} aria-label="{label}" '
        'style="position:absolute;inset:0;z-index:2;border-radius:inherit"></a>'
    )
    return html[:start] + opening + overlay + html[end + 1:]


def improve_research(html: str) -> str:
    html = html.replace(
        "projected African AI market by 2030, from $4.5B in 2025 — 27.4% CAGR (Mastercard, 2025)",
        'projected African AI market by 2030; Mastercard reports a 27.42% CAGR (<a href="https://www.mastercard.com/news/media/ue4fmcc5/mastercard-ai-in-africa-2025.pdf" style="color:inherit;text-decoration:underline">Mastercard, 2025</a>)',
    )
    html = html.replace(
        "Africa’s AI market is projected to grow from $4.51 billion in 2025 to $16.53 billion by 2030 — a 27.4% compound annual growth rate (Mastercard, 2025).",
        'Mastercard projects Africa’s AI market will reach $16.53 billion by 2030 and reports a 27.42% compound annual growth rate in its <a href="https://www.mastercard.com/news/media/ue4fmcc5/mastercard-ai-in-africa-2025.pdf" style="text-decoration:underline">2025 AI in Africa analysis</a>.',
    )
    old_sources = re.compile(r'Mastercard, “AI in Africa” market analysis \(2025\)[\s\S]*?Cognis Group client deployment data \(2024–2026\)\.')
    sources = (
        '<strong>Method.</strong> Desk research completed July 2026. We prioritised original reports and kept each publisher’s population, geography, and definition intact; global, population-level, and enterprise survey rates are not directly comparable. Cognis delivery ranges are directional observations from anonymised engagements, not a statistically representative African sample.<br><br>'
        '<strong>Primary sources.</strong> '
        '<a href="https://www.mastercard.com/news/media/ue4fmcc5/mastercard-ai-in-africa-2025.pdf" style="text-decoration:underline">Mastercard, AI in Africa 2025</a> · '
        '<a href="https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/gsma_resources/ai-for-africa-use-cases-delivering-impact/" style="text-decoration:underline">GSMA, AI for Africa</a> · '
        '<a href="https://www.afdb.org/en/news-and-events/press-releases/africas-ai-revolution-african-development-bank-report-projects-1-trillion-additional-gdp-2035-use-ai-enhance-productivity-89619" style="text-decoration:underline">African Development Bank, Africa’s AI productivity gain</a> · '
        '<a href="https://www.microsoft.com/en-us/corporate-responsibility/topics/AI-Economy-Institute/reports/Global-AI-Adoption-2025/" style="text-decoration:underline">Microsoft AI Diffusion Report 2025</a> · '
        '<a href="https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai" style="text-decoration:underline">McKinsey, State of AI</a> · '
        '<a href="https://www.spglobal.com/market-intelligence/en/news-insights/research/ai-experiences-rapid-adoption-but-with-mixed-outcomes-highlights-from-vote-ai-machine-learning" style="text-decoration:underline">S&amp;P Global, AI &amp; ML Use Cases 2025</a>.'
    )
    return old_sources.sub(sources, html, count=1)


def improve_buyer_guide(html: str) -> str:
    html = html.replace("Cognis Group leads the field.", "Cognis Group is best suited to this specific brief.")
    html = html.replace(
        "Published by Cognis Group: we are on this list, so judge our inclusion by the same questions we give you below.",
        "Published by Cognis Group: we are on this list, so judge our inclusion by the same questions below. Method: firms were grouped by publicly documented African operations, primary capability, production evidence, and buyer fit; this is a job-to-be-done guide, not an independent league table.",
    )
    html = html.replace('"itemListOrder": "https://schema.org/ItemListUnordered"', '"itemListOrder": "https://schema.org/ItemListOrderAscending"')
    return html


def process(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    original = path.read_text(encoding="utf-8")
    html = original

    if rel == "404.html":
        html = re.sub(r'\s*<link[^>]+rel=["\']canonical["\'][^>]*>', "", html, count=1, flags=re.I)

    if rel.startswith("our-services/") and rel.count("/") == 2:
        html = re.sub(r'href=["\']\./([^"\']*)["\']', lambda m: f'href="/{m.group(1)}"', html)
        html = html.replace('href="./"', 'href="/"')

    if rel.startswith("blog/") and rel.count("/") == 2:
        slug = rel.split("/")[1]
        if slug in BLOG:
            author, _role, published, modified = BLOG[slug]
            html = replace_meta(html, "author", author)
            html = replace_meta(html, "og:type", "article", prop=True)
            html = replace_meta(html, "article:published_time", published, prop=True)
            html = replace_meta(html, "article:modified_time", modified, prop=True)
            html = replace_meta(html, "article:author", author, prop=True)
            html = re.sub(r'(<p class="lf-byline">By <a)(?![^>]*\brel=)', r'\1 rel="author"', html, count=1)

    if rel == "blog/index.html":
        html = html.replace('"dateModified":"2026-04-10"', '"dateModified":"2026-07-24"')

    if rel == "faq/index.html":
        html = html.replace(
            "Three are live: Cognis AI, a workforce of specialised AI workers you hire for support, voice, knowledge, ops, or trade (ai.cognis.group); MarketSage, autonomous marketing and sales intelligence that plans campaigns, runs them across channels, and turns activity into pipeline (marketsage.africa); and Migratio, a data-migration platform for banks, ministries, and regulated enterprises (migratio.cognis.group). A fourth, SPOG, is in development.",
            "Four are live: Cognis AI, a workforce of specialised AI workers for support, voice, knowledge, ops, or trade (ai.cognis.group); MarketSage, autonomous marketing and sales intelligence (marketsage.africa); Migratio, data migration for regulated enterprises (migratio.cognis.group); and SPOG, a single pane of glass for enterprise operations (spog.cognis.group).",
        )
        html = html.replace(
            'Three are live — <a href="/products/">Cognis AI</a> (a workforce of specialised AI workers for support, voice, knowledge, ops, or trade), <a href="https://www.marketsage.africa">MarketSage</a> (autonomous marketing and sales intelligence), and <a href="https://migratio.cognis.group">Migratio</a> (a data-migration platform for banks, ministries, and regulated enterprises) — with a fourth, SPOG, in development.',
            'Four are live — <a href="https://ai.cognis.group">Cognis AI</a> (specialised AI workers), <a href="https://www.marketsage.africa">MarketSage</a> (marketing and sales intelligence), <a href="https://migratio.cognis.group">Migratio</a> (regulated data migration), and <a href="https://spog.cognis.group">SPOG</a> (a single pane of glass for enterprise operations).',
        )

    if rel == "teams/supreme-oyewumi/index.html":
        html = html.replace(">AI Engineer<", ">Founder &amp; AI Engineer<")

    if rel == "case-studies/index.html":
        html = html.replace('href="/contact/" data-h="h2"', 'href="/case-studies/marketsage/" data-h="h2"', 1)
        html = add_case_card_link(html, "Claims processing: from 14 days to under 48 hours", "/case-studies/claims-processing-automation/", "Read the claims-processing case study")
        html = add_case_card_link(html, "AI training: 6 months of capability in 6 weeks", "/case-studies/ai-training-programme/", "Read the AI-training case study")

    if rel.startswith("case-studies/") and rel.count("/") == 2:
        slug = rel.split("/")[1]
        if slug in CASE_NOTES:
            html = add_case_note(html, slug)

    if rel == "research/state-of-ai-african-enterprises-2026/index.html":
        html = improve_research(html)
    if rel == "best-ai-consulting-firms-africa/index.html":
        html = improve_buyer_guide(html)

    html = rewrite_jsonld(html, rel)
    if html != original:
        path.write_text(html, encoding="utf-8")
        return True
    return False


def main() -> int:
    paths = [ROOT / "index.html", ROOT / "404.html"]
    paths.extend(sorted(p for p in ROOT.glob("**/index.html") if "node_modules" not in p.parts and "brand-manual" not in p.parts))
    changed = sum(process(path) for path in dict.fromkeys(paths) if path.exists())
    print(f"{changed}/{len(dict.fromkeys(paths))} HTML files updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
