insert into public.site_settings (id, data, updated_at)
values (
  1,
  '{
    "siteTitle": "Richard Juan",
    "heroTitle": "Richard Juan",
    "heroSubtitle": "Videographer, photographer, and content strategist in Bandung.",
    "aboutTitle": "I''m Richard Juan.",
    "aboutBody": "A visual storyteller based in Bandung. I help brands and individuals communicate their message through purposeful visuals and strategic content.",
    "location": "Bandung, Indonesia",
    "email": "hello@richardjuan.com",
    "phone": "+6281234567890",
    "instagramUrl": "https://instagram.com/",
    "linkedinUrl": "https://linkedin.com/",
    "adminEmail": "adminrichardjuan@gmail.com",
    "adminPassword": "PersonalBranding10",
    "siteName": "Richard Juan",
    "seoTitle": "Richard Juan | Videographer & Photographer in Bandung",
    "seoDescription": "Richard Juan is a Bandung-based videographer, photographer, and content strategist creating cinematic work for brands, events, and individuals.",
    "seoKeywords": "Bandung videographer, Bandung photographer, video production, commercial photography, social media content",
    "canonicalUrl": "https://richardjuan.com/",
    "ogImageUrl": "https://richardjuan.com/opengraph.jpg"
  }'::jsonb,
  now()
)
on conflict (id) do update set data = excluded.data, updated_at = now();

insert into public.portfolio_categories (id, name, type, created_at)
values
  ('1', 'Videography', 'all', now()),
  ('2', 'Photography', 'all', now()),
  ('3', 'Graphic Design', 'all', now()),
  ('4', 'Social Media', 'all', now())
on conflict (id) do update set name = excluded.name, type = excluded.type;

insert into public.companies (id, name, logo_url, website_url, sort_order, active, created_at)
values
  ('company-1', 'Free and Safe Indonesia', '', '', 0, true, now()),
  ('company-2', 'Blessings Cafe', '', '', 1, true, now()),
  ('company-3', 'Jefs.marketing', '', '', 2, true, now())
on conflict (id) do update set
  name = excluded.name,
  logo_url = excluded.logo_url,
  website_url = excluded.website_url,
  sort_order = excluded.sort_order,
  active = excluded.active;

insert into public.media
  (id, project_id, type, url, thumbnail_url, gallery_urls, title, description, category, featured, created_at)
values
  (
    'media-1',
    null,
    'video',
    '',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    '[]'::jsonb,
    'Campaign Visual Story',
    'A cinematic brand piece built around movement, atmosphere, and story.',
    'Videography',
    true,
    now()
  ),
  (
    'media-2',
    null,
    'photo',
    '',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    '[]'::jsonb,
    'Portrait Direction',
    'Clean portrait visuals with warm direction and premium detail.',
    'Photography',
    true,
    now()
  ),
  (
    'media-3',
    null,
    'photo',
    '',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    '[]'::jsonb,
    'Social Content Set',
    'Short-form content planning and execution for social channels.',
    'Social Media',
    false,
    now()
  )
on conflict (id) do update set
  project_id = excluded.project_id,
  type = excluded.type,
  url = excluded.url,
  thumbnail_url = excluded.thumbnail_url,
  gallery_urls = excluded.gallery_urls,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  featured = excluded.featured;
