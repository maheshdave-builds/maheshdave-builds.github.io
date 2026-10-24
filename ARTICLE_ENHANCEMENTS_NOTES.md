# Article enhancement notes

- Article listing banner: Admin → Page content → select the Blog tab → Article listing banner image. Upload or replace the image, then click Save changes. Remove banner image restores the text banner fallback.
- Article detail includes platform share links (X, LinkedIn, Facebook), copy link, and browser-native text-to-speech controls with available system voices and playback speed.
- Listing page and detail spacing/animations have responsive styles and reduced-motion support.

## Backend-dependent likes
A persistent, duplicate-resistant public like counter cannot be securely implemented using only a static GitHub Pages frontend and the public JSON file. It needs a writable backend/API with atomic updates and a visitor identity/rate-limiting strategy. No fake local-only like counter was added. Configure an approved backend before enabling this feature.

## Validation
The source and deployment workflow are configured to build at the repository root and deploy `dist/`, including `404.html`. Run `npm ci && npm run build` and verify the GitHub Actions deployment before publishing.
