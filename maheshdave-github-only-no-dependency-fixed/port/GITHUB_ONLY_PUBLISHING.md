# GitHub-only publishing (Option A)

No Supabase or Cloudflare setup is required for the static publishing workflow.

1. Make edits in the admin editor in the browser where you work. Those edits are local drafts until published.
2. In Admin → Settings → Export or restore content, click **Export backup**.
3. Copy the downloaded `mahesh-portfolio-backup.json` over `public/portfolio-content.json`.
4. Put new permanent images under `public/media/` and update their paths in the JSON.
5. Run `npm run build`, then commit and push `public/portfolio-content.json` and any media files to GitHub.
6. Wait for GitHub Pages deployment. Visitors on all devices then receive the committed version.

## Limitations of this choice

GitHub Pages is static hosting and cannot securely write to the repository from frontend JavaScript. Publishing is therefore **export → replace JSON → commit/push → deploy**, not an automatic Save-to-GitHub button. Do not place a GitHub token in frontend code or `VITE_*` variables.

Browser drafts are not shared across browsers until exported and committed. Central contact-message storage and a private cross-device admin inbox are not available without a server-side component. A client-side password screen is not a security boundary; do not use it to protect secrets.
