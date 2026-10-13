# Admin Studio Guide

## Sign in and permissions

- Open `/admin` on the deployed site.
- Create the administrator in Supabase Dashboard → Authentication → Users. Do not enable public sign-up.
- Set trusted **app metadata** to `{"role":"admin"}` using a trusted Supabase administrative workflow. Do not use user-editable `user_metadata` for authorization.
- The UI checks the admin claim for a clearer experience, and the database RLS policies independently enforce permissions for every read/write. Never rely on the UI check alone.
- To sign out, use the bottom of the admin sidebar.

## First-time Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project URL and public anon/publishable key.
3. Run `supabase/schema.sql` in the Supabase SQL Editor. It creates tables, RLS policies, the public-read `portfolio-media` bucket, and idempotent seed content from the supplied resume.
4. Create the administrator and set `app_metadata.role` to `admin` through a trusted admin workflow.
5. In Authentication → URL Configuration, configure the production site URL and permitted redirect URLs.
6. Restart the Vite dev server after changing environment variables.

Never place a service-role key in frontend code or any `VITE_` environment variable.

## Managing content

### Profile

Use Profile to edit the name, title, intro, about copy, public email, social URLs (valid JSON object), resume URL, and portrait URL. The first profile record is used by the public site. Leave URLs blank only when the field is optional.

Example social URL JSON:

```json
{
  "linkedin": "https://www.linkedin.com/in/your-profile/",
  "github": "https://github.com/your-account",
  "stackexchange": "https://magento.stackexchange.com/users/70881/mahesh-dave"
}
```

### Projects, certifications, experience, and education

Each section provides create/edit/delete forms, search, published controls where available, and a numeric display order. Project technologies are comma-separated. Project `client_links` accepts a JSON array such as `[{"name":"Example","url":"https://example.com/"}]`. URLs should include `https://`. Public sections read these records from Supabase when records exist; the bundled resume-derived content remains a fallback before the database is populated.

Deleting a record is permanent and asks for confirmation. Display order is ascending.

### Blog and visual editor

- Select Blog, then create an article.
- Set a title, unique URL slug, category, excerpt, cover image URL, content, status, and publication date.
- Use the visual editor toolbar for bold, italic, underline, headings, paragraphs, ordered/unordered lists, blockquotes, links, undo, and redo.
- Use Preview article to review the rendered content before saving.
- Save draft to keep it private, or choose Published and click Publish article. Unpublishing is done by changing status back to Draft and saving.
- Published posts appear at `/blog/<slug>` and in the public Blog section. RLS only allows public queries to return published posts with a publication date not in the future.
- Slugs are unique at the database level. If a slug already exists, choose another one; the database will reject duplicates.

Article HTML is sanitized before saving and rendering. Do not paste untrusted script/embed code.

### Media library

Upload JPG, PNG, WebP, AVIF, or GIF files up to 5 MB. The UI shows the resulting public URL, which can be copied into image URL fields. Storage listing/upload is backed by Supabase Storage. Do not remove images that are still referenced by published content.

### Site Settings

This section lets you maintain key/value JSON settings in `site_settings`. Only approved public keys are readable anonymously by the RLS policy. The current frontend primarily uses the Profile record for public identity and links.

## Troubleshooting

- **Supabase not configured:** check `.env.local`, restart the dev server, and confirm the URL/key are from the same project.
- **Invalid login:** confirm the user exists in Supabase Auth and email/password login is enabled for that account.
- **Administrator access required:** set trusted `app_metadata.role` to `admin`; then sign out/in to refresh the session claims.
- **Permission denied / empty lists:** confirm `supabase/schema.sql` ran successfully and that the RLS policies exist. Check browser Network/Console for the returned PostgREST error.
- **Duplicate slug/name:** choose a unique slug or certification name.
- **Image upload fails:** verify the `portfolio-media` bucket exists, the account has the admin claim, and the file is an allowed image under 5 MB.

## Contact form

The contact section uses a mailto link. No fake form submission is presented; add a server-side form provider only if you want messages stored or sent through the website.
