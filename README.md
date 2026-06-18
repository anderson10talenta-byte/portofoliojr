# Richard Juan Portfolio CMS Website

Folder ini berisi semua bagian website dalam satu tempat: source React, admin dashboard, server CMS, asset publik, dan setup Supabase untuk database production-ready.

## Fitur

- Website portfolio React + Tailwind
- Admin dashboard React di `/admin`
- Edit homepage settings
- Tambah/edit/hapus video, foto, design, project, category, dan company
- Toggle featured work dan homepage content
- Edit kategori filter portfolio
- Data CMS tersimpan di Supabase/Postgres saat `DATABASE_URL` tersedia
- Upload production tersimpan di Supabase Storage bucket `portfolio-uploads`
- Fallback lokal ke `data/content.json` kalau database belum dinyalakan
- Supabase migrations + seed ada di folder `supabase/`

## Struktur penting

```text
portfolio-cms-website/
  server.js              # Native Node CMS/API server
  supabase/              # Supabase CLI config, migration, dan seed
  data/content.json      # Fallback data lokal kalau DATABASE_URL kosong
  src/                   # Source React website + admin
  public/                # Static assets untuk Vite
  dist/public/           # Hasil build yang diserve server
  package.json           # Scripts build/start
  vite.config.ts         # Konfigurasi Vite
```

## Jalankan lokal

```bash
pnpm install
cp .env.example .env
pnpm db:start
pnpm db:reset
pnpm run build
pnpm start
```

Buka:

- Website: `http://localhost:4173`
- Admin dashboard: `http://localhost:4173/admin`

Default admin account:

```text
Email: adminrichardjuan@gmail.com
Password: PersonalBranding10
```

Supabase local memakai Docker. Kalau `pnpm db:start` gagal karena Docker belum terinstall/running, install Docker Desktop dulu lalu ulangi perintahnya.

Kalau mau jalan cepat tanpa database, kosongkan `DATABASE_URL` di `.env`. Server akan memakai fallback `data/content.json`, tapi itu tidak cocok untuk production serverless.

## Database

Supabase project:

```text
Project ref: ndbytpnjjodsyizpzpfj
Project URL: https://ndbytpnjjodsyizpzpfj.supabase.co
```

Perintah penting:

```bash
pnpm db:start      # start Supabase local stack
pnpm db:reset      # apply migration + seed ulang database local
pnpm db:push       # push migration ke Supabase project yang sudah di-link
pnpm supabase link # link folder ini ke hosted Supabase project
```

Schema utama:

- `site_settings`
- `portfolio_categories`
- `companies`
- `projects`
- `media`
- `admin_sessions`

Untuk production, set environment variable di Vercel:

```bash
DATABASE_URL=your-supabase-transaction-pooler-or-postgres-connection-string
DATABASE_SSL=true
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_HOURS=2
SUPABASE_PROJECT_REF=ndbytpnjjodsyizpzpfj
SUPABASE_URL=https://ndbytpnjjodsyizpzpfj.supabase.co
SUPABASE_ANON_KEY=sb_publishable_yG8J4W5gu3KtY5vhCkZoTQ_yVI6vIO-
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=portfolio-uploads
```

Untuk apply schema ke Supabase hosted:

```bash
pnpm supabase login
pnpm supabase link --project-ref ndbytpnjjodsyizpzpfj
pnpm db:push
```

Kalau login browser tidak tersedia, buat Supabase access token lalu jalankan:

```bash
SUPABASE_ACCESS_TOKEN=your-token pnpm supabase link --project-ref ndbytpnjjodsyizpzpfj
SUPABASE_ACCESS_TOKEN=your-token pnpm db:push
```

## Catatan deploy

App ini siap di-import ke Vercel sebagai project Vite:

- Build command: `npm run build`
- Output directory: `dist/public`
- API routes: handled by `api/index.js`

Catatan penting: set `DATABASE_URL` di Vercel supaya perubahan admin dashboard tersimpan permanen di Supabase/Postgres. Set `SUPABASE_SERVICE_ROLE_KEY` supaya upload admin dashboard tersimpan permanen ke Supabase Storage. Kalau `DATABASE_URL` kosong, server akan fallback ke `data/content.json`, tetapi perubahan JSON itu tidak permanen di serverless.
