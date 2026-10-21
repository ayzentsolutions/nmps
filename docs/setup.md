# NMPS setup and release configuration

## Stack
NMPS is one Next.js App Router application using TypeScript, React, Tailwind CSS, Auth.js Credentials, Mongoose/MongoDB, Zod, Cloudinary and Resend. The API handlers live under /api/v1; a separate Express server is not required.

## Local setup
1. Use Node.js 22 LTS and npm.
2. Run npm install.
3. Copy .env.example to .env.local.
4. Set MONGODB_URI, AUTH_SECRET, AUTH_URL=http://localhost:3000, DEFAULT_SCHOOL_ID, and BOOTSTRAP_SECRET (at least 32 random characters).
5. Configure Cloudinary credentials for the media library. To use private admissions attachments, the Cloudinary account must support authenticated raw assets.
6. For actual email delivery, set RESEND_API_KEY, EMAIL_FROM, and the optional ADMISSIONS_NOTIFICATION_EMAIL / ENQUIRY_NOTIFICATION_EMAIL inboxes. The sender must be verified with Resend.
7. Run npm run dev, then open http://localhost:3000.

## First administrator
Send POST /api/v1/admin/bootstrap with header x-bootstrap-secret: $BOOTSTRAP_SECRET and JSON { "name": "...", "email": "...", "password": "..." }. The password must be at least 14 characters. Bootstrap requires a valid secret and an empty user collection. It is one-time; rotate/remove the bootstrap secret after setup.

## Password recovery
Staff use /admin/forgot-password. Reset requests return the same response for existing and unknown email addresses. Tokens are random, stored only as SHA-256 hashes, single-use and valid for 30 minutes. Email delivery requires the Resend configuration above. AUTH_URL must be the canonical HTTPS site URL in deployment.

## CI checks
Run npm run lint, npm run typecheck, npm test, and npm run build. GitHub Actions runs these on pushes to main and pull requests. The repository does not yet have a committed lockfile, so dependency installation is not fully reproducible; generate and commit package-lock.json, then switch release/CI installs to npm ci.

## Deployment
Deploy the Next.js app to Vercel or compatible Node hosting. Configure the variables above in the hosting dashboard and use separate preview/production databases. Verify /api/health and /api/ready. Perform a real sign-in, content publish/unpublish, media upload, private document upload/download, application submission, contact enquiry, email delivery and password reset against the configured deployment before launch.

## Important cautions
- Admissions attachments are stored as authenticated private Cloudinary assets, separate from public website media.
- Public admissions documents allow PDF/JPEG/PNG, up to 3 files and 4 MB combined.
- Privacy policy and terms pages are starter text and require school approval.
- Do not use production personal data until CI, authorization, data retention, backup/restore, accessibility, security and end-to-end checks are complete.
