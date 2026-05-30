export const meta = {
  name: 'cognis-deep-site-audit',
  description: 'Multi-persona live-site QA/UX/perf/e2e audit of www.cognis.group with Playwright, synthesized into a prioritized REPORT.md',
  phases: [
    { title: 'Test', detail: '28 persona agents drive the live site with Playwright and log evidence-backed findings to disk' },
    { title: 'Synthesize', detail: 'Dedupe + prioritize all findings into test-results/site-audit/REPORT.md' },
  ],
}

const SITE = 'https://www.cognis.group'
const REPO = 'C:\\Users\\supre\\cognis'
const PAGES = [
  '/', '/about-us/', '/our-services/',
  '/our-services/ai-strategy-advisory/', '/our-services/ai-training-workforce-development/', '/our-services/ai-agent-automation-engineering/',
  '/products/', '/why-cognis/',
  '/blog/', '/blog/why-most-enterprise-ai-strategies-fail-before-they-start/', '/blog/building-ai-agents-that-actually-ship/',
  '/blog/ai-governance-is-not-optional/', '/blog/ai-native-operations-for-african-enterprises/', '/blog/making-your-workforce-ai-ready/', '/blog/the-real-roi-of-ai/',
  '/case-studies/', '/case-studies/marketsage/', '/case-studies/ai-training-programme/', '/case-studies/claims-processing-automation/',
  '/contact/', '/faq/', '/how-we-work/',
  '/teams/supreme-oyewumi/', '/teams/kola-olatunde/', '/teams/fisayo-oludare/',
  '/privacy-policy/', '/terms/', '/thanks/', '/thanks-subscribe/',
]

const SUMMARY_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    label: { type: 'string' },
    findingsFile: { type: 'string' },
    total: { type: 'integer' }, critical: { type: 'integer' }, high: { type: 'integer' }, medium: { type: 'integer' }, low: { type: 'integer' },
    topIssues: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['label', 'findingsFile', 'total', 'topIssues'],
}

const REPORT_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    reportPath: { type: 'string' },
    totalFindings: { type: 'integer' }, critical: { type: 'integer' }, high: { type: 'integer' }, medium: { type: 'integer' }, low: { type: 'integer' },
    themes: { type: 'array', items: { type: 'string' } },
    topPriorities: { type: 'array', items: { type: 'string' } },
    executiveSummary: { type: 'string' },
  },
  required: ['reportPath', 'executiveSummary', 'topPriorities'],
}

function common(label, persona) {
  return [
    `You are a ${persona}. Audit the LIVE production site ${SITE}. Be adversarial, meticulous, and HONEST — report only issues you actually observe with evidence; never invent.`,
    ``,
    `ENVIRONMENT: You have Bash. Node + Playwright (chromium) are installed in ${REPO}. Always run from that directory.`,
    `TOOL 1 (preferred) — shared harness:`,
    `  node tests/probe.mjs '<journeyJSON>' test-results/site-audit/evidence/${label}`,
    `  journeyJSON = {"name":"${label}","viewport":{"width":1440,"height":900},"steps":[ ... ]}`,
    `  step actions: {"action":"goto","url":"/about-us/"}, {"action":"click","text":"Products"} or {"selector":"a.x"}, {"action":"back"}, {"action":"forward"}, {"action":"reload"}, {"action":"hover","text":"..."}, {"action":"scroll","to":"bottom"}, {"action":"viewport","size":{"width":390,"height":844}}, {"action":"wait","ms":1500}`,
    `  It writes report.json + per-step screenshots and prints a JSON summary (console errors, "seizes" = main-thread freeze, navErrors). Read screenshots with the Read tool to SEE problems.`,
    `TOOL 2 — custom Playwright: write your own ESM script to tests/_agent_${label}.mjs (import { chromium } from 'playwright') for interactions the harness can't express.`,
    `ROOT CAUSE: Read source under ${REPO} to explain WHY issues happen. Key files: index.html (large inline SPA + hero/nav/form scripts), products/index.html and why-cognis/index.html (hand-built shells — these do NOT use the global Framer header), scripts/inject_*.py (post-process injectors), our-services/* and blog/* snapshots.`,
    `KNOWN REPORTED ISSUES — verify, reproduce, and evidence each: (a) Framer sometimes seizes/freezes; (b) navigating Products -> Home makes the layout "scatter"; (c) the Products page header was built separately and does NOT match the global header (it should use the global Framer header); (d) testimonials on about/service pages are broken — white space inside them, they scroll too fast.`,
    ``,
    `OUTPUT: Write a JSON array of findings to test-results/site-audit/findings/${label}.json. Each finding = {"id","title","severity":"critical|high|medium|low","area","persona":"${label}","affectedPages":[],"reproSteps":[],"evidence":{"screenshots":[],"console":[],"metrics":{}},"rootCauseHypothesis","suggestedFix","confidence"}. Use REAL screenshot paths you generated and REAL console snippets. Then return the StructuredOutput summary (set findingsFile to that path).`,
    `Severity guide: critical = broken/blocking or data-affecting; high = clearly wrong & user-visible; medium = noticeable polish/UX; low = minor. Dedupe within your own list. Quality over quantity.`,
  ].join('\n')
}

