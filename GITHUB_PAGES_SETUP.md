# GitHub Pages deployment — Mahesh Dave portfolio

## 1. Create / confirm the repository
1. Sign in to GitHub as `maheshdave-builds`.
2. Create a **public** repository named exactly `maheshdave-builds.github.io` (a user site repository).
3. Extract this ZIP locally. Keep the project root files and folders (`package.json`, `src/`, `public/`, `vite.config.js`, `.github/`) together.
4. In the extracted folder, run:

```bash
npm ci
npm run build
```

5. Commit and push the project root to the repository's `main` branch. For an existing repo:

```bash
git init
git add .
git commit -m "Enhance portfolio and GitHub Pages deployment"
git branch -M main
git remote add origin https://github.com/maheshdave-builds/maheshdave-builds.github.io.git
git push -u origin main
```

If the folder is already a Git repository, do not run `git init` or add a second remote; use `git remote -v` and update the existing remote as needed.

## 2. Enable GitHub Pages
1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. The included `.github/workflows/deploy.yml` builds the Vite project and publishes `dist/` on every push to `main`.
4. Open the **Actions** tab and wait for “Deploy portfolio to GitHub Pages” to finish successfully.
5. Your site should be available at `https://maheshdave-builds.github.io/`.

## 3. Admin URL and direct navigation
- Admin page: `https://maheshdave-builds.github.io/mdadmin`
- The included `public/404.html` redirects GitHub Pages deep links back into the client-side router. Keep it in `public/`; Vite copies it into `dist/`.
- After a deployment, hard-refresh the browser if an old build or favicon is cached.

## 4. Shared admin publishing

Admin edits must use the shared Supabase backend to appear on every browser/device. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the GitHub Actions deployment environment before publishing. See `DEPLOYMENT_GUIDE.md` for database/RLS setup and administrator provisioning. Do not add a service-role key to this repository. Self-registration is disabled; the administrator account must be created and granted the `admin` app-metadata role through a trusted Supabase admin process. If these variables are not configured, cloud admin editing remains unavailable rather than silently saving to one browser only.

## 5. Profile and logo images
Use **Admin → Profile & about** to upload and crop the profile image. Use **Admin → Settings** to upload and crop the website logo; the logo is also used as the favicon during the current page session. Save the corresponding editor/settings after uploading.

## 6. Updating the site
Edit locally, test with `npm run dev`, then commit and push. GitHub Actions automatically rebuilds and deploys. If deployment fails, open **Actions**, select the failed run, and inspect the first failed step.
