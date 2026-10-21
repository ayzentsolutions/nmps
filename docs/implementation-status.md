# Implementation status

Updated 2026-10-22.

## Implemented in the first working slice
- [x] Next.js App Router, TypeScript, Tailwind and core configuration.
- [x] Reusable Mongoose connection and school-scoped user/page/page-version models.
- [x] Auth.js Credentials provider, bcrypt password verification, JWT session and role permission map.
- [x] One-time-secret bootstrap for the first administrator.
- [x] Zod-validated blocks; page CRUD APIs; published-only public API; publish/unpublish routes.
- [x] Separate draft and published snapshots, including title/slug separation to prevent draft metadata leaking onto the public site.
- [x] Protected staff sign-in, dashboard and visual page editor.
- [x] Editor supports create/edit/save, publish/unpublish, hide/show, duplicate/delete, drag reorder, undo/redo, responsive preview and version restore as a new draft.
- [x] Public page rendering from published MongoDB content and generic starter homepage.
- [x] Initial schema tests, project documentation and GitHub Actions verification workflow.

## Still required
- [ ] Clean install, lint, TypeScript, unit tests and production build; CI results have not yet been retrieved.
- [ ] CMS-driven logo, theme, global settings, navigation and footer.
- [ ] Cloudinary upload routes and media library.
- [ ] Notices, circulars, events, photo/video galleries.
- [ ] Admissions applications and secure private document storage.
- [ ] Enquiry assignment, notes, follow-ups, rate limiting and spam controls.
- [ ] User management, audit logs, health/readiness checks.
- [ ] Sitemap, robots rules, structured data, integration/E2E tests, accessibility and device validation.
- [ ] Production deployment verification.

The project is not production-ready yet. Configure secrets and verify the full build/test and security workflow before using production data.