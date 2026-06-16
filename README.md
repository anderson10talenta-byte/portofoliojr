# Richard Juan Portfolio CMS Website

Folder ini sekarang berisi semua bagian website dalam satu tempat: source React, admin dashboard, server CMS, build output, asset publik, dan data JSON.

## Fitur

- Website portfolio React + Tailwind
- Admin dashboard React di `/admin`
- Edit homepage settings
- Tambah/edit/hapus video, foto, design, project, category, dan company
- Toggle featured work dan homepage content
- Edit kategori filter portfolio
- Data tersimpan di `data/content.json`

## Struktur penting

```text
portfolio-cms-website/
  server.js              # Native Node CMS/API server
  data/content.json      # Data CMS lokal
  src/                   # Source React website + admin
  public/                # Static assets untuk Vite
  dist/public/           # Hasil build yang diserve server
  package.json           # Scripts build/start
  vite.config.ts         # Konfigurasi Vite
```

## Jalankan lokal

```bash
npm run build
npm start
```

Buka:

- Website: `http://localhost:4173`
- Admin dashboard: `http://localhost:4173/admin`

Default admin account:

```text
Email: adminrichardjuan@gmail.com
Password: PersonalBranding10
```

Untuk production, set environment variable:

```bash
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
```

## Catatan deploy

App ini siap di-import ke Vercel sebagai project Vite:

- Build command: `npm run build`
- Output directory: `dist/public`
- API routes: handled by `api/index.js`

Catatan penting: Vercel serverless bisa menjalankan API dan membaca data bawaan, tetapi perubahan CMS yang menulis ke `data/content.json` tidak permanen di serverless. Untuk CMS production yang benar-benar persisten, sambungkan storage/database seperti Supabase, Neon, Vercel Postgres, atau Vercel Blob.
