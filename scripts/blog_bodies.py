"""
New blog body content for the 3 replacement posts.
Stored here to keep rebuild_blog.py readable.
"""

# Body format: Framer rich-text JSON
# [1, [4,"tag",attrs,[5,"text"]], ...]

BODY_GOVERNANCE = (
    '[1,'
    '[4,"p",null,[5,"AI governance is not a compliance checkbox \u2014 it is the foundation that determines whether your AI investments build trust or create liability. For African enterprises operating across multiple regulatory jurisdictions, getting governance right from day one is not optional. It is the difference between scaling AI confidently and facing costly rollbacks."]],'
    '[4,"h3",null,[5,"1. The Regulatory Landscape Is Moving Faster Than You Think"]],'
    '[4,"p",null,[5,"The EU AI Act is already classifying AI systems by risk level, and any African enterprise selling into European markets must comply. Meanwhile, the African Union\u2019s Continental AI Strategy is setting continent-wide standards. Nigeria\u2019s NITDA, Kenya\u2019s Data Protection Act, and South Africa\u2019s POPIA are all shaping how AI can be deployed locally. Waiting for clarity is not a strategy \u2014 the frameworks are already here."]],'
    '[4,"h3",null,[5,"2. What Production-Ready AI Governance Actually Looks Like"]],'
    '[4,"p",null,[5,"Cognis Group builds governance into every engagement using a four-layer framework:"]],'
    '[4,"ul",null,'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Data governance: lineage tracking, consent management, and bias auditing at the dataset level"]]],'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Model governance: version control, performance monitoring, and drift detection in production"]]],'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Decision governance: human-in-the-loop review gates, audit trails, and rollback procedures"]]],'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Organisational governance: clear ownership, incident response protocols, and board-level reporting"]]]],'
    '[4,"h3",null,[5,"3. Why African Enterprises Have a Governance Advantage"]],'
    '[4,"p",null,[5,"Unlike enterprises in mature markets buried under decades of legacy AI debt, African organisations can build governance-first from day one. This is not a disadvantage \u2014 it is a structural edge. When your first AI system ships with audit trails, bias monitoring, and approval gates built in, you avoid the painful retrofitting that costs global enterprises millions."]],'
    '[4,"h3",null,[5,"4. The Business Case for Governance"]],'
    '[4,"p",null,[5,"Governance is not a cost centre. Enterprises with mature AI governance frameworks see faster regulatory approval, higher stakeholder trust, lower incident rates, and easier access to international markets. The question is not whether you can afford governance \u2014 it is whether you can afford to scale without it."]],'
    '[4,"p",null,[5,"Every Cognis Group engagement ships with governance built in, not bolted on. Because trust scales. Liability does not."]]]'
)

