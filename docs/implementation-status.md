# Implementation status

Updated: 2026-10-22.

## Implemented
- Next.js App Router, TypeScript, Tailwind, MongoDB/Mongoose, Auth.js Credentials, bcrypt and Zod.
- Committed npm package lockfile and deterministic npm ci CI install.
- School-scoped page, user, site settings, notice, event, gallery, media, admission, enquiry, audit and private document models/APIs.
- Visual page builder with draft/published snapshots, version history/restore, responsive preview and editable hero/text/image-text/stats/card-grid/FAQ/video/image-gallery/download blocks.
- CMS-managed school identity, validated theme tokens, navigation with dropdown items, social links, announcement banner, footer, global SEO and media-library pickers.
- Public published-content pages for notices, events, albums, admissions and enquiries; shared responsive site header/footer; sitemap/robots; health/readiness endpoints.
- Cloudinary public media library and authenticated private admission document storage. Public form accepts up to 3 PDF/JPEG/PNG documents up to 4 MB combined; staff access is authorization- and school-scoped with short-lived download links.
- Staff workspaces for admissions and enquiries, role-based user management, event/gallery/notice editing and publication, and searchable audit log viewer.
- Best-effort Resend notifications for applications/enquiries and rate-limited, non-enumerating email password reset with hashed single-use tokens.
- Rate-limited sign-in and public forms, baseline security headers, explicit demo seed and starter privacy/terms pages.
- CI workflow for ESLint, TypeScript, unit tests and production build.

## External setup still required
- Configure real MongoDB, Cloudinary authenticated raw-file support, Resend API key and verified sender domain/inboxes in deployment; verify each integration with a staging smoke test.
- School administrators must replace/approve privacy/terms starter content, school identity/contact information and all demo or sample content before publication.
- Full end-to-end/browser/device tests, accessibility review, load/security testing and backup/restore drill remain release tasks.
- Comprehensive audit coverage and dedicated staff invitation/forced first-login password-change flow are not complete.
- Configurable/custom admissions forms beyond the current schema and explicit versioning still need implementation.
- Production deployment, monitoring/alerts, retention/deletion procedures and rollback procedure have not been verified from this session.

CI success is required, but it alone does not establish production readiness. Do not treat the system as fully release-ready until the latest CI passes and the configured staging/deployment checks are completed.
