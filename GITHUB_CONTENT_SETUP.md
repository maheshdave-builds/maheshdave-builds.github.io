# GitHub-backed portfolio content (no Supabase required)

The app can use a single JSON file in your GitHub repository as the shared source of truth. The Cloudflare Worker keeps your GitHub token server-side; never put a GitHub write token in frontend code.

## One-time setup

1. Back up the current content from the browser where your latest edits exist. Browser-local edits do not automatically migrate to GitHub.
2. Create `public/portfolio-content.json` in the repository using that exported content as the initial JSON document. If you do not have an export, use the site's bundled content as a starting point.
3. Deploy `cloudflare-worker/index.js` as a Cloudflare Worker.
4. Set Worker variables:
   - `GITHUB_OWNER`: GitHub username or organization
   - `GITHUB_REPO`: repository name
   - `GITHUB_BRANCH`: deployment branch (usually `main`)
   - `CONTENT_PATH`: `public/portfolio-content.json`
   - `ALLOWED_ORIGIN`: exact production origin, no trailing slash
5. Set Worker secrets:
   - `GITHUB_TOKEN`: fine-grained token scoped to this repository with Contents read/write only
   - `ADMIN_PASSWORD`: long, unique administrator password
6. In GitHub repository Settings → Secrets and variables → Actions → Variables, add `VITE_GITHUB_CONTENT_API_URL` with the deployed Worker URL, e.g. `https://your-worker.your-subdomain.workers.dev`.
7. Deploy the site again using GitHub Actions. Open `/mdadmin/login` and sign in using the Worker `ADMIN_PASSWORD`. No Supabase Auth account is required when the gateway URL is configured.

## How it works

- Public pages fetch the shared JSON document from the Worker with no-cache headers.
- Admin content saves write the updated document through the Worker, which commits it to GitHub.
- The Worker validates admin passwords and holds the GitHub token. Neither secret belongs in a `VITE_` variable or the repository.
- Without `VITE_GITHUB_CONTENT_API_URL`, the app falls back to browser storage; those edits are not shared across browsers.

## Limitations and care

- Existing local edits must be exported/imported into the GitHub JSON file once; browser localStorage cannot be read from another device.
- Large base64 image uploads may exceed the Worker document size limit. Prefer repository image assets or durable image URLs.
- Each save creates a Git commit. If two editors save simultaneously, a conflict may occur; refresh and retry.
- This replaces Supabase for portfolio content and admin login, but contact form messages remain browser-local in local mode unless a separate shared message service is implemented.
