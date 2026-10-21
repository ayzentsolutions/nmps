# NMPS — School Website & Visual CMS

A production-oriented, multi-school-ready school website and content management system built with Next.js App Router, TypeScript, MongoDB/Mongoose, Auth.js, Zod, and managed media storage. The application uses Next.js Route Handlers for all `/api/v1` endpoints; no separate API server or Express.js is used.

## Status

Repository foundation is being implemented in verifiable batches. Initial features will be enabled only when backed by database persistence and server-side authorization. See `docs/implementation-status.md` for the verified scope and known external setup requirements.

## Requirements

- Node.js 20.9+ (Node.js 22 LTS recommended)
- npm
- MongoDB Atlas database
- Auth.js secret and initial administrator bootstrap configuration
- Cloudinary credentials for managed media uploads (optional until media upload is enabled)

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in values.
3. Start the development server: `npm run dev`
4. Open `http://localhost:3000`.

The application fails closed for admin access when authentication/database configuration is missing. Do not add real credentials to source control. Do not run a production seed automatically.

## Architecture

- `app/`: public pages, admin UI, and Next.js Route Handlers
- `lib/`: database connection, auth, permissions, validation and services
- `models/`: Mongoose models
- `components/`: public site, CMS, page-builder blocks and UI
- `docs/`: setup, security, operations and implementation status
- `tests/`: automated tests

## Security notes

- All protected server endpoints must authenticate and authorize each request.
- School-owned data is scoped by `schoolId`.
- Public readers may fetch published content only.
- Draft previews are protected and non-indexable.
- Admission documents must use authorized access or expiring signed URLs.
- Never log passwords, session tokens, or unnecessary applicant data.

## Documentation

- Setup and configuration: `docs/setup.md`
- Security model: `docs/security.md`
- Operations and recovery: `docs/operations.md`
- Implementation status: `docs/implementation-status.md`
