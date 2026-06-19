let cachedAdminState: boolean | null =
  typeof window !== "undefined" ? window.sessionStorage.getItem("portfolio_admin_ok") === "true" : null;
let pendingAdminCheck: Promise<boolean> | null = null;

export function getCachedAdminState() {
  return cachedAdminState;
}

export function setCachedAdminState(value: boolean) {
  cachedAdminState = value;
  if (typeof window !== "undefined") {
    if (value) window.sessionStorage.setItem("portfolio_admin_ok", "true");
    else window.sessionStorage.removeItem("portfolio_admin_ok");
  }
}

export async function checkAdminSession({ force = false }: { force?: boolean } = {}) {
  if (!force && cachedAdminState === true) return true;
  if (!force && pendingAdminCheck) return pendingAdminCheck;

  pendingAdminCheck = fetch("/api/admin/check", { credentials: "include" })
    .then((response) => response.json())
    .then((data) => {
      const isAdmin = Boolean(data.isAdmin);
      setCachedAdminState(isAdmin);
      return isAdmin;
    })
    .catch(() => {
      setCachedAdminState(false);
      return false;
    })
    .finally(() => {
      pendingAdminCheck = null;
    });

  return pendingAdminCheck;
}

export function clearAdminSessionCache() {
  setCachedAdminState(false);
}
