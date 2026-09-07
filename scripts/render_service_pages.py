#!/usr/bin/env python3
"""Render the three service detail pages as static HTML matching the Framer design.

One template, three pages. Per-page copy lives in SERVICES below; the long-form
article (+ FAQ schema), the page's structured data and its <head> metadata were
carried over verbatim from the Framer pages into scripts/service_pages/<slug>/.
The testimonials slider is read from /our-services/ at build time (one source).
Header and footer come from the global injectors.

    python3 scripts/render_service_pages.py
"""
from __future__ import annotations

import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "scripts" / "service_pages"
sys.path.insert(0, str(ROOT / "scripts"))
from inject_global_header import process as stamp_header  # noqa: E402
from inject_global_footer import process as stamp_footer  # noqa: E402

IMG = "/framer-runtime/images/"

SERVICES = {
    "ai-strategy-advisory": {
        "name": "AI Strategy & Advisory",
        "blurb": "We assess organizational AI readiness, identify high-value use cases, and build a clear, executable roadmap from strategy through to deployment and measurable impact.",
        "hero_p": "We assess organizational AI readiness, identify high-value use cases, and build a clear, executable roadmap from initial strategy through to live deployment and measurable business impact. Every engagement leaves you with the plan, the people, and the governance to execute it — long after we are gone.",
        "hero_img": "/assets/service-strategy-hero.jpg",
        "hero_alt": "A Cognis strategy session: mapping AI opportunities on a whiteboard with a client team",
        "hero_video": "/assets/service-strategy-hero.mp4",
        "layout": "v2",
        "hero_p_v2": "AI Strategy & Advisory answers five practical questions: where can AI help, what is ready now, what should happen first, who will own it, and how will success be measured? You receive a clear plan that leaders can approve and delivery teams can follow.",
        "proof_quote": "governance framework",
        "proof_lead": "From readiness assessments to board-approved roadmaps, this is what clients say about our strategy work.",
        "ben_h2": "What a Cognis AI Strategy engagement delivers",
        "ben_lead": "A defensible roadmap, production-first delivery, internal capability transfer, and governance built in from day one.",
        "ben_img": IMG + "XWVgE6Ab2HA2NJq5oJGrl9ao0Fk.png",
        "ben_img_alt": "Cognis consultants mapping an AI roadmap on a whiteboard",
        "cards": [
            ("Readiness Assessment", "We map your data, skills, tooling and organizational appetite against the AI use cases that will actually move your numbers."),
            ("Executable Roadmap", "A prioritised, phase-by-phase roadmap ranking every candidate use case by value, feasibility and risk — specific to your business."),
            ("Production-First Delivery", "Every engagement ships at least one workflow into real production. We measure success by deployment, not decks."),
            ("Governance From Day One", "Policy frameworks, audit structures and model oversight aligned with EU AI Act, AU Continental AI Strategy and sector-specific requirements — built in, not bolted on."),
        ],
        "quote": ("“Quod Tango Muto: what we touch, we change. Every engagement leaves you permanently more capable.”", "Cognis Group", "Nigeria", IMG + "QnjDKI0euXnnnPi4GtTEaqYDJLo.png"),
    },
    "ai-training-workforce-development": {
        "name": "AI Training & Workforce Development",
        "blurb": "We develop AI literacy across your organization — executives to operators — building the mindset, capability and discipline to work with AI effectively at scale.",
        "hero_p": "We partner with leadership to unlock organizational potential. Our consulting approach integrates deep business acumen with advanced analytical techniques to solve complex challenges, optimize workflows, and prepare your company for the future of work. We focus on impact and measurable results.",
        "hero_img": "/assets/service-training-hero.jpg",
        "hero_alt": "A Cognis trainer leading an in-person AI workshop for a seated group",
        "hero_video": None,
        "ben_h2": "What a Cognis AI Training engagement delivers",
        "ben_lead": "We develop AI literacy across your entire organization — from executive leadership to operational teams — building the mindset, capability, and governance discipline required to work with AI effectively and responsibly at scale. We do not teach tools. We change how your people think.",
        "ben_img": IMG + "service-training.jpg",
        "ben_img_alt": "AI training and workforce development at Cognis Group",
        "cards": [
            ("Executive Enablement", "Workshops and advisory sessions that give your leadership team the vocabulary, judgment and strategic framing to make confident AI decisions."),
            ("Operational Team Training", "Role-specific, hands-on training that equips your operators with the skills to actually use AI tools in the flow of their daily work."),
            ("Governance Discipline", "Institutionalised responsible AI practices — from prompt hygiene to data handling to approval gates — so scale does not come at the cost of control."),
            ("Measured Outcomes", "Every training programme ships with a measurement plan: capability baselines, post-training assessments, and productivity metrics tracked over months."),
        ],
        "quote": ("“After the Cognis training, our people do not just use AI — they think differently. That is the permanent change.”", "Partner CTO", "Enterprise partner", IMG + "IGOxPIDHI4tPrADWVh1HrKM99RQ.png"),
        "layout": "v2",
        "hero_p_v2": "AI Training & Workforce Development helps people use AI safely and confidently in the work they already do. Leaders learn how to make sound decisions, managers learn how to guide adoption, and teams learn practical ways to save time, improve quality and work more efficiently.",
        "proof_quote": "trained our whole organisation",
        "proof_lead": "From executive sessions to organisation-wide programmes, this is what clients say about our training work.",
    },
    "ai-agent-automation-engineering": {
        "name": "AI Agent & Automation Engineering",
        "blurb": "We architect, build and deploy custom AI agents and intelligent automation workflows that eliminate manual bottlenecks and scale your output without scaling your headcount.",
        "hero_p": "We architect, build, and deploy production-ready AI agents and automated workflows that eliminate manual processes, reduce operational errors, and scale organizational capacity — without adding headcount. Agents amplify people. They do not replace them.",
        "hero_img": "/assets/service-agent-hero.jpg",
        "hero_alt": "Code and dashboards on screens, seen through an engineer's glasses",
        "hero_video": None,
        "layout": "v2",
        "hero_p_v2": "An AI agent is a tool that can complete agreed steps in a process, such as reading documents, preparing a report, checking information or routing a request. We build these tools with clear limits, human approval where needed and records of every important action.",
        "proof_quote": "rebuilt our internal operations",
        "proof_lead": "From customer operations to back-office workflows, this is what clients say about the agents we ship.",
        "ben_h2": "What a Cognis Agent engagement delivers",
        "ben_lead": "Production workflows, stack-native integrations, human-in-the-loop control, and measurable hours saved — not another chatbot pilot.",
        "ben_img": IMG + "service-agent.jpg",
        "ben_img_alt": "AI agent and automation engineering at Cognis Group",
        "cards": [
            ("Production Workflows", "Every agent we build goes to production. From intake-to-invoice, KYC, document extraction, and customer ops — we ship agents that handle the work your team has been dreading."),
            ("Stack-Native Integration", "Agents integrate with the tools you already run — Microsoft, Google Workspace, Salesforce, HubSpot, local banking APIs. No rip-and-replace."),
            ("Human-in-the-Loop Review", "Every agent has review gates, audit logs and rollback paths. Your operators stay in control — the agent does the work, your people approve the outcome."),
            ("Measured in Hours Saved", "Every automation ships with a measurement plan. You see the hours returned, the errors avoided, the throughput gained — in numbers, not promises."),
        ],
        "quote": ("“We do not replace people with AI. We make them extraordinary with it. That is the whole point of what Cognis does.”", "Cognis Group", "Nigeria", IMG + "QTiI3J2XXGOwJw3fyXhxuB92fl0.png"),
    },
}

