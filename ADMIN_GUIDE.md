# Portfolio Studio — Local Admin Setup (No Supabase)

This project runs as a static Vite + React site and includes a browser-local content management dashboard. No Supabase project, database, API key, or `.env.local` file is required.

## 1. Start the site

```bash
npm install
npm run dev
```

Open `/admin`. On first visit, create your administrator email and password. Use a strong password of at least 12 characters. The login session is held in the current browser session. Use the admin's **Settings** area to change your password if the control is available in this build.

## 2. Manage the website

- **Profile & about** — edit your name, title, introduction, biography, contact details, resume link, social links and portrait.
- **Page content** — edit supported section headings and copy.
- **Page structure** — reorder built-in sections, hide/show sections, create custom sections, edit menu labels and destinations, add menu links, and hide/show or remove menu items.
- **Projects** — add, edit, remove, categorize, and publish projects. The public page displays project cards in a horizontally animated slider; category tabs are not used on the homepage.
- **Experience / Certifications / Education** — manage these records.
- **Blog** — create, edit, draft and publish articles.
- **Theme & branding** — change supported theme tokens, preview a draft and publish the selected theme.
- **Site settings** — update supported site metadata and appearance preferences.

Changes are saved to this browser's local storage and appear in the public site when opened in the same browser. Use the backup/export feature where available and keep a copy of your data. Images are compressed and stored as data URLs in local storage, so use optimized images to avoid filling browser storage. The profile photo editor includes a full-image modal preview.

## 3. Important limitations of static/local mode

A static website cannot securely provide server-backed authentication or shared CMS writes by itself. The local admin password is a convenience gate, not a security boundary: a visitor with access to the browser or source can bypass it. Content edits are not automatically shared with other browsers or visitors and do not update GitHub Pages by themselves. To publish edits for everyone without a hosted database, export the content/backup if supported, then commit the generated content to the project and redeploy; this workflow can be expanded if desired. Do not store secrets or sensitive personal data in this local CMS.

Contact form submissions cannot be collected into a shared inbox without a backend. Visitors can use the displayed email address instead. Password recovery email is not available in local mode.

## 4. Verify and build

```bash
npm run lint
npm run build
npm run preview
```

The production bundle is written to `dist/`. Deploy it using your usual static hosting workflow. GitHub Pages requires the configured base path and SPA fallback files to remain in place.
