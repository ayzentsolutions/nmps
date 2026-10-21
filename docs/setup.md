# NMPS setup and release configuration

## Stack
NMPS is a single Next.js App Router app using TypeScript, React, Tailwind CSS, Auth.js Credentials, Mongoose/MongoDB, Zod, Cloudinary and Resend. API handlers live under /api/v1; there is no separate Express server.

## Local setup
1. Use Node.js 22 LTS and npm.
2. Run npm ci to install the committed package-lock.json.
3. Copy .env.example to .env.local.
4. Set MONGODB_URI, AUTH_SECRET, AUTH_URL=http://localhost:3000, DEFAULT_SCHOOL_ID, and BOOTSTRAP_SECRET (at least 32 random characters).
5. Configure Cloudinary credentials for the media library. Private admission attachments additionally require authenticated raw assets to work in your Cloudinary account.
6. For actual email delivery, set RESEND_API_KEY, EMAIL_FROM, and optional ADMISSIONS_NOTIFICATION_EMAIL / ENQUIRY_NOTIFICATION_EMAIL inboxes. Verify the sender domain with Resend.
7. Run npm run dev and open http://localhost:3000.

## First administrator
Send POST /api/v1/admin/bootstrap with header x-bootstrap-secret: $BOOTSTRAP_SECRET and JSON { "name": "...", "email": "...", "password": "..." }. The password must be at least 14 characters. Bootstrap requires a valid one-time secret and an empty user collection; it uses a unique database lock to prevent concurrent initial admins. Rotate/remove BOOTSTRAP_SECRET after setup.

## Password recovery
Staff use /admin/forgot-password. Reset requests return the same response for existing and unknown email addresses. Tokens are random, stored only as SHA-256 hashes, single-use and valid for 30 minutes. Email delivery requires Resend configuration. AUTH_URL must be the canonical HTTPS site URL in deployment.

## CI checks
Run npm run lint, npm run typecheck, npm test and npm run build. GitHub Actions performs these checks on pushes to main and pull requests using npm ci. Check the latest completed run rather than assuming a push has passed.

## Deployment
Deploy the Next.js app to Vercel or compatible Node hosting. Configure environment variables in the hosting dashboard and use separate preview/production databases. Verify /api/health and /api/ready. Perform a real sign-in, role change/deactivation, content publish/unpublish, slug conflict, media upload, private document upload/download, application submission, contact enquiry, email delivery and password reset against the configured staging deployment before launch.

## Important cautions
- Public admission submissions can include up to 3 PDF/JPEG/PNG attachments with a 4 MB combined maximum. The files use authenticated private Cloudinary storage, separate from public website media.
- Privacy policy and terms pages are starter text and require school review/approval.
- Email and media integrations work only after secrets and provider permissions are set.
- Do not use production personal data until CI, authorization, data retention, backup/restore, accessibility, security and end-to-end checks are complete.
