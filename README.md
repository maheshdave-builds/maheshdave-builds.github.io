# Mahesh Dave — Adobe Commerce Portfolio

A responsive React + Vite portfolio using a warm neutral, forest-green and bronze design system, with light/dark themes and subtle motion. Portfolio copy is grounded in `Mahesh_Dave_Resume_2026.pdf`; external project links and certification verification links are omitted because the resume did not provide them.

## Stack

- React 19 + Vite
- Tailwind CSS 4 and custom CSS design tokens
- Framer Motion and Lucide icons
- Supabase Auth/PostgREST via a small browser REST adapter

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Without Supabase configuration, the public portfolio works and the blog shows its empty state; `/admin` displays setup instructions. With Supabase configured, published blog posts load from the database and the admin login uses Supabase Auth.

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor. Create the first admin user manually in Auth and set trusted `app_metadata.role` to `admin`. Review all policies before launch. Never expose a service-role key in frontend code. See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) and [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## Important current scope

The portfolio uses resume-derived bundled data for experience, projects, certifications, education, and technical toolkit. Supabase schema/RLS covers these entities, but dedicated admin CRUD forms and database-driven public rendering for those sections are not complete yet. Blog has basic draft/publish editing; its editor is a lightweight HTML textarea with formatting buttons, not a full WYSIWYG editor. Article detail pages, cover-image upload, and a media-library UI are also outstanding. The contact action uses email and does not pretend to submit a form.

## Build

```bash
npm run build
npm run lint
npm run preview
```

## Portfolio refresh notes

- The Vite entry point now mounts the React portfolio application (including the responsive navigation, light/dark theme, resume download, animated project cards, certifications, and blog listing).
- The supplied resume PDF is available at `/Mahesh_Dave_Resume_2026.pdf`.
- Existing project links and Adobe credential-verification URLs were recovered from the original HTML included in the uploaded archive. Project/demo links are shown only where they were present in that source.
- Supabase is optional for the public portfolio; configure `.env.local` using `.env.example` to enable the blog and admin login.
- Review `ADMIN_GUIDE.md` and `DEPLOYMENT_GUIDE.md` for setup and current CMS limitations before deployment.
