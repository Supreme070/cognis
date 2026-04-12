#!/usr/bin/env python3
"""
Rewrite .framercms chunks with Cognis Group copy.

Approach: for each (old, new) pair, scan for the UTF-8 bytes of `old` in the
chunk; verify the u32 BE at `idx-4` equals len(old) (proves this is a real
length-prefixed value, not a substring match inside a larger blob); then
splice in new bytes + new length prefix. File grows/shrinks naturally.

Verified safe against Framer CMS binary format:
- Header (u32 item_count + u16 field_count) does not depend on total size
- Records are self-describing (length-prefixed), so size changes in earlier
  records don't shift offsets that later records care about
- Any remaining 0x0d reference tags (partially decoded) use 16-byte fixed
  payload, not byte offsets
"""
import struct
import pathlib
import shutil
import sys

RAW = pathlib.Path("cms-raw")
OUT = pathlib.Path("cognis-cms")
OUT.mkdir(exist_ok=True)


def rewrite(in_path: pathlib.Path, out_path: pathlib.Path, replacements: dict) -> int:
    data = bytearray(in_path.read_bytes())
    total = 0
    seen_once = set()
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
                total += 1
                seen_once.add(old)
                i = idx + len(new_b)
            else:
                i = idx + 1
    out_path.write_bytes(bytes(data))
    missing = [k for k in replacements if k not in seen_once and k.encode("utf-8") != replacements[k].encode("utf-8")]
    if missing:
        print(f"  WARNING: {len(missing)} strings were not found in {in_path.name}:")
        for k in missing[:5]:
            print(f"    not found: {k!r}")
    return total


# =============================================================================
# SERVICES — 3 Cognis practice areas (AI Strategy, Agent/Automation Eng, ML/Data)
# =============================================================================
#
# Original schema (3 items × 25 fields): per item:
#   id, createdAt, updatedAt, nextItemId/previousItemId, plus ~19 content fields:
#   title, slug, short_blurb, long_desc, image_json,
#   benefit_heading, benefit_body,
#   5 x (benefit_item_title, benefit_item_body),
#   image2_json, testimonial_quote, testimonial_author, testimonial_image, testimonial_company
#
# We rewrite service metadata + our own Cognis copy. Image JSON blobs are left
# untouched — they still point at framerusercontent.com and our fetch monkey-
# patch will redirect them to /framer-runtime/images/.

