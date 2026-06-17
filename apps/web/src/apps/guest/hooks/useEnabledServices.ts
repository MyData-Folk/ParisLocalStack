import { useMemo } from "react";
import { SERVICE_CATALOG, type HotelServiceRequestType, type ServiceCatalogItem } from "@paris-local/shared";
import type { HotelServiceConfig, HotelServicePlanLimits, PublicSettingsResponse } from "../../../lib/api";

export type GuestServiceBehavior = "request" | "navigate";

export type GuestEnabledService = {
  id: string;
  serviceCode: string;
  title: string;
  description: string;
  imageUrl?: string;
  actionLabel?: string;
  requestType: HotelServiceRequestType;
  requestTitle: string;
  order: number;
  visibleAsCard: boolean;
  visibleInServicesPage: boolean;
  catalogItem?: ServiceCatalogItem;
  source: HotelServiceConfig;
  behavior: GuestServiceBehavior;
  navigateTarget?: string;
};

export type UseEnabledServicesResult = {
  services: GuestEnabledService[];
  hasDynamicServices: boolean;
  limits: HotelServicePlanLimits | null;
  error: string | null;
};

const catalogById = new Map<string, ServiceCatalogItem>(
  SERVICE_CATALOG.map((service) => [service.id, service])
);

const requestTypeByServiceCode: Record<string, HotelServiceRequestType> = {
  taxi: "taxi",
  airport_transfer: "taxi",
  restaurant_booking: "restaurant",
  room_service: "room_service",
  breakfast_info: "room_service",
  towels: "towels",
  housekeeping: "towels",
  maintenance: "maintenance",
  reception_assistance: "reception",
  luggage_storage: "reception",
  late_checkout: "reception",
  local_recommendations: "reception",
  partner_restaurants: "restaurant",
  partner_bars: "restaurant",
  cruises: "reception",
  bus_tours: "reception",
  museums_tickets: "reception",
  local_experiences: "reception",
  review_feedback: "reception",
  crm_collection: "reception",
  post_stay_followup: "reception",
  analytics_dashboard: "reception"
};

const NAVIGATE_SERVICES: Record<string, string> = {
  local_recommendations: "guide"
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickLimits(value: unknown): HotelServicePlanLimits | null {
  if (!isObject(value)) return null;
  if (typeof value.maxActiveServices !== "number" || !Array.isArray(value.allowedCategories)) return null;
  return value as unknown as HotelServicePlanLimits;
}

function pickEnabledServices(value: unknown): HotelServiceConfig[] {
  if (!Array.isArray(value)) return [];
  return value.filter((service): service is HotelServiceConfig => {
    if (!isObject(service)) return false;
    if (service.enabled !== true) return false;
    if (service.visibleInGuestApp !== true) return false;
    if (typeof service.serviceCode !== "string" || typeof service.order !== "number") return false;
    if (typeof service.visibleAsCard !== "boolean" || typeof service.visibleInServicesPage !== "boolean") return false;
    return true;
  });
}

function mapGuestService(service: HotelServiceConfig): GuestEnabledService {
  const catalogItem = catalogById.get(service.serviceCode);
  const title = service.customTitle || catalogItem?.labelFr || service.serviceCode;
  const description = service.customDescription || catalogItem?.descriptionFr || "";
  const requestType = requestTypeByServiceCode[service.serviceCode] ?? "custom_service";
  const navigateTarget = NAVIGATE_SERVICES[service.serviceCode];

  return {
    id: service.serviceCode,
    serviceCode: service.serviceCode,
    title,
    description,
    imageUrl: service.imageUrl,
    actionLabel: service.actionLabel,
    requestType,
    requestTitle: `Demande ${title}`,
    order: service.order,
    visibleAsCard: service.visibleAsCard,
    visibleInServicesPage: service.visibleInServicesPage,
    catalogItem,
    source: service,
    behavior: navigateTarget ? "navigate" : "request",
    navigateTarget
  };
}

export function buildEnabledServices(settings: PublicSettingsResponse | null | undefined): UseEnabledServicesResult {
  if (!isObject(settings)) {
    return { services: [], hasDynamicServices: false, limits: null, error: null };
  }

  const limits = pickLimits(settings.hotelServiceLimits);
  const enabledServices = pickEnabledServices(settings.enabledServices);

  if (enabledServices.length === 0) {
    return { services: [], hasDynamicServices: false, limits, error: null };
  }

  if (!limits) {
    return { services: [], hasDynamicServices: false, limits: null, error: "invalid_service_limits" };
  }

  const services = [...enabledServices]
    .sort((a, b) => a.order - b.order || a.serviceCode.localeCompare(b.serviceCode))
    .slice(0, limits.maxActiveServices)
    .map(mapGuestService);

  return {
    services,
    hasDynamicServices: services.length > 0,
    limits,
    error: null
  };
}

export function useEnabledServices(settings: PublicSettingsResponse | null | undefined): UseEnabledServicesResult {
  return useMemo(() => buildEnabledServices(settings), [settings]);
}
