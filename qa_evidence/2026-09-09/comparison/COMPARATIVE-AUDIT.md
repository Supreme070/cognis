# Luminary Meridian vs Cognis — 9 September 2026

**Cognis has the stronger public content and technical SEO foundation. Luminary Meridian has the clearer specialist advisory presentation and a more direct first-screen contact invitation. Neither observation establishes which company wins more business or receives more search traffic.**

The practical opportunity is to make Cognis's first impression as specific as its best service pages, make its evidence consistent, and get its existing important pages indexed. A wholesale redesign or a much larger content library is not the first priority.

## Scope and evidence

This is a public-site comparison, not a security penetration test or a competitor analytics report. It covers all 41 Cognis sitemap pages, the Luminary Meridian homepage and its linked sections, crawler files, hostname variants, page metadata, structured data, internal navigation, contact paths, credibility and mobile behavior. The crawl discovered only one linked content document for Luminary Meridian; this does not prove no other unlinked pages exist.

- 52 initial HTTP checks plus eight hostname/sitemap variant checks; raw results in `crawl.json`, `variants.json` and `live/`.
- Eight browser page/viewport combinations: both homepages, Cognis Contact and Cognis AI Strategy, at 390 and 1440 pixels. Two initial homepage checks with JavaScript disabled. Focused follow-up verified overflow causes, settled animations, no-JavaScript rendering and form names.
- Browser evidence: `browser.json`, `followup.json`, and PNGs alongside this report. The settled screenshots supersede immediate section screenshots taken while reveal animations were still pending.
- Cognis account baseline: [search and Google AI audit](../SEARCH-VISIBILITY-AUDIT.md). Luminary Meridian account data was not available.
- No forms, emails, event invitations or chat prompts were submitted. No account changes, code fixes or deployments were performed in this comparative audit.
- The in-app Browser had no available connection; an isolated project Playwright browser was used. Chrome DevTools MCP was unavailable. No Lighthouse score, field Core Web Vitals verdict, speed ranking, conversion-rate comparison or backlink-authority score is claimed.

## Comparative assessment

| Area | Assessment | Evidence and implication |
|---|---|---|
| Positioning | Luminary Meridian stronger for a cloud-advisory buyer | Its category and market are explicit early. Cognis explains useful AI work, but its main headline is a broad brand promise. |
| First-screen conversion | Luminary Meridian stronger | Two clear hero links are visible on mobile. Cognis's contact action is in the desktop navigation and inside the mobile menu; the mobile hero has no direct contact link. Ask Cognis is a different interaction. |
| Service architecture | Cognis stronger | Three dedicated practice pages with scope, process and FAQs versus services presented as homepage sections. More addressable pages can support distinct buyer questions if Google indexes them. |
| Named people and delivery evidence | Cognis stronger, with qualifications | Cognis has four named profiles and linked product/case pages. Both sites still depend heavily on first-party or anonymous claims. |
| Technical SEO | Cognis stronger | Working sitemap, consistent canonical URLs, structured data and social metadata. Luminary Meridian has gaps detailed below. |
| Mobile navigation and layout | Cognis stronger in the tested sample | Cognis menu opens and closes with Escape; sampled pages fit 390 pixels. Luminary Meridian lacks a mobile menu and clips substantive content. |
| Visual presentation | Different strengths | Luminary Meridian's cream, serif-led layout feels focused and restrained. Cognis feels more like a software builder but has more visual competition for attention. This is an editorial judgment, not conversion evidence. |
| Content available without JavaScript | Cognis stronger visually | Both deliver text in HTML. Luminary Meridian leaves 32 reveal elements transparent when JavaScript is disabled. |
| Actual SEO / AI results | No competitive winner measurable | Cognis: 28 Web clicks, 1,869 Web impressions, 192 Google AI impressions in the supplied period. Luminary Meridian: no account evidence. |
| Speed / field experience | Unmeasured | HTML and asset observations do not substitute for field metrics or controlled performance testing. |

## Luminary Meridian: verified findings

### High: mobile case studies and event content extend beyond the screen

At a 390-pixel viewport, the document extends to approximately 491 pixels. The second case-study card reaches x=491; the event date block reaches x=466. The settled screenshot `lm-390-case-studies-settled.png` visibly cuts off the second card. This is substantive content clipping, not just an invisible decorative element.

The mobile stylesheet attempts to collapse grids, but the observed case-study layout remains two columns. The event block also needs a responsive layout. Acceptance: those sections fit and remain readable at 320, 390 and 768 pixels without sideways scrolling.

### High: mobile navigation disappears

Below 900 pixels the navigation links are hidden. No replacement navigation button was present. Visitors retain the hero links, but lose direct access to the major sections from the header. The page is approximately 17,194 pixels tall at 390 pixels, making this consequential for navigation. The scroll handler also replaces mobile header padding with 60 pixels horizontally; it should respect the responsive layout.

### Medium: no-JavaScript presentation hides content

