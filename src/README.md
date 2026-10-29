# Source structure

- `app/`: Next.js routes, layouts, metadata, and future HTTP API routes in `app/api/`.
- `bootstrap/`: browser startup and storage setup.
- `features/`: product features, each with its own UI and logic.
- `integrations/`: future third-party email and messaging connections.
- `logs/`: future user activity logging.
- `types/`: shared TypeScript types.

The notes feature currently uses browser storage. Add API routes, integrations, or logging only when those features are implemented.