HERO_VIDEO = "/framer-runtime/assets/services-hero.mp4"
CTA_BG = IMG + "W7a7pFrDjUXSx6Ldb2bKvhqgg.png"
CTA_AVATARS = [IMG + "LHF5pnTEGiDqPokWO5u1DEp2l0.png", IMG + "IGOxPIDHI4tPrADWVh1HrKM99RQ.png", IMG + "owRvmfck3MmE9RTAPlzhICFlFg.png"]
TESTI_LEAD = "From AI strategy engagements to agent deployments and enterprise-wide training programs, this is what our clients share."

ARROW = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.0457 8.13128L5.8733 15.3037L4.69479 14.1252L11.8672 6.95277L5.54568 6.95277L5.54568 5.28636H14.7121V14.4528L13.0457 14.4528V8.13128Z" fill="currentColor"/></svg>'
QUOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#131313" d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/></svg>'
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600;1,700&amp;family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&amp;display=swap" rel="stylesheet">'

CSS = """<style data-svc-page>
  html,body{margin:0;padding:0;background:#fff}
  .svc{font-family:"Plus Jakarta Sans",sans-serif;color:#131313;background:#fff;-webkit-font-smoothing:antialiased}
  .svc *{box-sizing:border-box}
  .svc h1,.svc h2,.svc h3,.svc p{margin:0}
  .svc img{display:block}
  /* hero */
  .svc-hero{padding:100px 12px 12px}
  .svc-hero-box{display:flex;gap:10px;height:720px;border-radius:24px}
  .svc-hero-left{flex:0 0 33%;background:#f2f2f2;border-radius:24px;padding:40px;display:flex;align-items:center}
  .svc-hero-copy{display:flex;flex-direction:column;justify-content:center;gap:32px;width:100%}
  .svc-hero-text{display:flex;flex-direction:column;gap:16px}
  .svc h1{font-size:40px;line-height:52px;letter-spacing:-2.4px;font-weight:500}
  .svc-hero-text p{font-size:16px;line-height:24px;letter-spacing:-.32px;color:#7b7b7b}
  .svc-hero-right{flex:1;position:relative;border-radius:24px;overflow:hidden;min-width:0;background:#e9e9e9}
  .svc-hero-img,.svc-hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .svc-hero-img{animation:svcZoom 1s cubic-bezier(.22,1,.36,1) both}
  .svc-hero-video{animation:svcFade .6s ease .1s both}
  @keyframes svcZoom{from{transform:scale(1.3)}to{transform:scale(1)}}
  @keyframes svcFade{from{opacity:0}to{opacity:1}}
  .svc-in{animation:svcUp .45s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
  @keyframes svcUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .svc-square{width:40px;height:40px;border-radius:12px;background:#cdfb56;display:flex;align-items:center;justify-content:center;flex:none}
  .svc-square i{width:24px;height:24px;background:#131313;display:block}
  /* buttons: text rolls up, arrow swaps diagonally */
  .svc-btn{display:inline-flex;align-items:center;gap:4px;height:48px;padding:4px 4px 4px 16px;border-radius:48px;text-decoration:none;font-size:14px;line-height:20px;letter-spacing:1.68px;text-transform:uppercase;font-weight:500;width:max-content}
  .svc-btn-dark{background:#131313;color:#d6fd70}
  .svc-btn-dark .svc-arrow{background:#d6fd70;color:#131313}
  .svc-btn-lime{background:#d6fd70;color:#131313}
  .svc-btn-lime .svc-arrow{background:#131313;color:#fff}
  .svc-roll{display:block;height:20px;overflow:hidden;padding:0 4px}
  .svc-roll b{display:block;font-weight:inherit;transition:transform .34s cubic-bezier(.2,.7,.2,1)}
  .svc-btn:hover .svc-roll b,.svc-pill:hover .svc-roll b{transform:translateY(-20px)}
  .svc-arrow{position:relative;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none}
  .svc-arrow svg{width:20px;height:20px;position:absolute;transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .3s}
  .svc-arrow svg:last-child{transform:translate(-14px,14px);opacity:0}
  .svc-btn:hover .svc-arrow svg:first-child{transform:translate(14px,-14px);opacity:0}
  .svc-btn:hover .svc-arrow svg:last-child{transform:none;opacity:1}
  .svc-pill{display:inline-flex;align-items:center;height:36px;padding:8px 16px;border-radius:48px;background:#f2f2f2;color:#131313;text-decoration:none;font-size:14px;line-height:20px;letter-spacing:1.68px;text-transform:uppercase;font-weight:500;transition:background .2s ease;width:max-content}
  .svc-pill:hover{background:#d6fd70}
  .svc-pill .svc-roll{padding:0}
  /* sections */
  .svc-section{padding:72px 52px}
  .svc-container{display:flex;flex-direction:column;align-items:center;gap:64px;max-width:1336px;margin:0 auto}
  .svc-head{display:flex;flex-direction:column;align-items:center;gap:20px;max-width:752px;text-align:center}
  .svc-eyebrow{display:flex;align-items:center;gap:12px;font-size:14px;line-height:20px;letter-spacing:1.68px;text-transform:uppercase;font-weight:500}
  .svc-eyebrow i{width:4px;height:4px;background:#131313;display:block}
  .svc-head-text{display:flex;flex-direction:column;align-items:center;gap:20px}
  .svc h2{font-size:48px;line-height:1.17;letter-spacing:-2.88px;font-weight:500;max-width:718px}
  .svc-head-text p{font-size:16px;line-height:24px;letter-spacing:-.32px;color:#2f2f2f;max-width:532px}
  .svc-grid{display:flex;flex-direction:column;gap:12px;background:#f2f2f2;border-radius:24px;padding:12px;width:100%}
  .svc-row{display:grid;gap:12px;grid-template-columns:minmax(0,279fr) minmax(0,279fr) minmax(0,730fr)}
  .svc-row-b{grid-template-columns:minmax(0,730fr) minmax(0,279fr) minmax(0,279fr)}
  .svc-card{background:#fff;border-radius:12px;box-shadow:0 3px 6px rgba(0,0,0,.06);padding:20px;display:flex;flex-direction:column;height:304px}
  .svc-sp{flex:1 1 32px;min-height:0}
  .svc-card-text{display:flex;flex-direction:column;gap:8px}
  .svc h3{font-size:24px;line-height:32px;letter-spacing:-.96px;font-weight:500}
  .svc-card-text p{font-size:16px;line-height:24px;letter-spacing:-.32px;color:#7b7b7b}
  .svc-photo{border-radius:12px;overflow:hidden;min-height:304px;position:relative}
  .svc-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .svc-quote{margin:0;background:#cdfb56;border-radius:12px;padding:24px;display:flex;flex-direction:column;justify-content:space-between;gap:32px;min-height:304px}
  .svc-quote-body{display:flex;flex-direction:column;gap:20px}
  .svc-quote-icon{width:32px;height:32px;display:block}
  .svc-quote-icon svg{width:32px;height:32px;display:block}
  .svc-quote-body p{font-size:24px;line-height:32px;letter-spacing:-.96px;font-weight:500;max-width:648px}
  .svc-quote-author{display:flex;align-items:center;gap:12px}
  .svc-quote-author img{width:40px;height:40px;border-radius:50%;object-fit:cover}
  .svc-quote-author b{display:block;font-weight:500;font-size:16px;line-height:24px;letter-spacing:-.32px}
  .svc-quote-author span{display:block;font-size:16px;line-height:24px;letter-spacing:-.32px;color:#2f2f2f}
  .svc-band{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f2f2f2;border-radius:24px;padding:12px;width:100%}
  .svc-card-wide{height:260px}
  /* testimonials block (shared with /our-services/) — Framer rhythm + arrow hover */
  .svc [data-screen-label="Testimonials"]{padding:64px 52px !important}
  [data-h="h3"]:hover{background:#E8E8E8 !important}
  /* CTA */
  .svc-cta{padding:12px}
  .svc-cta-box{position:relative;border-radius:24px;overflow:hidden;padding:40px;min-height:487px;display:flex;align-items:center;max-width:1416px;margin:0 auto}
  .svc-cta-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .svc-cta-grad{position:absolute;left:0;right:0;bottom:0;height:75%;background:linear-gradient(rgba(55,149,215,0),rgb(0,70,120));opacity:.58}
  .svc-cta-content{position:relative;color:#fff;max-width:654px;display:flex;flex-direction:column;align-items:flex-start}
  .svc-trust{display:flex;align-items:center;gap:16px;margin-bottom:48px}
  .svc-trust p{font-size:16px;line-height:24px;letter-spacing:-.32px}
  .svc-avatars{display:flex}
  .svc-avatars img{width:40px;height:40px;border-radius:50%;object-fit:cover;margin-left:-12px}
  .svc-avatars img:first-child{margin-left:0}
  .svc-cta h2{color:#fff;margin-bottom:16px}
  .svc-cta-content>p{font-size:16px;line-height:24px;letter-spacing:-.32px;max-width:628px;margin-bottom:32px}
  /* phones / tablets (Framer's Phone layout) */
  @media (max-width:991px){
    .svc-hero-box{flex-direction:column;height:auto}
    .svc-hero-left{flex:none;padding:16px;min-height:480px}
    .svc-hero-copy{align-items:center;text-align:center;gap:24px}
    .svc-hero-right{flex:none;height:350px}
    .svc-row,.svc-row-b,.svc-band{grid-template-columns:1fr}
    .svc-section{padding:48px 16px}
    .svc [data-screen-label="Testimonials"]{padding:48px 16px !important}
    .svc-container{gap:48px}
    .svc h2{font-size:35px;letter-spacing:-2.1px}
    .svc-card{height:auto;min-height:248px}
    .svc-card-wide{min-height:372px}
    .svc-sp{flex:0 0 32px}
    .svc-photo{min-height:300px}
    .svc-cta-box{padding:40px 16px;min-height:466px}
    .svc-cta-content{align-items:center;text-align:center}
    .svc-trust{flex-direction:column;gap:16px;margin-bottom:32px}
  }
  @media (prefers-reduced-motion:reduce){
    .svc-in,.svc-hero-img,.svc-hero-video{animation:none}
    .svc-roll b,.svc-arrow svg,.svc-pill{transition:none}
  }
  /* v2 layout: process steps, fit/outcomes, proof, FAQ */
  .svc-head-left{align-items:flex-start;text-align:left;max-width:640px}
  .svc-head-left .svc-head-text{align-items:flex-start}
  .svc-head-text p+p{margin-top:-8px}
  .svc-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;background:#f2f2f2;border-radius:24px;padding:12px;width:100%}
  .svc-steps .svc-card{height:auto;min-height:232px}
  .svc-num{width:40px;height:40px;border-radius:12px;background:#cdfb56;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;letter-spacing:-.32px;flex:none}
  .svc-two{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f2f2f2;border-radius:24px;padding:12px;width:100%}
  .svc-two .svc-card{height:auto;min-height:0}
  .svc-two .svc-card-text{margin-top:32px}
  .svc-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
  .svc-list li{position:relative;padding-left:22px;font-size:16px;line-height:24px;letter-spacing:-.32px;color:#7b7b7b}
  .svc-list li::before{content:"";position:absolute;left:0;top:8px;width:8px;height:8px;background:#131313}
  .svc-proof{display:grid;grid-template-columns:minmax(0,1fr) min(404px,88vw);gap:48px;align-items:center;max-width:1336px;width:100%}
  .svc-proof-card{justify-self:end}
  .svc-faq{max-width:860px;width:100%;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:17px;line-height:1.72;color:#131313}
  .svc-faq details{border-top:1px solid #e6e6e6;padding:18px 0}
  .svc-faq details:last-of-type{border-bottom:1px solid #e6e6e6}
  .svc-faq summary{cursor:pointer;font-weight:600;font-size:17px;list-style:none;position:relative;padding-right:28px}
  .svc-faq summary::-webkit-details-marker{display:none}
  .svc-faq summary::after{content:"+";position:absolute;right:0;top:0;font-size:22px;font-weight:400;color:#7b7b7b}
  .svc-faq details[open] summary::after{content:"−"}
  .svc-faq details p{margin:12px 0 0;color:#2f2f2f}
  @media (max-width:991px){
    .svc-steps,.svc-two,.svc-proof{grid-template-columns:1fr}
    .svc-proof{gap:32px}
    .svc-proof-card{justify-self:center}
    .svc-head-left{align-items:center;text-align:center}
    .svc-head-left .svc-head-text{align-items:center}
  }
</style>"""


