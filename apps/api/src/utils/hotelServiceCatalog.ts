import {
  getHotelServiceLimitCategory,
  SERVICE_CATALOG,
  type HotelServiceCategory
} from "@paris-local/shared";

const PARTNER_SERVICE_IDS: ReadonlySet<string> = new Set(
  SERVICE_CATALOG.filter((service) => service.isPartnerMonetizable).map((service) => service.id)
);

const KNOWN_SERVICE_IDS: ReadonlySet<string> = new Set(SERVICE_CATALOG.map((service) => service.id));

export function categoryOfServiceCode(code: string): HotelServiceCategory | undefined {
  return getHotelServiceLimitCategory(code);
}

export function isPartnerServiceCode(code: string): boolean {
  if (!KNOWN_SERVICE_IDS.has(code)) return false;
  return PARTNER_SERVICE_IDS.has(code);
}

export function isKnownServiceCode(code: string): boolean {
  return KNOWN_SERVICE_IDS.has(code);
}
