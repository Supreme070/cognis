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
            ("/our-services/ai-agent-automation-engineering", "AI Agent &amp; Automation Engineering"),
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
            ("/our-services/ai-training-workforce-development", "AI Training &amp; Workforce Development"),
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
            ("/our-services/ai-agent-automation-engineering", "AI Agent &amp; Automation Engineering"),
        ],
    },

}

# Plain-English service copy. The public names remain unchanged for search
# relevance, while the explanations are written for business leaders first.
SERVICES["ai-strategy-advisory"].update({
    "lead": "AI Strategy &amp; Advisory answers five practical questions: where can AI help, what is ready now, what should happen first, who will own it, and how will success be measured? You receive a clear plan that leaders can approve and delivery teams can follow.",
    "what": """
<p>Many AI plans begin with technology and only later ask which business problem it should solve. That creates expensive trials that never become part of everyday work.</p>
<p>We begin with your goals, processes, people, data and risks. We then identify the opportunities worth funding and turn them into a practical plan with clear owners, costs, controls and measures of success.</p>
""",
    "how": """
<ol>
  <li><strong>Check what is ready.</strong> We review your data, systems, people and existing rules against the work you want to improve.</li>
  <li><strong>Choose the right opportunities.</strong> We rank ideas by business value, cost, difficulty, speed and risk.</li>
  <li><strong>Agree how the work will run.</strong> We define who funds, owns, approves and measures each AI project.</li>
  <li><strong>Build the roadmap.</strong> You receive a phased plan with named owners, dependencies and decision points.</li>
  <li><strong>Prepare leaders to decide.</strong> We provide a clear investment case, expected results and a plain view of the risks.</li>
</ol>
""",
    "who": """
<p>This service is for boards and leadership teams that need to make confident AI decisions. It is especially useful when an earlier trial stalled, regulations affect the next step, a new leader needs an independent view, or a wider change programme depends on AI.</p>
""",
    "outcomes": """
<ul>
  <li>An AI strategy with agreed priorities, owners and investment ranges.</li>
  <li>A 12–24 month plan based on what your organisation can realistically deliver.</li>
  <li>Clear rules for approving, managing and reviewing AI.</li>
  <li>A repeatable way to judge future AI investments without depending on us.</li>
</ul>
""",
    "faqs": [
        {"q": "How long does an AI strategy engagement take?", "a": "Most engagements take 8–14 weeks. We first assess what is ready, then agree priorities, ownership and controls before presenting the final plan to leadership."},
        {"q": "Do you build the AI systems you recommend?", "a": "Yes, if you want us to. You can use Cognis for the strategy only, the build only, or the full journey. Our advice is based on what the organisation needs."},
        {"q": "What makes the Cognis approach practical?", "a": "Every recommendation names the business problem, owner, data, cost, risk controls and measure of success. The result is a plan your team can act on."},
        {"q": "Which laws and standards do you consider?", "a": "Where relevant, we work with Nigeria's Data Protection Act, the EU AI Act, ISO 42001, NIST's AI Risk Management Framework and sector-specific rules. We explain what each one means for your plan."},
        {"q": "Can you advise whether to buy or build an AI platform?", "a": "Yes. We compare buying, building and combining both options against your needs, data-location rules, budget and in-house skills."},
        {"q": "Do you work with organisations outside Africa?", "a": "Yes. We are based in Lagos and work across Africa and beyond, especially where organisations need strong local understanding alongside global AI expertise."},
    ],
})

