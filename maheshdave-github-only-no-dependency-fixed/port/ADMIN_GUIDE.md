# Admin guide — GitHub-only publishing (Option A)

The public portfolio uses `public/portfolio-content.json` as its shared published content source. No Supabase account, Cloudflare Worker, or external database is needed for this publishing workflow.

## Edit and publish content

1. Open `/mdadmin` on your own development/local copy and make your edits. The editor saves its working draft in that browser's local storage.
2. In **Admin → Settings → Export or restore content**, choose **Export backup**. This downloads `mahesh-portfolio-backup.json` containing the complete editable content/settings.
3. Copy the downloaded JSON over `public/portfolio-content.json` in your local repository. Keep the filename exactly `portfolio-content.json`.
4. Add any new image files to the repository under `public/` and ensure the content JSON references their deployed paths. Existing image uploads saved as browser data URLs should be converted to repository image files for production use.
5. Validate JSON syntax, run `npm run build`, then commit and push the changed JSON and media files to GitHub.
6. Wait for GitHub Pages deployment to complete. All visitors/devices will see the published version after the deployment and browser cache refresh.

## Important limitations

- GitHub Pages is static hosting. It cannot securely accept writes to the Git repository from a browser-only admin panel. This option intentionally uses **export → commit → deploy** instead of automatic publishing.
- Browser-local edits are drafts for that browser until exported and committed. Importing a backup on another browser restores a draft there; it does not publish the content by itself.
- A password gate implemented only in frontend JavaScript is not a security boundary. Do not put GitHub tokens, deploy keys, or passwords in the frontend. For this no-third-party option, do not treat the static admin route as a secure private publishing API.
- Contact form submissions cannot be shared/collected centrally without a server-side service. This static option cannot provide a cross-device admin inbox.
- Before switching, export the browser that contains your latest customizations and use that JSON as the source of truth. Do not clear its local storage until you have verified the backup.