SERVICES = {
    # --- Item 0: AI Strategy -> AI Strategy & Advisory ---
    "AI Strategy": "AI Strategy & Advisory",
    "ai-strategy": "ai-strategy-advisory",
    "We help you find chances for AI use and put the tools into your business.":
        "We assess organizational AI readiness, identify high-value use cases, and build a clear, executable roadmap from strategy through to deployment and measurable impact.",
    "We help organizations understand where AI creates the most impact and how to adopt it effectively. "
    "Through strategic analysis, opportunity mapping, and technology guidance, we design a step-by-step plan that aligns intelligence with your business goals — ensuring clarity, feasibility, and long-term value.":
        "We assess organizational AI readiness, identify high-value use cases, and build a clear, executable roadmap from initial strategy through to live deployment and measurable business impact. Every engagement leaves you with the plan, the people, and the governance to execute it — long after we are gone.",
    "The Benefits of a Solid AI Strategy": "What a Cognis AI Strategy engagement delivers",
    "A well-defined AI strategy gives your organization clarity, direction, and measurable impact on your operations and future growth.":
        "A defensible roadmap, production-first delivery, internal capability transfer, and governance built in from day one.",

    "Clear Direction for AI Adoption": "Readiness Assessment",
    "Gain a structured, step-by-step roadmap that removes uncertainty and helps you adopt AI with confidence and purpose.":
        "We map your data, skills, tooling and organizational appetite against the AI use cases that will actually move your numbers.",

    "Reduced Operational Costs": "Executable Roadmap",
    "Identify and automate costly manual processes, freeing up resources and maximizing efficiency across departments.":
        "A prioritised, phase-by-phase roadmap ranking every candidate use case by value, feasibility and risk — specific to your business.",

    "Sustainable Competitive Edge": "Production-First Delivery",
    "Move beyond pilot projects to implement scalable AI solutions that differentiate your brand and boost market responsiveness.":
        "Every engagement ships at least one workflow into real production. We measure success by deployment, not decks.",

    "Enhanced Data Governance": "Governance From Day One",
    "Establish frameworks to ensure AI deployment is ethical, compliant, and secure from day one.":
        "Policy frameworks, audit structures and model oversight aligned with EU AI Act, AU Continental AI Strategy and sector-specific requirements — built in, not bolted on.",

    '"They brought clarity to complex problems, breaking down barriers and delivering innovative AI solutions."':
        '"Quod Tango Muto — what we touch, we change. Every engagement leaves you permanently more capable."',
    "Elara Vance": "Cognis Group",
    "Aura Insights": "Lagos, Nigeria",

    # --- Item 1: Business Consulting -> AI Training & Workforce Development ---
    "Business Consulting": "AI Training & Workforce Development",
    "business-consulting": "ai-training-workforce-development",
    "We lead your change with smart plans, pushing growth and making work simple.":
        "We develop AI literacy across your organization — executives to operators — building the mindset, capability and discipline to work with AI effectively at scale.",
    "Effective business consulting is the catalyst for profound and lasting change, optimizing every aspect of your organization for peak performance.":
        "We develop AI literacy across your entire organization — from executive leadership to operational teams — building the mindset, capability, and governance discipline required to work with AI effectively and responsibly at scale. We do not teach tools. We change how your people think.",
    "The Benefits of Business Consulting": "What a Cognis AI Training engagement delivers",
    "Optimized Operational Efficiency": "Executive Enablement",
    "Streamline core processes by eliminating bottlenecks and leveraging technology for faster service delivery, increasing operational performance.":
        "Workshops and advisory sessions that give your leadership team the vocabulary, judgment and strategic framing to make confident AI decisions.",
    "Strategic Market Positioning Now": "Operational Team Training",
    "Define a strong market strategy that captures new revenue streams and solidifies brand loyalty through competitive clarity fast.":
        "Role-specific, hands-on training that equips your operators with the skills to actually use AI tools in the flow of their daily work.",
    "Advanced Data-Driven Decisions": "Governance Discipline",
    "Shift from intuition to deep insight by establishing governance and analytical tools backed by solid, verifiable data immediately.":
        "Institutionalised responsible AI practices — from prompt hygiene to data handling to approval gates — so scale does not come at the cost of control.",
    "Enhanced Organizational Agility": "Measured Outcomes",
    "Develop a truly flexible structure ready to adapt quickly to market shifts and technological disruptions easily and fast.":
        "Every training programme ships with a measurement plan: capability baselines, post-training assessments, and productivity metrics tracked over months.",

    '"The team brought fresh perspectives, breaking down barriers and delivering innovative solutions for growth."':
        '"After the Cognis training, our people do not just use AI — they think differently. That is the permanent change."',
    "Darius Jones": "Cognis Group",
    "Vantage Tech": "Lagos, Nigeria",

    # --- Item 2: Data & Insights -> AI Agent & Automation Engineering ---
    "Data & Insights": "AI Agent & Automation Engineering",
    "data-insights": "ai-agent-automation-engineering",
    "We turn your raw data into clear value using solid rules and great models.":
        "We architect, build and deploy custom AI agents and intelligent automation workflows that eliminate manual bottlenecks and scale your output without scaling your headcount.",
    "Data is your most valuable asset. We build the data architecture, machine learning models, and visualization layers needed to extract deep, meaningful insights. From data warehousing to advanced predictive analytics, we ensure your data ecosystem is reliable, scalable, and directly tied to business outcomes.":
        "We architect, build, and deploy production-ready AI agents and automated workflows that eliminate manual processes, reduce operational errors, and scale organizational capacity — without adding headcount. Agents amplify people. They do not replace them.",
    "The Benefits of Powering Data & Insights": "What a Cognis Agent engagement delivers",
    "Harnessing your data correctly transforms it from simple information storage into a powerful engine for innovation and competitive edge.":
        "Production workflows, stack-native integrations, human-in-the-loop control, and measurable hours saved — not another chatbot pilot.",
    "Discover New Opportunities Now": "Production Workflows",
    "Utilize advanced analytics to spot patterns in customer behavior and demand forecasting previously invisible to your key internal teams.":
        "Every agent we build goes to production. From intake-to-invoice, KYC, document extraction, and customer ops — we ship agents that handle the work your team has been dreading.",
    "Centralized Data Reliability Fast": "Stack-Native Integration",
    "Implement unified data architecture to eliminate data silos for a single, accurate source of truth immediately.":
        "Agents integrate with the tools you already run — Microsoft, Google Workspace, Salesforce, HubSpot, local banking APIs. No rip-and-replace.",
    "Advanced Predictive Forecasting": "Human-in-the-Loop Review",
    "Move beyond retrospective reporting to forecasting future market trends, allowing for proactive and effective risk management early.":
        "Every agent has review gates, audit logs and rollback paths. Your operators stay in control — the agent does the work, your people approve the outcome.",
    "Enhanced User Personalization": "Measured in Hours Saved",
    "Use granular insights to tailor product offerings and service interactions, greatly boosting customer lifetime value now.":
        "Every automation ships with a measurement plan. You see the hours returned, the errors avoided, the throughput gained — in numbers, not promises.",

    '"Their data platform transformed our raw data into real-time, actionable insights, dramatically improving our marketing efficiency."':
        '"We do not replace people with AI — we make people extraordinary with AI. That is the whole point of what Cognis does."',
    "Mark Rilley": "Cognis Group",
    "Nexus Corp.": "Lagos, Nigeria",
}