// ---- build the 28 persona specs ----
const specs = []
function slice(arr, n, i) { const per = Math.ceil(arr.length / n); return arr.slice(i * per, (i + 1) * per) }

// Functional QA / SDET (6) — every link/button/form across page slices
for (let i = 0; i < 6; i++) {
  const pages = slice(PAGES, 6, i)
  specs.push({ label: `qa-func-${i + 1}`, persona: 'senior QA / SDET functional tester',
    body: `FOCUS: On these pages, enumerate and exercise EVERY link, button, nav item, footer link, CTA, and in-page anchor. Verify: nothing 404s, each link lands on the correct destination, external links (ai.cognis.group, marketsage, migratio) are correct + open in new tab with rel=noopener, in-page anchors scroll to the right section, footer + header links consistent. For any form on these pages, check required-field validation, labels, hidden fields, and the action target — but DO NOT actually submit (it emails the client). Pages: ${JSON.stringify(pages)}.` })
}
// E2E / synthetic journeys (5)
specs.push({ label: 'e2e-contact-funnel', persona: 'E2E tester (conversion funnel)', body: `FOCUS: Run the lead funnel: home -> Services -> a service detail -> Contact. On contact, test the form WITHOUT final submit: required validation, email format, that hidden Web3Forms fields (access_key, redirect, subject) get wired, button label. Also test the newsletter/subscribe form similarly. Report anything that would lose a lead.` })
specs.push({ label: 'e2e-scatter-repro', persona: 'E2E tester (navigation stability)', body: `FOCUS: Reproduce the "scatter" bug. Run home -> Products -> Home repeatedly (>=5 cycles) and also Products->Home via different links; capture screenshots each step and watch for layout scatter/broken rendering, plus console errors at the moment it scatters. Note that clicking "Home" on the Products page may fail (its header differs) — document that too. Try multiple viewports.` })
specs.push({ label: 'e2e-seize-hopper', persona: 'E2E tester (stress navigation)', body: `FOCUS: Rapidly hop every primary nav item in sequence, twice, with short waits, then back/forward many times, to trigger Framer "seize"/freeze. Use the harness "seizes" output + responsiveness. Capture when/where it freezes and console state. Try on desktop and mobile widths.` })
specs.push({ label: 'e2e-blog-journeys', persona: 'E2E tester (content browsing)', body: `FOCUS: From /blog/ open each of the 6 posts and return; also deep-link directly into 3 posts. Verify article content renders, images load, back works, and SPA nav doesn't break. Check case-studies the same way.` })
specs.push({ label: 'e2e-deeplink-hydration', persona: 'E2E tester (deep links + hydration)', body: `FOCUS: Direct-load each major route (home, about, services, a service detail, products, why-cognis, blog, a post, contact) and then SPA-navigate around from each. Watch for hydration flashes, content that loads then "scatters", canonical/scroll-position bugs, and the hero behaving differently on direct vs SPA load.` })
// UI/UX + designer (5)
specs.push({ label: 'ux-header-consistency', persona: 'UI/UX tester + design-system reviewer', body: `FOCUS: Compare the HEADER across ALL pages, especially /products/ and /why-cognis/ vs the global Framer header (home, about, services, blog). Document every mismatch: logo, nav items + order (does Products appear? does it match?), typography, spacing, height, background, sticky behavior, hover states, mobile hamburger. Confirm products/why-cognis use a hand-built header instead of the global one and detail the exact differences with side-by-side screenshots. Read products/index.html to confirm.` })
specs.push({ label: 'ux-testimonials', persona: 'UI/UX tester (components)', body: `FOCUS: Inspect testimonials on home AND on about/service pages. Verify: broken white-space inside cards, missing/placeholder logos, carousel scroll SPEED (measure — is it too fast?), readability, the quote marks, autoplay/pacing, and whether the home version differs from the service-page version. Capture screenshots and measure scroll/animation timing.` })
specs.push({ label: 'ux-responsive', persona: 'UI/UX responsive tester', body: `FOCUS: Across breakpoints 1512, 1280, 1024, 834, 768, 390 on home, services, a service detail, products, blog post, contact: find layout breaks, horizontal overflow, overlapping elements, hero text/card overlap, clipped content, tiny tap targets, broken grids. Screenshot each break.` })
specs.push({ label: 'ux-visual-polish', persona: 'UX designer (visual craft)', body: `FOCUS: Hunt visual-craft defects: placeholder/filler copy (e.g. "Quod Tango Muto" Latin), inconsistent spacing/alignment, typography scale issues, color/contrast oddities, broken or low-res images, missing hover/focus affordances, jarring transitions, z-index glitches. Be a perfectionist designer.` })
specs.push({ label: 'ux-a11y', persona: 'accessibility (a11y) specialist', body: `FOCUS: Keyboard navigation (tab order, focus visibility, skip links), image alt text, color contrast on hero/over-video text, heading hierarchy, ARIA on nav/carousel/forms, motion (carousel respects reduced-motion?), form labels. Report WCAG-relevant issues.` })
// Performance (4)
specs.push({ label: 'perf-load', persona: 'frontend performance engineer', body: `FOCUS: Measure cold-load on home, services, a service detail, products, a blog post: total transfer, request count, TTFB, FCP, approximate LCP, render-blocking, oversized images (note exact URLs/sizes), the hero video. Quantify and rank the worst offenders.` })
specs.push({ label: 'perf-jank-seize', persona: 'performance QA (runtime)', body: `FOCUS: Runtime jank + the Framer "seize". Use the harness longtask counts + responsiveness across interactions and scrolling; reproduce freezes; capture long-task counts and what triggers them (carousel, hero video sync, MutationObservers). Inspect index.html inline scripts for busy loops/observers as root cause.` })
specs.push({ label: 'perf-nav-thrash', persona: 'performance engineer (SPA)', body: `FOCUS: Cost of SPA navigation; reproduce the Products->Home "scatter" from a perf lens (layout thrash / reflow / re-hydration). Measure memory growth across 15+ navigations (look for leaks from observers/intervals added per page). Identify duplicated work.` })
specs.push({ label: 'perf-mobile', persona: 'mobile performance engineer', body: `FOCUS: Mobile (390x844) with CPU/network closer to real devices if possible. Load + interaction perf, the hamburger, scroll smoothness, the testimonials carousel on mobile, image weight on mobile. Quantify.` })
// Real users (5)
for (let i = 0; i < 5; i++) {
  specs.push({ label: `realuser-${i + 1}`, persona: 'panel of 10 realistic end users (simulate distinct personas)',
    body: `FOCUS: Simulate ~10 DISTINCT real users (vary by goal + device + patience), e.g. enterprise buyer skimming services, a candidate checking the team page, a journalist scanning the blog, a mobile user on a flaky connection, an impatient rage-clicker, someone hunting pricing, someone trying to contact sales, a returning visitor using back/forward a lot, a keyboard-only user, a skeptic checking case studies. For each, run a realistic journey with the harness and note ANYTHING confusing, broken, slow, or trust-eroding (dead ends, placeholder copy, layout breaks, freezes). Tag findings with which user persona hit them. Batch number ${i + 1}/5 — bias toward personas/journeys the other batches likely won't cover.` })
}
// Frontend / technical (2)
specs.push({ label: 'fe-console-hydration', persona: 'frontend engineer (diagnostics)', body: `FOCUS: Exhaustively capture console errors/warnings + pageerrors across ALL ${PAGES.length} routes (direct load + a couple SPA navs). Quantify the Framer "recoverable error" hydration warnings and pin root causes in code (which injected scripts mutate inside the React root). Diagnose the Products->Home scatter at the DOM level. Read index.html + scripts/inject_*.py.` })
specs.push({ label: 'fe-network', persona: 'frontend engineer (network)', body: `FOCUS: Network integrity across routes: 404/aborted assets (the ERR_ABORTED Framer images), broken/oversized media, redirect correctness (retired service slugs in _redirects), caching headers, mixed external calls (web3forms). List exact failing URLs and impact.` })
// PM (1)
specs.push({ label: 'pm-holistic', persona: 'senior product manager', body: `FOCUS: Holistic product + content + trust review across the site: messaging clarity, ANY placeholder/filler/Latin copy, inconsistent naming/branding, weak or missing CTAs, conversion blockers, broken trust signals, and overall coherence. Provide a product-level prioritization view (what hurts conversion/credibility most).` })

