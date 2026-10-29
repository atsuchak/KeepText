# KeepText

This branch contains the first version of KeepText. Guests can write on one page, and their writing is saved in this browser's local storage. Sign-in is a placeholder while email and Google authentication are being planned. Read [REQUIREMENTS.md](REQUIREMENTS.md) and [PROGRESS.md](PROGRESS.md) before adding more features.

See [src/README.md](src/README.md) for the code layout. Favicons, the app icon, and future images live in `public/assets/`. The Google site verification HTML stays at the public root because its URL must remain unchanged.

## Development

```bash
npm install
npm run dev
```

The database and authentication approach are still being decided. The previous implementation remains in Git history.
