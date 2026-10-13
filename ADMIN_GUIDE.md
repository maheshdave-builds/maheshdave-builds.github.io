# Admin guide

## Access and authentication

Open `/admin`. Sign-in uses Supabase Auth password authentication; there is no public registration UI. Create the administrator account manually in Supabase Dashboard → Authentication → Users. Then set that user's **app metadata** to include `{"role":"admin"}` using a trusted administrative path (Dashboard or a server-side admin tool). Do not put admin role in user-editable metadata. The database RLS policies check this claim on every protected write. Test policies with an ordinary user and anon access before launch.

## Configure Supabase

1. Create a Supabase project and copy its Project URL and anon/publishable key.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. In SQL Editor, run `supabase/schema.sql`.
4. Create the first administrator in Auth, and set trusted app metadata `role=admin`.
5. Set the site's production URL in Supabase Auth → URL Configuration and add local/production redirect URLs as appropriate.

The public anon key is designed to be exposed in browser applications. Never use a service-role key in frontend environment variables.

## Blog

In `/admin`, choose Blog. Create an article, set title/slug/category/excerpt/content and status. Content is stored as HTML; the toolbar provides basic formatting actions but the current editor is a lightweight HTML textarea, not a full WYSIWYG editor. Save as draft or publish. Public queries and RLS only return published posts with a publication date not in the future. Slugs are unique at the database level. Edit an article to update it; confirm before deleting. Published article detail routes are available at `/blog/:slug`; image insertion and cover upload are not implemented in the current UI.

## Other content, images and settings

The schema includes tables for profile, projects, certifications, experience, education and site settings, but the current admin UI only has complete record editing for blog posts. Other sections display records and a refresh action; dedicated CRUD forms, reordering, and media-library upload controls remain to be completed. Until then, use Supabase Table Editor carefully. Public portfolio sections currently use resume-derived bundled data for these areas, so database changes to those tables do not yet update the public sections.

Create a public `portfolio-media` bucket (the SQL sets it up) for public-facing images. The storage policies allow public reads and only admin-role uploads/updates/deletes. Validate file type/size in any future upload UI, and do not delete assets referenced by content.

## Current limitations

- No contact-form backend is included; contact is via email.
- LinkedIn, GitHub, and Magento Stack Exchange links were taken from the existing portfolio HTML bundled with the supplied ZIP; confirm the profiles are yours before launch.
- Certification verification URLs and project demo/repository links were not supplied, so no invented links are shown.
- The portfolio's blog listing fetches published posts from Supabase. Article-detail routing, rich WYSIWYG editing, image upload, and CRUD forms for non-blog entities remain unfinished.

## Implementation status (important)

The public portfolio now includes the resume PDF, the green/bronze animated visual system, light/dark theme switching, resume-derived project and certification content, and a published-article detail route at `/blog/:slug`. The admin login and Blog create/edit/delete/publish workflow are connected to Supabase when configured.

The following requested CMS features are **not yet implemented in this version**: dedicated CRUD forms and ordering controls for Profile, Projects, Certifications, Experience and Education; Storage upload/media-library UI; cover-image upload; and a full WYSIWYG editor (the current blog content field accepts HTML and provides a small formatting toolbar). Those sections are currently read-only in the admin UI and must not be treated as fully manageable from the dashboard. Do not launch with the expectation that all CMS requirements are complete.

Project repository/demo URLs and per-certificate verification URLs were not present in the supplied resume, so none are fabricated. The LinkedIn URL was matched to a public profile; confirm it is yours before publishing.
