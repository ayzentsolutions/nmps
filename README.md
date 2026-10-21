# NMPS — School Website & Visual CMS

NMPS is a school website and content management system built with Next.js App Router, TypeScript, Tailwind CSS, MongoDB/Mongoose, Auth.js Credentials, Zod, Cloudinary and Resend. All server APIs are implemented as Next.js Route Handlers under /api/v1; no separate Express server is used.

## Main features
- Visual page builder with version history, draft/publish snapshots, responsive preview and editable content blocks.
- CMS-controlled school branding, theme, header/footer navigation, dropdown items, social links, announcement banners and SEO defaults.
- Managed public media for website images and circular PDFs; separate authenticated private storage for admission documents.
- Notices/circulars, events, photo-gallery albums, admissions applications and contact enquiries.
- Protected staff workspaces, school-scoped APIs, roles, audit log viewer and one-time email password recovery.
- Rate-limited public submission/login flows, sitemap/robots and health/readiness endpoints.

## Start locally
1. Use Node.js 22 LTS.
2. Run npm ci.
3. Copy .env.example to .env.local and set required values.
4. Run npm run dev and open http://localhost:3000.
5. Create the first administrator with the one-time POST /api/v1/admin/bootstrap endpoint, then rotate/remove BOOTSTRAP_SECRET.

Read docs/setup.md before configuring deployment. Real MongoDB, Cloudinary and Resend settings are required for all integrations. The privacy policy and terms pages are starter content and need school approval.

## Verification and release status
GitHub Actions runs ESLint, TypeScript, unit tests and a production build. Check the latest run before release. Passing CI is necessary but not sufficient: run a staging smoke test covering staff access, page publish/unpublish, media upload, private application documents, form submissions, email delivery and password recovery.

See docs/implementation-status.md for the exact remaining release work. Do not use production personal data until authorization, privacy, retention, backup/restore, accessibility and end-to-end validation are complete.
