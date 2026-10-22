# GitHub Pages setup — static-only mode

1. Install Node.js LTS.
2. Run `npm ci` then `npm run build`.
3. Publish the generated `dist/` directory with your chosen GitHub Pages deployment method.
4. The public site reads `public/portfolio-content.json` at build/deployment time.

No Supabase, Cloudflare Worker, API URL, API key, or external database is used.

## Publishing content

Edit content in `/mdadmin`, export the JSON from Admin → Settings, replace `public/portfolio-content.json`, add any image assets to `public/`, and commit/push those changes. Rebuild and deploy so every visitor receives the same published content.

## Static-only security limitation

GitHub Pages is static hosting. It cannot securely write to the repository from browser JavaScript, and the admin editor has no server-side authentication. Treat `/mdadmin` as a local content editor, not a protected security boundary. Never store secrets or private data in it.
