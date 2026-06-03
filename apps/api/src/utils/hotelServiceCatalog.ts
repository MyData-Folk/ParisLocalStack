import {
  SERVICE_CATALOG,
  type HotelServiceCategory
} from "@paris-local/shared";

const CATEGORY_BY_SERVICE_ID: Record<string, HotelServiceCategory> = {
  wifi_info: "info",
  breakfast_info: "info",
  checkin_checkout: "info",
  taxi: "transport",
  airport_transfer: "transport",
  restaurant_booking: "service",
  room_service: "service",
  towels: "service",
  housekeeping: "service",
  maintenance: "service",
  reception_assistance: "hotel",
  luggage_storage: "hotel",
  late_checkout: "hotel",
  local_recommendations: "info",
  partner_restaurants: "service",
  partner_bars: "service",
  cruises: "service",
  bus_tours: "service",
  museums_tickets: "service",
  local_experiences: "service",
  review_feedback: "hotel",
  crm_collection: "hotel",
  post_stay_followup: "hotel",
  analytics_dashboard: "hotel"
};

const PARTNER_SERVICE_IDS: ReadonlySet<string> = new Set(
  SERVICE_CATALOG.filter((service) => service.isPartnerMonetizable).map((service) => service.id)
);

const KNOWN_SERVICE_IDS: ReadonlySet<string> = new Set(SERVICE_CATALOG.map((service) => service.id));

export function categoryOfServiceCode(code: string): HotelServiceCategory | undefined {
  if (KNOWN_SERVICE_IDS.has(code)) {
    return CATEGORY_BY_SERVICE_ID[code];
  }
  return "custom";
}

export function isPartnerServiceCode(code: string): boolean {
  if (!KNOWN_SERVICE_IDS.has(code)) return false;
  return PARTNER_SERVICE_IDS.has(code);
}

export function isKnownServiceCode(code: string): boolean {
  return KNOWN_SERVICE_IDS.has(code);
}