def e(s: str) -> str:
    return html.escape(s, quote=False)


def button(label: str, href: str, kind: str, extra_class: str = "", style: str = "") -> str:
    cls = f"svc-btn svc-btn-{kind}" + (f" {extra_class}" if extra_class else "")
    st = f' style="{style}"' if style else ""
    return (f'<a class="{cls}" href="{href}"{st}><span class="svc-roll"><b>{e(label)}</b><b aria-hidden="true">{e(label)}</b></span>'
            f'<span class="svc-arrow" aria-hidden="true">{ARROW}{ARROW}</span></a>')


def card(title: str, text: str, wide: bool = False, pill: str | None = None) -> str:
    pill_html = f'<a class="svc-pill" href="{pill}"><span class="svc-roll"><b>Learn more</b><b aria-hidden="true">Learn more</b></span></a>' if pill else ""
    return (f'<article class="svc-card{" svc-card-wide" if wide else ""}" data-appear><div class="svc-square" aria-hidden="true"><i></i></div><i class="svc-sp"></i>'
            f'<div class="svc-card-text"><h3>{e(title)}</h3><p>{e(text)}</p></div>{"<i class=svc-sp></i>" if pill else ""}{pill_html}</article>')


def head_block(name: str) -> str:
    return (f'<header class="svc-head"><div class="svc-eyebrow"><i></i><span>{name}</span></div>')


