# WorldScope News — Product Roadmap & Delivery Board

**Product direction:** A global digital newsroom and opportunities platform, with strong Nigeria/Africa reporting.
**Editorial promise:** Independent journalism. Verified facts. Deeper context.
**Audience:** Global.
**Community:** Optional Google sign-in; moderated comments only.
**Opportunities:** Jobs, internships, scholarships, grants, tenders, fellowships, training, volunteering, startup and business programmes.

This is the source-of-truth delivery board. Statuses must reflect verified implementation, not intention.

## Delivery rules
- Every feature is developed on a feature branch and proposed through a pull request.
- Review security, accessibility, mobile layout, editorial integrity and data protection before merge.
- Production deployment is complete only after Vercel reports a READY production deployment and the live URL is checked.
- Do not publish invented stories, fake audience numbers, fabricated jobs, or unverified claims.
- No public founder identity or personal photograph on the publication.
- Reader registration must never be required to read public news.
- Keep advertiser influence separate from editorial decisions.

## Phase 0 — Repository and deployment foundation
- [x] Confirm GitHub repository and default branch.
- [x] Confirm Vercel project name and live domain supplied by publisher.
- [ ] Verify Vercel's Git connection points to this repository and production branch is `main`.
- [ ] Verify push-to-main automatically triggers a production deployment.
- [ ] Add deployment status checks and a simple HTML/link smoke test.
- [ ] Verify the PWA manifest and service worker against browser installability requirements.
- [ ] Confirm live production deployment after each release.

**Important:** GitHub commits do not by themselves prove a Vercel deployment occurred. A release is marked deployed only after Vercel reports READY and the live site is inspected.

## Phase 1 — Public newsroom experience
- [x] Establish initial responsive static homepage.
- [x] Add lead-story, trending, latest-report, WorldScope TV and advertising areas.
- [x] Remove public founder profile and personal identity.
- [x] Add global opportunities entry point and anonymous newsroom About section.
- [ ] Replace decorative placeholder blocks with editorial photography only when properly licensed or supplied.
- [ ] Implement real article index, category pages, article detail pages and related stories.
- [ ] Add accessible search, pagination, RSS, sitemap, canonical URLs and structured metadata.
- [ ] Add visible article timestamps, author/editor desk, source notes and correction history.
- [ ] Ensure mobile typography, image crops, navigation and loading states are production quality.

## Phase 2 — Editorial CMS and newsroom workflow (next build)
- [ ] Select and configure a managed CMS or secure custom admin backend after evaluating cost, roles, preview and API needs.
- [ ] Define roles: reporter, researcher, fact-checker, editor, publisher and administrator.
- [ ] Create article schema: headline, slug, standfirst, body, category, tags, cover media, author desk, sources, status, timestamps and SEO fields.
- [ ] Implement workflow: pitch → research → draft → fact-check → editor review → approved → publish → update/correction.
- [ ] Store source records with publisher, URL, author, publication time, access time, source type and verification notes.
- [ ] Require evidence and editor sign-off for high-risk allegations.
- [ ] Add right-of-reply tracking and correction log.
- [ ] Provide preview and scheduled publishing.
- [ ] Secure admin routes, sessions, secrets, backups and audit logs.

## Phase 3 — Global Jobs & Opportunities
- [ ] Build opportunity data model and searchable listing pages.
- [ ] Categories: jobs, internships, scholarships, grants, tenders, fellowships, training, volunteering, startup/business programmes.
- [ ] Filters: country, city/state, remote/hybrid/onsite, type, eligibility and deadline.
- [ ] Each listing must show original source/application URL, eligibility, deadline, location and last verification date.
- [ ] Add expiry handling and stale-link checks.
- [ ] Add listing submission queue and manual verification before publication.
- [ ] Never charge jobseekers to access listings; clearly label paid promotions.

## Phase 4 — Reader accounts and community
- [ ] Allow anonymous public reading.
- [ ] Add Google OAuth only after consent screen, authorised domains, callback URLs and privacy policy are configured.
- [ ] Reader profile, saved stories, saved opportunities and category preferences.
- [ ] Moderated comments with reporting, rate limits, spam controls, blocked terms and moderator audit trail.
- [ ] Clear community rules, privacy notice and account deletion process.
- [ ] No anonymous unmoderated allegations or doxxing.

## Phase 5 — Audience, newsletter and advertising
- [ ] Add privacy-conscious analytics and consent controls where required.
- [ ] Private dashboard: users, sessions, engaged sessions, article reads, referrals, geography and returning readers.
- [ ] Public readership figures only after a defensible measurement period; never fabricate metrics.
- [ ] Connect newsletter provider and verified opt-in/unsubscribe flow.
- [ ] Advertising enquiry form and sales pipeline.
- [ ] Sponsored placements visibly labelled; editorial coverage remains independent.
- [ ] Media kit uses verified audience and campaign data only.

## Phase 6 — WorldScope TV and distribution
- [ ] Article-to-video relationship and video embeds.
- [ ] Production templates for bulletins, explainers, interviews and short clips.
- [ ] Captions, transcripts, rights and source records for footage.
- [ ] Social distribution checklist and platform-specific exports.
- [ ] No unlicensed footage or synthetic imagery presented as documentary evidence.

## Phase 7 — Installable web app
- [x] Initial manifest and service worker added.
- [ ] Test installability on current Android Chrome and iOS Safari.
- [ ] Add update prompt, offline fallback and cache invalidation.
- [ ] Push notifications only after explicit opt-in and topic controls.
- [ ] Measure performance, accessibility and Core Web Vitals.

## Release acceptance checklist
- [ ] Build/deployment passes.
- [ ] Production URL returns successfully.
- [ ] Mobile and desktop smoke tests pass.
- [ ] No broken navigation or placeholder email addresses.
- [ ] No false statistics, invented news or fabricated opportunity listings.
- [ ] Editorial and privacy links are present.
- [ ] Security and accessibility review completed.
- [ ] Release notes and rollback point recorded.
