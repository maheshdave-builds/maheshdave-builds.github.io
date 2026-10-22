# Deployment guide — GitHub-only static portfolio

This portfolio uses GitHub repository files as its published source of truth. No Supabase, Cloudflare Worker, external database, gateway, or hosted API is required.

## Build and deploy

```bash
npm ci
npm run build
```

Publish the generated `dist/` directory using GitHub Pages. Ensure `public/portfolio-content.json` and image assets are included in the build.

## Publish admin changes

1. Open `/mdadmin` and edit the local draft.
2. In Admin → Settings, export the JSON backup.
3. Replace `public/portfolio-content.json` with the exported JSON.
4. Add any newly uploaded images to `public/` and update their paths in the JSON.
5. Commit and push the changes, then rebuild/deploy.

Edits are not automatically committed to GitHub. The static editor is not a secure server-side admin system and must not contain secrets or private data.
