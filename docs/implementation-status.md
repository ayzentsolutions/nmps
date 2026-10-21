# Implementation status

Updated: 2026-10-22.

## Implemented
- Next.js App Router, TypeScript, Tailwind, MongoDB/Mongoose, Auth.js Credentials, bcrypt and Zod.
- School-scoped pages, users, website settings, notices, events, galleries, media assets, admission applications, enquiries, audit logs and private document metadata.
- Visual page builder with create/edit, draft/publish snapshots, version history/restore, responsive preview, media picker, image/video/gallery/download blocks, statistics, cards and FAQ sections.
- CMS-managed identity, theme, navigation, footer, announcement and SEO defaults.
- Public pages for notices, events, albums, admissions and contact enquiries; sitemap/robots; liveness and database-readiness endpoints.
- Cloudinary public media library and authenticated private admission-document storage. Public admission form accepts up to 3 PDF/JPEG/PNG attachments with a 4 MB combined limit; staff document downloads use short-lived authorized links.
- Protected staff workflows for admissions, enquiries, event/gallery/notice publishing, media, users and audit history.
- Best-effort Resend acknowledgements and optional staff notifications for admissions/enquiries.
- One-time email password recovery: rate-limited request endpoint, non-enumerating response, hashed tokens, 30-minute expiry, one-time consumption and bcrypt password update.
- Explicit demo seed, security headers, starter privacy/terms pages and setup/security documentation.

## Release blockers / not yet verified
- CI lint/typecheck/test/build must all pass on the latest commit. Earlier CI runs failed in ESLint config resolution; the ESLint flat-compat fix was committed and its latest pipeline must still be checked.
- No committed dependency lockfile; commit package-lock.json and use npm ci for deterministic builds.
- Real MongoDB, Cloudinary and Resend secrets/domain must be configured, then tested end-to-end in a deployed environment.
- Invitation flow and initial-password onboarding, custom admissions form-builder/schema versions and comprehensive audit coverage are incomplete.
- Privacy/terms starter copy must be replaced or approved by the school.
- End-to-end/browser tests, keyboard/screen-reader accessibility review, mobile device validation, load/security testing and backup/restore drill are still needed.
- Production deployment and monitoring have not been confirmed.

Feature implementation does not mean production-ready. Do not treat this repository as 100% release-ready until CI passes and deployment/security validation above is completed.
