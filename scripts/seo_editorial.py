"""Reviewed editorial content for the September 2026 audit remediation."""
MICROSOFT = 'https://aka.ms/AIDiffusionReport2025H2'
MASTERCARD = 'https://www.mastercard.com/news/media/ue4fmcc5/mastercard-ai-in-africa-2025.pdf'

def link(url, label): return f'<a href="{url}">{label}</a>'

RESEARCH = {
 'Key numbers': f'''<h2>Read the measures in context</h2><div class="seo-metrics">
 <p><strong>$16.53B</strong>Projected African AI market in 2030 — {link(MASTERCARD,'Mastercard, 2025')}.</p>
 <p><strong>27.42%</strong>Projected annual market growth in that report; a forecast, not a realised return.</p>
 <p><strong>21.1%</strong>South Africa’s estimated AI diffusion in H2 2025 — {link(MICROSOFT,'Microsoft, January 2026')}.</p>
 <p><strong>16.3%</strong>Worldwide diffusion in the same period; this measures people’s use of generative AI, not enterprise deployment.</p></div>''',
 'The Opportunity': f'''<h2>How big is Africa’s AI opportunity?</h2>
 <p>{link(MASTERCARD,'Mastercard’s AI in Africa 2025 report')} projects a $16.53 billion African AI market by 2030, with 27.42% compound annual growth. These are market forecasts. They do not measure the value an individual organisation will realise.</p>
 <p>For a buyer, a more useful starting point is a specific process: how often it runs, what it costs, where errors occur and whether staff can safely use the result. A large market projection cannot substitute for that business case.</p>''',
 'Real Adoption': f'''<h2>How widely are African enterprises actually adopting AI?</h2>
 <p>There is no single comparable enterprise adoption rate established by the sources used here. {link(MICROSOFT,'Microsoft’s H2 2025 report')} estimates South Africa’s AI diffusion at 21.1%, up from 19.3% in H1. Its global figure is 16.3%. The report estimates use of generative AI among the working-age population using adjusted telemetry; it does not count organisations with production deployments.</p>
 <p>Enterprise tool access, staff experimentation, a supervised pilot and a production system are different stages. When assessing a supplier or an internal programme, ask which stage its adoption figure measures, which population was sampled and when the measurement happened.</p>''',
 'The Gaps': '''<h2>What should an organisation check before deploying AI?</h2>
 <p>Cognis recommends checking five practical constraints: access to representative data, reliable infrastructure, staff capability, clear operational ownership and appropriate safeguards. These are delivery considerations, not a ranked survey of African enterprises.</p>
 <p>Document the process owner, permitted data, human review points, failure handling and operating budget before development. Test with realistic examples, including local language and connectivity conditions where they matter. Agree who can pause the system if quality drops.</p>''',
 'What Works': '''<h2>How should an enterprise measure whether AI works?</h2>
 <p>Measure the existing workflow first, then compare a supervised deployment against it. Record task volume, handling time, errors, review effort and operating costs over comparable periods. Keep the same task definition and explain any change in the mix of work.</p>
 <p><strong>Illustrative calculation, not a client result:</strong> 1,000 tasks per month at 12 minutes each require 200 hours. Reducing handling time to eight minutes saves about 67 gross hours. If review and maintenance take 20 hours, the net saving is about 47 hours. Convert that capacity to financial value only when the organisation can actually use it; subtract software and implementation costs separately.</p>
 <p>See our <a href="/case-studies/">delivery case studies</a> for first-party examples and their evidence limitations. Results from one engagement are not a forecast for another.</p>''',
 'Sources': f'''<h2>Sources, method and corrections</h2>
 <p>Reviewed 8 September 2026. This is a synthesis of public research and Cognis’s delivery recommendations, not an original representative survey. Forecasts, population estimates and enterprise outcomes have different denominators and must not be treated as interchangeable.</p>
 <ul><li>{link(MASTERCARD,'Mastercard: AI in Africa 2025')} — market forecast.</li>
 <li>{link(MICROSOFT,'Microsoft: Global AI Adoption in 2025, published January 2026')} — H2 diffusion estimates and methodology; South Africa appears in the appendix.</li></ul>
 <p><strong>Correction:</strong> the previous version incorrectly stated that every measured African country was below 20% adoption. South Africa was at 21.1% in the cited H2 report. Other statistics and Cognis improvement ranges without sufficient supporting references or measurement methods have been removed.</p>
 <p>Originally published 24 July 2026. For questions or corrections, <a href="/contact/">contact Cognis Group</a>.</p>''',
}

RELATED = {
 '/our-services/': ('AI services across Africa', [('/ai-consulting-nigeria/','AI consulting in Nigeria'),('/ai-consulting-south-africa/','AI consulting in South Africa'),('/ndpa-compliant-ai/','Planning AI with Nigerian data protection requirements')]),
 '/blog/': ('Research and buyer guidance', [('/research/state-of-ai-african-enterprises-2026/','The state of AI in African enterprises'),('/best-ai-consulting-firms-africa/','Choosing an AI delivery partner in Africa')]),
 '/blog/ai-governance-africa-2026/': ('Put governance into practice', [('/ndpa-compliant-ai/','AI and Nigerian data protection'),('/our-services/ai-agent-automation-engineering/','Engineering AI with human oversight')]),
}

FIRMS = [
 ('Cognis Group','/our-services/','Strategy, workforce training and agent engineering','An integrated engagement with a senior delivery team','Ask for a comparable deployment and agreed acceptance tests.'),
 ('InstaDeep','https://instadeep.com/','AI research and decision-making systems','Specialist technical and optimisation work','Ask about your domain, data requirements and delivery scope.'),
 ('DataProphet','https://dataprophet.com/','AI for manufacturing processes','Production and process optimisation','Ask about plant integration and measured process outcomes.'),
 ('Sama','https://www.sama.com/','Data annotation and model evaluation','Preparing and evaluating AI data','Ask about quality controls, data rights and evaluation design.'),
 ('Aerobotics','https://aerobotics.com/','Agricultural intelligence and yield estimation','Fruit-production decisions','Ask about crop coverage and validation in your growing conditions.'),
 ('Deloitte','https://www.deloitte.com/ng/en/issues/africa-ai.html','AI strategy, governance and implementation','Broader enterprise advisory and transformation','Ask which local team will deliver and who owns the resulting system.'),
]

def comparison():
    rows=''.join(f'<tr><th scope="row">{link(url,name)}</th><td>{focus}</td><td>{fit}</td><td>{question}</td></tr>' for name,url,focus,fit,question in FIRMS)
    return '''<h2>Compare providers against the work you need</h2><p>Cognis publishes this editorial shortlist and is included in it. It is not an independent ranking, exhaustive market study or endorsement by the firms listed. Provider links identify their published focus; the fit and procurement questions below are our editorial interpretation. Confirm current availability, location and scope directly.</p><div class="seo-table" role="region" aria-label="Provider comparison" tabindex="0"><table><thead><tr><th>Provider and source</th><th>Published focus</th><th>Potential fit</th><th>Evidence to request</th></tr></thead><tbody>'''+rows+'''</tbody></table></div><p>Sources reviewed 8 September 2026. Compare the actual proposed team, reference work, data controls, evaluation plan, total cost and handover terms. See the <a href="/research/state-of-ai-african-enterprises-2026/">research context</a> and our <a href="/ai-consulting-south-africa/">South Africa engagement guide</a>.</p>'''
