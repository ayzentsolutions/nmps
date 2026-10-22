# Staging release verification runbook

This procedure uses synthetic test records only. Run it against an isolated staging deployment and database, never a production URL or production database. The workflow can write a temporary page, create a test enquiry and admission application, upload test media and a private PDF, and reset a dedicated test account password temporarily.

## 1. Prepare the staging environment

1. Deploy the current release candidate to a staging environment on HTTPS. It must use a separate MongoDB database and separate staging credentials from production. Ensure the staging URL points to this isolated database before continuing.
2. Use a dedicated Cloudinary account or isolated staging folders/credentials, and enable authenticated raw resources for the private admission documents. Public media tests create and delete a synthetic image; private-document tests create and delete a synthetic PDF.
3. Configure the application deployment's staging environment values:
   - `MONGODB_URI`: staging-only MongoDB URI.
   - `AUTH_SECRET`: a random, unique secret of at least 32 characters.
   - `AUTH_URL`: the canonical HTTPS staging URL (no path).
   - `DEFAULT_SCHOOL_ID`: the intended staging school scope.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   - `RESEND_API_KEY`, `EMAIL_FROM`, `ADMISSIONS_NOTIFICATION_EMAIL`, `ENQUIRY_NOTIFICATION_EMAIL`.
   - Rotate/remove `BOOTSTRAP_SECRET` after initial setup; never reuse a production secret for staging.
4. Visit `/api/health` and `/api/ready`. Health must return `200 { "status": "ok" }`; readiness must return HTTP 200 with `status: "ready"` and `database: "connected"`.
5. Create dedicated, active staging staff accounts with the correct role for each of these: `super_admin`, `school_admin`, `editor`, `publisher`, `admissions_staff`, `enquiry_staff`, and `media_manager`. The workflow checks server-side access grants for each. None of these test accounts should have a forced password change pending.
6. Create one dedicated, active staging reset-test account, with a known original password of at least 14 characters, a verified email inbox you can read, and permission to use the staging workspace. Do not use a real staff member's account.
7. Select a monitored test recipient mailbox for staging messages, preferably distinct from real applicant addresses. Verify the Resend sender domain and configure its sending capability before testing.

## 2. Configure GitHub's staging environment

In the repository, open **Settings → Environments → New environment** and create `staging`. Configure the following environment variable and environment secrets. Do not add their values to source control, issue comments, screenshots, or logs.

Environment variable:
- `STAGING_BASE_URL`: canonical HTTPS origin of the isolated staging site, e.g. `https://staging.example.invalid` (replace with the real staging origin).

