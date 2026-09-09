# Cognis search visibility — account-data audit, 9 September 2026

The exports establish real but limited Google search visibility. The largest indexing gap is 25 canonical website pages reported as discovered but not indexed. All 25 currently pass the live HTTP, canonical and noindex checks performed for this audit. These results support prioritizing Google inspection and recrawling after the recent fixes; they do not establish that Google has indexed those pages today.

## Evidence and dates

- Source: `/Users/supreme/Downloads/google search`, initially 30 CSV files, followed by five Google Generative AI CSVs on a second directory check. All 35 were analyzed; originals were not changed.
- Google Search performance: selected filter is Web / Last 3 months, but supplied daily rows cover **24 July–6 September 2026**, 45 days. Do not describe this as 90 days of observed performance.
- Page indexing: latest supplied date is **4 September 2026**. All six reason exports have the same latest date and their example counts match their latest affected counts.
- The previous remediation was deployed on 8 September. Neither Google dataset measures its results. The earlier remediation document's uncommitted-source note is historical: the current Git log now includes the remediation and evidence commits.
- Live verification on 9 September: 51 unique URLs requested, including all 41 sitemap pages, all 33 exclusion examples after deduplication, sitemap and robots.txt. Raw headers and bodies are retained under `live/`; URL-to-file mappings, source hashes and calculations are in `export-analysis.json`. Assertions are in `verification.json`.
- Requests used ordinary HTTP access, not Google's authenticated URL Inspection or verified Googlebot infrastructure. Passing them does not prove Googlebot can access every URL from its own network or that Google's rendering/indexing decisions match our checks.

## Measured search performance

| Metric | Observed result |
|---|---:|
| Google property clicks | 28 |
| Google property impressions | 1,869 |
| Overall CTR, calculated as 28 / 1,869 | 1.50% |
| Homepage clicks / impressions | 22 / 1,357 |
| Africa consulting buyer guide clicks / impressions | 5 / 108 |
| Products clicks / impressions | 1 / 110 |
| All other exported page rows | 0 clicks |
| Nigeria clicks / impressions | 9 / 41 |
| South Africa clicks / impressions | 1 / 21 |
| United States clicks / impressions | 1 / 627 |
| United Kingdom clicks / impressions | 0 / 147 |
| Desktop clicks / impressions | 16 / 1,279 |
| Mobile clicks / impressions | 12 / 578 |
| Tablet clicks / impressions | 0 / 12 |

These figures come from `Chart.csv`, `Pages.csv`, `Countries.csv` and `Devices.csv` in the supplied Google performance folder. The homepage received 78.6% of clicks; the buyer guide received 17.9%. Visibility is concentrated in three landing pages and has not yet demonstrated a broad acquisition channel for service pages. No conversion or qualified-lead dataset was supplied.

The last 14 observed days, 24 August–6 September, delivered 16 clicks / 575 impressions, versus 6 clicks / 602 impressions during 10–23 August. This is a small-sample baseline change before the remediation, not evidence of its impact.

The visible query table's largest entry is `cognis`: 571 impressions, 5 clicks, average position 11.07. It contains multiple other Cognis-like names and potentially unrelated entities. This suggests brand ambiguity worth reviewing, but does not establish searcher intent. The query `johannesburg ai consultancy firms` has 27 impressions, zero clicks and average position 59.37; `ai consulting south africa` has 5 impressions, zero clicks and position 61.4. These are weak commercial-query signals, not grounds for claiming strong non-brand rankings.

