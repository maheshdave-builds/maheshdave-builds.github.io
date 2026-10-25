# Portfolio Studio — Shared Admin Guide

The administrator dashboard is available at `/mdadmin`. This repository uses the GitHub Contents API publishing flow: edits are staged in the current browser until the authenticated **Publish** action commits the authoritative JSON files. Browser `localStorage` alone is not a shared database.

## First-time setup

1. Sign in to the admin dashboard with a narrowly scoped GitHub fine-grained token that has Contents: Read and write access to this repository.
2. Save edits to stage them in this browser, then use **Publish** to commit the separate JSON files.
3. Confirm the GitHub Actions Pages workflow succeeds before considering changes live.
4. Never put a privileged token in source code or build-time frontend environment variables.

Never place a Supabase service-role key in frontend code or GitHub Pages build variables.

## Dashboard features

- **Profile & about** — profile, biography, contact and social links.
- **Page content** — section headings and copy.
- **Page structure** — reorder/hide sections, add custom sections, manage menu links, and choose an animated header navigation style.
- **Projects / Experience / Certifications / Education** — manage portfolio records.
- **Articles** — write and publish articles, insert images, code blocks, links, quotes, color/highlight formatting, and crop cover images. The public published-article collection is `public/articles-content.json`; drafts remain in browser-local staging until published. `public/portfolio-content.json` contains portfolio/site settings only. Use a private backend if draft records must be shared across browsers.
- **Theme & branding** — customize the visual theme.
- **Site settings** — site metadata and appearance preferences.

## Existing browser-only edits

Edits made before the shared database is configured remain in that browser's local storage and do not automatically migrate. Export a backup from the old browser before moving content. Do not assume that changing the URL or uploading source code transfers browser-local data into Supabase.

## Verify

```bash
npm ci
npm run lint
npm run build
npm run preview
node scripts/verify-articles.mjs
```
