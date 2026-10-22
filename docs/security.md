# Security notes

- Auth.js Credentials verifies active staff accounts with bcrypt hashes. Credential attempts use a MongoDB-backed rate limit; public forms and password-reset requests have separate limits.
- JWT sessions have an eight-hour maximum age. Each JWT callback checks the current account's active state and session version against MongoDB; deactivation or a session-version change invalidates the token on its next validation. Password reset and password change increment the session version. Session validity therefore depends on MongoDB being reachable; the auth callback fails closed on a validation error.
- New or invited staff can be required to replace a temporary password before using protected admin APIs. Password change increments the session version, requiring the user to sign in again.
- Protected admin API routes authorize permissions on the server. Ordinary school users are school-scoped; super administrators have platform-wide access. UI visibility alone is not an authorization boundary.
- Public page, notice, event and gallery queries only return published snapshots. Draft editing does not rewrite the published snapshot. Page slugs are validated and reserved routes are disallowed.
- CMS block content uses a finite Zod registry; arbitrary HTML and scripts are not executed. Image/media URLs are HTTPS/local paths; video embeds are limited to YouTube/Vimeo.
- Password-reset tokens are cryptographically random, stored as SHA-256 hashes, expire after 30 minutes, are one-time use and rate-limited. Reset requests return a generic response to reduce account enumeration. Reset email sending depends on Resend deployment configuration.
- Bootstrap requires a long one-time secret and an empty users collection. Rotate/remove `BOOTSTRAP_SECRET` after the initial administrator has been created.
- Public media library files are intentionally public. Private admissions documents use authenticated Cloudinary raw assets, application/school-scoped metadata, role-authorized downloads with short-lived signed URLs, and audit events. Never place confidential documents in the public media library.
- Public forms use MongoDB-backed rate limiting and enquiries have a honeypot. Verify that hosting proxy headers are trustworthy before relying on IP-based limits.
- Response headers include `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and (after the release-readiness branch change is merged) `Strict-Transport-Security`. A Content Security Policy remains deployment-specific and needs validated rollout.
- Comprehensive audit coverage is not yet complete. Review sensitive-action coverage and avoid recording passwords, reset tokens, document contents or full application submissions in audit metadata or logs.
- The staging verification workflow is destructive to **staging test data** by design (temporary page/media and private document, test admission and enquiry); only run it with the explicit dispatch confirmation on an isolated staging environment. See `docs/release-runbook.md`.
- Production launch still requires restricted database networking, secret management, school-approved privacy/terms, approved retention/deletion procedures, backups, alerting, manual accessibility review, security testing, and successful end-to-end/recovery checks.

This document records intended controls, not an independent penetration-test result. Confirm all controls against the actual deployed configuration before processing real student or parent data.
