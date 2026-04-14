"""Longform body content for the 6 Cognis Group service pages.

Each entry: slug -> dict with
    headline    – display H1 for the longform block
    lead        – 40–70 word definition opener
    what        – "What This Means" paragraphs (HTML)
    how         – "How We Deliver" structured list (HTML)
    who         – "Who This Is For" paragraphs/list (HTML)
    outcomes    – "Outcomes" list (HTML)
    faqs        – list of {q, a} (5–8 items) — also emitted as FAQPage schema
    related     – list of (href, label) for related services block
"""

SERVICES = {
    "ai-strategy-advisory": {
        "headline": "AI Strategy & Advisory",
        "lead": (
            "AI Strategy & Advisory is the work of turning board-level AI ambition into a "
            "sequenced, executable plan — one that respects your data reality, your "
            "regulatory surface, and the production operating model you can actually "
            "sustain. We do not write strategy decks. We write deployment roadmaps the "
            "business can sign and the engineering team can ship."
        ),
        "what": """
<p>Most AI strategies fail because they are written at the wrong altitude. They set ambition without specifying workflow, and they list use cases without confirming that the underlying data, platforms, and people can support any of them in production.</p>
<p>Our advisory work starts from the opposite direction. We treat strategy as a contract between leadership and engineering: a document that names specific workflows, specific users, specific data systems, specific governance frameworks, and specific success metrics — then sequences the investments required to move from the current state to a shippable one.</p>
""",
        "how": """
<ol>
  <li><strong>Readiness diagnostic.</strong> We assess data, technical, workforce, and governance readiness against the use cases you are considering — not in the abstract. The output is a heat map of what is actually blocking production.</li>
  <li><strong>Use-case prioritisation.</strong> We score candidate initiatives on value, feasibility, time-to-value, and risk. We cut the ones that fail any of those tests and deepen the ones that survive.</li>
  <li><strong>Operating model design.</strong> We specify how AI work will be funded, staffed, governed, and measured — including the interaction model between central AI teams, business units, and compliance.</li>
  <li><strong>Roadmap sequencing.</strong> Quarter-by-quarter plan with named owners, dependencies, and decision gates aligned to EU AI Act, NIST AI RMF, ISO 42001, and NDPA where relevant.</li>
  <li><strong>Executive alignment.</strong> Board-ready narrative, investment case, and risk posture — written for the people who need to approve it.</li>
</ol>
""",
        "who": """
<p>This work suits boards and executive teams that are past the exploration phase and need to commit capital. Typical triggers:</p>
<ul>
  <li>A previous AI investment stalled at pilot and the organisation wants to understand why before reinvesting.</li>
  <li>A regulatory change (EU AI Act, NDPA 2023, sector-specific rules) is forcing an AI governance decision the business is not ready to make.</li>
  <li>A new CEO, CIO, or Chief AI Officer needs an independent read on what is real versus what is deck-ware.</li>
  <li>An M&amp;A or transformation programme is dependent on an AI capability the organisation does not yet have.</li>
</ul>
""",
        "outcomes": """
<ul>
  <li>A board-approved AI strategy with named use cases, owners, and investment envelopes.</li>
  <li>A 12–24 month roadmap sequenced against actual readiness — not aspiration.</li>
  <li>A governance operating model aligned to the regulations that bind you.</li>
  <li>A decision framework for future AI investment that the business can apply without us in the room.</li>
</ul>
""",
        "faqs": [
            {"q": "How long does an AI strategy engagement take?",
             "a": "Typical engagements run 8–14 weeks from kickoff to board-ready roadmap. The diagnostic phase takes 3–4 weeks, prioritisation and operating model design another 3–4 weeks, and roadmap sequencing plus executive alignment the final 2–6 weeks depending on stakeholder complexity."},
            {"q": "Do you build the AI systems you recommend?",
             "a": "We can, but we do not have to. Our advisory work is deliberately independent so the strategy is not self-serving. If you choose us to build, it is because the strategy calls for it — not because we baked ourselves into the plan."},
            {"q": "How is this different from a McKinsey or BCG AI strategy?",
             "a": "Those firms produce excellent strategy documents. We produce documents that ship. The difference shows up in the level of specificity: named data systems, named platform decisions, named compliance controls, named owners — not archetypes."},
            {"q": "What regulations do you align strategy to?",
             "a": "Primarily the EU AI Act, NIST AI RMF, ISO 42001, and Nigeria's NDPA 2023 — plus any sector-specific regime (financial services, health, public sector) that binds your organisation. Alignment is a design input, not a compliance review at the end."},
            {"q": "Can you advise on buy-vs-build for AI platforms?",
             "a": "Yes. Buy-vs-build is embedded in the roadmap. We assess platform vendors, foundation model providers, and in-house capability options against your specific use cases and sovereignty requirements."},
            {"q": "Do you work with organisations outside Africa?",
             "a": "Yes. We advise clients across Africa, Europe, and the Americas. Our Lagos base gives us an unusually strong view on cross-border regulatory fit — particularly for organisations operating in multiple jurisdictions."},
        ],
        "related": [
            ("/our-services/ai-governance-risk-compliance", "AI Governance, Risk &amp; Compliance"),
            ("/our-services/enterprise-digital-transformation", "Enterprise Digital Transformation"),
            ("/our-services/ai-training-workforce-development", "AI Training &amp; Workforce Development"),
        ],
    },

    "ai-agent-automation-engineering": {
        "headline": "AI Agent & Automation Engineering",
        "lead": (
            "AI Agent &amp; Automation Engineering is the discipline of building autonomous "
            "and semi-autonomous systems that execute real work inside enterprise workflows — "
            "under production-grade observability, guardrails, and human oversight. Demos "
            "are easy. Shipping agents that a regulated business is willing to trust with "
            "customer interactions, financial transactions, or compliance actions is not."
        ),
        "what": """
<p>Agents fail in production for predictable reasons: no evaluation harness, no safety rails, no recovery path when tools misfire, no observability into why they made a decision, and no integration discipline with the systems of record they are supposed to act on.</p>
<p>We engineer agents as production software — with the same rigour you would apply to any other system the business depends on. That means version control, continuous evaluation, structured tool contracts, policy-enforced action surfaces, and human-in-the-loop design where the risk profile demands it.</p>
""",
        "how": """
<ol>
  <li><strong>Workflow decomposition.</strong> We map the end-to-end workflow the agent is replacing or augmenting, identify the decision points, and classify each one by risk and reversibility.</li>
  <li><strong>Tool &amp; integration design.</strong> We specify the tools the agent can call, the schemas they accept, and the rollback behaviour for any non-idempotent action.</li>
  <li><strong>Evaluation harness.</strong> Before any model selection, we build the evaluation set — real tasks, real data, graded rubrics — so we can measure rather than guess.</li>
  <li><strong>Guardrails &amp; policy layer.</strong> Structured policy enforcement (NDPA, internal controls, role-based action limits) sits between the model and the tools, not inside the prompt.</li>
  <li><strong>Observability &amp; feedback loops.</strong> Every agent action is logged, attributed, and linkable to the inputs and model version that produced it — so incidents are investigable.</li>
  <li><strong>Phased rollout.</strong> Shadow mode → supervised mode → autonomous mode, with explicit promotion criteria at each stage.</li>
</ol>
""",
        "who": """
<p>This work suits organisations where agents will touch customer-facing, revenue-bearing, or compliance-sensitive workflows — and the cost of a wrong action is material. Typical contexts:</p>
<ul>
  <li>Financial services firms automating claims triage, KYC review, or credit adjudication support.</li>
  <li>Public-sector and regulated enterprises automating case handling, document review, or citizen-facing enquiry response.</li>
  <li>Operations-heavy businesses replacing repetitive back-office workflows without losing audit trails.</li>
</ul>
""",
        "outcomes": """
<ul>
  <li>Production agents with measurable accuracy, latency, and cost envelopes.</li>
  <li>A reproducible evaluation harness the team can extend post-handover.</li>
  <li>Policy and guardrail layers that satisfy internal risk and external regulators.</li>
  <li>Observability that turns "the agent did something weird" into a specific, debuggable event.</li>
</ul>
""",
        "faqs": [
            {"q": "What foundation models do you work with?",
             "a": "We are deliberately model-agnostic. We work across Claude, GPT, Gemini, and open-weight models (Llama, Mistral, Qwen) depending on the use case, data-residency requirement, and cost envelope. Model choice falls out of the evaluation harness, not the sales pitch."},
            {"q": "How do you handle data residency and sovereignty?",
             "a": "Where residency is a requirement — NDPA, sector regulation, or client policy — we design for it from the start: in-region inference, BYOK key management, VPC-isolated deployments, or on-prem model hosting as needed."},
            {"q": "What agent frameworks do you use?",
             "a": "We select per engagement. We have shipped on LangGraph, CrewAI, custom orchestration, and provider-native agent APIs. Framework choice is an implementation detail — the architecture discipline is what carries across."},
            {"q": "How do you prevent hallucinations in production agents?",
             "a": "Hallucinations are a design problem, not just a model problem. We constrain the surface: structured tool outputs, retrieval-grounded generation where factual accuracy matters, policy checks on every external action, and evaluation gates before promotion."},
            {"q": "Do you provide post-deployment monitoring?",
             "a": "Yes. Observability is part of the build, not an add-on. Clients receive dashboards covering accuracy drift, cost, latency, policy violations, and human-override rates. Ongoing managed operations is available as a separate engagement."},
            {"q": "How long does it take to get an agent into production?",
             "a": "A focused agent on a well-scoped workflow typically moves from kickoff to supervised production in 10–16 weeks. Broader multi-agent systems or heavily regulated environments take longer — usually because the policy and integration surface, not the model work, is what governs the timeline."},
        ],
        "related": [
            ("/our-services/ai-strategy-advisory", "AI Strategy &amp; Advisory"),
            ("/our-services/ml-data-intelligence", "ML &amp; Data Intelligence"),
            ("/our-services/ai-governance-risk-compliance", "AI Governance, Risk &amp; Compliance"),
        ],
    },

    "ml-data-intelligence": {
        "headline": "ML & Data Intelligence",
        "lead": (
            "ML &amp; Data Intelligence is the end-to-end work of turning enterprise data "
            "into decisions — data platforms, predictive models, forecasting systems, and "
            "the MLOps discipline required to keep them honest in production. We build "
            "systems that survive the first week, the first drift event, and the first "
            "audit."
        ),
        "what": """
<p>Classical machine learning is not going away. Demand forecasting, churn prediction, anomaly detection, credit scoring, recommendation — these problems are better served by focused predictive models than by generalist LLMs, and the quality of the data platform beneath them is usually the single largest determinant of success.</p>
<p>We build both halves. Data platforms that are trustworthy by design, and models that run on top of them with the observability, retraining discipline, and governance needed to keep them accurate.</p>
""",
        "how": """
<ol>
  <li><strong>Data platform foundations.</strong> Lakehouse or warehouse architecture, ingestion, transformation, lineage, and access governance. We design for auditability first — it is cheaper than retrofitting it.</li>
  <li><strong>Feature engineering &amp; feature stores.</strong> So the same feature definition serves training and inference without drift.</li>
  <li><strong>Model development.</strong> From baseline through tuned production model, with experiment tracking and reproducibility non-negotiable.</li>
  <li><strong>MLOps &amp; serving.</strong> CI/CD for models, shadow deployment, canary rollout, and automated rollback.</li>
  <li><strong>Monitoring &amp; retraining.</strong> Drift detection, performance monitoring, and scheduled or event-triggered retraining — tied to business metrics, not just technical ones.</li>
  <li><strong>Governance &amp; documentation.</strong> Model cards, datasheets, risk classifications, and the audit trail your regulators will ask for.</li>
</ol>
""",
        "who": """
<p>This work is for organisations where data is a genuine asset but is either under-exploited or untrusted — and where decisions that should be quantitative are still made on instinct. We see strong fit in:</p>
<ul>
  <li>Financial services — credit, fraud, claims, forecasting.</li>
  <li>Retail, consumer goods, and telecoms — demand, pricing, churn, personalisation.</li>
  <li>Public sector and development finance — programme outcomes modelling, targeting, and impact measurement.</li>
</ul>
""",
        "outcomes": """
<ul>
  <li>A production data platform with lineage, access governance, and quality SLAs.</li>
  <li>Deployed predictive models with measurable accuracy and business impact.</li>
  <li>MLOps pipelines the client team can operate without us.</li>
  <li>Full model documentation aligned to EU AI Act high-risk requirements and ISO 42001.</li>
</ul>
""",
        "faqs": [
            {"q": "Do you replace existing data platforms?",
             "a": "Usually no. Ripping out working infrastructure rarely pays back. We extend, harden, and govern what is already there, and only recommend replacement where the existing platform genuinely cannot support the use cases on the roadmap."},
            {"q": "What cloud platforms do you build on?",
             "a": "AWS, Azure, GCP, and hybrid. We have also delivered on-prem and sovereign-cloud deployments where data residency demanded it. The architecture patterns carry; the vendor does not dictate the design."},
            {"q": "How do you handle model bias and fairness?",
             "a": "Bias testing is built into the evaluation harness from the first model we ship. We use protected-attribute auditing, disparate-impact analysis, and — where appropriate — adversarial evaluation. Findings are documented in the model card and reviewed before promotion."},
            {"q": "Can you work with legacy data?",
             "a": "Yes. Most of our engagements involve some portion of messy, poorly-labelled, or unstructured legacy data. The work of getting it into a form a model can learn from is usually half the engagement."},
            {"q": "What is your approach to MLOps tooling?",
             "a": "Pragmatic. MLflow, SageMaker, Vertex, Databricks, Kubeflow — we have shipped on all of them. We match the tool to the team's existing stack and skill level rather than forcing a rewrite."},
        ],
        "related": [
            ("/our-services/ai-agent-automation-engineering", "AI Agent &amp; Automation Engineering"),
            ("/our-services/ai-strategy-advisory", "AI Strategy &amp; Advisory"),
            ("/our-services/enterprise-digital-transformation", "Enterprise Digital Transformation"),
        ],
    },

    "ai-governance-risk-compliance": {
        "headline": "AI Governance, Risk &amp; Compliance",
        "lead": (
            "AI Governance, Risk &amp; Compliance is the operating discipline that lets an "
            "enterprise deploy AI without accumulating unmanaged regulatory, reputational, "
            "or operational risk. We design governance that is specific, implementable, and "
            "auditable — not a policy document that lives in a shared drive."
        ),
        "what": """
<p>Governance fails in one of two ways. Either it is treated as a late-stage compliance review — bolted on after the system is built, which guarantees friction — or it is written so abstractly that no engineer knows how to implement it. Both modes leave the organisation exposed.</p>
<p>We build governance as a design input. That means inventories, classifications, controls, and review gates that developers and business owners can actually follow, mapped directly to the regulations and standards that bind your organisation.</p>
""",
        "how": """
<ol>
  <li><strong>AI inventory &amp; risk classification.</strong> Every AI system the organisation uses — built, bought, or embedded in a SaaS — inventoried and classified against EU AI Act risk tiers, ISO 42001, and internal risk appetite.</li>
  <li><strong>Policy framework.</strong> Written so engineers can implement and auditors can test. Covers data use, model lifecycle, third-party AI, human oversight, transparency, and incident response.</li>
  <li><strong>Control design.</strong> Specific controls for each risk tier — documentation, testing, monitoring, human-in-the-loop — with named owners.</li>
  <li><strong>NDPA &amp; cross-border data mapping.</strong> Data flows, lawful bases, transfer mechanisms, and DPIA support where processing is high-risk.</li>
  <li><strong>Training &amp; attestation.</strong> Role-specific training for executives, product teams, and engineers so the policy is actually known, not just written.</li>
  <li><strong>Audit readiness.</strong> Evidence packs, model cards, and DPIA bundles in the form regulators and clients will actually ask for.</li>
</ol>
""",
        "who": """
<p>This service is relevant to any organisation whose AI use is entering a scale where the current informal controls will not hold. Common triggers:</p>
<ul>
  <li>EU AI Act obligations becoming enforceable for high-risk systems.</li>
  <li>A client or partner requiring ISO 42001 or SOC 2 AI assurance.</li>
  <li>NDPA enforcement action or a material privacy incident.</li>
  <li>A board-level concern that the organisation cannot answer, in detail, what AI it is running and under what controls.</li>
</ul>
""",
        "outcomes": """
<ul>
  <li>A complete AI inventory and risk register, maintained by name owners.</li>
  <li>A policy framework aligned to EU AI Act, NIST AI RMF, ISO 42001, and NDPA 2023.</li>
  <li>Implementable controls and review gates integrated with your existing SDLC.</li>
  <li>Evidence readiness for internal audit, external audit, and regulator inspection.</li>
</ul>
""",
        "faqs": [
            {"q": "Do you handle EU AI Act compliance specifically?",
             "a": "Yes. We map systems to EU AI Act risk tiers, design the documentation and post-market monitoring obligations for high-risk systems, and help you decide where to reduce risk classification through design changes rather than accept the heavier compliance burden."},
            {"q": "How does this differ from a law firm's AI compliance work?",
             "a": "Law firms interpret the regulation. We operationalise it. Both roles matter. Our deliverables are the inventories, controls, model cards, and monitoring that turn the legal interpretation into something the engineering team can actually execute."},
            {"q": "Do you support ISO 42001 certification?",
             "a": "Yes. We prepare organisations for ISO 42001 audit — AIMS scoping, policy authoring, control implementation, internal audit, and remediation. We do not certify; we prepare you for the certifying body."},
            {"q": "Can you run a one-off audit rather than build a full programme?",
             "a": "Yes. A focused AI risk assessment — typically 4–6 weeks — is a common entry point, and often becomes the input to a broader governance engagement."},
            {"q": "How do you integrate governance with existing risk and compliance functions?",
             "a": "We treat AI governance as an extension of your existing risk operating model, not a parallel one. The goal is one risk register, one audit calendar, one escalation path — with AI-specific controls layered in."},
        ],
        "related": [
            ("/our-services/ai-strategy-advisory", "AI Strategy &amp; Advisory"),
            ("/our-services/ai-training-workforce-development", "AI Training &amp; Workforce Development"),
            ("/our-services/ai-agent-automation-engineering", "AI Agent &amp; Automation Engineering"),
        ],
    },

    "ai-training-workforce-development": {
        "headline": "AI Training &amp; Workforce Development",
        "lead": (
            "AI Training &amp; Workforce Development is the work of raising the AI "
            "literacy, fluency, and capability of an entire organisation — from the board "
            "to the frontline — so that AI investments actually land. Technology without "
            "capability is shelf-ware. We build the capability."
        ),
        "what": """
<p>The single most underfunded line item in enterprise AI programmes is the people who will have to use, supervise, or govern the systems being built. Without training, adoption stalls, misuse creeps in, and executives are unable to challenge the vendors and technical teams presenting to them.</p>
<p>We design training programmes that are role-specific and business-anchored. Executives learn to make AI investment decisions. Product and functional leaders learn to scope and own AI initiatives. Technical teams learn to build and operate AI systems under governance. Frontline teams learn to use AI tools safely inside their actual workflows.</p>
""",
        "how": """
<ol>
  <li><strong>Capability baseline.</strong> We measure current AI literacy and fluency by role, not by survey-filling. The baseline tells us where the programme has to focus.</li>
  <li><strong>Programme architecture.</strong> Role-based tracks — executive, manager, practitioner, frontline — with clear learning outcomes and assessment.</li>
  <li><strong>Curriculum design.</strong> Built around the organisation's actual use cases and tools, not generic "intro to AI" material.</li>
  <li><strong>Delivery.</strong> Instructor-led cohorts, blended learning, workshops, and — where helpful — custom-built simulation environments for hands-on practice.</li>
  <li><strong>Embedded coaching.</strong> For high-stakes roles (AI product owners, governance leads), we pair learners with senior Cognis practitioners during live project work.</li>
  <li><strong>Measurement.</strong> Pre/post assessment, behaviour-change indicators, and business-outcome linkage so leadership can see the programme working.</li>
</ol>
""",
        "who": """
<p>This work is for organisations that have tried "send a few people on a course" and found that the capability did not stick. Typical contexts:</p>
<ul>
  <li>A large-scale transformation where AI is a core pillar but the workforce was not part of the original plan.</li>
  <li>A regulated environment where EU AI Act Article 4 AI-literacy obligations now apply and the current programme does not meet them.</li>
  <li>A public-sector or development-finance mandate to build AI capability across a ministry, agency, or national programme.</li>
</ul>
""",
        "outcomes": """
<ul>
  <li>A workforce that can scope, own, use, and challenge AI work — at the right depth for each role.</li>
  <li>Documented AI-literacy evidence for EU AI Act Article 4 and equivalent obligations.</li>
  <li>A cohort of internal champions capable of sustaining the programme after we leave.</li>
  <li>Measurable shifts in adoption, safety, and the quality of AI decisions at executive level.</li>
</ul>
""",
        "faqs": [
            {"q": "Do you deliver executive-level AI training?",
             "a": "Yes. Executive programmes are typically 2–4 short sessions focused on investment decisions, governance, risk literacy, and how to interrogate vendor and technical claims. They are the highest-leverage training we run."},
            {"q": "Can you train at scale across thousands of employees?",
             "a": "Yes. We design tiered programmes where intensive cohort learning at the top is paired with broader-reach blended learning below. We have delivered organisation-wide programmes across African enterprises and public-sector bodies."},
            {"q": "Do you cover EU AI Act Article 4 AI-literacy obligations?",
             "a": "Yes. Article 4 compliance is a standard element of our programme design for organisations subject to the Act, including the evidence and record-keeping needed to demonstrate literacy across roles."},
            {"q": "Do you provide certification?",
             "a": "We issue Cognis attendance and assessment records. For formal certification, we partner with recognised bodies where clients need an externally verified credential."},
            {"q": "Can the programme be white-labelled for our academy?",
             "a": "Yes. We regularly license curriculum for delivery through client learning academies, with train-the-trainer support so your L&amp;D team can sustain it."},
        ],
        "related": [
            ("/our-services/ai-strategy-advisory", "AI Strategy &amp; Advisory"),
            ("/our-services/ai-governance-risk-compliance", "AI Governance, Risk &amp; Compliance"),
            ("/our-services/enterprise-digital-transformation", "Enterprise Digital Transformation"),
        ],
    },

    "enterprise-digital-transformation": {
        "headline": "Enterprise Digital Transformation",
        "lead": (
            "Enterprise Digital Transformation is the multi-year work of re-engineering how "
            "an organisation runs — processes, platforms, data, and operating model — with "
            "AI and modern software at the centre rather than bolted on. We lead "
            "transformations that actually finish."
        ),
        "what": """
<p>Digital transformation has a reputation for failing quietly. Programmes stretch, scope creeps, the target operating model is never quite ratified, and the business ends up with new technology layered on top of the old ways of working. The result costs more and delivers less than anyone planned for.</p>
<p>AI raises the stakes. The organisations that genuinely become AI-native will not be the ones that added an AI team to an otherwise unchanged structure — they will be the ones that redesigned processes around what AI makes possible, at the same time as they redesigned the platforms, the data, and the operating model.</p>
""",
        "how": """
<ol>
  <li><strong>Transformation thesis.</strong> A clear, defensible answer to "what does this organisation look like three years from now, and why." Without it, every downstream decision drifts.</li>
  <li><strong>Process re-engineering.</strong> End-to-end value streams redesigned around AI, automation, and modern software — not paved-cowpath digitisation.</li>
  <li><strong>Platform &amp; data architecture.</strong> Cloud, data, integration, and AI platform decisions sequenced against the transformation thesis.</li>
  <li><strong>Operating model redesign.</strong> Org, roles, funding, governance, vendor model, and talent strategy — the parts of transformation that usually fail are organisational, not technical.</li>
  <li><strong>Programme delivery.</strong> Portfolio structure, tranche planning, benefit tracking, and executive cadence that keeps momentum over multi-year horizons.</li>
  <li><strong>Change adoption.</strong> Workforce enablement, communications, and leadership development embedded from day one.</li>
</ol>
""",
        "who": """
<p>This work is for CEOs, CIOs, COOs, and transformation leaders accountable for a step change in how their organisation operates. Typical contexts:</p>
<ul>
  <li>Financial services, telecoms, and energy firms responding to new entrants, regulation, or margin compression.</li>
  <li>Public-sector bodies modernising citizen services under constrained fiscal envelopes.</li>
  <li>Post-merger integration where the integrated operating model needs to be digital and AI-native from the start.</li>
</ul>
""",
        "outcomes": """
<ul>
  <li>A transformation thesis the board owns and the organisation understands.</li>
  <li>Re-engineered value streams with measurable efficiency, quality, and customer-experience gains.</li>
  <li>A platform and data architecture capable of supporting the next decade of change.</li>
  <li>An operating model that sustains momentum past the external programme.</li>
</ul>
""",
        "faqs": [
            {"q": "How long are transformation engagements?",
             "a": "Transformations are multi-year programmes, but we structure them as 12–18 month tranches with clear deliverables and decision gates. Open-ended programmes are the pattern that fails; tranches are how you avoid it."},
            {"q": "Do you compete with the Big Four on transformation?",
             "a": "We often work alongside them. Our edge is AI-native design and deep African market context. Where clients want a more focused, senior-led team rather than a large leverage model, they choose us."},
            {"q": "Can you run the programme management office?",
             "a": "Yes — either as the primary PMO or in a senior advisory role alongside an internal or third-party PMO. We have done both."},
            {"q": "How do you measure transformation success?",
             "a": "Against business outcomes the board signs off at the start — cost, revenue, customer metrics, resilience, compliance — with leading indicators tracked monthly. We do not measure success in slides delivered."},
            {"q": "How do you handle legacy systems during transformation?",
             "a": "Pragmatically. Wholesale replacement is rarely the right answer. We sequence modernisation so legacy is progressively encapsulated, replaced, or retired — not big-banged."},
        ],
        "related": [
            ("/our-services/ai-strategy-advisory", "AI Strategy &amp; Advisory"),
            ("/our-services/ai-governance-risk-compliance", "AI Governance, Risk &amp; Compliance"),
            ("/our-services/ai-training-workforce-development", "AI Training &amp; Workforce Development"),
        ],
    },
}
