import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "data", "content.json");
const publicDir = process.env.PUBLIC_DIR
  ? path.resolve(process.env.PUBLIC_DIR)
  : path.join(__dirname, "dist", "public");
const uploadDir = path.join(__dirname, "public", "uploads");
const port = Number(process.env.PORT || 4173);
const sessions = new Set();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

async function readContent() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

async function writeContent(content) {
  await writeFile(dataPath, `${JSON.stringify(content, null, 2)}\n`);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const body = await readBody(req);
  if (!body.length) return {};
  return JSON.parse(body.toString("utf8"));
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    ...headers
  });
  res.end(payload);
}

function success(message = null) {
  return { success: true, message };
}

function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  return cookie
    .split(";")
    .map((item) => item.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

function isAdmin(req, content) {
  const expected = process.env.ADMIN_PASSWORD || content.settings.adminPassword;
  const token = getCookie(req, "portfolio_admin");
  return req.headers["x-admin-password"] === expected || Boolean(token && sessions.has(token));
}

function credentialsMatch(content, email, password) {
  const expectedPassword = process.env.ADMIN_PASSWORD || content.settings.adminPassword;
  const expectedEmail = process.env.ADMIN_EMAIL || content.settings.adminEmail;
  if (password !== expectedPassword) return false;
  if (!expectedEmail) return true;
  return String(email || "").trim().toLowerCase() === String(expectedEmail).trim().toLowerCase();
}

function setAdminCookie(res, token) {
  res.setHeader("set-cookie", `portfolio_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
}

function clearAdminCookie(res) {
  res.setHeader("set-cookie", "portfolio_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

function getId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getNextNumberId(items = []) {
  const max = items.reduce((current, item) => {
    const value = Number(item.id);
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, 0);
  return max + 1;
}

async function requireAdmin(req, res) {
  const content = await readContent();
  if (!isAdmin(req, content)) {
    send(res, 401, { error: "Unauthorized" });
    return null;
  }
  return content;
}

async function serveStatic(req, res, pathname) {
  if (pathname.startsWith("/uploads/")) {
    const uploadPath = path.normalize(path.join(uploadDir, pathname.replace(/^\/uploads\//, "")));
    if (!uploadPath.startsWith(uploadDir)) {
      send(res, 403, "Forbidden");
      return;
    }
    try {
      const file = await readFile(uploadPath);
      res.writeHead(200, { "content-type": mime[path.extname(uploadPath)] || "application/octet-stream" });
      res.end(file);
    } catch {
      send(res, 404, "Not found");
    }
    return;
  }

  const safePath = pathname === "/" ? "/index.html" : pathname;
  const target = path.normalize(path.join(publicDir, safePath));
  if (!target.startsWith(publicDir)) {
    send(res, 403, "Forbidden");
    return;
  }

  try {
    const file = await readFile(target);
    res.writeHead(200, { "content-type": mime[path.extname(target)] || "application/octet-stream" });
    res.end(file);
  } catch {
    if (!path.extname(safePath)) {
      const index = await readFile(path.join(publicDir, "index.html"));
      res.writeHead(200, { "content-type": mime[".html"] });
      res.end(index);
      return;
    }
    send(res, 404, "Not found");
  }
}

function publicSettings(content) {
  const { adminEmail, adminPassword, siteTitle, ...settings } = content.settings;
  return {
    siteName: siteTitle || content.settings.siteName || "Richard Juan",
    seoTitle: "Richard Juan - Videographer & Photographer in Bandung",
    seoDescription: "Richard Juan is a Bandung-based videographer, photographer, and content strategist creating cinematic work for brands, events, and individuals.",
    seoKeywords: "Bandung videographer, Bandung photographer, video production, commercial photography, social media content",
    canonicalUrl: "https://richardjuan.com/",
    ogImageUrl: "https://richardjuan.com/opengraph.jpg",
    ...settings
  };
}

function normalizedCategories(content) {
  return content.categories.map((category, index) =>
    typeof category === "string"
      ? { id: index + 1, name: category, type: "all", createdAt: new Date(0).toISOString() }
      : category
  );
}

function normalizedCompanies(content) {
  return content.companies.map((company, index) => ({
    sortOrder: index,
    active: true,
    createdAt: new Date(0).toISOString(),
    ...company
  }));
}

function normalizeType(type = "") {
  if (type === "image") return "photo";
  return type;
}

function storedType(type = "") {
  if (type === "image") return "photo";
  return type;
}

function publicMedia(item) {
  const type = normalizeType(item.type);
  return {
    galleryUrls: [],
    createdAt: new Date(0).toISOString(),
    ...item,
    type,
    thumbnailUrl: item.thumbnailUrl || null,
    description: item.description || null,
    category: item.category || null,
    projectId: item.projectId ?? null
  };
}

function publicProject(project) {
  return {
    tags: [],
    featured: false,
    showOnHomepage: false,
    thumbnailUrl: null,
    description: null,
    clientName: null,
    createdAt: new Date(0).toISOString(),
    ...project
  };
}

function dashboardStats(content) {
  const media = (content.media || []).map(publicMedia);
  const projects = (content.projects || []).map(publicProject);
  return {
    totalProjects: projects.length,
    totalMedia: media.length,
    totalVideos: media.filter((item) => item.type === "video").length,
    totalPhotos: media.filter((item) => item.type === "photo").length,
    totalDesigns: media.filter((item) => item.type === "design").length,
    featuredProjects: projects.filter((item) => item.featured).length || media.filter((item) => item.featured).length,
    recentMedia: media.slice(0, 6)
  };
}

async function saveUpload(req) {
  const type = req.headers["content-type"] || "";
  const match = type.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) return null;

  const boundary = `--${match[1] || match[2]}`;
  const body = await readBody(req);
  const raw = body.toString("binary");
  const start = raw.indexOf("\r\n\r\n");
  const filenameMatch = raw.slice(0, start).match(/filename="([^"]+)"/);
  if (start === -1 || !filenameMatch) return null;

  const original = filenameMatch[1].replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
  const end = raw.indexOf(`\r\n${boundary}`, start + 4);
  const fileBuffer = body.subarray(start + 4, end);
  const filename = `${Date.now()}-${original}`;
  const destination = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(destination);
    stream.on("finish", resolve);
    stream.on("error", reject);
    stream.end(fileBuffer);
  });

  return `/uploads/${filename}`;
}

export async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/api/site") {
      const content = await readContent();
      const safeSettings = publicSettings(content);
      send(res, 200, { ...content, settings: safeSettings });
      return;
    }

    if (req.method === "GET" && pathname === "/api/settings") {
      const content = await readContent();
      send(res, 200, publicSettings(content));
      return;
    }

    if (req.method === "GET" && pathname === "/api/media") {
      const content = await readContent();
      const type = normalizeType(url.searchParams.get("type") || "");
      const media = (content.media || []).map(publicMedia).filter((item) => !type || item.type === type);
      send(res, 200, media);
      return;
    }

    if (req.method === "GET" && pathname === "/api/projects") {
      const content = await readContent();
      const projects = (content.projects || []).map(publicProject);
      const featured = url.searchParams.get("featured");
      const homepage = url.searchParams.get("homepage");
      send(res, 200, projects.filter((item) => (
        (featured !== "true" || item.featured) &&
        (homepage !== "true" || item.showOnHomepage)
      )));
      return;
    }

    const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch && req.method === "GET") {
      const content = await readContent();
      const project = (content.projects || []).map(publicProject).find((item) => String(item.id) === projectMatch[1]);
      if (!project) return send(res, 404, { error: "Project not found" });
      send(res, 200, { ...project, media: (content.media || []).map(publicMedia).filter((item) => String(item.projectId) === String(project.id)) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/stats") {
      const content = await readContent();
      send(res, 200, dashboardStats(content));
      return;
    }

    if (req.method === "GET" && pathname === "/api/categories") {
      const content = await readContent();
      send(res, 200, normalizedCategories(content));
      return;
    }

    if (req.method === "GET" && pathname === "/api/companies") {
      const content = await readContent();
      const includeInactive = url.searchParams.get("all") === "true";
      const companies = normalizedCompanies(content);
      send(res, 200, includeInactive ? companies : companies.filter((company) => company.active));
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/status") {
      const content = await readContent();
      send(res, 200, { configured: Boolean(content.settings.adminPassword || process.env.ADMIN_PASSWORD) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/check") {
      const content = await readContent();
      send(res, 200, { isAdmin: isAdmin(req, content) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/login") {
      const { email, password } = await readJson(req);
      const content = await readContent();
      if (!credentialsMatch(content, email, password)) {
        send(res, 401, { error: "Wrong email or password" });
        return;
      }
      const token = crypto.randomBytes(24).toString("hex");
      sessions.add(token);
      setAdminCookie(res, token);
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/setup") {
      const { email, password } = await readJson(req);
      if (!password || password.length < 8) {
        send(res, 400, { error: "Password must be at least 8 characters" });
        return;
      }
      const content = await readContent();
      content.settings.adminEmail = email;
      content.settings.adminPassword = password;
      await writeContent(content);
      const token = crypto.randomBytes(24).toString("hex");
      sessions.add(token);
      setAdminCookie(res, token);
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/logout") {
      const token = getCookie(req, "portfolio_admin");
      if (token) sessions.delete(token);
      clearAdminCookie(res);
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && pathname === "/api/integrations/status") {
      send(res, 200, { databaseConnected: false, storageConfigured: false, storageBucket: "local uploads", mode: "localCms" });
      return;
    }

    if (req.method === "POST" && pathname === "/api/login") {
      const { email, password } = await readJson(req);
      const content = await readContent();
      if (!credentialsMatch(content, email, password)) {
        send(res, 401, { error: "Wrong email or password" });
        return;
      }
      const token = crypto.randomBytes(24).toString("hex");
      sessions.add(token);
      setAdminCookie(res, token);
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === "PUT" && pathname === "/api/settings") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      content.settings = { ...content.settings, ...(await readJson(req)) };
      await writeContent(content);
      send(res, 200, content.settings);
      return;
    }

    if (req.method === "POST" && pathname === "/api/media") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      const body = await readJson(req);
      const item = {
        id: getNextNumberId(content.media),
        featured: false,
        galleryUrls: [],
        createdAt: new Date().toISOString(),
        ...body,
        type: storedType(body.type)
      };
      content.media.unshift(item);
      await writeContent(content);
      send(res, 201, publicMedia(item));
      return;
    }

    const mediaMatch = pathname.match(/^\/api\/media\/([^/]+)$/);
    if (mediaMatch && req.method === "PUT") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      const index = content.media.findIndex((item) => String(item.id) === mediaMatch[1]);
      if (index === -1) return send(res, 404, { error: "Media not found" });
      const body = await readJson(req);
      content.media[index] = { ...content.media[index], ...body, type: body.type ? storedType(body.type) : content.media[index].type };
      await writeContent(content);
      send(res, 200, publicMedia(content.media[index]));
      return;
    }

    if (mediaMatch && req.method === "DELETE") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      content.media = content.media.filter((item) => String(item.id) !== mediaMatch[1]);
      await writeContent(content);
      send(res, 200, success("Media deleted"));
      return;
    }

    if (req.method === "POST" && pathname === "/api/projects") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      content.projects = content.projects || [];
      const project = {
        id: getNextNumberId(content.projects),
        tags: [],
        featured: false,
        showOnHomepage: false,
        createdAt: new Date().toISOString(),
        ...(await readJson(req))
      };
      content.projects.unshift(project);
      await writeContent(content);
      send(res, 201, publicProject(project));
      return;
    }

    if (projectMatch && req.method === "PUT") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      content.projects = content.projects || [];
      const index = content.projects.findIndex((item) => String(item.id) === projectMatch[1]);
      if (index === -1) return send(res, 404, { error: "Project not found" });
      content.projects[index] = { ...content.projects[index], ...(await readJson(req)) };
      await writeContent(content);
      send(res, 200, publicProject(content.projects[index]));
      return;
    }

    if (projectMatch && req.method === "DELETE") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      content.projects = (content.projects || []).filter((item) => String(item.id) !== projectMatch[1]);
      content.media = (content.media || []).map((item) => String(item.projectId) === projectMatch[1] ? { ...item, projectId: null } : item);
      await writeContent(content);
      send(res, 200, success("Project deleted"));
      return;
    }

    if (req.method === "POST" && pathname === "/api/categories") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      const category = { id: getNextNumberId(normalizedCategories(content)), createdAt: new Date().toISOString(), ...(await readJson(req)) };
      content.categories.push(category);
      await writeContent(content);
      send(res, 201, category);
      return;
    }

    if (req.method === "PUT" && pathname === "/api/categories") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      const { categories } = await readJson(req);
      content.categories = Array.isArray(categories) ? categories : content.categories;
      await writeContent(content);
      send(res, 200, content.categories);
      return;
    }

    const categoryMatch = pathname.match(/^\/api\/categories\/([^/]+)$/);
    if (categoryMatch && req.method === "DELETE") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      content.categories = content.categories.filter((item, index) => String(typeof item === "string" ? index + 1 : item.id) !== categoryMatch[1]);
      await writeContent(content);
      send(res, 200, success("Category deleted"));
      return;
    }

    if (req.method === "POST" && pathname === "/api/companies") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      const company = { id: getNextNumberId(content.companies), active: true, sortOrder: content.companies.length, createdAt: new Date().toISOString(), ...(await readJson(req)) };
      content.companies.push(company);
      await writeContent(content);
      send(res, 201, normalizedCompanies({ companies: [company] })[0]);
      return;
    }

    const companyMatch = pathname.match(/^\/api\/companies\/([^/]+)$/);
    if (companyMatch && req.method === "PUT") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      const index = content.companies.findIndex((item) => String(item.id) === companyMatch[1]);
      if (index === -1) return send(res, 404, { error: "Company not found" });
      content.companies[index] = { ...content.companies[index], ...(await readJson(req)) };
      await writeContent(content);
      send(res, 200, normalizedCompanies({ companies: [content.companies[index]] })[0]);
      return;
    }

    if (companyMatch && req.method === "DELETE") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      content.companies = content.companies.filter((item) => String(item.id) !== companyMatch[1]);
      await writeContent(content);
      send(res, 200, success("Company deleted"));
      return;
    }

    if (req.method === "POST" && pathname === "/api/upload") {
      const content = await requireAdmin(req, res);
      if (!content) return;
      const urlPath = await saveUpload(req);
      if (!urlPath) return send(res, 400, { error: "Upload failed" });
      send(res, 201, { url: urlPath });
      return;
    }

    await serveStatic(req, res, pathname);
  } catch (error) {
    console.error(error);
    send(res, 500, { error: "Server error" });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer(router).listen(port, () => {
    console.log(`Portfolio CMS running at http://127.0.0.1:${port}`);
  });
}
