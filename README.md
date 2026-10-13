# Mahesh Dave — Adobe Commerce Portfolio

Responsive React + Vite portfolio with a forest-green, bronze, and warm-neutral visual system, animated sections, persistent light/dark preference, resume download, project showcase, certifications, experience, education, and a Supabase-backed blog.

## Stack

- React 19 + Vite
- Tailwind CSS 4 and custom CSS design tokens
- Framer Motion and Lucide icons
- Supabase Auth, PostgREST, Row Level Security, and Storage through a small browser adapter

## Run locally

```bash
npm install
cp .env.example .env.local
# Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

The public portfolio retains resume-derived bundled content when the Supabase content tables are empty. Run `supabase/schema.sql` to initialize the schema, security policies, media bucket, and starter content. `/admin` requires a Supabase account whose trusted `app_metadata` contains `{"role":"admin"}`. No public registration or hardcoded demo credentials are provided.

## Admin features

- Dashboard with live database counts
- Profile, projects, certifications, experience, education, and site settings CRUD
- Searchable record lists and numeric display ordering
- Blog drafts, publishing/unpublishing, preview, unique slugs, and a visual rich-text toolbar
- Supabase Storage image uploads with size/type validation
- Database RLS policies for admin-only writes and public-only published content

See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) and [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for configuration and verification steps.

## Build and verify

```bash
npm run build
npm run lint
npm run preview
```

Do not deploy until the production build succeeds and Supabase permissions have been tested with anonymous, ordinary authenticated, and administrator sessions.
