# Mahesh Dave — Portfolio Studio

A responsive React + Vite portfolio with a light professional theme, theme-aware scrollbar, animated custom cursor on pointer devices, modern capsule navigation, motion effects, and a browser-local admin content editor.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Admin: `http://localhost:5173/admin`.

No `.env.local`, Supabase URL, API key, or backend account is required for local editing mode.

## Build

```bash
npm run build
npm run preview
```

## Admin capabilities

- Profile, resume, social links, portrait upload
- Editable homepage headlines/descriptions, about statistics, skills/toolkit groups
- Project CRUD with project logo/thumbnail and client logos
- Certification CRUD with badge/logo and verification URL
- Experience and education CRUD
- Blog editor with headings, bold/italic/underline/strike, alignment, lists, quotes, links, colors/highlights, inline images, image upload, undo/redo, and cover image
- Site title and logo upload, favicon update, JSON backup import/export

## Local storage and deployment caveats

The editor stores data in the current browser's local storage. It does not publish changes to GitHub Pages or synchronize them between browsers/devices. Use the JSON export/import to back up or move content. For a public production admin panel, configure a real backend with server-side authentication and permissions; this no-backend admin route is intended for local/personal editing only.

See `ADMIN_GUIDE.md` for details.
