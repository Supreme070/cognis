# Cognis SEO and AI search remediation — 8 September 2026

The code and editorial changes are deployed to **https://cognis.group/**. The final Cloudflare Pages deployment is `d8466d40` (https://d8466d40.cognis.pages.dev). Source changes remain in the local working tree; no Git commit or push was made.

The baseline is the [7 September audit](../2026-09-07/AUDIT.md). This release preserves the user's subsequent commits through `45be94d`, including the global header/footer, service-card links, filled careers roles, static service renderer, page-specific media and reordered service sections.

## Completed changes

| Audit issue | Resolution |
|---|---|
| Five disconnected pages | Contextual HTML links from the services overview, insights index and governance article connect all 41 sitemap pages to home. Maximum link depth is two. |
| Incorrect research statistic | Replaced the below-20% claim with Microsoft's South Africa H2 2025 estimate of 21.1%; corrected the description metadata too. Explained the working-age population denominator and the distinction from enterprise deployment. |
| Unsupported research figures | Removed insufficiently supported estimates and delivery ranges. Added direct primary references, a dated correction and an explicitly illustrative ROI calculation. |
| Broken/circular Cognis AI action | Home and product cards now offer a demo request at `/contact/?interest=cognis-ai`. Updated availability wording, FAQ, application schema and text files. This is the fallback until a verified public product destination is supplied. |
| Unclear homepage proof | Replaced the unexplained headline metrics with descriptive labels. Clearly identified the example dashboards and their numbers/names as illustrative. Added testimonial provenance, including the fact that MarketSage is a Cognis product. |
| Structured-data drift | Removed the three retired offers from catalogs; derive FAQ answers and article headlines from visible HTML; consolidated Supreme's person identifier; removed retired author/team source definitions. |
| Unsupported ranking language | Replaced the “leading” headline and answer on Why Cognis with specific capabilities. |
| Buyer-guide evidence | Added official provider links and consistent comparison columns. Distinguished published focus from editorial fit assessment. Replaced the unsourced price range with guidance for comparing scoped proposals. |
| Older article evidence | Added primary practice references to the six older articles. Removed the unsupported “five years of data” excerpt and the ROI article's unsupported numerical ranges. |
| Training-case ambiguity | Removed subgroup counts whose overlap was unspecified and the assessment percentage whose calculation was undefined. Retained the reported total with an explicit evidence limitation. Replaced “certified” champions with “trained.” |
| Heavy service template | Preserved the user's completed static rebuild. Final service HTML is 53,024 / 52,838 / 53,517 bytes, about 92% smaller than the roughly 690 KB baseline. No legacy module preloads remain. This is HTML size, not a measured Core Web Vitals improvement. |
| Mobile navigation | Restricted link discovery to the header; fixed Escape dismissal, focus handling, keyboard containment, inactive-menu focusability and closing on desktop resize. |
| Build regressions | Normal `npm run prerender` now uses the current static service and global chrome generators, followed by the SEO synchronization and checks. The destructive legacy Framer renderer requires explicit opt-in and a separate working copy. |
| Deployment leakage/consistency | Replaced broad repository copying with a public-file allowlist. CI validates committed content before deployment. Scripts, audit files, workers, raw CMS sources and backup HTML are excluded. Mutable assets revalidate. |
| Duplicate hosting aliases | Added host-specific `noindex` response headers for the Pages alias and preview URLs, preserving indexing on the canonical domain. |
| AI text files | Generated the directory and full public-page text from current HTML. All 41 canonical pages are represented; shared navigation, footer and scripts are excluded from the full extraction. |

## Validation

- `npm test`: 41 pages; all reachable from home within two steps; no failing local link, asset, canonical, metadata, schema, closed-role or content-consistency checks.
- `npm run test:browser`: 23 passing scenarios, covering ten representative pages at 390 and 1440 pixels plus the three service pages with JavaScript disabled. Includes menu interaction, demo destinations, layout overflow, script errors and native FAQ behavior. See [browser results](browser-checks.json).
- `npm run prerender`: passed. A repeated build left all 41 pages, sitemap and two AI text files byte-identical (44 files checked).
- Clean deployment assembly: 314 public files; identical to the tested workspace files; internal directories absent.
- `git diff --check`: passed.
- Live checks and raw responses are recorded in [live verification](live-verification.json) and `live/`. Cloudflare's email obfuscation is decoded only for text comparison; original HTTP responses are retained.

The Browser skill's connection check found no available app browser, so the repository's isolated Playwright browser was used for local testing. Cloudflare and Wrangler guidance informed the host-specific headers and deployment checks.

## What code cannot establish

This release improves technical eligibility, content accuracy and discoverability. It does not establish top rankings, indexed coverage, AI citation frequency, qualified-lead growth or passing field Core Web Vitals. No Search Console, Bing Webmaster or analytics connector was available in this session.

1. Connect or provide exports from Search Console and Bing Webmaster Tools to establish index coverage, chosen canonicals, non-brand queries, target-country performance and available AI visibility reports.
2. Measure qualified enquiries and their landing pages/sources using the site's chosen analytics system. No invented account identifier or third-party tracking was installed.
3. Supply publishable client measurement records and approved corroboration to strengthen the case studies and testimonials. Retained first-party claims are attributed, not independently verified.
4. Confirm owned social profiles and office/appointment details before changing external company listings. No office addresses, client identities, certifications or endorsements were invented.
5. Use real-user LCP, INP and CLS data to judge field performance after sufficient traffic. The browser checks are functional and responsive tests, not a Lighthouse or field CWV score.

Google's current [generative AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) emphasizes useful, accessible content; the presence of `llms.txt` or extra schema is not proof of AI visibility. The corrected research cites [Microsoft's H2 2025 report](https://aka.ms/AIDiffusionReport2025H2) and [Mastercard's AI in Africa 2025 report](https://www.mastercard.com/news/media/ue4fmcc5/mastercard-ai-in-africa-2025.pdf) directly.

## Maintaining the changes

- Edit current static pages for ordinary copy changes. Service layouts/copy are generated by `scripts/render_service_pages.py` and `scripts/service_pages/`; global chrome comes from the global injectors.
- Reviewed research and comparison blocks live in `scripts/seo_editorial.py`. Synchronization rules live in `scripts/sync_seo.py`; update those sources when revising their generated blocks.
- Run `npm run prerender`, then `npm run test:browser` when changing layout or interaction. For copy-only edits, `npm run seo:sync` and `npm test` provide the content gates.
- Assemble into a new or empty directory with `python3 scripts/assemble_site.py --output <directory>`. The assembler intentionally refuses to erase existing output.
- Commit the source and generated outputs together before the next Git-driven deployment. The GitHub workflow publishes committed files after validation; this release was uploaded directly from the verified local artifact.
