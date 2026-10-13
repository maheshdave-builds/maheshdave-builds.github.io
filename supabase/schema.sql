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

-- Idempotent seed content from the supplied portfolio/resume. These rows let the
-- admin start with real content rather than an empty database on first setup.
create unique index if not exists certifications_name_unique on public.certifications (name);
create unique index if not exists experience_entry_unique on public.experience (company, role, duration);
create unique index if not exists education_entry_unique on public.education (degree, institution);

insert into public.projects (title,slug,description,technologies,demo_url,sort_order,is_published) values
('ACE Configurator — American Lighting','ace-configurator-american-lighting','Headless commerce experience on Adobe Commerce Cloud using React and GraphQL for dynamic product configuration, pricing, and product data. Optimized API interactions and rendering to reduce network requests.',array['Adobe Commerce Cloud','React','GraphQL','Headless Commerce'],'https://ace.americanlighting.com/',1,true),
('Adobe App Builder — Odoo Connector','adobe-app-builder-odoo-connector','Real-time Adobe Commerce and Odoo ERP integration using event-driven flows with Adobe I/O Events. Published on Adobe Exchange with monitoring and logging.',array['Adobe App Builder','Odoo ERP','Adobe I/O Events','Integration'],'https://exchange.adobe.com/apps/ec/abt7pvp37o/odoo-connector-for-adobe-commerce',2,true),
('Adobe Commerce — Salesforce Integration','adobe-commerce-salesforce-integration','Bi-directional synchronization of customer, order, and product data using Jitterbit; the resume reports a 99% improvement in data accuracy and elimination of manual entry.',array['Adobe Commerce','Salesforce','Jitterbit','Data Integration'],null,3,true),
('Adobe Commerce Optimizer','adobe-commerce-optimizer','Configured an evaluation storefront and demo environment with live catalog synchronization, validating product-data consistency and supporting deployment.',array['Adobe Commerce Optimizer','Catalog Sync','Storefront'],null,4,true),
('Hyvä Storefront Implementations','hyva-storefront-implementations','Delivered lightweight storefronts using Hyvä, Tailwind CSS, and Alpine.js, including a Store Locator module refactor for Hyvä compatibility.',array['Hyvä','Tailwind CSS','Alpine.js','Magento 2'],null,5,true),
('Enterprise Commerce Implementations','enterprise-commerce-implementations','Commerce Cloud, Enterprise, and Magento Open Source work across client projects including Rev-A-Shelf, Who Has It?, Midas Furniture, American Lighting, Melissa, RAK Ceramics, Tent and Table, TDot Performance, RP Tech India, and Tools Plus.',array['Adobe Commerce Cloud','Adobe Commerce Enterprise','Magento Open Source'],null,6,true)
on conflict (slug) do nothing;

insert into public.certifications (name,issuer,verification_url,sort_order,is_published) values
('Adobe Certified Expert – Adobe Commerce Business Practitioner','Adobe','https://certification.adobe.com/credential/verify/92b40b16-0f0d-45c5-aa0c-a68d58e19555',1,true),
('Adobe Certified Professional – Adobe Commerce Business Practitioner','Adobe','https://certification.adobe.com/completion/verify/3311dc33-d610-4589-87b0-b41b29f40273',2,true),
('Adobe Certified Professional – Adobe Commerce Developer','Adobe','https://certification.adobe.com/credential/verify/03ca53f9-db0a-4f90-9c10-7d17dd1c21f7',3,true),
('Adobe Commerce as a Cloud Service Foundations','Adobe','https://certification.adobe.com/completion/verify/774dd85f-9753-420b-947b-c9d9b9d06eab',4,true),
('Adobe Commerce Foundations','Adobe','https://certification.adobe.com/completion/verify/319de8a4-3641-4cf6-a475-61484f4fe690',5,true),
('Adobe Commerce Optimizer Foundations','Adobe','https://certification.adobe.com/completion/verify/bd28dc63-6cf4-4fda-9789-24aa137350e1',6,true),
('Adobe Experience Manager Sites Optimizer Foundations','Adobe','https://certification.adobe.com/completion/verify/30478c12-c877-4c08-b72b-401e8bb7e4a6',7,true)
on conflict (name) do nothing;