def testimonials_block() -> str:
    src = (ROOT / "our-services" / "index.html").read_text(encoding="utf-8")
    m = re.search(r'<section[^>]*data-screen-label="Testimonials"', src)
    start = m.start(); depth = 0
    for mm in re.finditer(r"<section\b|</section>", src[start:]):
        depth += 1 if mm.group(0) == "<section" else -1
        if depth == 0:
            block = src[start:start + mm.end()]; break
    block = re.sub(r"(<div[^>]*>)What clients say about[^<]*(</div>)", lambda x: x.group(1) + e(TESTI_LEAD) + x.group(2), block, count=1)
    return block


def hero_media(s: dict) -> str:
    """Hero panel: a still photo, plus the page's video on top when it has one."""
    img = f'<img class="svc-hero-img" src="{s["hero_img"]}" alt="{e(s.get("hero_alt", s["name"] + " — Cognis Group"))}" width="935" height="720" fetchpriority="high">'
    video = s.get("hero_video", HERO_VIDEO)
    if not video:
        return img
    return img + f'\n        <video class="svc-hero-video" src="{video}" poster="{s["hero_img"]}" autoplay muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video>'


def longform_parts(slug: str) -> dict:
    """Split the carried-over article into its pieces for the v2 layout."""
    src = (DATA / slug / "longform.html").read_text(encoding="utf-8")
    body = re.search(r'<section class="cognis-service-longform"[^>]*>([\s\S]*?)</section>', src).group(1)
    schema = re.search(r'<script[^>]*application/ld\+json[^>]*>[\s\S]*?</script>', src[src.find("</section>"):]).group(0)
    sec = lambda title: re.search(r"<h2>" + re.escape(title) + r"</h2>([\s\S]*?)(?=<h2>|<aside|$)", body).group(1).strip()
    means = re.findall(r"<p>([\s\S]*?)</p>", sec("What this means"))
    steps = [(a.strip(), b.strip()) for a, b in re.findall(r"<li><strong>([\s\S]*?)</strong>([\s\S]*?)</li>", sec("How we deliver"))]
    who = re.findall(r"<p>([\s\S]*?)</p>", sec("Who this is for"))
    outcomes = re.findall(r"<li>([\s\S]*?)</li>", sec("Outcomes you can expect"))
    faqs = re.findall(r"<details>[\s\S]*?</details>", sec("Frequently asked questions"))
    return {"means": means, "steps": steps, "who": who, "outcomes": outcomes, "faqs": faqs, "schema": schema}


