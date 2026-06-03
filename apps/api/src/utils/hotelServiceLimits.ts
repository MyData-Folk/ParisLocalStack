import {
  enforceHotelServicePlanLimits,
  type CommercialPackage,
  type HotelServiceConfig,
  type HotelServiceLimitError,
  type HotelServiceLimitResult
} from "@paris-local/shared";

import { categoryOfServiceCode, isPartnerServiceCode } from "./hotelServiceCatalog.js";

export function enforceHotelServiceApiLimits(
  services: HotelServiceConfig[],
  plan: CommercialPackage
): HotelServiceLimitResult {
  return enforceHotelServicePlanLimits(
    services,
    plan,
    categoryOfServiceCode,
    isPartnerServiceCode
  );
}

export type { HotelServiceLimitError, HotelServiceLimitResult };
