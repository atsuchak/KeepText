# KeepText handoff

## Git state

- Active branch: `keeptext-v2`.
- `10313d4` is the earlier scaffold checkpoint, not the latest commit. Run `git log -1 --oneline` for the current commit and `git log --oneline 10313d4..HEAD` for the redesign history.
- Review `git status` before making changes. Do not reset the working tree without checking for new work.
- `main` still contains the previous Blanked Note implementation. This work has not pushed the branch or opened a pull request.
- `keeptext-v2` has no remote tracking branch. A new agent in this workspace can see these commits; a fresh clone cannot see the branch until it is pushed.

## Product state

- Next.js 16.2.10, React 19.2.4, TypeScript, and plain CSS. No authentication or database packages are installed.
- Product name: **KeepText**. The wordmark uses white for "Keep" and light blue for "Text".
- Solid near-black UI with a writing area that focuses automatically on page load.
- Guests can write on one page without creating a note. Text is saved in this browser's local storage.
- The top-right **Sign in** button opens `/sign-in`, which is a placeholder page. There is no working sign-in yet.
- The sidebar and toggle are coded for a future signed-in state, and the sidebar starts closed. `src/app/page.tsx` currently passes `isSignedIn={false}`, so guests see neither control.
- Browser tab, Apple, and Android icons use the user's files in `public/assets/keeptext-favicon/`.

## Important code paths

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | Home route. Replace the hardcoded guest state with a verified server session when auth is ready. |
| `src/features/notes/NotesApp.tsx` | Header, sign-in link, and signed-in sidebar toggle. |
| `src/features/notes/components/GuestEditor.tsx` | Focused guest editor and save-error message. |
| `src/bootstrap/guestDraftStorage.ts` | Browser draft storage and fallback from the previous multi-note storage key. |
| `src/app/sign-in/page.tsx` | Placeholder to replace with email and Google sign-in UI. |
| `src/app/layout.tsx` | Site metadata, favicon links, and theme color. |
| `src/app/api/` | Reserved for Next.js HTTP route handlers. No endpoints exist yet. |
| `src/integrations/` | Reserved for external providers such as email. No integration exists yet. |
| `src/features/auth/` | Reserved for authentication UI and logic. |

See `src/README.md` for the rest of the folder map. Read the relevant local guides in `node_modules/next/dist/docs/` before changing Next.js code, as required by `AGENTS.md`.

## Storage and migration

- Current guest draft key: `keeptext.guestDraft.v1`.
- Previous local notes key: `keeptext.notes.v1`. If the guest draft key does not exist, the editor combines previous local note titles and text into the single page. The old key is not deleted.
- Do not clear or overwrite guest drafts when a user signs in. Decide how to import them into an account, then ask for confirmation before any destructive migration.
- `.env.local` is ignored by Git and may contain credentials from the old app. Do not commit it or assume its values match the new auth setup.
- `public/googleead0c3d5809d017f.html` is a site verification file, not a Google OAuth configuration file. Keep its public URL intact.

## Next task: authentication

The user wants **email login plus Google login**. The previous app used email/password, verification codes, custom JWT sessions, MongoDB, and email delivery, but that code was removed from this branch and remains on `main`.

Decisions still open:

1. Database and account model. MongoDB is not confirmed for the new version.
2. Authentication provider/library, email verification flow, and Google OAuth credentials.
3. Whether existing Blanked Note accounts and notes must be migrated.
4. How to link an existing email account to a Google account with the same address.
5. How a guest draft should move into a signed-in account.

Implementation should replace the placeholder sign-in page, establish a real server-verified session, and pass its state to the home route. Keep guest writing available without signing in. Do not use a client-only flag as proof of authentication. Add server-side authorization to any account or note endpoints.

## Checks completed

- `npm run lint` passed.
- `npm run build` passed, including `/` and `/sign-in`.
- Browser checks passed for editor focus, typing, local save, reload, mobile width, hidden guest sidebar, and the sign-in placeholder.