log(`Launching ${specs.length} persona testers against ${SITE}`)
phase('Test')
const summaries = await parallel(specs.map((s) => () =>
  agent(common(s.label, s.persona) + '\n\n' + s.body, { label: s.label, phase: 'Test', schema: SUMMARY_SCHEMA })
))
const ok = summaries.filter(Boolean)
const files = ok.map((s) => s.findingsFile).filter(Boolean)
const totalReported = ok.reduce((n, s) => n + (s.total || 0), 0)
log(`Collected ${ok.length}/${specs.length} agent reports, ~${totalReported} raw findings`)

phase('Synthesize')
const synthPrompt = [
  `You are the lead engineer + QA manager consolidating a large multi-persona audit of ${SITE}.`,
  `All agent findings are JSON files under test-results/site-audit/findings/ in ${REPO}. Read them (Bash: list the dir, then Read each; there are ~${files.length}). Evidence screenshots are under test-results/site-audit/evidence/<label>/ and test-results/site-audit/.`,
  `Known finding files: ${JSON.stringify(files)}.`,
  ``,
  `TASK: Deduplicate and CLUSTER findings across agents (many will overlap). Assign each cluster a global severity and a priority. Group into themes such as: Navigation stability / Framer seize, Products->Home "scatter", Header consistency (Products/why-cognis vs global), Testimonials, Performance (load + jank), Hydration/console errors, Network/assets, Responsive/layout, Accessibility, Content/placeholder copy, Forms/conversion. Make sure you explicitly cover the four user-reported issues.`,
  `Write a thorough, engineering-ready report to test-results/site-audit/REPORT.md with: (1) Executive summary; (2) Severity counts; (3) A prioritized fix backlog (P0/P1/P2) with, for each item: title, severity, affected pages, evidence (screenshot paths + console snippets), root-cause hypothesis, and a concrete recommended fix + rough effort; (4) Per-theme detail sections; (5) An appendix listing which agents/evidence support each major item.`,
  `Be precise and cite real evidence paths. Do not invent issues not present in the findings. Then return the StructuredOutput summary (reportPath = test-results/site-audit/REPORT.md).`,
].join('\n')
const report = await agent(synthPrompt, { label: 'synthesize', phase: 'Synthesize', schema: REPORT_SCHEMA })
return { report, agentsCompleted: ok.length, totalAgents: specs.length, rawFindings: totalReported }
