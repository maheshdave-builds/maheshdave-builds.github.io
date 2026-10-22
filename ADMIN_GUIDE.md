# Portfolio Studio — Shared Admin Guide

The administrator dashboard is available at `/mdadmin`. Content must be connected to Supabase to persist across browsers and devices. A static GitHub Pages build cannot use browser `localStorage` as a shared database.

## First-time setup

1. Run the SQL in `supabase/schema.sql` and then `supabase/migration_002_admin_studio.sql` in the Supabase SQL editor, in the order appropriate for a new or existing project.
2. Create the `portfolio-media` public storage bucket/policies (the schema includes these statements).
3. In GitHub repository Settings → Secrets and variables → Actions → Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Push/re-run the GitHub Pages workflow so those variables are included at build time.
5. Create the administrator in Supabase Authentication and grant `role: "admin"` in `app_metadata` through a trusted admin process. Disable public sign-ups. The public site contains no self-registration flow.
6. Configure the production URL and `/mdadmin/reset-password` as allowed Supabase Auth redirect URLs.

Never place a Supabase service-role key in frontend code or GitHub Pages build variables.

## Dashboard features

- **Profile & about** — profile, biography, contact and social links.
- **Page content** — section headings and copy.
- **Page structure** — reorder/hide sections, add custom sections, manage menu links, and choose an animated header navigation style.
- **Projects / Experience / Certifications / Education** — manage portfolio records.
- **Articles** — write and publish articles, insert images, code blocks, links, quotes, color/highlight formatting, and crop cover images.
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
```
