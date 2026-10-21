# Setup and configuration

## Requirements
- Node.js 20.9+ (Node.js 22 LTS recommended), npm, and MongoDB Atlas.
- An Auth.js secret and one-time bootstrap secret of at least 24 characters.

## Local setup
1. Run npm install.
2. Copy .env.example to .env.local.
3. Set MONGODB_URI, AUTH_SECRET, AUTH_URL, DEFAULT_SCHOOL_ID and BOOTSTRAP_SECRET.
4. Run npm run dev and open http://localhost:3000.
5. Create the first administrator using POST /api/v1/admin/bootstrap, with the one-time secret in the x-bootstrap-secret header and JSON fields name, email, password. Passwords must be at least 14 characters.
6. Sign in at /admin/login and open the page builder.
7. Rotate or remove BOOTSTRAP_SECRET after use.

Bootstrap stays closed if the secret is not configured, is shorter than 24 characters, or is incorrect. It refuses to run after a user already exists. Do not send the bootstrap secret from frontend code or commit it to the repository.

## MongoDB
Use a dedicated database and a least-privilege MongoDB Atlas database user. Restrict network access to required environments and back up production data before destructive changes. Configure unique indexes before moving production traffic.

## Deployment
Deploy as one Next.js application to Vercel or compatible hosting; do not deploy a separate Express or Node API server. Configure environment variables in the hosting dashboard. Use an isolated preview database rather than the production database.

## Incomplete integrations
Cloudinary uploads, email, notices, events, galleries, admissions, enquiry management, user management and version restoration UI are not complete in this batch.