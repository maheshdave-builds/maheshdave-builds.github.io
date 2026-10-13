# Deployment Guide

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase URL and public anon/publishable key.
npm run dev
```

Before release:

```bash
npm run build
npm run lint
npm run preview
```

## Supabase initialization

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor. The script creates the content tables, Row Level Security policies, `portfolio-media` bucket and initial resume-derived records. It is designed to be safe to re-run for seeded content.
3. Create the administrator in Authentication → Users. Set trusted `app_metadata.role` to `admin` through a trusted administrative workflow; do not use user-editable metadata.
4. Configure Authentication → URL Configuration with the exact local and production site URLs.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local` for local development and to the hosting provider's build environment for production.
6. Sign out and back in after changing admin metadata so the session contains the updated claims.

Only the public anon/publishable key belongs in browser code. Never expose the service-role key.

## Production deployment

This is a React + Vite single-page app. Build and deploy the generated `dist/` directory to a static host such as Netlify, Vercel, Cloudflare Pages, or GitHub Pages. Configure SPA fallback/rewrites so `/admin` and `/blog/<slug>` serve `index.html`; without this, direct navigation to nested routes can return a host-level 404. Configure the environment variables before building. The app assumes domain-root paths for `/admin`, `/md_pic.jpeg`, and `/Mahesh_Dave_Resume_2026.pdf`; GitHub Pages repository subpaths need a matching Vite `base` and asset-path review.

## Security validation checklist

- Confirm RLS is enabled on every content table.
- Test anonymous reads: only published projects/certifications/experience/education, safe profile content, and published blog posts should be visible.
- Test anonymous writes and ordinary authenticated writes: all must be denied.
- Test admin writes using an account with trusted `app_metadata.role=admin`.
- Confirm drafts are not returned through public REST queries or article routes.
- Confirm no service-role key is present in source, `.env.example`, or frontend build output.
- Keep Auth redirect URLs narrow and review Storage policies before launch.

## Limitations / external setup

The app does not create an administrator account automatically; that must be done in Supabase. Email contact uses `mailto:` rather than a message-storing contact form. Supabase configuration is required for persistent admin edits, database-backed content, and image uploads. Validate the deployment with `npm run build`, `npm run lint`, and the security checklist before announcing the site.