SERVICES["ai-training-workforce-development"].update({
    "lead": "AI Training &amp; Workforce Development helps people use AI safely and confidently in the work they already do. Leaders learn how to make sound decisions, managers learn how to guide adoption, and teams learn practical ways to save time, improve quality and work more efficiently.",
    "what": """
<p>AI tools do not create value simply because an organisation buys them. People need to know when to use them, how to check their work and when a human decision is still required.</p>
<p>Our training is built around each role and the organisation's real tasks. AI is not about taking people's jobs; it is about helping people work better and more efficiently.</p>
""",
    "how": """
<ol>
  <li><strong>Understand current skills.</strong> We check what each group already knows and where support is needed.</li>
  <li><strong>Create role-based learning.</strong> Leaders, managers, specialists and wider teams receive the depth they need.</li>
  <li><strong>Use real work.</strong> Lessons and exercises are based on your processes and approved tools.</li>
  <li><strong>Teach in practical formats.</strong> We combine live sessions, workshops, guided practice and digital learning.</li>
  <li><strong>Support key people.</strong> Product owners and governance leads can work with senior Cognis specialists during live projects.</li>
  <li><strong>Measure the result.</strong> We compare knowledge, behaviour and business results before and after training.</li>
</ol>
""",
    "who": """
<p>This service is for organisations that need more than a one-off introduction to AI. It suits major change programmes, regulated organisations with staff-knowledge duties, and public institutions building skills across a ministry, agency or national programme.</p>
""",
    "outcomes": """
<ul>
  <li>People who can use, check and manage AI at the right level for their role.</li>
  <li>Training records that support relevant AI-literacy requirements.</li>
  <li>Internal champions who can continue the programme after handover.</li>
  <li>Measurable improvement in safe use, confidence and decision quality.</li>
</ul>
""",
    "faqs": [
        {"q": "Do you deliver AI training for executives?", "a": "Yes. Executive programmes usually run across 2–4 short sessions covering investment decisions, oversight, risk and how to question supplier or technical claims."},
        {"q": "Can you train thousands of employees?", "a": "Yes. We combine focused sessions for leaders and specialists with practical learning for the wider workforce, then train internal champions to keep the programme going."},
        {"q": "Do you cover EU AI Act Article 4?", "a": "Yes, where it applies. Article 4 requires organisations to take steps so staff have enough knowledge to use AI responsibly. We build suitable learning, assessment and records into the programme."},
        {"q": "Do you provide certificates?", "a": "We provide Cognis attendance and assessment records. If formal external certification is required, we can work with a recognised certification body."},
        {"q": "Can our learning team deliver the programme later?", "a": "Yes. We can provide the curriculum under your organisation's brand and train your internal facilitators to deliver it."},
    ],
})

SERVICES["ai-agent-automation-engineering"].update({
    "lead": "An AI agent is a tool that can complete agreed steps in a process, such as reading documents, preparing a report, checking information or routing a request. We build these tools with clear limits, human approval where needed and records of every important action.",
    "what": """
<p>AI tools often fail outside a demonstration because they were not designed for real users, imperfect data, system errors or high-risk decisions.</p>
<p>We build AI agents as dependable business systems. We test them on real tasks, limit what they can do, record their actions and make sure people can review, correct or stop them.</p>
""",
    "how": """
<ol>
  <li><strong>Map the work.</strong> We break the process into steps and identify which decisions are safe to support or automate.</li>
  <li><strong>Connect the right systems.</strong> We define which tools and data the AI may use and what happens if a connection fails.</li>
  <li><strong>Test before choosing technology.</strong> We create a set of real tasks and correct answers so quality can be measured.</li>
  <li><strong>Set safety rules.</strong> Clear permissions and approval limits sit between the AI and any action it can take.</li>
  <li><strong>Record and improve.</strong> Important actions are logged so the team can investigate problems and improve performance.</li>
  <li><strong>Launch in stages.</strong> The system first works in the background, then under human review, and only gains more freedom when the evidence supports it.</li>
</ol>
""",
    "who": """
<p>This service is for organisations with high-volume, multi-step work that takes too much time or creates avoidable errors. It is particularly useful in customer service, finance, operations, public services and other regulated work where human control and a clear record matter.</p>
""",
    "outcomes": """
<ul>
  <li>A working AI tool with agreed measures for quality, speed and cost.</li>
  <li>A reusable set of tests your team can continue after handover.</li>
  <li>Clear rules for what the system may do and when a person must decide.</li>
  <li>Monitoring that shows what happened, why it happened and what needs attention.</li>
</ul>
""",
    "faqs": [
        {"q": "Which AI models do you work with?", "a": "We work with leading models including Claude, GPT, Gemini, Llama, Mistral and Qwen. We test the best options against your task, data-location needs and budget before choosing."},
        {"q": "Can our data stay in Nigeria or in our own systems?", "a": "Yes. Where law or policy requires it, we can use suitable local, private-cloud or on-site options and design data access around those limits from the start."},
        {"q": "Which agent-building tools do you use?", "a": "We use tools such as LangGraph, CrewAI, provider agent services or custom software when they fit. The right choice depends on the work, existing systems and level of control required."},
        {"q": "How do you reduce incorrect AI answers?", "a": "We limit the task, use approved sources, require checks before important actions and test the full system on real examples. A person reviews decisions where the risk is too high for automation."},
        {"q": "Do you monitor the system after launch?", "a": "Yes. Monitoring for quality, speed, cost, rule breaches and human corrections is part of the build. Ongoing support is also available."},
        {"q": "How long does it take to launch an AI agent?", "a": "A focused tool for a well-defined process usually takes 10–16 weeks to reach supervised use. Larger or more regulated systems take longer because connections, approvals and safety evidence require more work."},
    ],
})
