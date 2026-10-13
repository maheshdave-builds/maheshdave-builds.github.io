-- Run in the Supabase SQL editor. Create the first administrator in Supabase Auth
-- manually; do not enable public sign-ups. These policies make content private by default.
create extension if not exists pgcrypto;

create table if not exists public.profile (
 id uuid primary key default gen_random_uuid(), name text not null, title text, intro text,
 about text, email text, social_urls jsonb not null default '{}'::jsonb, resume_url text,
 image_url text, updated_at timestamptz not null default now()
);
create table if not exists public.projects (
 id uuid primary key default gen_random_uuid(), title text not null, slug text unique,
 description text, technologies text[] not null default '{}', image_url text, github_url text,
 demo_url text, sort_order integer not null default 0, is_published boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.certifications (
 id uuid primary key default gen_random_uuid(), name text not null, issuer text, issued_at date,
 expires_at date, credential_id text, verification_url text, image_url text,
 sort_order integer not null default 0, is_published boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.experience (
 id uuid primary key default gen_random_uuid(), company text not null, role text not null,
 duration text, description text, sort_order integer not null default 0,
 is_published boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.education (
 id uuid primary key default gen_random_uuid(), degree text not null, institution text,
 graduation_year text, details text, sort_order integer not null default 0,
 is_published boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.site_settings (
 key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
create table if not exists public.blog_posts (
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
 excerpt text, content text not null default '', category text, cover_image_url text,
 status text not null default 'draft' check (status in ('draft','published')),
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists blog_posts_publication_idx on public.blog_posts(status,published_at desc);

alter table public.profile enable row level security;
alter table public.projects enable row level security;
alter table public.certifications enable row level security;
alter table public.experience enable row level security;
alter table public.education enable row level security;
alter table public.site_settings enable row level security;
alter table public.blog_posts enable row level security;

-- Public SELECT is intentionally limited to published rows (and safe profile/settings data).
drop policy if exists "public read profile" on public.profile;
create policy "public read profile" on public.profile for select to anon, authenticated using (true);
drop policy if exists "admin manage profile" on public.profile;
create policy "admin manage profile" on public.profile for all to authenticated using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

do $$ declare t text; begin
 foreach t in array array['projects','certifications','experience','education'] loop
  execute format('drop policy if exists "public read published %1$s" on public.%1$I',t);
  execute format('create policy "public read published %1$s" on public.%1$I for select to anon, authenticated using (is_published = true)',t);
  execute format('drop policy if exists "admin manage %1$s" on public.%1$I',t);
  execute format('create policy "admin manage %1$s" on public.%1$I for all to authenticated using (auth.jwt() -> ''app_metadata'' ->> ''role'' = ''admin'') with check (auth.jwt() -> ''app_metadata'' ->> ''role'' = ''admin'')',t);
 end loop;
end $$;

drop policy if exists "public read published posts" on public.blog_posts;
create policy "public read published posts" on public.blog_posts for select to anon, authenticated using (status='published' and published_at is not null and published_at <= now());
drop policy if exists "admin manage posts" on public.blog_posts;
create policy "admin manage posts" on public.blog_posts for all to authenticated using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings for select to anon, authenticated using (key in ('site_title','site_description','social_links'));
drop policy if exists "admin manage settings" on public.site_settings;
create policy "admin manage settings" on public.site_settings for all to authenticated using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Storage: create a public bucket named portfolio-media in Dashboard > Storage.
-- Public reads are for portfolio assets; only admin users may upload/update/delete.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-media','portfolio-media',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif'];
drop policy if exists "public read portfolio media" on storage.objects;
create policy "public read portfolio media" on storage.objects for select to anon, authenticated using (bucket_id='portfolio-media');
drop policy if exists "admin upload portfolio media" on storage.objects;
create policy "admin upload portfolio media" on storage.objects for insert to authenticated with check (bucket_id='portfolio-media' and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
drop policy if exists "admin update portfolio media" on storage.objects;
create policy "admin update portfolio media" on storage.objects for update to authenticated using (bucket_id='portfolio-media' and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') with check (bucket_id='portfolio-media' and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
drop policy if exists "admin delete portfolio media" on storage.objects;
create policy "admin delete portfolio media" on storage.objects for delete to authenticated using (bucket_id='portfolio-media' and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