# =============================================================================
# BLOG — 6 posts. For launch we keep the existing template blog text since we
# have no Cognis content written yet. We rename them to neutral AI-business
# titles that could plausibly be Cognis-authored.
# Actually: leave unchanged for now; the nav link renames Blog -> Insights and
# the section will be repurposed/hidden later.
# =============================================================================
BLOG = {}


# =============================================================================
# PLANS — 3 pricing tiers. The plan deletes the Pricing section from the HTML
# (Step 5 of original plan). The CMS chunk will still be fetched at runtime
# but will not be rendered (the section is gone). No rewrite needed.
# =============================================================================
PLANS = {}


# =============================================================================
# MAIN
# =============================================================================
def run():
    jobs = [
        ("QSCEvOCzd-chunk-default-0.framercms",   "services-chunk.framercms",   SERVICES),
        ("QSCEvOCzd-indexes-default-0.framercms", "services-indexes.framercms", SERVICES),
        ("rAjl8lYSc-chunk-default-0.framercms",   "blog-chunk.framercms",       BLOG),
        ("rAjl8lYSc-indexes-default-0.framercms", "blog-indexes.framercms",     BLOG),
        ("csw22u1fM-chunk-default-0.framercms",   "plans-chunk.framercms",      PLANS),
    ]
    for src, dst, reps in jobs:
        src_path = RAW / src
        dst_path = OUT / dst
        if not src_path.exists():
            print(f"SKIP {src} (not mirrored)")
            continue
        if not reps:
            shutil.copyfile(src_path, dst_path)
            print(f"COPY {src} -> {dst} (no replacements)")
            continue
        total = rewrite(src_path, dst_path, reps)
        before = src_path.stat().st_size
        after = dst_path.stat().st_size
        print(f"WROTE {src} -> {dst}: {total} replacements, {before} -> {after} bytes ({after - before:+d})")

if __name__ == "__main__":
    run()
