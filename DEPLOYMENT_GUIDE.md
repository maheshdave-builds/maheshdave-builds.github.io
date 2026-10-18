# Deployment guide

## Local development

Install Node.js 20.19+ or 22.12+, then run:

```bash
npm install
npm run dev
```

No environment variables are required. `.env.example` is included for clarity only; do not copy it to `.env.local` for this version.

## Verify before deployment

```bash
npm run lint
npm run build
npm run preview
```

## Static hosting

1. Build with `npm run build`.
2. Deploy the contents of `dist/` to your static host.
3. Configure SPA fallback/rewrite rules so `/admin` and `/blog/<slug>` serve `index.html`.
4. Confirm the resume PDF and profile assets are present in `dist/`.

## Content publishing and security limitations

The current no-key implementation uses `localStorage` so the admin editor is available without any external setup. Browser storage is per-browser and per-origin. Changes made in `/admin` are **not automatically sent to the deployed website or shared with other visitors**. Use JSON export/import for backup and migration. For site-wide content publishing, use a build/deploy workflow that incorporates the exported data, or connect a real server-side CMS.

Do not treat the local admin route as protected. A public static React application cannot safely keep administrator credentials or enforce authorization by itself. A production shared CMS requires server-side authentication and data permissions.
