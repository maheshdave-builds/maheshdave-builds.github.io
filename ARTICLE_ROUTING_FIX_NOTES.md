# Article routing and content consistency fixes

## What changed
- Public article cards, related links, admin preview links, canonical metadata, social sharing, and the sitemap use `/articles/:slug`.
- `/blog/:slug` remains compatible and redirects to the corresponding `/articles/:slug` route.
- The GitHub Pages 404 handler preserves deep paths (including query strings) and restores them before the client router matches the route.
- Public article lists and detail lookups share one compatibility selector for `posts`, `articles`, and `blogPosts`; an empty `posts: []` no longer masks a populated legacy collection.
- Published reads no longer silently fall back to browser-local CMS data when the public JSON request fails.
- Public routes wait for the published content request and show a distinct loading/error state rather than flashing bundled seed content.
- A build-time sitemap generator includes published article routes from `public/portfolio-content.json`.
- Slider images preserve their source aspect ratio and fit inside the image frame.
- “View All Articles” is aligned with the homepage article heading and respects reduced-motion preferences.
- Added eight independent Profile Image Section Design presets in Admin → Profile & about → Profile photo. Existing Frame Presets are unchanged.

## Important content-preservation note
The source ZIP used for these edits contained an empty `public/portfolio-content.json` (`posts`, `articles`, and `blogPosts` were all empty). The article body/title could not be recovered from that archive, and it was not hardcoded. To avoid overwriting the live content, the supplied overlay ZIP intentionally excludes `public/portfolio-content.json`. Apply this ZIP over the existing repository and keep its current `public/portfolio-content.json` intact. The sitemap build step reads that existing file.

## Deployment and verification
Commit the changed source files and workflow to the repository's deployment branch. GitHub Actions regenerates the sitemap and deploys `dist`. Confirm the workflow completes before testing `/articles`, `/articles/<slug>`, and the legacy `/blog/<slug>` redirect. The local environment could not complete `npm ci` because dependency installation timed out, so a production build and deployed-browser click-through were not verified here.
