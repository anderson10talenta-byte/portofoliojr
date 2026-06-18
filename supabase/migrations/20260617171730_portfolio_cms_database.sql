create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id integer primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint single_site_settings_row check (id = 1)
);

create table if not exists public.portfolio_categories (
  id text primary key,
  name text not null,
  type text not null default 'all',
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id text primary key,
  name text not null,
  logo_url text not null default '',
  website_url text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  title text not null,
  description text,
  category text not null default 'Videography',
  client_name text,
  tags jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  show_on_homepage boolean not null default false,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.media (
  id text primary key,
  project_id text references public.projects(id) on delete set null,
  type text not null check (type in ('video', 'photo', 'design')),
  url text not null default '',
  thumbnail_url text,
  gallery_urls jsonb not null default '[]'::jsonb,
  title text not null,
  description text,
  category text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  token text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_admin_sessions_expires_at on public.admin_sessions(expires_at);
create index if not exists idx_companies_active_sort on public.companies(active, sort_order, created_at);
create index if not exists idx_projects_created_at on public.projects(created_at desc);
create index if not exists idx_projects_featured on public.projects(featured) where featured = true;
create index if not exists idx_projects_homepage on public.projects(show_on_homepage) where show_on_homepage = true;
create index if not exists idx_media_type_created on public.media(type, created_at desc);
create index if not exists idx_media_featured on public.media(featured) where featured = true;
create index if not exists idx_media_project on public.media(project_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-uploads',
  'portfolio-uploads',
  true,
  262144000,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.site_settings enable row level security;
alter table public.portfolio_categories enable row level security;
alter table public.companies enable row level security;
alter table public.projects enable row level security;
alter table public.media enable row level security;
alter table public.admin_sessions enable row level security;

drop policy if exists "Public portfolio uploads are readable" on storage.objects;
create policy "Public portfolio uploads are readable"
on storage.objects for select
to public
using (bucket_id = 'portfolio-uploads');

-- The website reads and writes through the Node CMS API using DATABASE_URL.
-- Direct anonymous table access is intentionally closed by RLS.
