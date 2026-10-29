# KeepText handoff

## Current work (uncommitted)

- Email/password and Google auth use Better Auth with MongoDB. Email verification uses an OTP sent through Resend. The signup flow passed an isolated in-memory test. A synthetic signup through the local HTTP route returned 200 and Resend accepted the OTP email to its test inbox. Real recipient delivery and Google OAuth remain untested.
- Auth data now targets the existing MongoDB `test` database, regardless of the Git branch or Atlas project name. The existing MongoDB user has `atlasAdmin`; no new write flag or Codex configuration is needed. Better Auth creates its auth collections on first writes.
- The user explicitly chose a fresh start and multiple titled notes. The old `test.users` (1 document), `test.notehistories` (13 documents), and `test.verificationtokens` (0 documents) collections were dropped. The `test.notes` validator now allows `_id`, `userId`, `title`, `content`, and optional `pinned` and `customTitle` fields, plus a `userId` index.
- Sidebar Rename, Pin/Unpin, and Remove now write to MongoDB. Renamed titles remain stable when content changes, and pinned texts sort first. The `migrate-note-fields.mjs` script updated the existing Atlas validator without changing note records.
- Signed-in users write directly in a blank editor; the first text creates a note, and its first three words become the sidebar title. New note and delete controls live in the signed-in sidebar. The server encrypts title and content with AES-256-GCM before MongoDB storage; guest drafts stay in browser storage. The `NOTE_ENCRYPTION_KEY` must be copied to production environment variables and kept stable.
- Local Windows SRV DNS was unreliable inside Next.js. The ignored `.env.local` now uses a direct Atlas seed list in `MONGODB_URI`; Vercel can continue using the SRV URI.
- `npm run lint`, `npm run build`, the encryption and title tests, and `node --test src/features/auth/signup.test.mjs` passed. Synthetic HTTP signup and signed-in note create/edit/reload/delete passed against the local app; Resend accepted a styled OTP email to its test inbox. Real recipient delivery and Google OAuth remain untested.

## Git state

- Active branch: `keeptext-v2`.
- `10313d4` is the earlier scaffold checkpoint, not the latest commit. Run `git log -1 --oneline` for the current commit and `git log --oneline 10313d4..HEAD` for the redesign history.
- Review `git status` before making changes. Do not reset the working tree without checking for new work.
- `main` still contains the previous Blanked Note implementation. This work has not pushed the branch or opened a pull request.
- `keeptext-v2` has no remote tracking branch. A new agent in this workspace can see these commits; a fresh clone cannot see the branch until it is pushed.

## Product state

- Next.js 16.4.3, React 19.2.4, TypeScript, and plain CSS. Better Auth and the MongoDB driver are installed.
- Product name: **KeepText**. The wordmark uses white for "Keep" and light blue for "Text".
- Solid near-black UI with a writing area that focuses automatically on page load.
- Guests can write on one page without creating a note. Text is saved in this browser's local storage.
- The top-right **Sign in** button opens a right-side drawer with email/password, email OTP, and Google flows. `/sign-in` and `/sign-up` remain available as direct routes.
- The home route checks a server session. Signed-in users see multiple titled notes, with the sidebar initially closed. Guests see no sidebar control.
- Browser tab, Apple, and Android icons use the user's files in `public/assets/keeptext-favicon/`.

## Important code paths

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | Home route with server-verified session state. |
| `src/features/notes/NotesApp.tsx` | Header, note selection, and signed-in sidebar toggle. |
| `src/features/notes/components/GuestEditor.tsx` | Focused guest editor and save-error message. |
| `src/bootstrap/guestDraftStorage.ts` | Browser draft storage and fallback from the previous multi-note storage key. |
| `src/features/notes/components/UserEditor.tsx` | Signed-in writing editor with note creation and autosave. |
| `src/app/sign-in/page.tsx` | Email/password and Google sign-in UI. |
| `src/app/layout.tsx` | Site metadata, favicon links, and theme color. |
| `src/app/api/notes/` | Authorized multiple-note read and write routes. |
| `src/features/auth/` | Better Auth configuration and sign-in UI. |
| `src/integrations/` | MongoDB connection and Resend email sender. |

See `src/README.md` for the rest of the folder map. Read the relevant local guides in `node_modules/next/dist/docs/` before changing Next.js code, as required by `AGENTS.md`.

## Storage and migration

- Current guest draft key: `keeptext.guestDraft.v1`.
- Previous local notes key: `keeptext.notes.v1`. If the guest draft key does not exist, the editor combines previous local note titles and text into the single page. The old key is not deleted.
- Guest drafts stay in browser storage after sign-in and are not imported automatically.
- `.env.local` is ignored by Git and may contain credentials from the old app. Do not commit it or assume its values match the new auth setup.
- `public/googleead0c3d5809d017f.html` is a site verification file, not a Google OAuth configuration file. Keep its public URL intact.

## Next task: authentication verification

- Confirm the same `NOTE_ENCRYPTION_KEY` and auth environment variables are configured in Vercel. Use the production Atlas URI there.
- Test email sign-up and verification OTP with the configured Resend domain, then email/password sign-in and sign-out.
- Test Google OAuth using both local and production callback URLs. A matching Google address should link only after the email account has been verified.
- Test a real signed-in user's multiple-note flow in the browser. The synthetic API flow confirmed create, save, reload, delete, encrypted fields, and the four-field schema.

## Checks completed

- `npm run lint` passed.
- `npm run build` passed, including the auth and multiple-note routes.
- `node --test src/features/notes/noteEncryption.test.mjs` passed.
- The unauthorized note API returned HTTP 401 before the multiple-note route change; the new routes still need a live auth check.
