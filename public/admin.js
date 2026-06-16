let adminPassword = sessionStorage.getItem("portfolioCmsPassword") || "";
let cmsData = null;

const $ = (selector) => document.querySelector(selector);

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setMessage(text) {
  $("#saveMessage").textContent = text;
  window.setTimeout(() => {
    $("#saveMessage").textContent = "";
  }, 2800);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": adminPassword,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(error.message || "Request failed.");
  }
  return response.json();
}

async function loadData() {
  const response = await fetch("/api/site");
  cmsData = await response.json();
  renderAdmin();
}

function fillSettings() {
  const form = $("#settingsForm");
  Object.entries(cmsData.settings || {}).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value || "";
  });
  $("#categoryForm").elements.categories.value = (cmsData.categories || []).join("\n");
}

function renderMediaList() {
  $("#adminMediaList").innerHTML = (cmsData.media || []).map((item) => `
    <article class="admin-item">
      <div>
        <h3>${item.title}</h3>
        <p>${item.category} · ${item.type}${item.featured ? " · Featured" : ""}</p>
      </div>
      <div class="admin-actions">
        <button class="small-button" data-toggle-featured="${item.id}">${item.featured ? "Unfeature" : "Feature"}</button>
        <button class="danger-button" data-delete-media="${item.id}">Delete</button>
      </div>
    </article>
  `).join("") || `<div class="empty-state">No projects yet.</div>`;
}

function renderCompanyList() {
  $("#adminCompanyList").innerHTML = (cmsData.companies || []).map((item) => `
    <article class="admin-item">
      <div>
        <h3>${item.name}</h3>
        <p>${item.websiteUrl || "No website"}</p>
      </div>
      <button class="danger-button" data-delete-company="${item.id}">Delete</button>
    </article>
  `).join("") || `<div class="empty-state">No clients yet.</div>`;
}

function renderAdmin() {
  fillSettings();
  renderMediaList();
  renderCompanyList();
}

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  adminPassword = $("#password").value;
  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ password: adminPassword }),
    });
    sessionStorage.setItem("portfolioCmsPassword", adminPassword);
    $("#loginPanel").hidden = true;
    $("#cmsPanel").hidden = false;
    await loadData();
  } catch (error) {
    $("#loginMessage").textContent = error.message;
  }
});

$("#settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = formToObject(event.currentTarget);
  await api("/api/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  await loadData();
  setMessage("Settings saved.");
});

$("#mediaForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = formToObject(event.currentTarget);
  data.featured = event.currentTarget.elements.featured.checked;
  await api("/api/media", {
    method: "POST",
    body: JSON.stringify(data),
  });
  event.currentTarget.reset();
  await loadData();
  setMessage("Project added.");
});

$("#categoryForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const categories = event.currentTarget.elements.categories.value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  await api("/api/categories", {
    method: "PUT",
    body: JSON.stringify({ categories }),
  });
  await loadData();
  setMessage("Categories saved.");
});

$("#companyForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/companies", {
    method: "POST",
    body: JSON.stringify(formToObject(event.currentTarget)),
  });
  event.currentTarget.reset();
  await loadData();
  setMessage("Client added.");
});

document.addEventListener("click", async (event) => {
  const deleteMedia = event.target.closest("[data-delete-media]");
  if (deleteMedia && confirm("Delete this project?")) {
    await api(`/api/media/${deleteMedia.dataset.deleteMedia}`, { method: "DELETE" });
    await loadData();
    setMessage("Project deleted.");
  }

  const toggleFeatured = event.target.closest("[data-toggle-featured]");
  if (toggleFeatured) {
    const item = cmsData.media.find((entry) => entry.id === toggleFeatured.dataset.toggleFeatured);
    await api(`/api/media/${item.id}`, {
      method: "PUT",
      body: JSON.stringify({ featured: !item.featured }),
    });
    await loadData();
    setMessage("Project updated.");
  }

  const deleteCompany = event.target.closest("[data-delete-company]");
  if (deleteCompany && confirm("Delete this client?")) {
    await api(`/api/companies/${deleteCompany.dataset.deleteCompany}`, { method: "DELETE" });
    await loadData();
    setMessage("Client deleted.");
  }
});

async function tryRestoreSession() {
  if (!adminPassword) return;
  $("#password").value = adminPassword;
  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ password: adminPassword }),
    });
    $("#loginPanel").hidden = true;
    $("#cmsPanel").hidden = false;
    await loadData();
  } catch {
    sessionStorage.removeItem("portfolioCmsPassword");
    adminPassword = "";
  }
}

tryRestoreSession();
