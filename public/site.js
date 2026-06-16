const state = {
  data: null,
  filter: "All",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80";

function qs(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function setText(selector, value) {
  const element = qs(selector);
  if (element) element.textContent = value || "";
}

function mediaImage(item) {
  return item.thumbnailUrl || item.url || fallbackImage;
}

function emptyState(text) {
  return `<div class="empty-state">${escapeHtml(text)}</div>`;
}

function renderWorkCard(item) {
  return `
    <button class="work-card" data-media-id="${escapeHtml(item.id)}" style="background-image: url('${escapeHtml(mediaImage(item))}')">
      <span class="work-card-content">
        <p class="category">${escapeHtml(item.category || item.type || "Portfolio")}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description || "")}</p>
      </span>
    </button>
  `;
}

function renderCompanies(companies) {
  const container = qs("#companies");
  if (!container) return;
  container.innerHTML = companies.length
    ? companies.map((company) => {
        const label = escapeHtml(company.name);
        return company.websiteUrl
          ? `<a class="client-pill" href="${escapeHtml(company.websiteUrl)}" target="_blank" rel="noreferrer">${label}</a>`
          : `<span class="client-pill">${label}</span>`;
      }).join("")
    : `<span class="client-pill">Add clients from CMS</span>`;
}

function renderFilters(categories) {
  const filters = ["All", ...categories];
  qs("#filters").innerHTML = filters.map((filter) => `
    <button class="filter-button ${state.filter === filter ? "active" : ""}" data-filter="${escapeHtml(filter)}" aria-pressed="${state.filter === filter}">
      ${escapeHtml(filter)}
    </button>
  `).join("");
}

function renderMedia() {
  const media = state.data.media || [];
  const filtered = state.filter === "All"
    ? media
    : media.filter((item) => item.category === state.filter);
  const featured = media.filter((item) => item.featured).slice(0, 4);

  qs("#featuredGrid").innerHTML = featured.length
    ? featured.map(renderWorkCard).join("")
    : emptyState("New case studies are being curated. Add featured projects from the CMS.");

  qs("#workGrid").innerHTML = filtered.length
    ? filtered.map(renderWorkCard).join("")
    : emptyState("No published work is available for this category yet.");
}

function renderSite() {
  const { settings, categories, companies } = state.data;
  document.title = `${settings.siteTitle || settings.heroTitle} Portfolio`;
  setText("#heroTitle", settings.heroTitle);
  setText("#heroSubtitle", settings.heroSubtitle);
  setText("#aboutTitle", settings.aboutTitle);
  setText("#aboutBody", settings.aboutBody);
  setText("#location", settings.location);
  qs("#year").textContent = new Date().getFullYear();
  qs("#emailLink").href = `mailto:${settings.email}`;
  qs("#whatsappLink").href = `https://wa.me/${String(settings.phone || "").replace(/\D/g, "")}`;
  renderCompanies(companies || []);
  renderFilters(categories || []);
  renderMedia();
}

async function loadSite() {
  const response = await fetch("/api/site");
  state.data = await response.json();
  renderSite();
}

document.addEventListener("click", (event) => {
  const scrollTarget = event.target.closest("[data-scroll]");
  if (scrollTarget) {
    document.querySelector(scrollTarget.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
    qs("#mobileMenu").hidden = true;
    qs("#menuButton")?.setAttribute("aria-expanded", "false");
  }

  const filter = event.target.closest("[data-filter]");
  if (filter) {
    state.filter = filter.dataset.filter;
    renderFilters(state.data.categories || []);
    renderMedia();
  }

  const card = event.target.closest("[data-media-id]");
  if (card) {
    const item = state.data.media.find((entry) => entry.id === card.dataset.mediaId);
    if (!item) return;
    qs("#dialogImage").src = mediaImage(item);
    qs("#dialogImage").alt = item.title;
    setText("#dialogTitle", item.title);
    setText("#dialogDescription", item.description);
    qs("#mediaDialog").showModal();
  }
});

qs("#menuButton")?.addEventListener("click", () => {
  const menu = qs("#mobileMenu");
  menu.hidden = !menu.hidden;
  qs("#menuButton").setAttribute("aria-expanded", String(!menu.hidden));
});

qs("#closeDialog")?.addEventListener("click", () => qs("#mediaDialog").close());

loadSite().catch(() => {
  qs("#featuredGrid").innerHTML = emptyState("Could not load portfolio content. Please refresh.");
});
