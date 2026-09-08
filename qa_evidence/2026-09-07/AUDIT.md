Cognis Group — SEO, GEO, AEO and AI search audit
================================================

**Audit date: 7 September 2026. Verdict: strong basic crawlability, but not yet excellent overall.** The most consequential gaps are disconnected commercial/research pages, unsupported or inconsistent proof, a factual error in the research flagship, and an inconsistent product destination. More crawler names or schema would not solve these problems.

This is an audit of the live `https://cognis.group` site and the local project. SEO means conventional search discovery and performance; GEO means visibility in generative answers; AEO means answer engine optimization. “AIO” is ambiguous, so this audit covers both Google AI Overviews/AI Mode and broader AI search readiness. These overlap substantially. No search engine provides a universal “GEO score.” The assessments below are editorial judgments, not Lighthouse scores or measured rankings.

| Area | Assessment | Evidence |
|---|---|---|
| Crawlability and indexability | Strong | All 41 sitemap pages return 200, have self-canonicals, and allow indexing |
| Metadata and HTML content | Strong foundation | 41 distinct titles, descriptions and single H1s; meaningful content in initial HTML |
| Internal discovery | Material gap | Five important pages form a group unreachable from the homepage through the audited HTML links |
| Structured data | Needs correction | JSON parses, but 28 pages retain six-service catalogs; FAQ and article metadata drift |
| Helpful answers | Good foundation | Clear definitions, service deliverables, FAQs and named expert posts |
| Evidence and citation quality | Needs substantial work | One verified research error, incomplete citations, unexplained homepage metrics |
| Entity and local presence | Partial | Company/person schema exists, but public brand ambiguity and incomplete office details remain |
| Performance and mobile experience | Unverified, with code risks | Heavy service templates; no current browser trace or field CWV data available |
| Actual search/AI visibility | Partly observed, not measured | Public search returns Cognis pages; no Search Console, Bing or conversion account data inspected |

**Scope and verification.** Parsed 45 local HTML pages, fetched every live sitemap URL plus robots/AI files, checked representative host and path redirects, tested a nonexistent path, compared local/live content, inspected schema semantics, mapped internal links, checked local image references, sampled public product endpoints and resource headers, tested six crawler user-agent strings on two page templates, and checked selected research claims against primary sources. Raw responses, parsed records, DNS evidence and scripts sit beside this report. [Page inventory](page-inventory.csv) has one row per live sitemap page; [summary](summary.json) includes the link graph.

HTTP requests came from this audit environment, not verified search-bot IPs. User-agent tests cannot certify CDN/WAF behavior for real crawlers. This is not a complete backlink analysis, a ranking survey, an authenticated indexing audit, or a legal review. No site source, DNS, account settings or deployment was changed. Existing careers and sitemap edits were preserved.

**1. High priority: five valuable pages are disconnected from the main site’s HTML navigation.**

The live internal-link graph reaches 36 of 41 sitemap pages from the homepage. The five exceptions have links from one another, but no incoming HTML link from the reachable part of the site:

| Page | Incoming page(s) within the audited site |
|---|---|
| `/best-ai-consulting-firms-africa/` | South Africa page and research report |
| `/research/state-of-ai-african-enterprises-2026/` | Buyer’s guide |
| `/ai-consulting-nigeria/` | Research report |
| `/ai-consulting-south-africa/` | Buyer’s guide |
| `/ndpa-compliant-ai/` | Nigeria page |

This explains how a check can report zero orphan pages while missing an entire isolated group. Sitemaps and `llms.txt` expose some of these URLs, and public search already returns some of them; the finding is not that they are unindexed. The issue is weak integration into the browsing and linking structure of the main site.

Add relevant links from `/our-services/` to the Nigeria and South Africa pages, from `/blog/` to the research and buyer’s guide, and from governance content to the NDPA page. Link commercial pages to the most relevant case study and expert. Preserve each page’s distinct purpose. **Acceptance:** all 41 pages reachable through ordinary HTML anchors from home; report and regional pages accessible in one or two sensible navigation steps. Evidence: `summary.json`, `page-inventory.csv`.

