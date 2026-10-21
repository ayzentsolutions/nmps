# Implementation status

Updated 2026-10-22.

## Implemented in the first batches
- [x] Inspected the repository: empty except for the initial README.
- [x] Next.js App Router, TypeScript, Tailwind and core configuration.
- [x] Reusable Mongoose connection and school-scoped user/page/page-version models.
- [x] Auth.js Credentials provider, bcrypt password verification, JWT session and role permission map.
- [x] One-time-secret bootstrap for the first administrator.
- [x] Zod-validated content blocks; page create/update/delete APIs; published-only public API; publish/unpublish routes.
- [x] Separate draft and published snapshots and a database-backed public page renderer.
- [x] Initial schema tests and setup/security/operations documentation.

## In progress / remaining
- [ ] Visual page editor and staff dashboard UI (next committed batch).
- [ ] Clean install, lint, TypeScript, tests and production build.
- [ ] Version history API and restore UI.
- [ ] CMS-driven logo, theme, global settings, navigation and footer.
- [ ] Cloudinary upload routes and media library.
- [ ] Notices, circulars, events, photo/video galleries.
- [ ] Admissions applications and secure private document storage.
- [ ] Enquiry assignments, internal notes, follow-up lifecycle, rate limiting and spam controls.
- [ ] User management, audit logs, health/readiness checks.
- [ ] Sitemap, robots rules, structured data, integration/E2E tests and responsive/accessibility validation.
- [ ] Production deployment verification.

This project is not production-ready yet. Configure environment variables privately and complete a clean build/test run before using production data.