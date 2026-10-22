# Mahesh Dave Portfolio — GitHub-only static mode

This version has **no Supabase, Cloudflare Worker, external database, gateway, or hosted API dependency**. The public website reads `public/portfolio-content.json` from the GitHub repository.

## Run locally

1. Install Node.js (LTS).
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `/mdadmin` to edit a browser-local draft.

## Publish changes to every visitor

1. In Admin → Settings, export the portfolio JSON backup.
2. Replace `public/portfolio-content.json` with that exported JSON.
3. Copy any new image files into `public/` and update their paths in the JSON if needed.
4. Commit and push the JSON and image assets to GitHub.
5. Wait for GitHub Pages deployment to finish. Visitors on every device then see the committed content.

## Static-only limitations

GitHub Pages cannot securely write repository files from browser JavaScript. Admin edits remain in the current browser until exported; they do not automatically synchronize to another browser. This static admin UI is **not a security boundary** and has no server-side password protection. Do not put secrets or private data in it. Only committed repository content is shared publicly.