def proof_card(match_text: str) -> str:
    """The matching card from the shared testimonial slider on /our-services/ (one source)."""
    src = (ROOT / "our-services" / "index.html").read_text(encoding="utf-8")
    track = re.search(r'<div[^>]*style="[^"]*transition: transform 0\.45s[^"]*"[^>]*>', src)
    i = track.end(); depth = 0; cur = i; cards = []
    for m in re.finditer(r"<div\b|</div>", src[i:]):
        if m.group(0) == "<div":
            if depth == 0: cur = i + m.start()
            depth += 1
        else:
            depth -= 1
            if depth == 0: cards.append(src[cur:i + m.end()])
            if depth < 0: break
    return next(c for c in cards if match_text in c)


def render_v2(slug: str, s: dict, meta: str, schema: str) -> str:
    """Hero → what you get → how we deliver → who it's for + outcomes → proof → FAQ → other services → CTA."""
    lf = longform_parts(slug)
    others = [k for k in SERVICES if k != slug]
    q_text, q_name, q_org, q_avatar = s["quote"]
    cards = [card(t, x) for t, x in s["cards"]]
    hero_btn = button("Get Started", "/contact/", "dark", "svc-in", "--d:.8s")
    cta_btn = button("Start the Conversation", "/contact/", "lime")
    hero = f'''<section class="svc-hero" aria-labelledby="svc-title">
    <div class="svc-hero-box">
      <div class="svc-hero-left"><div class="svc-hero-copy">
        <div class="svc-square svc-in" style="--d:.5s" aria-hidden="true"><i></i></div>
        <div class="svc-hero-text"><h1 id="svc-title" class="svc-in" style="--d:.6s">{e(s["name"])}</h1><p class="svc-in" style="--d:.7s">{e(s["hero_p_v2"])}</p></div>
        {hero_btn}
      </div></div>
      <div class="svc-hero-right">
        {hero_media(s)}
      </div>
    </div>
  </section>'''
    benefits = f'''<section class="svc-section svc-benefits" aria-labelledby="svc-benefits-title">
    <div class="svc-container">
      {head_block("What you get")}<div class="svc-head-text"><h2 id="svc-benefits-title">{e(s["ben_h2"])}</h2><p>{e(s["ben_lead"])}</p></div></header>
      <div class="svc-grid">
        <div class="svc-row svc-row-a">{cards[0]}{cards[1]}<div class="svc-photo" data-appear><img src="{s["ben_img"]}" alt="{e(s["ben_img_alt"])}" loading="lazy" width="730" height="304"></div></div>
        <div class="svc-row svc-row-b"><blockquote class="svc-quote" data-appear><div class="svc-quote-body"><span class="svc-quote-icon">{QUOTE}</span><p>{e(q_text)}</p></div><div class="svc-quote-author"><img src="{q_avatar}" alt="" width="40" height="40" loading="lazy"><div><b>{e(q_name)}</b><span>{e(q_org)}</span></div></div></blockquote>{cards[2]}{cards[3]}</div>
      </div>
    </div>
  </section>'''
    steps = "".join(f'<article class="svc-card" data-appear><div class="svc-num" aria-hidden="true">{i}</div><i class="svc-sp"></i><div class="svc-card-text"><h3>{t}</h3><p>{x}</p></div></article>' for i, (t, x) in enumerate(lf["steps"], 1))
    means = "".join(f"<p>{m}</p>" for m in lf["means"])
    deliver = f'''<section class="svc-section svc-deliver" aria-labelledby="svc-deliver-title">
    <div class="svc-container">
      {head_block("Process")}<div class="svc-head-text"><h2 id="svc-deliver-title">How we deliver</h2>{means}</div></header>
      <div class="svc-steps">{steps}</div>
    </div>
  </section>'''
    who = "".join(f"<p>{w}</p>" for w in lf["who"])
    outcomes = "".join(f"<li>{o}</li>" for o in lf["outcomes"])
    fit = f'''<section class="svc-section svc-fit" aria-labelledby="svc-fit-title">
    <div class="svc-container">
      {head_block("Fit")}<div class="svc-head-text"><h2 id="svc-fit-title">Who this is for, and what you can expect</h2></div></header>
      <div class="svc-two">
        <article class="svc-card" data-appear><div class="svc-square" aria-hidden="true"><i></i></div><div class="svc-card-text"><h3>Who this is for</h3>{who}</div></article>
        <article class="svc-card" data-appear><div class="svc-square" aria-hidden="true"><i></i></div><div class="svc-card-text"><h3>Outcomes you can expect</h3><ul class="svc-list">{outcomes}</ul></div></article>
      </div>
    </div>
  </section>'''
    proof = f'''<section class="svc-section svc-proof-section" aria-labelledby="svc-proof-title">
    <div class="svc-container"><div class="svc-proof">
      <header class="svc-head svc-head-left"><div class="svc-eyebrow"><i></i><span>Proof</span></div><div class="svc-head-text"><h2 id="svc-proof-title">What our clients say</h2><p>{e(s["proof_lead"])}</p></div></header>
      <div class="svc-proof-card" data-appear>{proof_card(s["proof_quote"])}</div>
    </div></div>
  </section>'''
    faq = f'''<section class="svc-section svc-faq-section" aria-labelledby="svc-faq-title">
    <div class="svc-container">
      {head_block("FAQ")}<div class="svc-head-text"><h2 id="svc-faq-title">Frequently asked questions</h2></div></header>
      <div class="svc-faq">{"".join(lf["faqs"])}</div>
    </div>
    {lf["schema"]}
  </section>'''
    band = "".join(card(SERVICES[o]["name"], SERVICES[o]["blurb"], wide=True, pill=f"/our-services/{o}/") for o in others)
    services = f'''<section class="svc-section svc-services" aria-labelledby="svc-services-title">
    <div class="svc-container">
      {head_block("Services")}<div class="svc-head-text"><h2 id="svc-services-title">Comprehensive consulting and intelligent innovation</h2><p>Whether you’re optimizing today or building for tomorrow we help you move faster with confidence.</p></div></header>
      <div class="svc-band">{band}</div>
    </div>
  </section>'''
    avatars = "".join(f'<img src="{a}" alt="" width="40" height="40" loading="lazy">' for a in CTA_AVATARS)
    cta = f'''<section class="svc-cta" aria-labelledby="svc-cta-title">
    <div class="svc-cta-box" data-appear>
      <img class="svc-cta-bg" src="{CTA_BG}?width=1600" alt="" loading="lazy">
      <div class="svc-cta-grad" aria-hidden="true"></div>
      <div class="svc-cta-content">
        <div class="svc-trust"><p>Trusted by forward-thinking organizations across three continents</p><div class="svc-avatars">{avatars}</div></div>
        <h2 id="svc-cta-title">What we touch, we change</h2>
        <p>Cognis Group bridges deep African market knowledge with global AI engineering capability. We do not replace people with AI. We make them extraordinary with it.</p>
        {cta_btn}
      </div>
    </div>
  </section>'''
    return page_shell(meta, schema, "\n  ".join([hero, benefits, deliver, fit, proof, faq, services, cta]))


