# Cognis improvement programme — terminal handover

Updated: 9 September 2026. Workspace: `/Users/supreme/Desktop/cognis`.

## Resume instruction

Read this document, inspect `git status`, then continue unfinished assistant-owned work below. Preserve the user's commits and edits. Do not restart the audit or repeat completed checks without a reason. This Markdown document is intended to travel with the repository and be readable directly in a new terminal.

The user wants Cognis to exceed https://luminarymeridian.com/ in positioning, presentation, evidence, service clarity, conversion, SEO/AI discovery, external credibility and measurement. They explicitly asked the assistant to finish everything it can first and handle user-supplied photos/account inputs afterwards. Website fixes and ordinary implementation choices are authorized. Do not send email, submit public enquiries or invent proof, client results, affiliations, credentials, photos or account identifiers.

## Evidence already available

- [Google search + AI audit](qa_evidence/2026-09-09/SEARCH-VISIBILITY-AUDIT.md)
- [Competitive audit and action register](qa_evidence/2026-09-09/comparison/COMPARATIVE-AUDIT.md)
- Source exports: `/Users/supreme/Downloads/google search` (35 CSVs, analyzed; original files unchanged).
- Google Web baseline: 28 clicks, 1,869 impressions, CTR 1.50%, 24 July–6 September 2026.
- Google AI baseline: 192 property impressions, 11 page rows / 200 page impressions, same dates. Page/property aggregation differs; do not add AI to Web totals or infer AI clicks.
- Indexing snapshot 4 September: 20 indexed, 33 excluded across the domain property. Of 41 main-site sitemap URLs, 25 are explicitly discovered but unindexed. Do not equate 20 domain-wide indexed URLs with 20 indexed sitemap pages.
- September 9 live checks: all 41 sitemap pages return 200, have matching canonical links, no inspected noindex directive, and are within two links of home. These checks do not establish Google's current index or verified Googlebot access.
- Competitor comparison: 60 HTTP checks, desktop/mobile browser checks and screenshots. Cognis stronger in content/technical foundations; competitor clearer in initial advisory pitch. Competitor traffic/AI metrics unavailable. No field speed or Lighthouse score was measured.

## Current implementation status

Updated 9 September 2026 (Claude session, after Codex's run stopped mid-way). All of this is in the working tree, **not committed** — the user reviews and approves before anything is pushed.

- [x] Why Cognis: "Africa's leading" removed from title, H1, og/twitter titles (`scripts/site_improvements.py`, applied by `sync_seo.py`).
- [x] Case-study overview: unsupported "72% score lift" / "100% Article 4 coverage" chips replaced.
- [x] Strategy page: "Production-First Delivery" promise replaced with "Ready for Delivery" (engineering is a separate scope) in `scripts/render_service_pages.py`.
- [x] Homepage: the original hero (card ring, video, "What We Touch, We Change") is **kept** by the user's decision. Only the good idea was taken from Codex's rewrite: an offer line above the headline ("AI strategy, training and engineering for African organisations") and a visible "Discuss your AI project" button, present on phones too. Codex's replacement hero/product-strip/expertise sections and their CSS were removed.
- [x] Accessibility: skip link + `<main id="cg-main">` on every page; contact-form labels wired to fields; "Send an enquiry" jump link on Contact.
- [x] One-footer rule restored: the newsletter field's `aria-label` now lives in the footer template (`inject_global_footer.py`), so all 45 pages carry byte-identical header and footer again.
- [x] `npm run prerender` passes and is idempotent (second run changes nothing); `check_seo.py` reports no errors.
- [ ] Public CMS asset exclusion — not verified in this pass.
- [ ] Enquiry measurement review — not started.
- [ ] Publication: nothing from this batch is live yet.

## User-owned inputs — handle after assistant work

1. Actual training photos (existing now, more next week): original files, dates, location, topic, instructor, publishable organisation name, permission status and reliable outcome evidence. Use images only for their actual engagement. Intended placement: homepage proof feature, training service and an evidenced case study. Activity photographs do not prove attendance totals or improvement percentages.
2. Search Console: inspect services overview, strategy, agent engineering, Nigeria consulting, About and Contact; live-test then request indexing if appropriate. Confirm sitemap successfully processed. Assistant currently lacks Search Console OAuth scopes and a signed-in browser connection.
3. Client evidence and approved testimonials: baseline, period, denominator, measurement method and permission/anonymization. No fabricated client names or results.
4. Confirm owned social profiles and public office details before changes to external listings.
5. Choose reporting destination/analytics account for qualified enquiry reporting if existing infrastructure does not provide enough. Do not install trackers with made-up identifiers.
6. Re-export indexing after its data date advances past the release; review around September 16. Compare matched 28-day performance windows when enough data exists. Dates are review points, not guaranteed indexing deadlines.

## Repository workflow and access

- `npm run prerender`: current static service generator, global header/footer injection, SEO synchronization, content checks. Do not run `prerender:legacy` in this working tree.
- `npm test`: local SEO/content checks. `npm run test:browser`: existing Playwright checks (currently hard-coded September 8 evidence destination; update before producing new evidence).
- Service content: `scripts/render_service_pages.py`; editorial synchronization: `scripts/sync_seo.py`, `scripts/seo_editorial.py`; public assembly: `scripts/assemble_site.py`.
- Build to a new/empty directory with `python3 scripts/assemble_site.py --output <directory>`. Never publish the repository root: audit exports, scripts, workers and CMS sources must stay private.
- Cloudflare Pages project: `cognis`; account ID `19c9c47808b6b0545bd672bace6f6510`. Wrangler OAuth worked previously. Read Cloudflare/Wrangler skills before use; write logs to `/tmp`.
- Google login `supreme@cognis.group` works but Search Console API returned `ACCESS_TOKEN_SCOPE_INSUFFICIENT`. Do not rerun ordinary login expecting it to add scopes. Do not overwrite global application-default credentials.
- In-app browser discovery returned no browsers. Repository Playwright was used for isolated public/local checks. Chrome DevTools MCP unavailable; do not fabricate performance results.
- Credentials stay in existing secure stores; never print tokens or put them in this file.

## Strategic next batches

Once this first implementation is complete: integrate authentic training evidence; improve one flagship case study with publishable records; strengthen verified external identity; establish lead qualification reporting; then expand only into topics/services supported by real expertise. Preserve Cognis's builder identity and practical strategy/training/engineering focus. The competitor is a benchmark, not a source of claims to copy.
