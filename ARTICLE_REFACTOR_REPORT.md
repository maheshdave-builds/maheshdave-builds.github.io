# Article refactor report

## Root cause found in the supplied repository

The public data loader fetched only `/portfolio-content.json`, while article records lived under the `posts` key in that portfolio document. The admin staged and published the combined portfolio payload, and article code contained collection-key compatibility merging (`articles`, `blogPosts`, `posts`) rather than one canonical source. The homepage also rendered its empty state whenever its filtered array was empty, without distinguishing a failed load from a successful empty response. That architecture allowed schema/source mismatches to appear as “Articles coming soon”.

## Changes

- Migrated the two existing article records to `public/articles-content.json`, preserving IDs, slugs, dates, content, image URLs, SEO fields, tags, and other record fields.
- Standardized article records on `articles` and `article` naming, canonical `status` (`published` or `draft`), `/articles`, `/articles/:slug`, and `#articles`.
- Removed the article record collection from `public/portfolio-content.json`; site/portfolio content remains independently readable.
- Added separate public JSON reads and separate authenticated GitHub writes. The publisher commits `public/articles-content.json` and `public/portfolio-content.json`; GitHub Actions rebuilds the site after those commits.
- Prevented drafts and future-dated records from being written to the publicly readable article JSON. Drafts remain in browser-local staging until published; shared/private draft storage requires a private backend.
- Made article deletion a replacement of the staged article collection, so missing IDs are treated as intentional deletions instead of being merged back from the deployed file.
- Added homepage loading and error states, validated article JSON, a shared canonical visibility rule, and deployment checks for the separate JSON file.
- Updated sitemap generation to read the dedicated article file and updated admin/publishing documentation.
- Kept `/blog/:slug` and `#blog` compatibility adapters only for existing links/configuration; the legacy Supabase table name is retained in the optional database adapter because it is an external schema name.

## Verification performed locally

- `node scripts/verify-articles.mjs`: passed; 2 records, both currently eligible for publication; synthetic checks passed for one published article, multiple published articles, and draft privacy.
- `node scripts/generate-sitemap.mjs`: passed; generated 4 public URLs (homepage, listing, and 2 article detail URLs).
- JSON checks passed: unique IDs/slugs, canonical status fields, and no article collection in `portfolio-content.json`.
- `node --check` passed for the changed non-JSX JavaScript modules and scripts.

## Not verified / infrastructure limits

- `npm ci` timed out in this environment and Vite was unavailable, so a full Vite build and browser-based regression suite could not be run here.
- This worktree has not been pushed to GitHub. No GitHub token or publishing permission was supplied, so the live GitHub Pages deployment and live JSON could not be updated or verified. Production will use the new files only after the changes are committed and GitHub Actions deploys successfully.
- The repository contains a separate nested `sitework/` copy of an older application. The root project is the one built by `.github/workflows/deploy.yml`; the nested copy was not overwritten to avoid replacing its unrelated differences.
- Drafts are browser-local until publication. For durable, private drafts shared across devices, use a private database/backend; a public GitHub Pages JSON file cannot safely contain unpublished article bodies.
