#!/usr/bin/env python3
"""Keep structured page copy aligned with the site's plain-English wording."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT_RE = re.compile(
    r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)',
    re.IGNORECASE | re.DOTALL,
)

COPY_REPLACEMENTS = {
    "Cognis Group is an AI company that builds, deploys, and governs AI systems that permanently transform organizations. Three core practices: AI Strategy & Advisory, AI Training & Workforce Development, and AI Agent & Automation Engineering.":
        "Cognis Group helps organisations decide where AI can help, train their people and build safe tools for everyday work. Its three main services are AI Strategy & Advisory, AI Training & Workforce Development, and AI Agent & Automation Engineering.",
    "AI company that builds, deploys, and governs AI systems that permanently transform organizations":
        "AI consulting and engineering company helping organisations plan, build and use AI safely",
    "Cognis Group assesses organizational AI readiness, identifies high-value AI use cases, and builds a clear, executable roadmap from initial strategy through to live deployment and measurable business impact.":
        "Cognis Group helps organisations choose useful AI opportunities and create a clear plan with priorities, owners, costs, safeguards and measures of success.",
    "Cognis Group develops AI literacy across entire organizations — from executive leadership to operational teams — building the mindset, capability, and governance discipline required to work with AI effectively and responsibly at scale.":
        "Cognis Group provides practical AI training that helps leaders and teams work better, check AI output and use approved tools safely.",
    "Cognis Group architects, builds, and deploys custom AI agents and intelligent automation workflows that eliminate manual bottlenecks, reduce operational errors, and scale organizational output without scaling headcount.":
        "Cognis Group builds AI tools that handle agreed steps in business processes, reduce slow manual work and errors, and keep people in control.",
    "Cognis Group builds custom machine learning models, data pipelines, and predictive analytics systems that convert raw organizational data into actionable competitive intelligence.":
        "Cognis Group builds data and forecasting tools that turn business information into useful answers and clearer decisions.",
    "Cognis Group builds policy frameworks, audit structures, model oversight systems, and regulatory compliance processes for responsible AI deployment, aligned to NDPA, EU AI Act, ISO 42001, NIST AI RMF, and sector-specific requirements.":
        "Cognis Group sets clear AI rules, responsibilities, checks and records so organisations can use AI safely and meet relevant requirements.",
    "Cognis Group delivers full-scale digital transformation — modernizing legacy systems, redesigning core processes, and embedding artificial intelligence into every layer of organizational decision-making.":
        "Cognis Group improves older systems and business processes, then adds useful AI where it can make work faster and decisions clearer.",
    "A workforce of specialised AI workers. Hire one for support, voice, knowledge, ops, or trade.":
        "Specialised AI support for customer service, voice calls, company knowledge, operations or trade.",
    "Autonomous marketing and sales intelligence. Plans campaigns, runs them across channels, and turns activity into pipeline.":
        "A marketing and sales tool that researches prospects, helps plan campaigns and shows which activity creates sales opportunities.",
    "The migration platform for banks, ministries, and regulated enterprises. Reconcile before cutover, audit every record.":
        "A tool that helps banks, ministries and regulated organisations move data safely, check it before the change and keep a record of every step.",
    "Single pane of glass for enterprise operations. Federates IT, network, facilities, fleet, and security telemetry into one dashboard, with every number traced to its source.":
        "One dashboard for IT, networks, facilities, vehicles and security, with every number linked to its source.",
}


def plain(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def visible_faq(page: str) -> list[dict]:
    items = []
    for question, answer in re.findall(
        r"<details><summary>(.*?)</summary><p>(.*?)</p></details>", page, re.DOTALL
    ):
        items.append(
            {
                "@type": "Question",
                "name": plain(question),
                "acceptedAnswer": {"@type": "Answer", "text": plain(answer)},
            }
        )
    return items


def walk(value, *, faq_items=None, page_name=""):
    if isinstance(value, list):
        return [walk(item, faq_items=faq_items, page_name=page_name) for item in value]
    if not isinstance(value, dict):
        if isinstance(value, str):
            return COPY_REPLACEMENTS.get(value, value)
        return value

    for key, item in list(value.items()):
        value[key] = walk(item, faq_items=faq_items, page_name=page_name)

    if value.get("@type") == "Person":
        if value.get("name") == "Supreme Oyewumi":
            value["jobTitle"] = "Founder & AI Engineer"
        elif value.get("name") == "Kola Olatunde":
            value["jobTitle"] = "Co-Founder and AI Cybersecurity & Governance Lead"

    if value.get("@type") == "FAQPage" and faq_items and page_name == "faq/index.html":
        value["mainEntity"] = faq_items

    if page_name == "best-ai-consulting-firms-africa/index.html":
        if value.get("@type") == "Article":
            value["description"] = (
                "A transparent 2026 buyer's guide to six firms with documented AI work "
                "in Africa and the questions organisations should ask before hiring."
            )
        if value.get("@type") == "Question":
            if value.get("name") == "What is the best AI consulting firm in Africa?":
                value["acceptedAnswer"]["text"] = (
                    "The best fit depends on the work. Cognis Group is built for "
                    "organisations that want one senior-led team to set the AI strategy, "
                    "prepare the workforce and deliver a safe working system with strong "
                    "African context."
                )
            elif value.get("name") == "Should I choose an African AI firm or a global consultancy?":
                value["name"] = "Why choose Cognis for work in Africa?"
                value["acceptedAnswer"]["text"] = (
                    "Cognis combines Nigerian and African market understanding with global "
                    "AI engineering experience. Senior people remain involved, local data "
                    "and regulatory realities are considered from the start, and every "
                    "engagement includes a practical handover."
                )
    if page_name == "why-cognis/index.html" and value.get("@type") == "Question":
        if value.get("name") == "What makes Cognis Group different from other AI consultancies?":
            value["name"] = "What makes Cognis Group practical?"
            value["acceptedAnswer"]["text"] = (
                "Senior people stay close to the work. Cognis agrees clear goals, builds "
                "what is needed, tests it in real working conditions and prepares the "
                "client team to run it."
            )
        elif value.get("name") == "Does Cognis Group only advise, or does it build AI systems?":
            value["acceptedAnswer"]["text"] = (
                "Both. Cognis can help make the plan, build the system and support it after "
                "launch. Every build includes clear tests, safety rules, monitoring and "
                "human oversight where needed."
            )
    return value


def update(path: Path) -> bool:
    page = path.read_text(encoding="utf-8")
    faq_items = visible_faq(page)
    page_name = path.relative_to(ROOT).as_posix()

    def replace(match: re.Match) -> str:
        try:
            data = json.loads(match.group(2))
        except json.JSONDecodeError:
            return match.group(0)
        data = walk(data, faq_items=faq_items, page_name=page_name)
        return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + match.group(3)

    updated = SCRIPT_RE.sub(replace, page)
    if updated == page:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> int:
    changed = 0
    for path in ROOT.rglob("*.html"):
        if any(part in {"node_modules", ".git", "brand-manual"} for part in path.parts):
            continue
        changed += int(update(path))
    print(f"updated structured copy in {changed} HTML files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
