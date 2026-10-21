# Implementation status

Updated 2026-10-22.

## Implemented in the initial batches
- [x] Inspected repository: empty except for the initial README.
- [x] Next.js App Router, TypeScript, Tailwind and configuration.
- [x] Reusable Mongoose connection and school-scoped user/page/page-version models.
- [x] Auth.js Credentials provider, bcrypt password verification, JWT session and a role permission map.
- [x] One-time-secret bootstrap for the first super administrator.
- [x] Zod schemas for a controlled set of page blocks.
- [x] School-scoped page create/update/delete API, published-only public API, publish/unpublish API.
- [x] Draft and published snapshots stored as separate version documents.
- [x] Public database-backed route rendering with a generic fallback homepage.
- [x] Initial schema tests and operational documentation.

## Still required
- [ ] Admin visual editor and staff dashboard UI (being added next).
- [ ] Verify clean install, lint, TypeScript, unit tests and production build.
- [ ] Version history and restore UI/API.
- [ ] CMS-driven theme, navigation, logo, header/footer and school settings.
- [ ] Cloudinary upload routes, media library and secure private files.
- [ ] Notices, circulars, events and galleries.
- [ ] Admissions applications and private document storage.
- [ ] Enquiry assignments, notes, follow-up lifecycle, rate limiting and spam protection.
- [ ] User administration, audit logging and health/readiness checks.
- [ ] Sitemap, robots rules, structured data, integration/E2E tests and accessibility/device verification.
- [ ] Production deployment validation.

This repository is not production-ready yet. Environment configuration and a clean build/test run are still required.