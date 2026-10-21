# Implementation status

Updated 2026-10-22.

## Implemented in the first working slice
- [x] Inspected the repository: initially empty except for the README.
- [x] Next.js App Router, TypeScript, Tailwind and core configuration.
- [x] Reusable Mongoose connection and school-scoped user/page/page-version models.
- [x] Auth.js Credentials provider, bcrypt password verification, JWT session and role permission map.
- [x] One-time-secret bootstrap for the first administrator.
- [x] Zod-validated content blocks; page create/update/delete APIs; published-only public API; publish/unpublish routes.
- [x] Separate draft and published snapshots, including separate published title/slug so unsaved draft changes do not leak publicly.
- [x] Protected admin sign-in/dashboard and page editor.
- [x] Editor supports create/edit/save, draft-only status, publish/unpublish, hide/show, duplicate/delete, drag reorder, undo/redo and responsive preview.
- [x] Public page rendering from published MongoDB content and generic starter homepage.
- [x] Initial schema tests, project documentation and a GitHub Actions verification workflow.

## Still required
- [ ] Clean installation, lint, TypeScript, tests and production build; CI results have not yet been retrieved.
- [ ] Version history API and restore UI.
- [ ] CMS-driven logo, theme, global settings, navigation and footer.
- [ ] Cloudinary upload routes and media library.
- [ ] Notices, circulars, events and photo/video galleries.
- [ ] Admissions applications and secure private document storage.
- [ ] Enquiry assignments, internal notes, follow-up lifecycle, rate limiting and spam controls.
- [ ] User management, audit logs, health/readiness checks.
- [ ] Sitemap, robots rules, structured data, integration/E2E tests, accessibility and device validation.
- [ ] Production deployment verification.

The project is not production-ready yet. Configure environment variables privately and complete clean build/test and security checks before using production data.