**2. High priority: the flagship research page makes a claim its cited source contradicts.**

The research page’s `<20%` highlight and adoption paragraph say no African country measured has reached 20% AI adoption. The linked Microsoft H2 2025 report lists **South Africa at 21.1%**, up from 19.3% in H1. Correct the statistic and identify the period and population being measured. The page discusses enterprise adoption, while Microsoft’s metric concerns people’s use of generative AI; the existing methods note correctly says those populations are not interchangeable. [Microsoft report, appendix page 15](https://aka.ms/AIDiffusionReport2025H2).

Source locations: [research HTML](../../research/state-of-ai-african-enterprises-2026/index.html), particularly the headline metrics and line 231. The following also need attention:

| Claim/source | Audit result | Required action |
|---|---|---|
| Mastercard: $16.53bn by 2030, 27.42% CAGR | Verified against the linked report | Retain with clear projection language and source |
| Microsoft: every measured African country below 20% | Contradicted by the cited H2 report | Correct to the source’s actual figures and period |
| McKinsey: 88% in 2025 | Current citation URL now serves a 2026 survey | Link a stable 2025 publication/PDF, or update claim and date together |
| GSMA: $240bn in 2025, $290bn by 2030 | Confirmed in GSMA’s 2026 publication, but that specific publication is not linked on the page | Add the direct supporting citation |
| CIO100 55%, youth weekly use above 75%, IMF 4%, MIT 95% | Exact supporting sources absent from the page’s links | Identify and link the original research, with sample, period and scope; otherwise remove or qualify |
| Cognis operational improvement ranges | Labeled directional/anonymized, which is helpful; no sample sizes or measurement windows | Add a method appendix and traceable examples |

Verified references: [Mastercard report](https://www.mastercard.com/news/media/ue4fmcc5/mastercard-ai-in-africa-2025.pdf), [current McKinsey destination](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai), [GSMA 2026 release](https://www.gsma.com/newsroom/press-release/mobile-technologies-contributed-240-billion-to-africas-economy-in-2025-as-the-continent-enters-a-new-phase-of-digital-transformation/).

The research page says every public figure is linked; the actual links do not yet meet that promise. Several unsupported claims may be true—lack of a supplied citation is not evidence they are false. **Acceptance:** every quantitative claim has an appropriate original source, or a documented first-party method; source edition, denominator and time period match the claim.

**3. High priority: Cognis AI has three inconsistent public representations.**

The homepage calls it live and offers “Visit Cognis AI,” linking to `/products/`. On `/products/`, the same call to action links back to `/products/` in another tab. Meanwhile the FAQ and both AI text files point to `https://ai.cognis.group`, which failed DNS resolution. Independent public DNS queries returned no A, AAAA or CNAME answer. MarketSage, Migratio and SPOG returned HTTP 200 in endpoint checks; their full product functionality was not tested.

Evidence: [products HTML](../../products/index.html) line 159, [FAQ](../../faq/index.html) line 211, [llms.txt](../../llms.txt) line 23, [llms-full.txt](../../llms-full.txt) line 27, `probes.json`, `ai-dns-a.json`, `ai-dns-aaaa.json`, `ai-dns-cname.json`.

Choose the real product destination and status, then use it consistently across cards, FAQ, schema and AI files. If it is not publicly available, give visitors an accurate demo/contact action and status. **Acceptance:** product CTAs reach the promised destination; machine-readable descriptions match availability; no circular “visit” link.

**4. High priority: homepage proof needs attribution and labels.**

The homepage contains `97%` without a clear measurable label, “+5,000 practitioners,” “50% workflow efficiency gained,” a “4,900 / 10,000 tasks” adoption display, “49% business growth,” and named dashboard entries including Lindsey Press, Livia Curtis and Ann Stanton. The About page repeats 49% business growth. The initial HTML does not clearly identify these as demo data or provide a measurement source. This is not a finding that the metrics or people are fabricated; the problem is that readers and content extraction cannot distinguish illustration from proof.

Evidence: [homepage](../../index.html) lines 705, 888, 1064, 1098 and 1118; [About](../../about-us/index.html) line 217. Also resolve the incomplete phrase “dedicated to helping organisations sharper, faster and AI-ready.”

For real results, state what was measured, for whom or which anonymized cohort, when, and against which baseline. Link to supporting case studies. For illustrative interfaces, label the section clearly as an example and keep sample data out of proof claims. Keep the site’s people-first proposition consistent with the MarketSage quote about reducing headcount needs. **Acceptance:** every prominent number is auditable or visibly identified as an illustration; no unexplained sample names appear to be client evidence.

**5. High priority: structured data is syntactically sound but semantically stale.**

All JSON-LD blocks parsed successfully. That establishes valid JSON, not accurate structured data or eligibility for every search feature.

- **28 pages have six-service offer catalogs**, including machine learning, standalone governance and digital transformation, while the primary proposition identifies three practices and the legacy service routes have been retired. Represent the actual three offers, or explicitly relate secondary capabilities to them.
- On `/why-cognis/`, the JSON-LD FAQ asks about industries and regions, while the fourth visible question concerns handover. Other FAQ wording differs too. Generate both representations from the same content.
- **Six older blog articles have different visible headings and schema headlines.** These are related headlines, not unrelated pages, so this is consistency work rather than proof of a penalty. For example, “The Real ROI of AI” is the metadata title while the page heading is “Measuring AI ROI: The Framework That Separates Real Impact from Expensive Experiments.”
- The same founder is represented with both `/#founder` and `/teams/supreme-oyewumi/#person`. Both resolve to defined entities in the audited site, so there is no dangling-reference finding; one stable identifier would be clearer.
- Source generation still contains a retired team member and attribution in `scripts/seo-data.mjs` and references in `scripts/inject_geo_2026.py`. Current output has corrected the workforce post to Supreme. Check the full rebuild before assuming those corrections persist.

Google requires markup to represent the actual page and explicitly notes that automated validation cannot catch all quality problems. [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

**Acceptance:** visible text, authors, service catalog, canonical URLs, dates and structured data are generated consistently; rebuilding preserves the corrections; relevant rich-result types are validated separately. Do not add ratings, certifications or invented reviews merely to obtain schema coverage.

**6. High priority for buyers and citations: improve independent corroboration.**

The buyer’s guide discloses that Cognis publishes it and is included. That is good. But it has no external links to the five other firms’ evidence, and its comparison table describes Cognis commitments rather than comparing the firms against common criteria. The “Africa’s leading AI consulting firm” claim on `/why-cognis/` is a self-description, not established independent recognition.

Make the guide more useful with direct official references, the same comparison dimensions for each provider, dated evidence, realistic boundaries and a clear distinction between an editorial shortlist and a ranked study. Keep the disclosure. Replace unsupported superlatives with specific capabilities unless independent evidence supports them.

Two client case studies are anonymized and one is an own-product build. The evidence notes already acknowledge confidentiality and measurement limitations. Strengthen them with publishable dates, sample sizes, before/after definitions, redacted deliverables, named responsible Cognis experts, and approved client corroboration when available. On the training case, 40 leaders + 180 specialists + 3,000 wider-workforce participants sums to 3,220, while the headline says 3,200. Explain overlap or rounding and whether the 45 champions are a subset. Clarify whether 72% assessment improvement is relative improvement or percentage points.

These changes would give a journalist, buyer or answer engine a stronger reason to cite Cognis. They are not a guaranteed ranking uplift. No private client identity needs to be disclosed.

**7. Medium priority: service pages retain a much heavier legacy implementation.**

| Template | Decoded local HTML | Live compressed HTML transfer |
|---|---:|---:|
| Homepage | 150,077 bytes | 23,254 bytes |
| Strategy service | 690,311 bytes | 100,881 bytes |
| Training service | 690,386 bytes | 100,473 bytes |
| Engineering service | 691,241 bytes | 101,035 bytes |
| Services overview | 69,899 bytes | 12,955 bytes |

The strategy page contains **318,174 bytes of inline CSS** and references **28 module preloads**, whose local files total **1,390,228 bytes** before compression. Those file totals are not measured browser transfer or execution time. Its autoplay service video is **1,091,584 bytes**. Another hero-video reference is present, but the audit did not establish that both videos download.

Useful service detail and FAQs exist in the initial HTML, so there is no demonstrated JavaScript-only content failure. However, that material is appended **after the site footer**, following repeated testimonials and template material. Put the deliverables, process, suitability and FAQs into the principal service content, ahead of the final CTA/footer. This improves reading order and reduces extraction noise. Do not describe this as hidden content or cloaking: that was not established.

Live hashed JavaScript paths under `/framer-runtime/sites/…` return `max-age=0, must-revalidate`; the long-lived cache rule currently covers `/framer-runtime/images/*` only. Before assigning immutable caching, verify those filenames really change whenever their bytes change—the CMS build patches some runtime bundles in place. Fingerprint mutable build outputs first, then apply appropriate caching. Retain revalidation for assets intentionally replaced at a stable URL.

**Acceptance:** simplify the service template, verify parity with and without JavaScript, preserve all content/links/schema, and measure representative desktop/mobile loads. Assess LCP, INP and CLS with field data where available. “Good” CWV thresholds are LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile. [Web Vitals guidance](https://web.dev/articles/vitals).

**8. Medium priority: deepen selected content with evidence people can use.**

All 11 articles expose substantive text and named authors. Five newer expert posts link to relevant primary technical sources and use distinct images. Those are strengths. Six older posts have no external supporting links, even when discussing laws, frameworks and broad claims. They can remain opinion pieces, but should cite the rules and research on which factual statements depend.

Do not expand pages merely to hit a word count. Better additions are actual evaluation examples, a redacted rollout plan, an annotated governance register, a training assessment rubric, and an ROI calculation with assumptions. The blog index promises “five years of production AI data” in one excerpt; identify whose data and link to it. A firm founded in 2024 may have staff with earlier experience, but the distinction needs to be explicit.

Prioritize a few buyer questions using existing pages:

| Buyer need | Best existing destination | Useful addition |
|---|---|---|
| Choosing an AI consultancy in Nigeria | Nigeria page | Local engagement example, scope and procurement expectations |
| Selecting a delivery partner | Buyer’s guide | Sourced comparison, limitations, evaluation checklist |
| Planning a first AI deployment | Strategy service | Example roadmap and the decisions a client must supply |
| Assessing agent reliability | Engineering service and expert posts | Evals, failure examples, human approval boundaries |
| Budgeting | Services and FAQ | Scope examples and genuine cost drivers; numerical ranges only if approved and defensible |
| Training a large team | Training service and case study | Curriculum sample, assessment method and unambiguous participant counts |
| Data protection | NDPA page | Primary regulatory links, dated expert review and concrete controls |

**9. Medium priority: strengthen the public company identity and local details.**

Public searches for Cognis Group surfaced an unrelated life-sciences company using `cognisgroup.com` and the LinkedIn slug `/company/cognisgroup`. Your markup uses `/company/cognis-group`, a different URL. Its direct HTTP check returned LinkedIn’s 999 response; that does not establish that your page is missing or incorrect. Verify ownership and the visible details in a signed-in session. The linked GitHub organization returned 200. No comprehensive backlink/mention count was available. [Unrelated company’s own LinkedIn profile](https://www.linkedin.com/company/cognisgroup).

Use a consistent public description identifying Cognis Group Limited as the Lagos-founded AI consulting and engineering firm, its founders and its canonical website. Correct matching social and professional profiles where needed. Seek legitimate partner/client acknowledgements, conference biographies and published expert work. Do not manufacture mentions or purchase fake authority.

The site provides a US street address, a Lagos district-level address, and only “Ontario, Canada” for the Canadian office. Where useful and true, publish complete office/appointment details, phone numbers, time zones and the distinction between staffed offices and registration or mailing addresses. Verify Google Business Profile/Bing Places eligibility and existing listings; their absence was not established here. The South Africa page correctly says there is no local office. Do not invent one or create many thin city pages.

**10. Medium priority: deployment state is already out of sync.**

Your pre-existing local edits mark both advertised roles as filled and remove `JobPosting` data. The live pages still show open applications with JobPosting validity through 25 October 2026. This audit did not deploy those changes. If the local edits reflect the intended business state, publish them through the normal workflow promptly.

The deployment workflow uploads committed static artifacts without rebuilding or running an SEO acceptance check. `/brand-manual/` is live as a 200 response with no title, canonical or noindex even though the workflow excludes that directory. That is evidence that the current source workflow alone does not describe everything served live; it does not prove the exact deployment cause. Decide whether the manual is a public resource or internal collateral, then give it appropriate metadata or exclude it. This is a hygiene issue, not a claimed security incident.

`https://cognis.pages.dev/` also serves the homepage with 200 and a canonical to the main domain. The canonical is a useful mitigation; a host-level permanent redirect is cleaner if the alternate host has no intended public role. Existing HTTP and www variants correctly reach the HTTPS apex. Retired blog/team paths tested also redirect correctly. A nonexistent URL returns a real 404.

Add a deployment gate that checks the final artifact and compares key live endpoints after publishing. Include connected link reachability, product destinations, canonical/indexability rules, visible/schema parity and expired job handling—not merely whether tags exist.

**11. AI files and crawler permissions are present, but not proof of visibility.**

`robots.txt` allows Googlebot, Bingbot, OAI-SearchBot, Claude search and Perplexity, among others. The homepage allows full snippets and large image previews. All sitemap pages permit indexing; none use restrictive snippet directives in the parsed metadata. Two-template user-agent tests returned ordinary HTML with no challenge page; service longform was present for all six agents tested. Verify real bot traffic and WAF outcomes using server logs before declaring crawler access fully proven.

Search access and training access are separate choices. OpenAI documents OAI-SearchBot for search and GPTBot for training; enabling training is not a prerequisite for search inclusion. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).

`llms.txt` is organized and useful as a maintained summary, but still points at the broken Cognis AI hostname. Its link to `llms-full.txt` promises complete site content; that file is a short overview of roughly 6.5 KB, not the full site. Either provide the promised content or describe it accurately. Include important market pages if the file is meant as the main content directory. Keep these files synchronized with source content.

Google explicitly says it does not use `llms.txt` for search visibility or rankings. There is no special AI schema to add and no ideal word count. Google’s guidance emphasizes useful original content and a sound site structure. [Google’s current AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

Also, **FAQ rich results were retired on 7 May 2026** according to Google’s documentation update. Keep useful FAQs for people; do not treat a large FAQPage count as a competitive rich-result advantage. [Google documentation updates](https://developers.google.com/search/updates).

**12. Measurement is required before anyone can call the site “super.”**

No analytics script was identified in the parsed initial live pages or the scoped source scan. That does not prove the absence of server-side analytics, DNS ownership verification or an existing Search Console property. No connected account measurements were available to this audit.

As of this audit date, Google documents a **Search generative AI control** under Search Console Settings, with inclusion as the default and inheritance from parent properties. Verify Cognis has not been excluded. It also documents a **Generative AI performance report** for Search impressions; availability can depend on sufficient data. These newer controls should be checked rather than relying solely on older advice that AI traffic is inseparable in reporting. [Google inclusion control](https://support.google.com/webmasters/answer/16908024), [Google generative AI report](https://support.google.com/webmasters/answer/16984139).

Bing’s AI Performance report provides citation and grounding-query information for supported AI experiences. Citation counts are not visits or conversions. [Bing AI Performance](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c).

Use the following measurement plan:

| Outcome | Evidence to collect |
|---|---|
| Search can index the right pages | Search Console indexed status, chosen canonical, sitemap processing and sampled URL Inspection |
| The site attracts buyers | Non-brand queries, impressions, clicks and landing pages by target country; distinguish branded traffic |
| Google AI visibility | Inclusion setting plus generative AI impression report where available |
| Bing/Copilot visibility | AI citations, cited pages and grounding queries |
| ChatGPT/other AI visibility | Available referral traffic, verified crawler logs and a repeatable small prompt sample |
| Business value | Successful enquiry events and qualified opportunities attributed to landing page/source |
| Usability | Mobile/desktop field CWV and representative lab checks |

For manual AI-answer sampling, record exact question, platform, date, country/language context, whether the correct Cognis entity was mentioned, which URL was cited and whether the facts were accurate. Repeat consistently. Do not present a small variable sample as a universal rank. Example questions should cover hiring an AI consultancy in Nigeria, choosing an engineering partner, AI training delivery, regulated-data deployment and company identity.

**Recommended order of work.**

| Order | Work | Done when |
|---|---|---|
| 1 | Connect the five isolated pages | All public sitemap pages reachable through HTML links from home |
| 2 | Correct research facts and Cognis AI destination/status | Claims align with primary sources; every product CTA is truthful and functional |
| 3 | Publish already-prepared career closures if they are the intended state | Live roles and structured data reflect filled positions |
| 4 | Resolve homepage metrics and schema/content drift | Proof is attributable; markup and page agree |
| 5 | Simplify service templates and content order | Browser verification confirms complete content and acceptable mobile experience |
| 6 | Improve case-study evidence, buyer comparison and local identity | A buyer can verify the differentiators without relying only on self-description |
| 7 | Establish search, AI and conversion baselines | Improvements evaluated by visibility and qualified enquiries |

A focused first pass should fix consistency and discovery before expanding content. A longer editorial pass should turn real experience into evidence other sites can reference. There is no basis yet to promise top rankings, frequent AI citations or excellent conversion performance.

**Checks that passed and should be preserved.**

- 41/41 live sitemap URLs: HTTP 200, no redirects, self-canonical, one H1, a distinct title and description, and no `noindex`.
- All parsed local and live JSON-LD: zero JSON syntax errors.
- Internal HTML page targets and local same-domain image `src` files checked against disk: no missing targets. This does not cover every external image, CSS URL, JavaScript-created URL or live asset.
- The 36 pages reachable from home are within two HTML-link steps.
- HTTP/www normalization, the sampled legacy redirects, and true unknown-path 404 handling work.
- Thank-you and subscription confirmation pages are noindexed and omitted from the sitemap.
- Primary content is in initial HTML; author profiles, service explanations, FAQ answers, company schema, canonical metadata and AI crawler permissions already exist.

**Performance and browser limitation.** No browser was available after runtime discovery. Chrome DevTools tracing was also unavailable. The [web-perf skill](/Users/supreme/.codex/skills/web-perf/SKILL.md) explicitly says: “If unavailable, STOP—the chrome-devtools MCP server isn't configured.” That trace workflow stopped; the source and HTTP audit continued. A public PageSpeed API request returned HTTP 429 quota exhaustion. Therefore this report contains no Lighthouse score, measured LCP/INP/CLS, mobile screenshot assessment, accessibility-conformance claim or confirmed post-hydration behavior. Missing HTML image dimensions alone were not classified as layout-shift failures because CSS may reserve their space.

**Evidence files.** `local-pages.json`, `live-pages.json`, `probes.json`, `bot-probes.json`, `resource-headers.json`, `ai-dns-*.json`, `summary.json`, `page-inventory.csv`, and raw `live/*.body`/`live/*.headers`. `audit.py`, `probes.py` and `summarize.py` reproduce the read-only collection and analysis. JSON parsing and local-reference checks are structural checks, not a substitute for a browser, Search Console or a schema validator.
