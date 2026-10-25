# GitHub-only publishing

The admin editor stages unpublished edits in the current browser. To publish those edits to every visitor, use the **Publish** action in the admin header. Sign in with a GitHub fine-grained personal access token restricted to the `maheshdave-builds/maheshdave-builds.github.io` repository and grant **Contents: Read and write** permission.

The token is held in `sessionStorage` for the current browser tab/session; it is not embedded in the JavaScript bundle or saved to `localStorage`. Sign out or close the session to clear it. Never commit a token or share it.

The publishing flow commits portfolio data to `public/portfolio-content.json` and published, currently eligible article data to `public/articles-content.json`. Because both files are publicly readable on GitHub Pages, drafts and future-dated articles are excluded from the deployed article JSON. Drafts remain in browser-local staging until published; use a private database/backend if drafts must persist securely across browsers or devices. The portfolio JSON must not contain an article collection. Each successful file update triggers the GitHub Actions Pages workflow; the workflow verifies both files, regenerates `public/sitemap.xml` from the dedicated article JSON, builds the site, and deploys the artifact. Public reads load both JSON files independently and report a loading error if either file is unavailable or invalid.

The static architecture uses GitHub as the authoritative source. Browser-local staging is not production until **Publish** succeeds. The public frontend never lets a visitor's local draft override the published JSON.

## Important security note

GitHub Pages has no server-side authentication. The admin route's password screen is a convenience gate, not a secure access boundary. The GitHub token is privileged even when it is only kept in session storage. Use a narrowly scoped token and revoke it when no longer needed. A backend or GitHub App OAuth flow is required for stronger admin security without exposing a personal access token to the browser.

## Manual backup option

Admin → Settings → Export backup downloads the combined editable content payload. The deployed source files remain separate: portfolio content is in `public/portfolio-content.json`, and articles are in `public/articles-content.json`. If editing files manually, commit and push both files as appropriate to `main`.
