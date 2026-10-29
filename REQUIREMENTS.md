# Redesign requirements

For the current implementation state and authentication handoff, read `PROGRESS.md`.

## Project context

- This is a redesign of the existing Blanked Note project.
- Work is taking place on the `keeptext-v2` branch. The previous version is committed in Git history.
- Inspect the existing code and Git history before replacing or deleting files. Keep the repository and its history.
- Follow `AGENTS.md`. Read the relevant local Next.js guide before changing Next.js code.

## Goals

1. Redesign the user interface.
2. Change the visual theme.
3. Improve the user experience.
4. Keep email login and add Google login.
5. Make the interface simpler than the current one.
6. Revisit the project name, database design, and authentication as part of the wider redesign.

## Previous implementation

- Next.js 16, React 19, and TypeScript.
- MongoDB with Mongoose.
- Email and password authentication with verification codes, custom JWT sessions, and email delivery.
- A note editor, note history, profile, and theme support.

## Current branch

- The previous app code has been removed from this branch.
- The project name is `KeepText`. The UI uses a solid near-black background and white text. The wordmark uses white for "Keep" and light blue for "Text".
- Guests can write directly on one page. Their writing is saved in browser local storage.
- The sidebar and its toggle are reserved for signed-in users and start closed. They are hidden from guests.
- The Sign in button opens a placeholder page until email and Google authentication are implemented.
- Code is organized by feature. Startup storage, shared types, UI components, and styles have separate files.
- The previous implementation remains available in Git history and on `main`.

## Decisions still needed

- Specific screens, user flows, and visual references for the redesign.
- Whether to keep MongoDB or change the database and data model.
- Google login provider and how existing email accounts should link to Google accounts.
- Whether existing user accounts and notes must be migrated.

## Guidance for the next agent

- Confirm the open decisions before implementing changes that depend on them.
- Map current features and data flows before removing old code.
- Preserve user data if migration is required; do not assume the database can be reset.
- Remove code and dependencies that become unused after the new design and flows are working.
- Keep all repository files and product copy in English unless the user requests otherwise.
