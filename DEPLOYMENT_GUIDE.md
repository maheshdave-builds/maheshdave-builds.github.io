# Deployment guide

## Local development

Install Node.js 20.19+ or 22.12+, then run:

```bash
npm install
npm run dev
```

For local public-site preview, the app can run without environment variables. To enable shared admin editing, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` or the deployment environment. Use only the public anon/publishable key.

## Verify before deployment

```bash
npm run lint
npm run build
npm run preview
```

## Static hosting

1. Build with `npm run build`.
2. Deploy the contents of `dist/` to your static host.
3. Configure SPA fallback/rewrite rules so `/mdadmin` and `/articles/<slug>` (legacy `/blog/<slug>` links redirect to the article URL) serve `index.html`.
4. Confirm the resume PDF and profile assets are present in `dist/`.

## Content publishing and security

Browser `localStorage` is per-browser and per-origin, so it is not used for administrator editing. Configure the shared Supabase database and role-based policies below before using the admin dashboard. Do not store a service-role key in this public repository.

## Shared admin content (required for cross-device persistence)

The previous browser-only CMS stored edits in `localStorage`, so changes were visible only in the browser where they were made. The application now uses the existing Supabase data adapter whenever the two public environment variables below are configured. Do not put a Supabase service-role key in frontend code.

1. Create/use the Supabase project and apply the project's database schema and row-level security policies for `profile`, `projects`, `experience`, `certifications`, `education`, `blog_posts`, and `site_settings`, plus a public `portfolio-media` Storage bucket.
2. In GitHub repository **Settings → Secrets and variables → Actions → Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the anon/publishable key only).
3. Ensure the GitHub Pages build workflow passes those variables to the Vite build environment. Vite embeds `VITE_*` values at build time; adding them after deployment requires a new build/deploy.
4. Create the administrator user directly in Supabase Authentication. In that user's `app_metadata`, grant `role: "admin"` (or `roles: ["admin"]`) using a trusted server-side/admin process. Never grant admin role from the public client. Public self-registration is not offered by the site.
5. Configure Supabase Auth's allowed redirect URLs for the production site and `/mdadmin/reset-password`. Test login, editing, publishing, and media uploads from a second browser/device.

Without the Supabase variables, shared content editing is intentionally unavailable: browser-local storage is not a safe or reliable substitute for a shared database. Existing localStorage edits from the old version do not automatically migrate to Supabase. Export the old browser's content backup before moving it, then import/migrate it using a trusted one-time migration workflow.

## Admin URL

The administrator route is now `/mdadmin`. The old `/admin` path redirects to the new path for convenience. The route name is not a security boundary by itself; authorization is enforced through Supabase Auth and database RLS.
