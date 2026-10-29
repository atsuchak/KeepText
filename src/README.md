# Source structure

- `app/`: Next.js routes, layouts, metadata, and auth/note API routes in `app/api/`.
- `bootstrap/`: browser startup and storage setup.
- `features/`: product features, each with its own UI and logic.
- `integrations/`: MongoDB connection and Resend email delivery.
- `logs/`: future user activity logging.
- `types/`: shared TypeScript types.

Guest drafts use browser storage. Signed-in notes use encrypted title and content in MongoDB.