Environment secrets:
- `STAGING_SUPER_ADMIN_EMAIL`, `STAGING_SUPER_ADMIN_PASSWORD`
- `STAGING_SCHOOL_ADMIN_EMAIL`, `STAGING_SCHOOL_ADMIN_PASSWORD`
- `STAGING_EDITOR_EMAIL`, `STAGING_EDITOR_PASSWORD`
- `STAGING_PUBLISHER_EMAIL`, `STAGING_PUBLISHER_PASSWORD`
- `STAGING_ADMISSIONS_EMAIL`, `STAGING_ADMISSIONS_PASSWORD`
- `STAGING_ENQUIRY_EMAIL`, `STAGING_ENQUIRY_PASSWORD`
- `STAGING_MEDIA_MANAGER_EMAIL`, `STAGING_MEDIA_MANAGER_PASSWORD`
- `STAGING_RESET_TEST_EMAIL`, `STAGING_RESET_TEST_PASSWORD` (the account's known original password)
- `STAGING_EMAIL_TEST_RECIPIENT` (inbox you control and can verify)
- `STAGING_EMAIL_FROM` (an authorized sender on the verified Resend domain)
- `STAGING_RESEND_API_KEY` (staging-appropriate scope, if supported)
- `STAGING_CLOUDINARY_CLOUD_NAME`, `STAGING_CLOUDINARY_API_KEY`, `STAGING_CLOUDINARY_API_SECRET`

Use dedicated staging credentials, not the production API key or database URI. Restrict who can run staging workflows and access the `staging` environment.

## 3. Run the full release verification workflow

1. Confirm the staging application has the intended code version and a recent restorable staging backup.
2. Open **Actions → Staging release verification → Run workflow**.
3. Select branch `release-readiness-checks-2026-10-22` (or the approved release-candidate branch) and explicitly enable **confirm_staging_only** only after verifying the URL and database are staging-only.
4. Run the workflow. It checks provider connectivity and verified sender setup, sends a staging test email and waits for delivery, probes public health/readiness/security headers, runs axe WCAG 2.1 A/AA scans on six routes, checks login and server-side role permissions, tests draft/publish/unpublish, uploads/lists/deletes public media, submits a synthetic admission with a private PDF and tests authorization/signed download/deletion, submits and closes a synthetic enquiry, exercises reset-email/token/password restoration, and runs a bounded 8-worker read-only API smoke test.
5. Inspect the workflow result and download the `nmps-staging-release-report` artifact. Every check must pass; record any provider-specific remediation and rerun after fixing it.

The test suite is intentionally blocked unless the dispatch confirmation is true. It should never target production. The suite will leave synthetic records for the test admission (marked withdrawn), enquiry (marked closed), and associated audit history; uploaded document and media assets and the temporary page are cleaned up. Review these synthetic records before repeating tests. A successful run is evidence for that staging environment and commit only; it is not a proof of arbitrary production load capacity or of a human legal approval.

## 4. Scheduled monitoring

The `Staging uptime and database readiness` workflow probes `/api/health` and `/api/ready` every six hours. Configure the `STAGING_BASE_URL` variable in the `staging` GitHub environment. The `Production uptime and database readiness` workflow probes the same non-mutating endpoints every 15 minutes after `PRODUCTION_BASE_URL` is configured in the `production` GitHub environment. If the production variable is empty, the production workflow records that monitoring is not configured and makes no network requests. Configure GitHub Actions notifications to reach the responsible operator and review failures promptly. These probes cover basic site/database availability only; they are not full external monitoring or an incident-response service. Production still needs hosting/provider-native alerting, error-rate and email-delivery monitoring, access to logs, an on-call owner and an escalation path.

## 5. Backup/restore and rollback drill — operator sign-off required

Do this in an isolated staging environment first; do not restore over production as a test.

1. Record the environment, selected backup/snapshot ID and timestamp, operator, current application commit, and database name (do not record credentials).
2. Use the MongoDB hosting console to create or select a backup and restore it to a **new isolated database**. If point-in-time restore is available and configured for the deployed tier, verify the desired recovery point. Record the achieved restore point and elapsed time.
3. Point a temporary, access-restricted staging deployment to that restored database. Verify `/api/ready`, sign-in, school/role scope, public published pages, notices/events/gallery, settings, admission/enquiry visibility, audit history, page version restore, and access to a test private document that exists in this staging backup. Check that indexes/unique constraints are present and that no unexpected demo/production data crossed environments.
4. Test rollback by redeploying the previous known-good application build to a disposable staging slot against a compatible staging database snapshot. Smoke-test public pages, admin login, publishing and admissions. Check schema migrations and backward compatibility before any real rollback. Do not point old code at the live database unless that rollback has been explicitly reviewed and approved.
5. Record PASS/FAIL, restore duration and recovery point, discrepancies, remediation owner, and the person approving the drill. Do not mark backup/restore complete until the operator has performed the actual provider-console restore and verified the resulting data.

## 6. Security, accessibility and load test limits

The workflow checks a limited set of response headers and runs automated axe rules on six routes. It is not a substitute for manual keyboard/screen-reader/device checks, security review, penetration testing, dependency and configuration review, or validating rate limits behind the actual hosting proxy. Validate a Content Security Policy separately before enabling it because its sources depend on the live hosting, media and embed configuration.

The built-in load check is a small, bounded read-only smoke test against the public pages API (default 8 concurrent workers for 10 seconds). It does not certify a target number of visitors, concurrent admissions submissions or peak traffic. Define a school-approved test window and capacity target, then run a separate ramped load test with the actual deployment profile; watch 5xx rate, p95/p99 latency, MongoDB connections/CPU, hosting memory/CPU, provider limits, and email/storage rates. Do not run synthetic writes or load tests on production without explicit change approval.

## 7. School launch checklist — school approver required

Before accepting real student or parent submissions:
- Have the authorized school representative review and approve the privacy policy and website terms. Replace starter content with the school's legal name, data-controller/contact details, purposes and lawful basis as appropriate, provider/transfer details, retention/deletion schedule, applicable rights and complaint route. Legal appropriateness must be decided by the school/adviser, not the software workflow.
- Replace example branding, contact information, homepage text, images, SEO metadata, admission sessions/classes, notices, events, disclosures and any seeded/demo content with verified school-approved content. Use the CMS; review every public page and media URL before publishing.
- Confirm the school's actual mail recipients/sender identity, privacy and retention processes for admissions/enquiries and private documents. Ensure staff accounts use non-shared credentials and remove bootstrap access.
- Confirm production environment variables, backups, monitoring/alert delivery, incident contact, rollback plan and the production release commit. Keep production data separate from staging.
- Capture approval date, approver role/name, approved content version, test run URL/commit, backup drill record, and explicit release decision.

## Exit criteria

Do not describe release readiness as complete until the staging workflow is green for the release candidate, the backup/restore and rollback drill has a recorded pass, appropriate human accessibility/security/load checks are complete, production monitoring is confirmed, and the school records its own legal/content approvals.
