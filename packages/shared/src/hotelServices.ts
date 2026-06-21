import { z } from "zod";
import type { CommercialPackage } from "./serviceCatalog.js";

export const hotelServiceCategories = [
  "info",
  "service",
  "hotel",
  "transport",
  "wellness",
  "custom"
] as const;
export type HotelServiceCategory = (typeof hotelServiceCategories)[number];

export const hotelServiceRequestTypes = [
  "taxi",
  "restaurant",
  "room_service",
  "towels",
  "laundry_pressing",
  "reception",
  "maintenance",
  "wellness",
  "custom_service"
] as const;
export type HotelServiceRequestType = (typeof hotelServiceRequestTypes)[number];

export const hotelServiceFormKinds = [
  "none",
  "generic",
  "taxi",
  "restaurant",
  "linen",
  "laundry_pressing",
  "room_service",
  "wellness"
] as const;
export type HotelServiceFormKind = (typeof hotelServiceFormKinds)[number];

export const hotelServiceConfigSchema = z.object({
  serviceCode: z.string().min(1).max(80),
  enabled: z.boolean(),
  order: z.number().int().nonnegative(),
  customTitle: z.string().min(1).max(80).optional(),
  customDescription: z.string().max(280).optional(),
  imageUrl: z.string().url().optional(),
  visibleInGuestApp: z.boolean(),
  visibleAsCard: z.boolean(),
  visibleInServicesPage: z.boolean(),
  actionLabel: z.string().min(1).max(40).optional()
});

export const enabledServicesSchema = z.array(hotelServiceConfigSchema);

export const hotelServicesUpdateSchema = z
  .object({
    enabledServices: enabledServicesSchema.optional()
  })
  .strict();

export type HotelServiceConfig = z.infer<typeof hotelServiceConfigSchema>;
export type EnabledServices = z.infer<typeof enabledServicesSchema>;
export type HotelServicesUpdateInput = z.infer<typeof hotelServicesUpdateSchema>;

export const hotelServicePlanLimitsSchema = z.object({
  plan: z.custom<CommercialPackage>(),
  maxActiveServices: z.number().int().nonnegative(),
  allowedCategories: z.array(z.enum(hotelServiceCategories)),
  allowWellness: z.boolean(),
  allowCustomImages: z.boolean(),
  allowCustomServices: z.boolean(),
  allowPartnerServices: z.boolean(),
  allowPremiumBranding: z.boolean()
});

export type HotelServicePlanLimits = z.infer<typeof hotelServicePlanLimitsSchema>;

export const HOTEL_SERVICE_PLAN_LIMITS: Record<CommercialPackage, HotelServicePlanLimits> = {
  starter: {
    plan: "starter",
    maxActiveServices: 3,
    allowedCategories: ["info", "service", "hotel"],
    allowWellness: false,
    allowCustomImages: false,
    allowCustomServices: false,
    allowPartnerServices: false,
    allowPremiumBranding: false
  },
  boutique: {
    plan: "boutique",
    maxActiveServices: 6,
    allowedCategories: ["info", "service", "hotel", "transport"],
    allowWellness: false,
    allowCustomImages: false,
    allowCustomServices: false,
    allowPartnerServices: true,
    allowPremiumBranding: false
  },
  premium: {
    plan: "premium",
    maxActiveServices: 12,
    allowedCategories: ["info", "service", "hotel", "transport", "wellness"],
    allowWellness: true,
    allowCustomImages: true,
    allowCustomServices: false,
    allowPartnerServices: true,
    allowPremiumBranding: true
  },
  palace: {
    plan: "palace",
    maxActiveServices: 24,
    allowedCategories: ["info", "service", "hotel", "transport", "wellness", "custom"],
    allowWellness: true,
    allowCustomImages: true,
    allowCustomServices: true,
    allowPartnerServices: true,
    allowPremiumBranding: true
  }
};

export function getHotelServicePlanLimits(plan: CommercialPackage): HotelServicePlanLimits {
  return HOTEL_SERVICE_PLAN_LIMITS[plan];
}

export type HotelServiceLimitError = {
  code:
    | "too_many_active"
    | "category_not_allowed"
    | "wellness_not_allowed"
    | "custom_service_not_allowed"
    | "custom_image_not_allowed"
    | "partner_service_not_allowed"
    | "duplicate_service_code"
    | "invalid_order";
  message: string;
  serviceCode?: string;
};

export type HotelServiceLimitResult = {
  ok: boolean;
  errors: HotelServiceLimitError[];
  limits: HotelServicePlanLimits;
};

export function enforceHotelServicePlanLimits(
  services: HotelServiceConfig[],
  plan: CommercialPackage,
  categoryOf: (code: string) => HotelServiceCategory | undefined,
  isPartner: (code: string) => boolean
): HotelServiceLimitResult {
  const limits = getHotelServicePlanLimits(plan);
  const errors: HotelServiceLimitError[] = [];

  const active = services.filter((s) => s.enabled);
  if (active.length > limits.maxActiveServices) {
    errors.push({
      code: "too_many_active",
      message: `Plan "${plan}" allows at most ${limits.maxActiveServices} active services (got ${active.length}).`
    });
  }

  const seen = new Set<string>();
  for (const service of active) {
    if (seen.has(service.serviceCode)) {
      errors.push({
        code: "duplicate_service_code",
        message: `Duplicate serviceCode "${service.serviceCode}".`,
        serviceCode: service.serviceCode
      });
    }
    seen.add(service.serviceCode);

    const category = categoryOf(service.serviceCode);
    if (category && !limits.allowedCategories.includes(category)) {
      errors.push({
        code: "category_not_allowed",
        message: `Plan "${plan}" does not allow category "${category}".`,
        serviceCode: service.serviceCode
      });
    }
    if (category === "wellness" && !limits.allowWellness) {
      errors.push({
        code: "wellness_not_allowed",
        message: `Plan "${plan}" does not allow wellness services.`,
        serviceCode: service.serviceCode
      });
    }
    if (category === "custom" && !limits.allowCustomServices) {
      errors.push({
        code: "custom_service_not_allowed",
        message: `Plan "${plan}" does not allow custom services.`,
        serviceCode: service.serviceCode
      });
    }
    if (isPartner(service.serviceCode) && !limits.allowPartnerServices) {
      errors.push({
        code: "partner_service_not_allowed",
        message: `Plan "${plan}" does not allow partner services.`,
        serviceCode: service.serviceCode
      });
    }
    if (service.imageUrl && !limits.allowCustomImages) {
      errors.push({
        code: "custom_image_not_allowed",
        message: `Plan "${plan}" does not allow custom images.`,
        serviceCode: service.serviceCode
      });
    }
  }

  return { ok: errors.length === 0, errors, limits };
}
