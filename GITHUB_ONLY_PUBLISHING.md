# GitHub-only publishing

The admin editor keeps unpublished edits as a draft in the current browser. To publish those edits to every visitor, use **Admin → Settings → Publish changes to all devices**. Enter a GitHub fine-grained personal access token restricted to the `maheshdave-builds/maheshdave-builds.github.io` repository with **Contents: Read and write** permission. The token is used in memory for the publish action only; it is not saved to localStorage or embedded in the source.

The admin commits the content JSON to `public/portfolio-content.json` using GitHub's Contents API. A push to `main` triggers GitHub Actions to rebuild and deploy the site. Once deployment finishes, all devices load the shared JSON file. The public frontend does not allow a visitor's localStorage draft to override the shared published JSON.

## Important security note

GitHub Pages has no server-side authentication. The admin route's password screen is a convenience gate, not a secure access boundary. Use a narrowly scoped, short-lived token, never paste it into public code or share it, and revoke it when no longer needed. A backend or GitHub App OAuth flow is required for stronger admin security without exposing a personal access token to the browser.

## Manual backup option

Admin → Settings → Export backup downloads the content JSON. You can also manually replace `public/portfolio-content.json` and commit/push it to `main`.
