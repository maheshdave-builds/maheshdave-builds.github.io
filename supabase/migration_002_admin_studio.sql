-- Migration 002 — additions for the rebuilt portfolio + admin studio.
-- Safe to run repeatedly. Run AFTER supabase/schema.sql, in the SQL editor.
-- It only adds columns, one table and policies; it never drops data.

-- ---------------------------------------------------------------- profile
alter table public.profile add column if not exists short_name text;
alter table public.profile add column if not exists location text;
alter table public.profile add column if not exists availability text;

-- --------------------------------------------------------------- projects
alter table public.projects add column if not exists category text;
alter table public.projects add column if not exists link_label text;
alter table public.projects add column if not exists client_logo_url text;
alter table public.projects add column if not exists client_links jsonb not null default '[]'::jsonb;

-- ------------------------------------------------------------ blog_posts
alter table public.blog_posts add column if not exists author text default 'Mahesh Dave';
alter table public.blog_posts add column if not exists tags text[] not null default '{}';
alter table public.blog_posts add column if not exists seo_title text;
alter table public.blog_posts add column if not exists seo_description text;
alter table public.blog_posts add column if not exists canonical_url text;

create index if not exists blog_posts_slug_idx on public.blog_posts (slug);
create index if not exists blog_posts_updated_idx on public.blog_posts (updated_at desc);

-- ---------------------------------------------------------- contact inbox
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  message text not null check (char_length(message) between 1 and 4000),
  user_agent text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Visitors may submit, but may never read anything back.
drop policy if exists "public submit contact message" on public.contact_messages;
create policy "public submit contact message" on public.contact_messages
  for insert to anon, authenticated
  with check (true);

drop policy if exists "admin read contact messages" on public.contact_messages;
create policy "admin read contact messages" on public.contact_messages
  for select to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "admin update contact messages" on public.contact_messages;
create policy "admin update contact messages" on public.contact_messages
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "admin delete contact messages" on public.contact_messages;
create policy "admin delete contact messages" on public.contact_messages
  for delete to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ------------------------------------------------------------- site_settings
-- Published theme, copy and branding must be readable by visitors. Draft theme
-- stays admin-only: it is simply not in this whitelist, and only the separate
-- admin policy grants access to it.
drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings
  for select to anon, authenticated
  using (key in (
    'site_title',
    'site_description',
    'social_links',
    'branding',
    'copy',
    'stats',
    'tech_stack',
    'theme_published'
  ));

drop policy if exists "admin manage settings" on public.site_settings;
create policy "admin manage settings" on public.site_settings
  for all to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Seed the page copy, highlights, toolkit and theme so a fresh project renders
-- the real site instead of empty section headings.
insert into public.site_settings (key, value) values
  ('branding', '{"logo":"","contact_email":"davemahesh119@gmail.com","show_client_projects":true}'::jsonb),
  ('copy', '{
     "heroEyebrow":"ADOBE COMMERCE · ARCHITECTURE · LEADERSHIP",
     "heroHeadline":"Engineering commerce that works harder.",
     "aboutTitle":"Technical depth. People-first delivery.",
     "aboutDescription":"Connecting architecture, engineering execution, and team growth to build commerce platforms that last.",
     "experienceTitle":"Experience built in production.",
     "experienceDescription":"A progression from hands-on Magento development to technical leadership and solution architecture.",
     "projectsTitle":"Commerce work with real-world impact.",
     "projectsDescription":"Selected commerce implementations, integrations, and client storefronts.",
     "certificationsTitle":"Credentials that back the craft.",
     "certificationsDescription":"Adobe credentials and product foundations, with verification links where available.",
     "educationTitle":"The foundation behind the practice.",
     "educationDescription":"Academic background and qualifications.",
     "toolkitTitle":"A practical, modern toolkit.",
     "toolkitDescription":"Platforms, patterns, and tools used across commerce, integrations, frontend, infrastructure, and delivery.",
     "blogTitle":"Lessons from the work.",
     "blogDescription":"Practical notes on Adobe Commerce, integration architecture, performance, and AI-assisted engineering.",
     "contactTitle":"Good work starts with a conversation.",
     "contactDescription":"Have a commerce challenge, integration idea, or engineering question? I’d be glad to connect."
   }'::jsonb),
  ('stats', '[
     {"value":"9+","label":"Years in commerce engineering"},
     {"value":"8+","label":"People led across delivery teams"},
     {"value":"99%","label":"Data accuracy improvement reported on Salesforce integration"},
     {"value":"35%","label":"Faster PR turnaround after AI workflow adoption"}
   ]'::jsonb)
on conflict (key) do nothing;

-- --------------------------------------------------------------- storage
-- Public read is fine for portfolio imagery; writes remain admin-only via the
-- policies in schema.sql.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media','portfolio-media',true,5242880,
        array['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml'];

-- ==========================================================================
-- Creating the first administrator (do this by hand, never from the browser):
--
-- 1. Supabase Dashboard → Authentication → Users → "Add user" (email +
--    password). Do NOT enable public sign-ups under Authentication → Providers.
-- 2. Then run, replacing the address:
--
--    update auth.users
--       set raw_app_meta_data =
--           coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--     where email = 'you@example.com';
--
-- That `role` claim is what every policy above checks. Sign out and back in
-- afterwards so the new JWT carries it.
-- ==========================================================================
