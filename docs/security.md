# Security model

- Auth.js Credentials authentication verifies active users in MongoDB with bcrypt password hashes.
- JWT sessions have an eight-hour maximum age.
- Protected page APIs enforce a server-side role permission matrix.
- Ordinary users are restricted to their session schoolId; page slugs are unique within a school.
- Public endpoints only read published content. Draft content is not returned publicly.
- Page data is validated against a finite Zod block registry; CMS HTML/scripts are not executed.
- Password hashes are excluded from normal Mongoose selection; do not log passwords, tokens or sensitive user data.
- Bootstrap requires a long secret and an empty users collection. Rotate/remove the secret immediately after creating the initial administrator.
- Admission/private documents are not implemented; do not upload sensitive files to public storage.
- Production still requires HTTPS, restricted database networking, backups, environment secret management and integration tests.