insert into public.experience (company,role,duration,description,sort_order,is_published) values
('Brainvire Infotech Inc.','Team Lead – Adobe Commerce','Oct 2024 – Present','Lead a cross-functional team of 8+ across Adobe Commerce Cloud and Enterprise implementations. Introduced AI-assisted development and code-review workflows, architect headless commerce solutions, own technical estimation, and establish code-quality governance.',1,true),
('Brainvire Infotech Inc.','Senior Software Engineer','Apr 2022 – Sep 2024','Built custom enterprise Adobe Commerce modules, engineered bi-directional Jitterbit and Salesforce integration, developed an Adobe App Builder Odoo connector published on Adobe Exchange, delivered Hyvä storefronts, and optimized production performance and delivery pipelines.',2,true),
('Brainvire Infotech Inc.','Software Engineer','Mar 2020 – Mar 2022','Developed Magento 2 modules, themes and extensions; integrated payment, shipping and tax services; diagnosed production performance issues; supported Magento 1-to-2 migrations and release validation.',3,true),
('Emipro Technologies Pvt. Ltd.','Magento Developer','Mar 2018 – Feb 2020','Built custom Magento modules and storefront features, contributed Magento–Odoo synchronization, resolved production issues, and collaborated on responsive storefront themes.',4,true)
on conflict (company,role,duration) do nothing;

insert into public.education (degree,institution,graduation_year,details,sort_order,is_published) values
('Master of Computer Applications (MCA)','Saurashtra University, Rajkot','2018','First Class with Distinction · 75.66% · Second Rank in University',1,true),
('Bachelor of Computer Applications (BCA)','Shree Swaminarayan College of Computer Science, Bhavnagar','2015','First Class · 64.49%',2,true),
('H.S.C. — Commerce','Dakshinamurti Vinaymandir, Bhavnagar','2012','First Class · 67.57%',3,true)
on conflict (degree,institution) do nothing;

do $$ begin
 if not exists (select 1 from public.profile) then
  insert into public.profile (name,title,intro,about,email,social_urls,resume_url,image_url)
  values ('Mahesh Dave','Adobe Commerce Team Lead · Certified Expert & Developer','I architect and scale Adobe Commerce experiences across B2B and B2C—bringing together composable commerce, thoughtful integrations, performance engineering, and AI-assisted delivery.','I’m an Adobe Commerce engineering lead with 9 years of hands-on experience building and scaling commerce platforms. My work spans Adobe Commerce Cloud and Enterprise, Magento 2, headless and composable storefronts, GraphQL, ERP/CRM integrations, cloud delivery, and performance optimization. At Brainvire, I lead cross-functional teams across enterprise implementations, support solution architecture and pre-sales, and introduce practical AI-assisted workflows into the software delivery lifecycle.','davemahesh119@gmail.com','{"linkedin":"https://in.linkedin.com/in/mahesh-dave-808732154","github":"https://github.com/maheshdave119","stackexchange":"https://magento.stackexchange.com/users/70881/mahesh-dave"}'::jsonb,'/Mahesh_Dave_Resume_2026.pdf','/md_pic.jpeg');
 end if;
end $$;

-- Optional multi-link support for projects (idempotent for existing installations).
alter table public.projects add column if not exists client_links jsonb not null default '[]'::jsonb;
update public.projects set client_links = '[{"name":"Rev-A-Shelf","url":"https://rev-a-shelf.com/"},{"name":"Who Has It?","url":"https://whohasit.co/"},{"name":"Midas Furniture","url":"https://midasfurniture.com/"},{"name":"American Lighting","url":"https://ace.americanlighting.com/"},{"name":"Melissa","url":"https://melissa.com.sg/"},{"name":"RAK Ceramics","url":"https://onlineshop.rakceramics.com/"},{"name":"Tent and Table","url":"https://tentandtable.net/"},{"name":"TDot Performance","url":"https://www.tdotperformance.ca/"},{"name":"RP Tech India","url":"https://rptechindia.com/"},{"name":"Tools Plus","url":"https://www.toolsplus.com/"},{"name":"Noctua","url":"https://noctua.at/"},{"name":"Bokacha","url":"https://www.bokacha.com/"},{"name":"Pool Spot","url":"https://www.poolspot.com.au/"},{"name":"Deadwood Knives","url":"https://deadwoodknives.com/"}]'::jsonb where slug='enterprise-commerce-implementations' and client_links='[]'::jsonb;
