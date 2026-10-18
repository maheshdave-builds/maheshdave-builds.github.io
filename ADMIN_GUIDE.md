# Portfolio Studio — Admin guide

Open `/admin` while the Vite development server is running.

## Editable sections
- **Profile:** name, title, introduction, about text, resume URL, social URLs, and profile portrait uploader.
- **Page content:** hero and section headlines/descriptions, about highlights/statistics, and skills/toolkit categories.
- **Projects:** title, category, description, technologies, project/client URLs, client links, project thumbnail/logo, and optional client logo.
- **Certifications:** name, issuer, year, verification URL, and certification badge/logo.
- **Experience and education:** edit, add, and remove entries.
- **Blog editor:** draft/publish posts with rich-text formatting, headings, lists, quotes, links, text color/highlight, inline images by URL or upload, undo/redo, and cover image.
- **Site settings:** browser/site title, main website logo (also updates the admin brand and browser favicon), show/hide client implementations, and JSON import/export backups.

## Image uploads
Image files are resized and compressed in the browser before being saved. Keep uploaded images reasonably sized because the current no-backend version stores content in browser local storage. Export a JSON backup regularly. If storage quota is exceeded, use smaller images or external image URLs.

## Important local-mode limitation
This is a no-backend editing mode. Content persists only in the current browser profile and is not automatically synced to a deployed website or other devices. The `/admin` route is not protected for public production use. For a publicly deployed CMS, add a server-side backend and authentication/authorization before exposing the editor.