The query export totals only 6 clicks / 944 impressions, compared with the property's 28 / 1,869. Do not classify the missing 22 clicks as branded or non-branded. Google omits some queries for privacy and has additional table limitations. Page rows total 1,952 impressions because page and property aggregation differ; use 1,869 for the property baseline. Countries and devices reconcile exactly to that baseline. [Google's dimension guidance](https://support.google.com/webmasters/answer/17011259?hl=en), [aggregation guidance](https://support.google.com/webmasters/answer/17011364?hl=en).

The property includes subdomains: page-level impressions include 1,784 for `cognis.group`, 130 for `migratio.cognis.group`, and 38 for `spog.cognis.group`. Do not compare domain-wide indexing totals directly with the main site's 41-page sitemap.

## Indexing findings and decisions

The latest overview reports **20 indexed + 33 not indexed = 53 known URLs** across the property. This is not a finding that 20 of the main site's 41 sitemap pages are indexed.

| Exported reason | Count | Current evidence and decision |
|---|---:|---|
| Discovered – currently not indexed | 25 | All 25 are in the current 41-page sitemap. All return direct HTTP 200, have self-referencing canonicals, and have no noindex directive in inspected HTML/headers. Prioritize current Google URL Inspection and a small set of indexing requests. |
| Page with redirect | 5 | Each currently redirects once to a working 200 destination. Preserve these redirects. |
| Excluded by noindex | 1 | `/thanks-subscribe/` intentionally has noindex and is absent from the sitemap. Preserve it. |
| Not found (404) | 1 | `/teams/` returns a real 404, is absent from the sitemap, and has no incoming links from the 41 inspected canonical pages. It is not one of the individual team profiles. No urgent indexing fix is indicated. |
| Crawled – currently not indexed | 1 | `/cognis-cms/services-chunk.framercms` is a CMS data asset, not a public article/service page. It currently returns 200 as `application/octet-stream`, with no X-Robots-Tag. Keep it out of the index; see deployment discrepancy below. |
| Alternate page with proper canonical | 0 | Empty example table agrees with zero affected pages. No action. |

The redirect examples are `http://cognis.group/`, `/case-studies`, `/terms`, `https://migratio.cognis.group/index.html`, and `https://migratio.cognis.group/contact.html`. Their destinations are respectively the HTTPS homepage, slash-normalized case-studies and terms pages, Migratio homepage, and Migratio `/contact`.

Google's exclusion examples are not guaranteed exhaustive, even below the 1,000-row limit. Discovered means Google knows a URL but has not yet crawled it according to that report; the exports do not establish why scheduling was delayed. The 1970-01-01 values on all 25 discovered rows are treated as missing-date placeholders, not literal crawl dates. Do not invent a crawl-overload, quality, penalty or robots-block diagnosis. [Google's indexing definitions and limitations](https://support.google.com/webmasters/answer/7440203?hl=en).

### Priority queue for the 25 discovered pages

Priority reflects business relevance, not an assertion that Google will index these first.

| Priority | URL path |
|---|---|
| First | `/our-services/` |
| First | `/our-services/ai-strategy-advisory/` |
| First | `/our-services/ai-agent-automation-engineering/` |
| First | `/ai-consulting-nigeria/` |
| First | `/about-us/` |
| First | `/contact/` |
| Next | `/how-we-work/` |
| Next | `/why-cognis/` |
| Next | `/case-studies/ai-training-programme/` |
| Next | `/faq/` |
| Next | `/blog/` |
| Next | `/blog/why-most-enterprise-ai-strategies-fail-before-they-start/` |
| Next | `/blog/building-ai-agents-that-actually-ship/` |
| Next | `/blog/the-real-roi-of-ai/` |
| Next | `/blog/making-your-workforce-ai-ready/` |
| Next | `/blog/ai-governance-is-not-optional/` |
| Next | `/blog/ai-native-operations-for-african-enterprises/` |
| Next | `/blog/from-copilot-to-coworker-productizing-ai-agents/` |
| Next | `/teams/supreme-oyewumi/` |
| Next | `/teams/obruche-uwanoghor/` |
| Next | `/teams/tosin-salami/` |
| Lower | `/careers/` |
| Lower | `/careers/business-development-manager/` |
| Lower | `/careers/customer-service-professional/` |
| Lower | `/privacy-policy/` |

The other 16 sitemap URLs have historical impressions in the performance export. That is positive historical visibility evidence, not an exact current indexed-page inventory. No indexed-page example export or URL Inspection results were supplied.

### Current technical checks

- All 41 canonical pages returned HTTP 200 without redirects, with matching canonicals and no inspected noindex directive.
- All 41 were reachable from the live homepage within two HTML-link steps.
- The live sitemap contains the same 41 URLs as the local sitemap, including all 25 discovered examples.
- Live robots.txt permits Googlebot and advertises the correct sitemap.
- `npm test` passed: 41 pages, 41 reachable, maximum depth two, no errors.

### Deployment discrepancy to resolve

The old CMS `.framercms` URL is currently available with HTTP 200. The 8 September evidence recorded internal source exclusions, and the current assembly script excludes the `.framercms` extension. The current observation therefore warrants checking the active deployment, asset route and cache against the intended assembly; it does not identify which of those caused the difference. Avoid claiming that the earlier removal remains effective today. Either retire the unused asset with a real 404/410, or, if runtime dependencies still require it, serve it with `X-Robots-Tag: noindex`. Do not request indexing for it.

Migratio's two redirect destinations also lack canonical links in the fetched HTML and contain multiple H1 elements. These belong to a separate subdomain/application; the main site's passing tests do not cover them. Canonical consistency should be reviewed in that application's source. Multiple H1s alone are not proof of an indexing failure.

## Google account follow-up

1. In Search Console, inspect `https://cognis.group/our-services/` using the top URL field. Record the current indexing verdict, referring sitemap, last crawl, crawl permission, indexing permission and Google-selected canonical when available.
2. Use **Test live URL**. If it succeeds and the intended page remains unindexed, use **Request indexing**. Repeat for the other five First-priority URLs, subject to Google's quota. Requests are not guarantees; repeated requests do not speed up crawling. [Google's recrawl instructions](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
3. Open **Indexing → Sitemaps** and check that `https://cognis.group/sitemap.xml` was processed successfully. The public file works; account-side submission/processing is not established by these exports. Submit it if absent, or investigate any reported processing error.
4. Once the indexing report's latest date advances beyond 8 September, export it again. Recheck around 16 September and compare the same affected URLs, then assess a longer performance period when enough new data exists. These are review dates, not indexing deadlines.
5. Do not use Validate fix merely to clear expected redirects, thank-you noindex or an intentionally absent directory. The objective is to index useful canonical pages, not reduce every exclusion count to zero.

## AI visibility: new export received and reconciled

The second directory check found `cognis.group-Performance-on-Search-Generative-AI-Features-2026-09-09`, containing Chart, Pages, Countries, Devices and Filters CSVs. This closes the missing Google AI report gap. Source hashes, original rows and reconciled totals are saved in `google-ai-analysis.json`.

**Google AI visibility is now confirmed: 192 property-level impressions from 24 July through 6 September 2026.** The 45 daily rows, country totals and device totals reconcile exactly. The filter says Web / Last 3 months; the observed rows cover the same period as the ordinary Search export. These data still predate the September 8 remediation.

| Exported page | AI impressions |
|---|---:|
| Homepage | 146 |
| `/best-ai-consulting-firms-africa/` | 23 |
| `/products/` | 11 |
| `https://migratio.cognis.group/` | 10 |
| `/research/state-of-ai-african-enterprises-2026/` | 3 |
| `/ai-consulting-south-africa/` | 2 |
| `/blog/ai-governance-africa-2026/` | 1 |
| `/blog/securing-ai-agents-in-production/` | 1 |
| `/case-studies` | 1 |
| `/case-studies/marketsage/` | 1 |
| `/ndpa-compliant-ai/` | 1 |

The 11 page rows sum to **200**, while the property total is **192**. This reflects different page/property aggregation, not a reconciliation failure. The homepage represents 73% of exported page-level impressions (146/200). Ten rows are on the main domain, one on Migratio. No individual core-service page appears in the supplied AI page table; absence from an exported table alone is not proof of zero visibility.

AI impressions span 48 countries. The largest are United States 28, United Kingdom 23 and India 19; Nigeria has 12 and South Africa 5. Devices: desktop 120, mobile 71, tablet 1. The final 14 days have 60 impressions versus 58 in the preceding 14: little change at this sample size, and no post-remediation inference is possible.

Google's report covers AI Overviews and AI Mode, but these files do not separate the two. They contain no AI clicks, prompts/queries, ranking metric or conversions. Do not add these impressions to the general Web total; the AI report is a dedicated view of activity included in Web reporting. This establishes actual Google AI exposure, not ChatGPT or Perplexity visibility, unique audience size, endorsement, lead generation, or competitive dominance. [Google's report definitions](https://support.google.com/webmasters/answer/16984139).

The immediate priority remains indexing the 25 discovered canonical pages and monitoring the next dated exports. The buyer guide and homepage have demonstrated AI visibility; use them as baseline landing pages to monitor alongside the service pages after recrawling. No further Google AI export is needed for this baseline.

The standalone `cognis.group_SearchPerformanceOverview_All_9_9_2026.csv` contains 9 clicks / 88 impressions for 26 July–7 September. Its filename resembles a Bing export, but it contains no vendor/filter metadata, so provenance remains unconfirmed. One row has 3 clicks / 2 impressions (150% CTR). Preserve the source values and confirm report definitions before interpreting that result. It has no AI-specific dimension and must not be treated as an AI visibility report or added to Google totals.

No analytics, conversion, crawler-log or dedicated Bing AI dataset is present. The evidence is sufficient for Google search and Google AI visibility baselines plus indexing triage; it is not yet a complete cross-engine SEO/GEO/AIO measurement set.

## Work completed in this audit

Read and reconciled all 35 CSVs, checked all 51 unique live URLs in the initial audit, verified local SEO checks, researched current Google reporting definitions, and saved the source manifests, calculations, raw live responses and prioritized follow-up. The second directory check analyzed only newly added files; it did not repeat the live crawl. No account settings, indexing requests, website code or deployments were changed during this audit.
