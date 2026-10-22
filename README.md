# Mahesh Dave — Portfolio Studio

A responsive React + Vite portfolio with a theme-aware scrollbar, animated navigation, motion effects, article publishing and a private administrator dashboard.

## Run locally

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. Admin path: `/mdadmin`.

## Shared admin setup

To make edits visible on every browser/device, configure the Supabase URL and public anon key as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the deployment environment. Apply `supabase/schema.sql` and `supabase/migration_002_admin_studio.sql`, then create an administrator in Supabase Auth and grant the `admin` app-metadata role through a trusted admin process. Self-registration is disabled. Never place a service-role key in frontend code.

The GitHub Actions workflow builds and deploys the site. `VITE_*` values are embedded at build time, so changing variables requires a new deployment. See `ADMIN_GUIDE.md` and `DEPLOYMENT_GUIDE.md` for setup and migration notes.

## Features

- Profile, resume, social links, portrait and project content management
- Page structure editing, custom sections and multiple header navigation styles
- Projects, experience, certifications and education management
- Articles editor with formatting, color/highlight, code blocks, image uploads and crop controls
- Public copy buttons for code/quote blocks and external-link indicators
- Theme and site branding controls

Existing edits stored in a previous browser's local storage do not automatically migrate to Supabase. Export or recover that content from the original browser before switching to the shared backend.


## Admin without Supabase Auth

The admin login supports the GitHub content gateway. Configure `VITE_GITHUB_CONTENT_API_URL` as a GitHub Actions repository variable and set `ADMIN_PASSWORD` as a Cloudflare Worker secret. See `GITHUB_CONTENT_SETUP.md`. When the gateway URL is configured, the content adapter reads and writes the shared GitHub JSON document; local storage is only a fallback before the gateway is configured.


## GitHub-backed CMS (no Supabase Auth)

See [`GITHUB_CONTENT_SETUP.md`](./GITHUB_CONTENT_SETUP.md). Configure `VITE_GITHUB_CONTENT_API_URL` in GitHub Actions and set the GitHub token and admin password as Cloudflare Worker secrets. With the gateway configured, admin content saves are written to the repository JSON file and read by public pages on all devices.


## GitHub-only publishing (no external backend)

The public site reads `public/portfolio-content.json` as its shared content source. To edit content, open `/mdadmin/login` and enter a GitHub fine-grained personal access token scoped to this repository with **Contents: Read and write** permission. The token is kept in `sessionStorage` for the current browser session only and is not bundled into the public website. Saves commit the JSON file to the `main` branch; the GitHub Pages workflow builds and deploys it.

Create the token under GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens. Select repository `maheshdave-builds/maheshdave-builds.github.io`, set Contents to Read and write, and no other permissions. Do not share the token or commit it to the repository.

This is a browser-based publishing model: a repository-scoped token is visible to the signed-in browser session while in use. For stronger security, use a server-side gateway instead.
