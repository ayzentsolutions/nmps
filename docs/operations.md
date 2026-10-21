# Operations and recovery

Use separate MongoDB databases and credentials for local, preview and production. Ensure preview deployments cannot write to production. Keep secrets only in hosting environment settings.

Enable MongoDB Atlas backups appropriate to the deployed tier, and test restoration into an isolated database. Cloudinary public media and authenticated private admission files should be managed in separate folders/types and reviewed under the provider's retention/account settings.

Before release, run npm run lint, npm run typecheck, npm test and npm run build. Smoke test staff login and rate limiting, school/role permissions, draft isolation, publish/unpublish, slug conflict handling, password reset expiry/single-use behavior, public forms, private admission document access, media references, notices/events/gallery, sitemap and robots.

Check /api/health for liveness and /api/ready for MongoDB readiness. Monitor 4xx/5xx rates and email provider failures without logging reset tokens, passwords, full application forms or private file URLs. Set alerting and retention according to school policy.

If a secret is exposed, rotate it immediately and inspect deployment logs without copying secrets or unnecessary personal information. Database recovery should restore into an isolated database first, validate indexes and page content, then switch the configured URI deliberately.

Do not deploy production user data until CI passes and a staging deployment has successfully exercised all configured integrations. Maintain a documented incident contact and a school-approved data retention/deletion process.