BODY_ROI = (
    '[1,'
    '[4,"p",null,[5,"The hardest question in enterprise AI is not \u201cwhat should we build?\u201d \u2014 it is \u201chow do we prove it worked?\u201d Most AI projects cannot answer this question because they never defined what \u201cworked\u201d means before they started. Cognis Group measures every engagement against four dimensions, and we publish the framework here so you can apply it to your own investments."]],'
    '[4,"h3",null,[5,"1. The Four Dimensions of AI ROI"]],'
    '[4,"p",null,[5,"We measure AI impact across four axes that together give a complete picture of business value:"]],'
    '[4,"ul",null,'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Hours saved: direct time returned to the organisation through automation of manual processes"]]],'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Error rates reduced: measurable decrease in human error, rework, and quality incidents"]]],'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Throughput gained: increased volume of work processed without proportional headcount growth"]]],'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Capability transferred: internal teams who can operate, maintain, and extend AI systems independently"]]]],'
    '[4,"h3",null,[5,"2. Why Most Enterprise AI Projects Cannot Show ROI"]],'
    '[4,"p",null,[5,"The failure pattern is consistent: teams build impressive demos, leadership gets excited, pilots launch \u2014 and then nothing measurable happens. The root cause is almost always the same: no baseline was established before the AI was deployed. Without a clear before-and-after measurement plan, even successful AI deployments cannot prove their value."]],'
    '[4,"h3",null,[5,"3. The Measurement Plan Ships Before the Model"]],'
    '[4,"p",null,[5,"At Cognis Group, the measurement plan is the first deliverable in every engagement \u2014 not the last. Before any model is trained or agent is built, we establish baselines: how long does this process take today? What is the current error rate? How many units move through this workflow per week? These numbers become the scorecard against which every AI intervention is judged."]],'
    '[4,"h3",null,[5,"4. Making ROI Visible to the CFO"]],'
    '[4,"p",null,[5,"AI ROI must be expressed in the language of finance, not data science. Hours saved multiplied by fully-loaded labour cost gives you a direct cost offset. Error reduction maps to rework costs avoided. Throughput gains translate to revenue capacity without proportional OpEx growth. When you frame AI impact this way, budget conversations change from \u201cshould we invest?\u201d to \u201cwhere do we invest next?\u201d"]],'
    '[4,"p",null,[5,"The framework is simple. The discipline to apply it consistently is what separates organisations whose AI delivers from those whose AI experiments."]]]'
)

BODY_NATIVE = (
    '[1,'
    '[4,"p",null,[5,"Every major enterprise technology wave \u2014 cloud, mobile, SaaS \u2014 has followed the same pattern: early adopters who build natively outperform late adopters who bolt the new technology onto legacy systems. AI is no different. And African enterprises have a structural advantage that most global competitors lack: the ability to build AI-native from the ground up."]],'
    '[4,"h3",null,[5,"1. The Leapfrog Opportunity Is Real"]],'
    '[4,"p",null,[5,"Africa leapfrogged landlines with mobile. It leapfrogged branch banking with M-Pesa and digital wallets. The same structural opportunity exists with AI. Enterprises in Lagos, Nairobi, and Johannesburg are not burdened with decades of legacy ERP systems, rigid data architectures, and institutional resistance to change. They can design AI-native workflows from day one \u2014 and many are."]],'
    '[4,"h3",null,[5,"2. What AI-Native Actually Means"]],'
    '[4,"p",null,[5,"AI-native is not about using ChatGPT. It means designing business processes where AI is a first-class participant, not an afterthought:"]],'
    '[4,"ul",null,'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Customer operations where AI agents handle intake, triage, and routing \u2014 with humans reviewing exceptions"]]],'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Financial workflows where document extraction, reconciliation, and compliance checks run autonomously"]]],'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"Supply chain systems where demand forecasting and inventory optimisation update in real time"]]],'
    '[4,"li",{"data-preset-tag":"p"},[4,"p",null,[5,"People operations where onboarding, training assessment, and performance tracking are AI-augmented"]]]],'
    '[4,"h3",null,[5,"3. What Cognis Group Sees on the Ground"]],'
    '[4,"p",null,[5,"Across our engagements in West Africa, East Africa, and Southern Africa, we see a consistent pattern: the enterprises that move fastest are the ones that skip the \u201cpilot purgatory\u201d phase entirely. They pick one high-value workflow, deploy an AI agent into production within weeks, measure the impact, and expand. No innovation labs. No eighteen-month roadmaps. Just deployed, measured, working AI."]],'
    '[4,"h3",null,[5,"4. The Risk of Being AI-Adjacent"]],'
    '[4,"p",null,[5,"The alternative \u2014 being AI-adjacent \u2014 means bolting AI tools onto workflows designed for humans. It produces marginal gains at best and expensive disappointment at worst. AI-adjacent organisations treat AI as a feature. AI-native organisations treat it as an operating principle. The gap between them will only widen."]],'
    '[4,"p",null,[5,"Africa\u2019s enterprises have the chance to build AI-native from the start. The window is open now. Cognis Group exists to help you walk through it."]]]'
)
