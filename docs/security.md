# Security notes

- Auth.js Credentials verifies active staff accounts with bcrypt hashes. Credential attempts are rate-limited by a persistent MongoDB time-bucket limiter; public forms and password-reset requests also have separate limits.
- JWT sessions have an eight-hour maximum age. Password reset invalidates outstanding reset tokens, though existing signed-in JWT sessions remain valid until expiry or provider/session changes; an explicit session-revocation mechanism remains future work.
- Protected admin API routes authorize permissions on the server. Ordinary school users are school-scoped; super administrators have platform-wide access.
- Public page, notice, event and gallery queries only return published snapshots. Draft editing does not rewrite the published snapshot. Page slugs are validated and reserved routes are disallowed.
- CMS block content uses a finite Zod registry; arbitrary HTML and scripts are not executed. Image/media URLs are HTTPS/local paths; video embeds are limited to YouTube/Vimeo.
- Password hashes are excluded from normal Mongoose reads. Password-reset tokens are generated with cryptographic randomness, stored as SHA-256 hashes, expire after 30 minutes, are one-time use and are rate-limited. Reset email sending depends on Resend deployment configuration.
- Bootstrap requires a long one-time secret and an empty users collection. Rotate/remove BOOTSTRAP_SECRET after the initial administrator has been created.
- Public media library files are intentionally public. Private admissions documents use authenticated Cloudinary assets, metadata scoped to an application and school, role-authorized downloads with short-lived signed URLs, and audit events. Never put confidential documents in the public media library.
- Public forms use MongoDB-backed rate limiting and enquiries have a honeypot. Confirm platform proxy headers are trustworthy before relying on IP-based limits.
- HTTP response headers include nosniff, Referrer-Policy, X-Frame-Options and a restrictive Permissions-Policy. A Content Security Policy still requires deployment-specific validation.
- Comprehensive audit writes exist for selected sensitive actions, but audit coverage is not exhaustive. Review records omit passwords/tokens and should not store document contents.
- Production requires restricted database networking, secret management, approved privacy/terms copy, data retention policy, backups, accessibility/security tests and successful end-to-end checks.