def page_shell(meta: str, schema: str, body: str) -> str:
    return f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{meta}
{FONTS}
{CSS}
{schema}
<link rel="stylesheet" href="/responsive.css">
<script src="/cognis.js" defer></script>
<script defer src="/assets/logo-motion.js"></script><script defer src="/assets/ask-cognis.js"></script>
</head>
<body>
<div id="svc-page"><main class="svc">
  {body}
</main></div>
</body>
</html>
'''


def render(slug: str) -> str:
    s = SERVICES[slug]
    d = DATA / slug
    meta = (d / "meta.html").read_text(encoding="utf-8").strip()
    schema = (d / "schema.html").read_text(encoding="utf-8").strip()
    longform = (d / "longform.html").read_text(encoding="utf-8").strip()
    if s.get("layout") == "v2":
        return render_v2(slug, s, meta, schema)
    others = [k for k in SERVICES if k != slug]
    q_text, q_name, q_org, q_avatar = s["quote"]
    cards = [card(t, x) for t, x in s["cards"]]
    hero_btn = button("Get Started", "/contact/", "dark", "svc-in", "--d:.8s")
    cta_btn = button("Start the Conversation", "/contact/", "lime")
    hero = f'''<section class="svc-hero" aria-labelledby="svc-title">
    <div class="svc-hero-box">
      <div class="svc-hero-left"><div class="svc-hero-copy">
        <div class="svc-square svc-in" style="--d:.5s" aria-hidden="true"><i></i></div>
        <div class="svc-hero-text"><h1 id="svc-title" class="svc-in" style="--d:.6s">{e(s["name"])}</h1><p class="svc-in" style="--d:.7s">{e(s["hero_p"])}</p></div>
        {hero_btn}
      </div></div>
      <div class="svc-hero-right">
        <img class="svc-hero-img" src="{s["hero_img"]}" alt="{e(s["name"])} — Cognis Group" width="935" height="720" fetchpriority="high">
        <video class="svc-hero-video" src="{HERO_VIDEO}" poster="{s["hero_img"]}" autoplay muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video>
      </div>
    </div>
  </section>'''
    benefits = f'''<section class="svc-section svc-benefits" aria-labelledby="svc-benefits-title">
    <div class="svc-container">
      {head_block("Benefits")}<div class="svc-head-text"><h2 id="svc-benefits-title">{e(s["ben_h2"])}</h2><p>{e(s["ben_lead"])}</p></div></header>
      <div class="svc-grid">
        <div class="svc-row svc-row-a">{cards[0]}{cards[1]}<div class="svc-photo" data-appear><img src="{s["ben_img"]}" alt="{e(s["ben_img_alt"])}" loading="lazy" width="730" height="304"></div></div>
        <div class="svc-row svc-row-b"><blockquote class="svc-quote" data-appear><div class="svc-quote-body"><span class="svc-quote-icon">{QUOTE}</span><p>{e(q_text)}</p></div><div class="svc-quote-author"><img src="{q_avatar}" alt="" width="40" height="40" loading="lazy"><div><b>{e(q_name)}</b><span>{e(q_org)}</span></div></div></blockquote>{cards[2]}{cards[3]}</div>
      </div>
    </div>
  </section>'''
    band = "".join(card(SERVICES[o]["name"], SERVICES[o]["blurb"], wide=True, pill=f"/our-services/{o}/") for o in others)
    services = f'''<section class="svc-section svc-services" aria-labelledby="svc-services-title">
    <div class="svc-container">
      {head_block("Services")}<div class="svc-head-text"><h2 id="svc-services-title">Comprehensive consulting and intelligent innovation</h2><p>Whether you’re optimizing today or building for tomorrow we help you move faster with confidence.</p></div></header>
      <div class="svc-band">{band}</div>
    </div>
  </section>'''
    avatars = "".join(f'<img src="{a}" alt="" width="40" height="40" loading="lazy">' for a in CTA_AVATARS)
    cta = f'''<section class="svc-cta" aria-labelledby="svc-cta-title">
    <div class="svc-cta-box" data-appear>
      <img class="svc-cta-bg" src="{CTA_BG}?width=1600" alt="" loading="lazy">
      <div class="svc-cta-grad" aria-hidden="true"></div>
      <div class="svc-cta-content">
        <div class="svc-trust"><p>Trusted by forward-thinking organizations across three continents</p><div class="svc-avatars">{avatars}</div></div>
        <h2 id="svc-cta-title">What we touch, we change</h2>
        <p>Cognis Group bridges deep African market knowledge with global AI engineering capability. We do not replace people with AI. We make them extraordinary with it.</p>
        {cta_btn}
      </div>
    </div>
  </section>'''
    return f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{meta}
{FONTS}
{CSS}
{schema}
<link rel="stylesheet" href="/responsive.css">
<script src="/cognis.js" defer></script>
<script defer src="/assets/logo-motion.js"></script><script defer src="/assets/ask-cognis.js"></script>
</head>
<body>
<div id="svc-page"><main class="svc">
  {hero}
  {benefits}
  {testimonials_block()}
  {services}
  {cta}
  {longform}
</main></div>
</body>
</html>
'''


def main() -> int:
    for slug in SERVICES:
        out = ROOT / "our-services" / slug / "index.html"
        out.write_text(render(slug), encoding="utf-8")
        stamp_header(out); stamp_footer(out)
        print(f"  wrote {out.relative_to(ROOT)} ({out.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
