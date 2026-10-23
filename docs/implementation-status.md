# Implementation and release status

Updated: 2026-10-23.

## Implemented in the repository

- Next.js App Router, TypeScript, Tailwind, MongoDB/Mongoose, Auth.js Credentials, bcrypt and Zod.
- Committed npm lockfile and deterministic `npm ci` CI install.
- School-scoped page, user, site settings, notice, event, gallery, media, admission, enquiry, audit and private document models/APIs.
- Visual page builder with separate drafts and published snapshots, version history/restore, responsive preview and editable content blocks.
- CMS-managed school identity, validated theme tokens, navigation/dropdowns, social links, announcement banner, footer, SEO and media-library pickers.
- Public published-content pages/APIs for notices, events, albums, admissions and enquiries; site chrome; sitemap/robots; health/readiness endpoints.
- Cloudinary public media and authenticated private admission-document storage. Application attachments: up to 3 PDF/JPEG/PNG files and 4 MB combined; staff access is role- and school-scoped with short-lived download links.
- Protected staff workspaces, server-side role-based permissions, user management, admissions/enquiry workflows and searchable audit viewer.
- Rate-limited login/public forms, password-reset tokens that are hashed, single-use and time-limited, JWT session validity/version checks, required temporary-password replacement, and baseline security response headers.
- Best-effort Resend notifications for admission/enquiry submissions and password reset; delivery depends on a verified sender and deployment settings.
- Explicitly guarded demo seed and starter privacy/terms pages; these are not production-approved content.
- CI workflow for ESLint, TypeScript, unit tests and production build.
- Shared frontend design tokens for color, type, spacing, controls, borders, focus indicators, cards and responsive breakpoints; CMS pages use a common API-response reader so HTML/plain-text server failures produce clear errors rather than JSON parser noise.
- Account & Security screen with password-change and recovery links; role-aware dashboard modules; blank/unknown CMS content blocks no longer present fabricated statistics or generic marketing filler.
- Status filters for admissions and enquiries pass the selected filter into the request; notices, events and gallery editors now expose supported status filters. Public navigation filters empty/unsafe destinations.
- Automated responsive viewport smoke checks are implemented in the staging workflow for representative public routes and each staff role at 320, 360, 375, 390, 414, 768, 1024, 1280 and 1440 CSS pixels. This is unverified against a live staging deployment until the workflow is configured and run.
- The staging release workflow and six-hour staging liveness/readiness probe are present on `main`. The release suite includes provider connectivity, delivery, role/permission tests, publishing, public media, private documents, enquiries, password recovery, automated axe scans, responsive viewport smoke checks, and a bounded read-only load smoke. **These workflow checks are implemented but not verified until configured and run against isolated staging.**

## Still required before production release

### Staging setup and test execution
- Create an isolated HTTPS staging deployment/database and GitHub `staging` environment; configure the variable/secrets in `docs/release-runbook.md`, and use dedicated non-production provider credentials and synthetic test accounts.
- Run the **Staging release verification** workflow for the approved release candidate and resolve all failures. The latest known ordinary CI success does not prove the provider integrations or user journeys work in staging.
- Perform a real MongoDB backup/restore and application rollback drill to isolated targets and record operator, recovery point, elapsed time and results.
- Complete manual device/keyboard/screen-reader checks, a security review/penetration test, deployment CSP validation, and a load test based on an explicit expected-traffic target. The included automated accessibility and short read-only load smoke tests are only partial evidence.
- Configure and verify production provider secrets, sender domain/inboxes, deployment health/error alerts, email-delivery monitoring, incident ownership, log retention and recovery procedures.

### School launch and data governance
- The school must approve the privacy policy and terms and provide correct official identity/contact information, school-approved pages/images/SEO, notices, events, admissions sessions, disclosures and email recipients.
- Review and remove demo or placeholder content in the live environment before publication. The demo seed refuses production mode and refuses a school ID that does not start with `demo-`; do not run it on production.
- The school must approve a data retention/deletion schedule and confirm who can access application and enquiry information, including private supporting documents.
- Audit coverage remains incomplete; review sensitive actions and retention before handling real student/parent information.
- Configurable/custom admissions forms and explicit schema-version management beyond the current fixed form are still product work.

## Current evidence and launch decision

CI run [39912001410](https://github.com/ayzentsolutions/nmps/actions/runs/39912001410) passed on commit `10491c1f1a1609d5eded51a57dec5b932714897c`; it covers lint, type checking, unit tests and production build only. It does not prove responsive viewport checks, provider integrations, or user journeys work in a live staging environment.

Do not label the site production-ready until the release-candidate CI passes, the staging suite is configured and green, provider configuration is verified, recovery/rollback and security/accessibility/load checks have recorded results, and the school has documented its content/legal approval.
