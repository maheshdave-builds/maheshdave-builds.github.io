# Deployment guide

## Local development

Requirements: Node.js 20+ and npm. From the project root:

```bash
npm install
cp .env.example .env.local
# edit .env.local with the Supabase project URL and anon/publishable key
npm run dev
```

Build and lint with `npm run build` and `npm run lint`; preview a production build with `npm run preview`.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor to create content tables, RLS policies, and the `portfolio-media` bucket/policies.
3. Create the administrator in Authentication → Users, then set `app_metadata.role` to `admin` using a trusted admin workflow. Never use user-editable metadata as the authorization source.
4. Configure Authentication → URL Configuration with your local development URL and production domain. Add the correct redirect URLs for the domain used to sign in.
5. Configure `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Only public/anon credentials belong in browser builds.

## Production deployment

This is a Vite + React single-page application. Run `npm run build`; deploy the generated `dist/` directory to a static host (Netlify, Vercel, Cloudflare Pages, or GitHub Pages). Configure the host's SPA fallback to serve `index.html` for `/admin` and other application routes. Add the same two Vite environment variables in the host's project settings and rebuild. The bundled resume PDF and image files are served from the public root.

For GitHub Pages, configure the correct base path if deploying below a repository subpath; the current app assumes domain-root paths (`/admin`, `/md_pic.jpeg`, `/Mahesh_Dave_Resume_2026.pdf`). A custom domain/root deployment is the simplest fit.

## Security checklist

- Never expose a Supabase service-role key in `.env`, frontend code, or deployment build variables prefixed with `VITE_`.
- Keep RLS enabled on every table and verify anon users cannot query drafts or write content.
- Confirm only accounts with trusted `app_metadata.role=admin` can write rows and storage objects.
- Keep production Auth redirect URLs narrow and accurate; rotate credentials if exposed.
- Review SQL policies after schema changes and test them using anon, ordinary authenticated, and admin sessions.

## Remaining manual work

The current implementation includes a Supabase REST/Auth adapter and a basic blog draft/publish UI. The public listing reads published posts, but individual article pages, full rich-text WYSIWYG editing, image uploads, and dedicated CRUD/reordering forms for profile/projects/certifications/experience/education/settings are not complete. Do not describe those as implemented until they are built and verified. The current portfolio sections for resume content remain bundled in source data.

## Implementation status and verification notes

The public article route `/blog/:slug` reads only published posts permitted by the Supabase RLS policy. The admin dashboard supports Supabase Auth login/logout and blog-post CRUD, but dedicated CRUD/reordering forms for profile, projects, certifications, experience, education and site settings, as well as image upload/media library and a full WYSIWYG editor, remain incomplete. The project has not been successfully built in this environment because package installation did not complete; run `npm install`, `npm run build`, and `npm run lint` in your development environment before deployment.
