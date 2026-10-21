# Operations and recovery

Use separate MongoDB databases and credentials for local, preview and production. Ensure preview deployments cannot write to production. Keep secrets only in hosting environment settings.

Enable MongoDB Atlas backups appropriate to the deployed tier, and test restoration into an isolated database. Back up managed media separately once media support is added.

Before a release, run npm run lint, npm run typecheck, npm test and npm run build. Smoke test login, role permissions, draft isolation, page publishing/unpublishing, slug conflicts and public route behavior. Do not declare release readiness if a check fails.

If a secret is exposed, rotate it and inspect deployment logs without copying secrets or unnecessary personal information. Database recovery should restore into an isolated database first, validate indexes and page content, then switch the configured URI deliberately.