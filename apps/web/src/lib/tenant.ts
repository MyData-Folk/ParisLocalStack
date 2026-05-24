export function extractHotelSlug(hostname = window.location.hostname) {
  const parts = hostname.split(".");
  const adminIndex = parts[0] === "admin" ? 1 : 0;
  const candidate = parts[adminIndex];
  if (!candidate || ["localhost", "127", "www"].includes(candidate)) return null;
  return candidate;
}

export function routeHotelSlug(pathSlug?: string) {
  return pathSlug || extractHotelSlug() || "vendome";
}
