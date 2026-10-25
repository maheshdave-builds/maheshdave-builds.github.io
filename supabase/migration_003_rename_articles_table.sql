-- Migration 003 — rename legacy blog_posts table to articles (safe to run once).
-- Skip if your database was created from the updated schema.sql with public.articles already.

do $$
begin
  if to_regclass('public.blog_posts') is not null and to_regclass('public.articles') is null then
    alter table public.blog_posts rename to articles;
    alter index if exists blog_posts_publication_idx rename to articles_publication_idx;
    alter index if exists blog_posts_slug_idx rename to articles_slug_idx;
    alter index if exists blog_posts_updated_idx rename to articles_updated_idx;
  end if;
end $$;

drop policy if exists "public read published posts" on public.articles;
drop policy if exists "admin manage posts" on public.articles;
drop policy if exists "public read published articles" on public.articles;
create policy "public read published articles" on public.articles for select to anon, authenticated using (status='published' and published_at is not null and published_at <= now());
drop policy if exists "admin manage articles" on public.articles;
create policy "admin manage articles" on public.articles for all to authenticated using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
