# WorldScope News — CTO Review Notes

## Current state (based on repository inspection)
- The repository contains a static HTML/CSS/JavaScript front end.
- It is not yet a full-stack publishing platform.
- The homepage currently uses empty-state copy rather than fabricated news.
- The Jobs & Opportunities area is an introductory placeholder, not a functioning listings database.
- The newsletter form is not connected to a mailing provider.
- Google sign-in, reader accounts, comments, analytics dashboard, CMS, ad booking and media uploads are not implemented.
- PWA files exist, but installability and offline behaviour still require real-device testing.
- A founder avatar was previously used in the public page; public founder identity has since been removed from the markup.
- The official contact address supplied by the publisher is worldscopenews5@gmail.com.

## Architecture recommendation
Do not bolt authentication, comments, job listings and editorial publishing onto the current static JavaScript page as local-only features. They require persistent data, role-based access control, server-side validation, auditability and backups.

Recommended staged architecture:
1. **Public frontend:** Next.js with server-rendered article pages, metadata, sitemap and RSS.
2. **CMS:** Evaluate Sanity or a similarly managed headless CMS for newsroom content and editorial roles. Confirm pricing, region, export and API constraints before selection.
3. **Application data:** Supabase/Postgres for reader profiles, saved content, opportunity records, comments/moderation queues and analytics events where appropriate.
4. **Authentication:** Google OAuth through a supported auth provider; public reading remains open.
5. **Media:** Managed object storage/CDN; preserve original source, rights, captions and alt text.
6. **Analytics:** Privacy-conscious measurement with access controls; public metrics only after validated.
7. **Deployment:** GitHub main branch connected to Vercel production; preview deployments for pull requests.

## Key risks and controls
- **Defamation/reputation:** Source evidence, right of reply, legal review for high-risk allegations, corrections log.
- **Misinformation:** Social posts are leads, not proof; verify with primary records and independent sources.
- **Copyright:** Track rights and licences for photographs/video; do not assume attribution alone grants reuse.
- **Opportunity fraud:** Verify employer/programme identity, source URL, deadline and application route; flag suspicious fees.
- **Account abuse:** Rate limits, spam controls, comment moderation, reporting and audit logs.
- **Privacy:** Minimise personal data, publish a clear privacy notice, define retention and deletion.
- **Security:** Never put service-role keys or OAuth secrets in client code; enforce server-side permissions and RLS.
- **Analytics integrity:** Distinguish users, sessions, page views and engaged reads; filter bots and internal traffic.

## Immediate next engineering slice
Build the editorial content foundation before public accounts:
- Select CMS/data architecture.
- Define article, source, correction and category schemas.
- Create editorial roles and approval workflow.
- Build public article/category pages against preview content.
- Add test fixtures clearly labelled as demo content and never publish them as live news.
- Establish deployment checks and verify Vercel Git integration.

## Release status
This document is a planning and review artifact. It does not claim that the listed future features have been implemented or deployed.
