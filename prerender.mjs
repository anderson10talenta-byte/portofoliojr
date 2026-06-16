/**
 * Post-build prerender script for the portfolio homepage.
 *
 * Vite produces an empty `<div id="root"></div>` shell — crawlers that don't
 * execute JavaScript see no meaningful content. This script:
 *
 *   1. Connects to DATABASE_URL (available at build time in both dev and prod)
 *      and fetches up to 12 media items (featured first, then by date).
 *   2. Renders those items as static portfolio cards in the #work section so
 *      AI crawlers and non-rendering bots see real project titles and descriptions.
 *   3. Injects all static markup (hero, services, portfolio, about, contact)
 *      directly into <div id="root"> so content is visible pre-hydration.
 *
 * React replaces #root on mount — no duplicate IDs, no hidden text.
 * If DATABASE_URL is absent or the query fails, the portfolio section falls back
 * to the generic heading/description so the build never breaks.
 *
 * Run automatically as part of `pnpm run build`.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import pg from "pg";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, "dist/public/index.html");

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str, max = 120) {
  if (!str || str.length <= max) return str ?? "";
  return str.slice(0, max).trimEnd() + "…";
}

function typeBadgeColor(type) {
  if (type === "video") return "#eab308";
  if (type === "photo") return "#3b82f6";
  return "#a855f7";
}

function renderMediaCard(item) {
  const badge = escapeHtml(
    item.type.charAt(0).toUpperCase() + item.type.slice(1)
  );
  const badgeColor = typeBadgeColor(item.type);
  const title = escapeHtml(item.title);
  const desc = escapeHtml(truncate(item.description));
  const thumb = item.thumbnail_url ? escapeHtml(item.thumbnail_url) : "";
  const workUrl = `/work/${item.id}`;

  return `<li style="border-radius:1rem;overflow:hidden;border:1px solid rgba(255,255,255,0.07);background:#18181b;display:flex;flex-direction:column">
    <a href="${workUrl}" style="display:flex;flex-direction:column;flex:1;text-decoration:none;color:inherit">
    ${
      thumb
        ? `<div style="aspect-ratio:16/9;overflow:hidden;background:#09090b">
        <img src="${thumb}" alt="${title}" loading="lazy" style="width:100%;height:100%;object-fit:cover" />
      </div>`
        : `<div style="aspect-ratio:16/9;background:#09090b;display:flex;align-items:center;justify-content:center">
        <span style="color:#3f3f46;font-size:2rem">▶</span>
      </div>`
    }
    <div style="padding:1.25rem;flex:1;display:flex;flex-direction:column;gap:0.5rem">
      <span style="display:inline-block;padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;background:${badgeColor}20;color:${badgeColor};width:fit-content">${badge}</span>
      <h3 style="font-size:1rem;font-weight:700;margin:0;color:#fafafa">${title}</h3>
      ${desc ? `<p style="font-size:0.875rem;color:#a1a1aa;margin:0;line-height:1.6">${desc}</p>` : ""}
    </div>
    </a>
  </li>`;
}

async function fetchMedia() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("Prerender: DATABASE_URL not set — portfolio section will use fallback text.");
    return [];
  }

  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, thumbnail_url, type, category, featured
       FROM media
       ORDER BY featured DESC, created_at DESC
       LIMIT 12`
    );
    console.log(`Prerender: fetched ${rows.length} media items from database.`);
    return rows;
  } catch (err) {
    console.warn("Prerender: DB query failed — portfolio section will use fallback text.", err.message);
    return [];
  } finally {
    await pool.end();
  }
}

function renderFeaturedSection(featuredItems) {
  if (featuredItems.length === 0) return "";

  const cards = featuredItems
    .map((item) => {
      const title = escapeHtml(item.title);
      const desc = escapeHtml(truncate(item.description, 160));
      const thumb = item.thumbnail_url ? escapeHtml(item.thumbnail_url) : "";
      const badge = escapeHtml(item.type.charAt(0).toUpperCase() + item.type.slice(1));
      const badgeColor = typeBadgeColor(item.type);

      const workUrl = `/work/${item.id}`;
      return `<li style="border-radius:1rem;overflow:hidden;border:1px solid rgba(255,255,255,0.07);background:#18181b;display:flex;flex-direction:column;position:relative">
      <a href="${workUrl}" style="display:flex;flex-direction:column;flex:1;text-decoration:none;color:inherit">
      ${
        thumb
          ? `<div style="aspect-ratio:16/9;overflow:hidden;background:#09090b;position:relative">
          <img src="${thumb}" alt="${title}" loading="lazy" style="width:100%;height:100%;object-fit:cover" />
          <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <div style="width:4rem;height:4rem;border-radius:50%;background:rgba(234,179,8,0.9);display:flex;align-items:center;justify-content:center">
              <span style="color:#000;font-size:1.5rem;margin-left:0.2rem">▶</span>
            </div>
          </div>
        </div>`
          : `<div style="aspect-ratio:16/9;background:#09090b;display:flex;align-items:center;justify-content:center">
          <span style="color:#3f3f46;font-size:2rem">▶</span>
        </div>`
      }
      <div style="padding:1.5rem;flex:1;display:flex;flex-direction:column;gap:0.5rem">
        <span style="display:inline-block;padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;background:${badgeColor}20;color:${badgeColor};width:fit-content">${badge}</span>
        <h3 style="font-size:1.1rem;font-weight:700;margin:0;color:#fafafa">${title}</h3>
        ${desc ? `<p style="font-size:0.875rem;color:#a1a1aa;margin:0;line-height:1.6">${desc}</p>` : ""}
      </div>
      </a>
    </li>`;
    })
    .join("\n");

  return `  <!-- Selected Works -->
  <section id="featured" style="padding:6rem 1.5rem;background:#09090b">
    <div style="max-width:72rem;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:3rem;flex-wrap:wrap;gap:1rem">
        <div>
          <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:900;margin:0 0 0.5rem">
            Selected <span style="color:#eab308">Works</span>
          </h2>
          <p style="color:#a1a1aa;font-size:1.1rem;margin:0">A showcase of my recent and most impactful video productions.</p>
        </div>
        <a href="#work" style="color:#eab308;font-weight:700;text-decoration:none">View all projects →</a>
      </div>
      <ul style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(22rem,1fr));gap:2rem">
        ${cards}
      </ul>
    </div>
  </section>`;
}

function renderPortfolioSection(items) {
  const grid =
    items.length > 0
      ? `<ul style="list-style:none;padding:0;margin:2.5rem 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(18rem,1fr));gap:1.5rem">
        ${items.map(renderMediaCard).join("\n")}
      </ul>`
      : `<p style="color:#a1a1aa;font-size:1.1rem;margin:1rem 0 0">
          Videography, photography, and graphic design work across commercial, event, and brand projects.
        </p>`;

  return `  <!-- Portfolio -->
  <section id="work" style="padding:6rem 1.5rem">
    <div style="max-width:72rem;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:900;margin:0 0 0.5rem">
        The <span style="color:#eab308">Portfolio</span>
      </h2>
      <p style="color:#a1a1aa;font-size:1rem;margin:0">
        ${items.length > 0 ? `${items.length} projects — videography, photography, and graphic design.` : "Videography, photography, and graphic design work."}
      </p>
      ${grid}
    </div>
  </section>`;
}

async function main() {
  const html = readFileSync(htmlPath, "utf-8");
  const mediaItems = await fetchMedia();
  const featuredItems = mediaItems.filter((m) => m.featured).slice(0, 4);

  const staticContent = `<div style="background:#09090b;color:#fafafa;font-family:Inter,sans-serif;min-height:100vh">

  <!-- Nav -->
  <header style="position:fixed;top:0;left:0;right:0;z-index:50;padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;background:rgba(9,9,11,0.8)">
    <span style="font-weight:900;letter-spacing:0.15em;font-size:1.1rem">RICHARD JUAN</span>
    <nav aria-label="Main navigation">
      <a href="#work" style="color:#a1a1aa;margin-left:2rem;text-decoration:none">Work</a>
      <a href="#services" style="color:#a1a1aa;margin-left:2rem;text-decoration:none">Services</a>
      <a href="#about" style="color:#a1a1aa;margin-left:2rem;text-decoration:none">About</a>
      <a href="#contact" style="color:#a1a1aa;margin-left:2rem;text-decoration:none">Contact</a>
    </nav>
  </header>

  <!-- Hero -->
  <section style="min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:6rem 1.5rem 4rem">
    <div style="max-width:56rem">
      <span style="display:inline-block;padding:0.25rem 0.75rem;border-radius:9999px;border:1px solid rgba(234,179,8,0.3);color:#eab308;font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:1.5rem">
        Content-Driven Videographer
      </span>
      <h1 style="font-size:clamp(2rem,6vw,4rem);font-weight:900;line-height:1.05;margin:0 0 1rem">
        Richard Juan<br><span style="color:#eab308">Bandung Videographer</span> &amp; Photographer
      </h1>
      <p style="font-size:1.35rem;color:#e4e4e7;max-width:42rem;margin:0 auto 0.75rem;font-weight:500">
        Creative Content That Matches Your Vision
      </p>
      <p style="font-size:1.1rem;color:#a1a1aa;max-width:42rem;margin:0 auto 2.5rem">
        Helping brands and individuals tell their stories through cinematic video and striking photography.
      </p>
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
        <a href="#work" style="display:inline-block;padding:0.875rem 2rem;border-radius:9999px;background:#eab308;color:#000;font-weight:700;text-decoration:none;font-size:1.05rem">
          View My Work
        </a>
        <a href="#contact" style="display:inline-block;padding:0.875rem 2rem;border-radius:9999px;border:2px solid rgba(255,255,255,0.2);color:#fff;font-weight:700;text-decoration:none;font-size:1.05rem">
          Start a Project
        </a>
      </div>
    </div>
  </section>

  <!-- Services -->
  <section id="services" style="padding:6rem 1.5rem;background:#18181b">
    <div style="max-width:72rem;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:900;text-align:center;margin:0 0 1rem">
        My <span style="color:#eab308">Services</span>
      </h2>
      <p style="color:#a1a1aa;text-align:center;margin:0 0 4rem;font-size:1.1rem">
        Comprehensive visual solutions tailored for modern digital platforms.
      </p>
      <ul style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:2rem">
        <li style="padding:2rem;border-radius:1.5rem;border:1px solid rgba(234,179,8,0.3);background:rgba(234,179,8,0.04)">
          <h3 style="font-size:1.2rem;font-weight:700;margin:0 0 0.75rem">Videography</h3>
          <p style="color:#a1a1aa;margin:0;line-height:1.6">Cinematic commercial, event, and documentary video production.</p>
        </li>
        <li style="padding:2rem;border-radius:1.5rem;border:1px solid rgba(255,255,255,0.07)">
          <h3 style="font-size:1.2rem;font-weight:700;margin:0 0 0.75rem">Photography</h3>
          <p style="color:#a1a1aa;margin:0;line-height:1.6">Professional portrait, product, and event photography.</p>
        </li>
        <li style="padding:2rem;border-radius:1.5rem;border:1px solid rgba(255,255,255,0.07)">
          <h3 style="font-size:1.2rem;font-weight:700;margin:0 0 0.75rem">Graphic Design</h3>
          <p style="color:#a1a1aa;margin:0;line-height:1.6">Visual identity, marketing collateral, and digital assets.</p>
        </li>
        <li style="padding:2rem;border-radius:1.5rem;border:1px solid rgba(255,255,255,0.07)">
          <h3 style="font-size:1.2rem;font-weight:700;margin:0 0 0.75rem">Social Media</h3>
          <p style="color:#a1a1aa;margin:0;line-height:1.6">Vertical content optimization for Reels, TikTok, and Shorts.</p>
        </li>
      </ul>
    </div>
  </section>

${renderFeaturedSection(featuredItems)}

${renderPortfolioSection(mediaItems)}

  <!-- About -->
  <section id="about" style="padding:6rem 1.5rem;background:#18181b">
    <div style="max-width:72rem;margin:0 auto">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:900;margin:0 0 1.5rem">
        About <span style="color:#eab308">Me</span>
      </h2>
      <p style="color:#a1a1aa;font-size:1.1rem;line-height:1.8;margin:0 0 1.25rem">
        I'm <strong style="color:#fff">Richard Juan</strong>, a videographer and photographer based in Bandung,
        with a background in digital marketing and business development.
      </p>
      <p style="color:#a1a1aa;font-size:1.1rem;line-height:1.8;margin:0 0 1.25rem">
        Since 2019, I've been developing my skills in photography and videography, combining creative
        execution with strategic thinking. I don't just shoot beautiful visuals — I create content that
        aligns with business objectives and speaks to the target audience.
      </p>
      <p style="color:#a1a1aa;font-size:1.1rem;line-height:1.8;margin:0 0 2.5rem">
        I've worked on 30+ projects across various industries, managing entire content pipelines from
        ideation to final delivery.
      </p>
      <div style="display:flex;gap:3rem;margin-bottom:4rem">
        <div>
          <div style="font-size:2.5rem;font-weight:900;color:#eab308">5+</div>
          <div style="font-size:0.8rem;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Years Exp.</div>
        </div>
        <div>
          <div style="font-size:2.5rem;font-weight:900;color:#eab308">30+</div>
          <div style="font-size:0.8rem;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Projects</div>
        </div>
      </div>

      <section id="experience">
        <h3 style="font-size:1.75rem;font-weight:900;margin:0 0 2rem;text-align:center">
          Professional <span style="color:#eab308">Journey</span>
        </h3>
        <ul style="list-style:none;padding:0;margin:0;max-width:48rem;margin-inline:auto">
          <li style="margin-bottom:2rem;padding-bottom:2rem;border-bottom:1px solid rgba(255,255,255,0.07)">
            <time style="color:#eab308;font-size:0.85rem;font-weight:600">Oct 2024 — Present</time>
            <div style="font-weight:700;margin:0.25rem 0">Creative Department (Full-time)</div>
            <div style="color:#a1a1aa;font-size:0.9rem;margin-bottom:0.5rem">Free and Safe Indonesia</div>
            <p style="color:#71717a;font-size:0.9rem;margin:0;line-height:1.6">Produced 12+ contents/month, managed Instagram (Bowlah), and documented events &amp; program.</p>
          </li>
          <li style="margin-bottom:2rem;padding-bottom:2rem;border-bottom:1px solid rgba(255,255,255,0.07)">
            <time style="color:#eab308;font-size:0.85rem;font-weight:600">Aug 2024 — Oct 2024</time>
            <div style="font-weight:700;margin:0.25rem 0">Social Media Marketing Specialist</div>
            <div style="color:#a1a1aa;font-size:0.9rem;margin-bottom:0.5rem">Jefs.marketing</div>
            <p style="color:#71717a;font-size:0.9rem;margin:0;line-height:1.6">Managed 4 client accounts, producing 12+ feeds/reels and 16+ stories/month with end-to-end content execution.</p>
          </li>
          <li style="margin-bottom:2rem;padding-bottom:2rem;border-bottom:1px solid rgba(255,255,255,0.07)">
            <time style="color:#eab308;font-size:0.85rem;font-weight:600">Mar 2024 — Jun 2024</time>
            <div style="font-weight:700;margin:0.25rem 0">Social Media Marketing Intern</div>
            <div style="color:#a1a1aa;font-size:0.9rem;margin-bottom:0.5rem">Comvee Adaptive Clothing</div>
            <p style="color:#71717a;font-size:0.9rem;margin:0;line-height:1.6">Produced 40+ social media contents and supported brand communication through visual content &amp; photoshoots.</p>
          </li>
          <li>
            <time style="color:#eab308;font-size:0.85rem;font-weight:600">Dec 2020 — May 2022</time>
            <div style="font-weight:700;margin:0.25rem 0">Photographer &amp; Videographer</div>
            <div style="color:#a1a1aa;font-size:0.9rem;margin-bottom:0.5rem">Dreampict.shoots</div>
            <p style="color:#71717a;font-size:0.9rem;margin:0;line-height:1.6">Delivered 25+ client projects, producing 65+ photo &amp; 2+ video content while managing social media to attract clients.</p>
          </li>
        </ul>
      </section>
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" style="padding:6rem 1.5rem">
    <div style="max-width:40rem;margin:0 auto;text-align:center">
      <h2 style="font-size:clamp(2rem,5vw,3rem);font-weight:900;margin:0 0 1rem">
        Get In <span style="color:#eab308">Touch</span>
      </h2>
      <p style="color:#a1a1aa;font-size:1.1rem;margin:0 0 0.75rem;line-height:1.7">
        Have a project in mind? Let's create something remarkable together.
      </p>
      <p style="color:#71717a;font-size:0.95rem;margin:0">
        Based in Bandung, Indonesia. Available for commercial, brand, and event projects.
      </p>
    </div>
  </section>

</div>`;

  const updatedHtml = html.replace(
    '<div id="root"></div>',
    `<div id="root">${staticContent}</div>`
  );

  if (updatedHtml === html) {
    console.error('Prerender: could not find <div id="root"></div> in built HTML. Skipping.');
    process.exit(1);
  }

  writeFileSync(htmlPath, updatedHtml, "utf-8");
  console.log("Prerender: injected static homepage content into dist/public/index.html");

  await generateWorkPages(html, mediaItems);
}

function buildWorkPageHtml(template, item) {
  const siteUrl = "https://richardjuan.com";
  const canonical = `${siteUrl}/work/${item.id}`;
  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
  const title = escapeHtml(`${item.title} — Richard Juan ${typeLabel}`);
  const description = item.description
    ? escapeHtml(truncate(item.description, 160))
    : `${typeLabel} by Richard Juan — Bandung videographer and photographer.`;
  const thumb = item.thumbnail_url ? escapeHtml(item.thumbnail_url) : "";
  const itemTitle = escapeHtml(item.title);
  const itemDesc = item.description ? escapeHtml(item.description) : "";
  const badge = escapeHtml(typeLabel);
  const badgeColor = typeBadgeColor(item.type);
  const category = item.category ? escapeHtml(item.category) : "";

  const staticContent = `<div style="background:#09090b;color:#fafafa;font-family:Inter,sans-serif;min-height:100vh">
  <header style="position:fixed;top:0;left:0;right:0;z-index:50;padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;background:rgba(9,9,11,0.8)">
    <a href="/" style="font-weight:900;letter-spacing:0.15em;font-size:1.1rem;color:#fafafa;text-decoration:none">RICHARD JUAN</a>
    <nav aria-label="Main navigation">
      <a href="/#work" style="color:#a1a1aa;margin-left:2rem;text-decoration:none">Work</a>
      <a href="/#services" style="color:#a1a1aa;margin-left:2rem;text-decoration:none">Services</a>
      <a href="/#about" style="color:#a1a1aa;margin-left:2rem;text-decoration:none">About</a>
      <a href="/#contact" style="color:#a1a1aa;margin-left:2rem;text-decoration:none">Contact</a>
    </nav>
  </header>

  <main style="max-width:56rem;margin:0 auto;padding:8rem 1.5rem 4rem">
    <a href="/#work" style="display:inline-flex;align-items:center;gap:0.5rem;color:#a1a1aa;text-decoration:none;font-weight:500;margin-bottom:2rem">
      ← Back to Portfolio
    </a>

    <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap">
      <span style="padding:0.2rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;background:${badgeColor}20;color:${badgeColor};border:1px solid ${badgeColor}40">${badge}</span>
      ${category ? `<span style="padding:0.2rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:rgba(255,255,255,0.07);color:#a1a1aa;border:1px solid rgba(255,255,255,0.1)">${category}</span>` : ""}
    </div>

    <h1 style="font-size:clamp(1.75rem,5vw,3rem);font-weight:900;line-height:1.1;margin:0 0 2rem;color:#fafafa">${itemTitle}</h1>

    ${thumb
      ? `<div style="border-radius:1rem;overflow:hidden;background:#000;margin-bottom:2rem">
          <img src="${thumb}" alt="${itemTitle}" style="width:100%;max-height:70vh;object-fit:contain;display:block" />
        </div>`
      : ""}

    ${itemDesc
      ? `<p style="font-size:1.1rem;color:#a1a1aa;line-height:1.8;margin:0 0 3rem">${itemDesc}</p>`
      : ""}

    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:2rem;margin-top:2rem">
      <p style="color:#71717a;font-size:0.9rem">
        Work by <a href="/" style="color:#eab308;font-weight:600;text-decoration:none">Richard Juan</a>
        — Bandung Videographer &amp; Photographer
      </p>
    </div>
  </main>
</div>`;

  let updated = template
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${description}"`
    )
    .replace(
      /<link rel="canonical" href="[^"]*"/,
      `<link rel="canonical" href="${canonical}"`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${title}"`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${description}"`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${canonical}"`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${title}"`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${description}"`
    );

  if (thumb) {
    updated = updated
      .replace(
        /<meta property="og:image" content="[^"]*"/,
        `<meta property="og:image" content="${thumb}"`
      )
      .replace(
        /<meta name="twitter:image" content="[^"]*"/,
        `<meta name="twitter:image" content="${thumb}"`
      );
  }

  updated = updated.replace(
    '<div id="root"></div>',
    `<div id="root">${staticContent}</div>`
  );

  return updated;
}

async function generateWorkPages(template, items) {
  if (items.length === 0) {
    console.log("Prerender: no media items — skipping /work/* page generation.");
    return;
  }

  const distDir = resolve(__dirname, "dist/public");
  let count = 0;

  for (const item of items) {
    const pageDir = resolve(distDir, "work", String(item.id));
    mkdirSync(pageDir, { recursive: true });
    const pageHtml = buildWorkPageHtml(template, item);
    writeFileSync(resolve(pageDir, "index.html"), pageHtml, "utf-8");
    count++;
  }

  console.log(`Prerender: generated ${count} static /work/:id pages.`);
}

main().catch((err) => {
  console.error("Prerender: unexpected error —", err);
  process.exit(1);
});
