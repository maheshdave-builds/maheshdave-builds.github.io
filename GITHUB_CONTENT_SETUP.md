# GitHub-backed portfolio publishing

This build uses `maheshdave-builds/maheshdave-builds.github.io`, branch `main`, as the shared source of truth. The public site reads `public/portfolio-content.json`; the admin commits content and uploaded media into the same repository.

## URLs

- Public site: https://maheshdave-builds.github.io/
- Admin login: https://maheshdave-builds.github.io/mdadmin/login
- Admin dashboard: https://maheshdave-builds.github.io/mdadmin
- Published content JSON: https://maheshdave-builds.github.io/portfolio-content.json

If the repository is connected to a custom domain, use that domain with the same paths instead.

## One-time repository setup

1. Ensure this project is in the `main` branch of `maheshdave-builds/maheshdave-builds.github.io` and `public/portfolio-content.json` exists.
2. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the build/deployment source.
3. Ensure Actions are enabled and the workflow `.github/workflows/deploy.yml` can run. The workflow builds the Vite app and deploys `dist/` to Pages after each push to `main`.
4. Open **Settings → Actions → General → Workflow permissions** and allow workflows to run. The provided Pages workflow requests the standard Pages deployment permissions.

## Sign in to the admin

1. Create a **fine-grained personal access token** in GitHub Settings → Developer settings → Personal access tokens.
2. Restrict it to **Only select repositories** → `maheshdave-builds/maheshdave-builds.github.io`.
3. Grant **Contents: Read and write**. Metadata read access is automatic. The token must belong to an account with write access to this repository.
4. Open `/mdadmin/login` and paste the token into the GitHub token field. The token is kept in this browser's `sessionStorage` only; signing out clears it. Use an expiry date and do not share the token or enter it on any other site.

> Security note: this is a browser-side GitHub integration. A token entered in the admin is available to the site's JavaScript for the duration of that browser session. Use a narrowly scoped, short-lived token and sign out after publishing. For a stronger security boundary, replace direct browser writes with a server-side Worker that stores the token as a secret.

## Publishing and media

- Admin content writes update `public/portfolio-content.json` through the GitHub Contents API and create a commit on `main`.
- Image uploads are committed under `public/uploads/<category>/`; content stores a public path such as `/uploads/profile/...`. Uploaded images therefore deploy with the site and are shared by all visitors/devices.
- GitHub Pages rebuilds/deploys after each content or media commit. It can take a short time for the new version to appear. Refresh after the deployment workflow completes.
- The save logic re-reads the current file SHA immediately before writing and retries once for a SHA conflict, which addresses the “does not match” publish error when the file changes between read and write.
- Image uploads are limited to 8 MB each. Use optimized images for faster publishing.

## Troubleshooting

- **401 / invalid token:** create a new token and verify it has not expired or been revoked.
- **403 / permission denied:** confirm the token is restricted to the correct repository and has Contents read/write; confirm your GitHub account has write access.
- **Branch protection / ruleset error:** allow authorized commits to `main` or use a server-side publishing workflow that opens a pull request.
- **Changes not live yet:** check the repository's Actions tab for the latest Pages deployment. A successful GitHub API commit does not mean the Pages deployment has already finished.
- **Admin login does not load:** make sure GitHub Pages is enabled and the deployed site URL is correct. The application routes the admin at `/mdadmin/login`.

No GitHub token is hard-coded in the build or committed in this repository.
