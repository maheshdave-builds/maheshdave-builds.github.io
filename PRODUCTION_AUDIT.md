# Article visibility and security audit (source archive review)

## Article visibility findings

- The supplied archive's `public/portfolio-content.json` contains `posts: []`; the Fastly VCL article slug is not present anywhere in the supplied source archive. A static GitHub Pages build cannot render a public listing card for an article absent from the deployed public content JSON.
- GitHub-backed public reads previously fell back to browser `localStorage` when the shared content file returned a 404 or related error. This could make content appear to work only in the admin's browser and mask a missing/broken published data file. That fallback is removed; missing shared content now surfaces as an error.
- The GitHub-mode content loader previously recorded a read error without transitioning out of `loading`. The homepage/listing could therefore display an empty-state message while data was still unresolved or failed. The loader now sets an explicit error state, and both article surfaces distinguish loading, error, and genuinely empty results.
- Publication is an explicit two-step workflow in the current architecture: save the article in admin, then click Publish in the admin header. The public JSON is the source used by GitHub Pages. The source archive does not contain the Fastly article record, so its existence in the current production repository and its current deployed response could not be verified from this archive.

## Security findings

- **High — public draft exposure risk:** the GitHub publishing code previously serialized the full staged content object into a public JSON file. That could expose draft article bodies and admin-only staging fields. Publishing now filters posts through the publication rule and removes `themeDraft` and `settingsRows` from the public payload. Drafts remain in local admin staging; GitHub Pages cannot privately store drafts without a private data store/backend.
- **High — preview bypass risk:** the shared `isPostPublic` predicate previously let a `preview=local` query or stale session flag bypass publication checks. That could expose drafts if they had already been written into the public JSON. The bypass is restricted to explicit local preview use; ordinary public routes enforce publication status.
- **Medium — client-held GitHub credential:** the admin uses a fine-grained GitHub token in `sessionStorage` and calls the GitHub Contents API from the browser. GitHub enforces repository write permission, so the URL itself is not the security boundary. However, a successful same-origin XSS could steal the token. Use a short-expiry fine-grained token scoped only to Contents read/write on this repository; do not use a classic or organization-wide token. A backend would be required to keep write credentials out of the browser, but none was introduced.
- **No hardcoded credential patterns detected** in the supplied source scan (GitHub token patterns, private-key headers, or service-role key names). This is a source scan, not a complete Git history/secret-scanner audit.
- **Deployment workflow:** `.github/workflows/deploy.yml` uses `contents: read`, `pages: write`, and `id-token: write`, which are the expected minimal permissions for checkout and GitHub Pages deployment. It does not print or bundle secrets in the workflow reviewed.

## Verification limits and remaining work

- Source inspection confirmed the archived JSON has zero posts and no Fastly VCL article record. Do not treat the visibility issue as production-verified until the actual article record is present in the deployed `public/portfolio-content.json` (or the actual production data source) and the deployed pages are checked.
- The live URLs could not be fetched reliably from this environment, network DNS was unavailable for direct requests, and dependencies are not installed; therefore no production browser test, build, lint, token permission test, or clipboard regression test was completed.
- Because this is static hosting, GitHub Pages cannot enforce private draft access by itself. The public JSON must contain published-only records; private drafts require a private store or backend.
