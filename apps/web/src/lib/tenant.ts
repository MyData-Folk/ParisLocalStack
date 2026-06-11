const tenantRoot = "welcomeparis.hotelmanager.fr";
export const neutralDemoHotelSlug = "demo-paris-local";

export type TenantResolution =
  | { kind: "platform"; hostname: string; isLocal: false }
  | { kind: "guest"; hostname: string; hotelSlug: string; isLocal: false }
  | { kind: "reception"; hostname: string; hotelSlug: string; isLocal: false }
  | { kind: "hotelAdmin"; hostname: string; hotelSlug: string; isLocal: false }
  | { kind: "local"; hostname: string; isLocal: true };

export function resolveTenantFromHostname(hostname = window.location.hostname): TenantResolution {
  const normalized = hostname.toLowerCase();

  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized.endsWith(".localhost")) {
    return { kind: "local", hostname: normalized, isLocal: true };
  }

  if (normalized === tenantRoot || normalized === `www.${tenantRoot}`) {
    return { kind: "platform", hostname: normalized, isLocal: false };
  }

  if (normalized.endsWith(`.${tenantRoot}`)) {
    const prefix = normalized.slice(0, -tenantRoot.length - 1);
    const labels = prefix.split(".");
    if (labels[0]?.startsWith("hotel-admin-") && labels[0].length > "hotel-admin-".length) {
      return { kind: "hotelAdmin", hostname: normalized, hotelSlug: labels[0].slice("hotel-admin-".length), isLocal: false };
    }
    if (labels[0]?.startsWith("admin-") && labels[0].length > "admin-".length) {
      return { kind: "reception", hostname: normalized, hotelSlug: labels[0].slice("admin-".length), isLocal: false };
    }
    if (labels[0] === "admin" && labels[1]) {
      return { kind: "reception", hostname: normalized, hotelSlug: labels[1], isLocal: false };
    }
    if (labels[0]) return { kind: "guest", hostname: normalized, hotelSlug: labels[0], isLocal: false };
  }

  const parts = hostname.split(".");
  const adminIndex = parts[0] === "admin" ? 1 : 0;
  const candidate = parts[adminIndex];
  if (!candidate || ["localhost", "127", "www", "welcomeparis"].includes(candidate)) {
    return { kind: "platform", hostname: normalized, isLocal: false };
  }
  return parts[0] === "admin"
    ? { kind: "reception", hostname: normalized, hotelSlug: candidate, isLocal: false }
    : { kind: "guest", hostname: normalized, hotelSlug: candidate, isLocal: false };
}

export function extractHotelSlug(hostname = window.location.hostname) {
  const tenant = resolveTenantFromHostname(hostname);
  return tenant.kind === "guest" || tenant.kind === "reception" || tenant.kind === "hotelAdmin" ? tenant.hotelSlug : null;
}

export function routeHotelSlug(pathSlug?: string) {
  return pathSlug || extractHotelSlug() || neutralDemoHotelSlug;
}

export function canonicalGuestUrl(pathname = window.location.pathname, hostname = window.location.hostname) {
  const tenant = resolveTenantFromHostname(hostname);
  if (tenant.kind !== "platform") return null;

  const match = pathname.match(/^\/h\/([^/]+)(?:\/(.*))?$/);
  if (!match) return null;

  const [, hotelSlug, section = ""] = match;
  const canonicalPath = section ? `/${section}` : "/";
  return `https://${hotelSlug}.${tenantRoot}${canonicalPath}${window.location.search}${window.location.hash}`;
}
