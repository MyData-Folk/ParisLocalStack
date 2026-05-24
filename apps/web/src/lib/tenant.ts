export function extractHotelSlug(hostname = window.location.hostname) {
  const normalized = hostname.toLowerCase();
  const tenantRoot = "welcomeparis.hotelmanager.fr";

  if (normalized === tenantRoot || normalized === `www.${tenantRoot}`) return null;
  if (normalized.endsWith(`.${tenantRoot}`)) {
    const prefix = normalized.slice(0, -tenantRoot.length - 1);
    const labels = prefix.split(".");
    return labels[0] === "admin" ? labels[1] ?? null : labels[0] ?? null;
  }

  const parts = hostname.split(".");
  const adminIndex = parts[0] === "admin" ? 1 : 0;
  const candidate = parts[adminIndex];
  if (!candidate || ["localhost", "127", "www", "welcomeparis"].includes(candidate)) return null;
  return candidate;
}

export function routeHotelSlug(pathSlug?: string) {
  return pathSlug || extractHotelSlug() || "vendome";
}