All 32 `.reveal` elements have computed opacity zero without JavaScript. Text remains in the response HTML, so this is not a claim that crawlers cannot read it. It is a progressive-enhancement failure for visitors when scripts fail or are disabled. Use visible content as the default, adding reveal behavior only after JavaScript initializes; provide reduced-motion handling.

### Medium: duplicate URL ambiguity and missing publishing metadata

The homepage has a description, language and one H1, but no HTML canonical link, JSON-LD or Open Graph/Twitter metadata. `/index.html` returns 200 at its own URL; HTTP and www variants correctly redirect to HTTPS apex. Consolidate the index-file variant and declare the intended canonical. [Google's canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

`/robots.txt`, `/sitemap.xml`, `/sitemap_index.xml` and `/sitemap-index.xml` all return 404. These tested endpoints do not establish that no sitemap exists anywhere. A missing robots file does **not** block Google: Google treats a robots 404 as no crawl restrictions. A sitemap is also not mandatory for a one-page site. These are publishing improvements, not evidence of deindexing. [Google's robots handling](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

`/llms.txt` and `/llms-full.txt` return 404. This is not an AI ranking failure or a reason to score Cognis as an AI winner. Google emphasizes useful, accessible content rather than extra AI-specific files. [Google's AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

### High for buyer diligence: claims have little supporting evidence on the page

The inspected [homepage](https://luminarymeridian.com/) names no individual practitioners. Two short engagement descriptions lack named clients, dates, measurement methods or supporting artifacts. Claims of unique market independence, frontier-lab collaboration and market forecasts are not accompanied by source links. A focused public search did not independently corroborate the collaboration claim; that is a research limitation, not evidence it is false.

For a buyer, verify who will deliver, their relevant work, what independence means contractually, and references for the proposed scope. Vendor product names alone do not establish accreditation or partnership. Regulatory references should identify the actual instrument, date and applicability; this audit does not verify the site's legal compliance claims.

### Medium: contact and trust paths

The contact actions use email links. There is no onsite enquiry form or booking workflow, and the displayed social handle is not a link. No privacy/terms link was found in the page navigation or footer. Email can be a valid contact method, but it depends on a configured email client and supplies little onsite completion feedback. The site has no `main` landmark. These are observed website gaps, not findings about the firm's legal status or service quality.

## Cognis: verified findings that matter now

### High: 25 important pages need Google follow-through

The September 4 indexing export lists 25 discovered but unindexed URLs, including the services overview, strategy, agent engineering, About, Nigeria consulting and Contact. The September 9 live checks found working 200 responses, matching canonicals and no inspected noindex directive for all 41 sitemap URLs; all are reachable from home within two HTML-link steps.

This is a reason to inspect Google's current state, not to repeat the claim that every page is already indexed. The 20 indexed URLs in the domain-wide report are not a verified count of main-site sitemap pages. The export predates September 8 changes.

### High: inconsistencies in commercial promises and proof

1. **`/why-cognis/`:** the current local source and live title/H1 still claim African AI consulting leadership. The previous remediation report said this language had been removed. Treat the prior completion claim as incomplete for the current state; update both content and the checks that should prevent its recurrence.
2. **`/case-studies/`:** the overview still advertises a 72% training score increase. The detailed training case says that assessment-improvement percentage was removed because the published evidence did not establish its calculation. Remove the unsupported overview statistic or provide the missing measurement evidence, then synchronize every repeated claim.
3. **`/our-services/ai-strategy-advisory/`:** a benefit card promises that every engagement ships a production workflow; the FAQ allows strategy-only engagements. State precisely whether production engineering is included in the strategy scope or contracted separately. This affects buyer expectations and quotations.
4. **Homepage proof:** decorative dashboards, a five-star visual, numerical graphics and a logo strip are prominent. The site contains an illustrative-data disclosure and discloses product ownership in places, but visitors can encounter those visuals without the qualifying context nearby. Put labels beside the relevant claims, distinguish owned products from external clients, and connect genuine outcomes to dated evidence.

Passing technical tests does not establish editorial truth or consistency. These findings show why the account-data review and comparative editorial review were necessary.

### High: the first screen undersells the offer

The current slogan conveys a brand attitude without telling a new visitor what they can buy. The explanatory paragraph carries that burden. On mobile the contact action is hidden in navigation while decorative media occupy substantial space.

Proposed direction, ready for editorial review:

> **AI strategy, training and engineering for African organisations.**
>
> Choose the right AI opportunities, prepare your people and put reliable systems into everyday work—with clear ownership and human oversight.
>
> **Discuss your AI project** → `/contact/`  
> **See our work** → `/case-studies/`

Keep the existing slogan as supporting brand copy if desired. Preserve Cognis's distinctive builder identity and product proof. Do not copy the competitor's claims of unique independence, affiliations, or capabilities the Cognis team has not established.

### Medium: accessible structure and form relationships

Cognis homepage and Contact lack a `main` or equivalent role landmark in the inspected browser DOM. The newer strategy page has one.

The contact form displays labels, but its name, email and message fields have no associated `<label>`, `aria-label` or `aria-labelledby`. The browser accessibility snapshot falls back to placeholders, so it would be inaccurate to say the fields have no accessible names at all. Associate the existing visible labels with persistent field IDs and verify keyboard focus. The newsletter email field needs the same review. [W3C form-label guidance](https://www.w3.org/WAI/tutorials/forms/labels/).

The contact form is below the office/contact information on the tested mobile layout. Consider an introductory jump link so a visitor arriving to enquire can reach the form immediately. Submission delivery was not tested, and a visible form is not proof that email or CRM delivery works.

### Medium: deployment hygiene and entity clarity

The earlier account audit found the CMS data file still serving publicly despite its intended exclusion. Investigate the current deployment/asset route before asserting removal. The leadership copy issue above also exists locally, so it cannot be explained solely as an old edge cache.

Search results and Cognis's visible query table include similarly named businesses. Consistent category, location, founder references and verified owned social profiles will help visitors distinguish this Cognis from others. Do not use a similarly named LinkedIn company's details as Cognis evidence.

## Technical and performance interpretation

Both homepages returned 200, exposed their text in response HTML, had an H1, and had no images missing the `alt` attribute. Empty alt attributes can be appropriate for decorative images; this count is not an accessibility certification. All tested fragment targets existed, and no page JavaScript exceptions were recorded in the eight main browser cases.

The fetched homepage HTML was 89,201 bytes for Luminary Meridian and 152,622 for Cognis. The compressed HTML transfers observed in those requests were approximately 48,075 and 23,649 bytes respectively. Cognis therefore had more HTML text but a smaller transferred HTML response in this sample. Neither figure includes all page assets or establishes which loads faster.

Cognis has considerably more media and scripts. Browser logs recorded aborted service-video requests, not HTTP errors; aborts can occur during normal media handling and are not classified as broken assets here. Luminary Meridian relies on external font CSS and an inline animation script. Without measured resource cost and traces, neither warrants invented savings or a speed score.

## How to use the account report: action register

The report becomes a dated baseline plus a prioritized work queue. A task is complete only when its acceptance evidence exists.

| Priority / timing | Action | Owner | Acceptance evidence |
|---|---|---|---|
| First: current week | Inspect six high-value URLs: services overview, strategy, agent engineering, Nigeria consulting, About and Contact | Search Console account operator; assistant reviews returned evidence | Current indexing verdict, crawl date and chosen canonical recorded; successful live test; indexing request recorded where still needed |
| First: current week | Confirm sitemap processing | Search Console account operator | Correct sitemap URL and successful account-side processing, not just a working public XML file |
| First: site changes | Fix leadership wording, training-stat inconsistency and strategy-scope contradiction | Website/editorial implementation | Same approved statement across title, H1, cards, detailed case, FAQ and structured data; live recheck after release |
| First: site changes | Add descriptive hero and visible mobile CTA | Website implementation | At 390 pixels a visitor can identify the offer and reach Contact directly; no layout regression |
| Next: site changes | Associate form labels and add main landmarks | Website implementation | Browser accessibility snapshot, keyboard check, and matching field IDs/labels |
| Next: content evidence | Strengthen one flagship case with approved records | Business owner supplies evidence; editor implements | Defined baseline, period, denominator, test conditions, client permission/anonymization and a supporting artifact |
| Next: measurement | Record lead source and qualified enquiries | Business owner chooses reporting destination; website implementation | Successful contact submissions distinguished from clicks; landing page/source retained appropriately; enquiries can be marked qualified |
| Review 16 September | Re-export indexing once its data date passes the release date | Account operator | Same URL cohort compared; classify indexed, still discovered, newly crawled or other state |
| Review after sufficient new data | Compare matched 28-day search and Google AI periods | Analyst | Same property, filters, date windows and metric definitions; note page launches and other changes |

Google controls crawling and indexing. Requests do not guarantee inclusion or a deadline. Use [Google's recrawl procedure](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl); do not repeatedly request every URL or validate intentional exclusions just to reduce the count.

Baseline measures to preserve: 25 discovered sitemap URLs as of September 4; 28 Web clicks / 1,869 impressions and 192 Google AI impressions during July 24–September 6. Page-level AI rows total 200 because aggregation differs. AI data is part of Web reporting, not an extra set of impressions to add. No AI clicks or lead count can be inferred from the supplied AI export.

Measure progress through important canonical pages indexed, service-page search impressions, relevant non-brand visibility, Google AI page coverage, and qualified enquiries. Avoid setting a made-up traffic or revenue target from only 28 clicks. The first aim is a working, measurable acquisition path with credible content.

## What this comparison changes

Cognis should retain its dedicated service pages, named team, owned-product demonstrations and detailed delivery approach. Improve the clarity and consistency of those assets before expanding into every cloud/infrastructure topic the competitor lists. A focused cloud or regulated-industry landing page is justified only where Cognis has the delivery capability and evidence to support it.

Luminary Meridian is a useful benchmark for category focus and the prominence of its contact action. Its mobile, metadata and evidence weaknesses make it an unsuitable template to copy wholesale. The next Cognis implementation should address the four high-priority website findings while the account operator advances indexing; subsequent exports tell us whether that work produces visibility and enquiries.
