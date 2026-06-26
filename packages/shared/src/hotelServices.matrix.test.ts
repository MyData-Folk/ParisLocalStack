import assert from "node:assert/strict";

import {
  HOTEL_SERVICE_PLAN_LIMITS,
  SERVICE_CATALOG,
  getHotelServiceLimitCategory,
  hotelServiceCategories,
  type CommercialPackage,
  type ServiceCatalogItem
} from "./index.js";

const packageRank: Record<CommercialPackage, number> = {
  starter: 0,
  boutique: 1,
  premium: 2,
  palace: 3
};

function findService(serviceCode: string): ServiceCatalogItem {
  const service = SERVICE_CATALOG.find((item) => item.id === serviceCode);
  assert.ok(service, `Expected service "${serviceCode}" to exist in SERVICE_CATALOG.`);
  return service;
}

function isMinPackageSatisfied(plan: CommercialPackage, minPackage: CommercialPackage): boolean {
  return packageRank[plan] >= packageRank[minPackage];
}

function packageAllowsService(plan: CommercialPackage, serviceCode: string): boolean {
  const service = findService(serviceCode);
  const limits = HOTEL_SERVICE_PLAN_LIMITS[plan];
  const category = getHotelServiceLimitCategory(service.id);

  return isMinPackageSatisfied(plan, service.minPackage)
    && (!service.isPartnerMonetizable || limits.allowPartnerServices)
    && limits.allowedCategories.includes(category);
}

const validCategories = new Set<string>(hotelServiceCategories);

for (const service of SERVICE_CATALOG) {
  const category = getHotelServiceLimitCategory(service.id);
  assert.ok(validCategories.has(category), `Service "${service.id}" maps to invalid category "${category}".`);
  assert.notEqual(category, "custom", `Known service "${service.id}" unexpectedly falls back to custom.`);
}

const starterLimits = HOTEL_SERVICE_PLAN_LIMITS.starter;
assert.equal(starterLimits.maxActiveServices, 3, "Starter should keep a 3 active services limit.");
assert.ok(starterLimits.allowedCategories.includes("transport"), "Starter should allow transport services.");
assert.equal(getHotelServiceLimitCategory("taxi"), "transport", "Taxi should map to transport.");
assert.equal(packageAllowsService("starter", "taxi"), true, "Taxi should be available in Starter.");

assert.equal(getHotelServiceLimitCategory("airport_transfer"), "transport", "Airport transfer should map to transport.");
assert.equal(findService("airport_transfer").minPackage, "boutique", "Airport transfer should remain a Boutique service.");
assert.equal(packageAllowsService("starter", "airport_transfer"), false, "Airport transfer should not be available in Starter.");
assert.ok(HOTEL_SERVICE_PLAN_LIMITS.boutique.allowedCategories.includes("transport"), "Boutique should allow transport services.");
assert.equal(packageAllowsService("boutique", "airport_transfer"), true, "Airport transfer should be available in Boutique.");

assert.ok(HOTEL_SERVICE_PLAN_LIMITS.palace.allowedCategories.includes("custom"), "Palace should allow custom services.");
assert.equal(HOTEL_SERVICE_PLAN_LIMITS.starter.allowedCategories.includes("custom"), false, "Starter should not allow custom services.");
assert.equal(HOTEL_SERVICE_PLAN_LIMITS.boutique.allowedCategories.includes("custom"), false, "Boutique should not allow custom services.");
assert.equal(HOTEL_SERVICE_PLAN_LIMITS.premium.allowedCategories.includes("custom"), false, "Premium should not allow custom services.");

for (const serviceCode of [
  "taxi",
  "airport_transfer",
  "room_service",
  "towels",
  "maintenance",
  "reception_assistance",
  "local_experiences",
  "analytics_dashboard"
]) {
  const service = findService(serviceCode);
  const category = getHotelServiceLimitCategory(service.id);
  assert.ok(validCategories.has(category), `Critical service "${serviceCode}" maps to invalid category "${category}".`);
}

assert.ok(HOTEL_SERVICE_PLAN_LIMITS.premium.allowedCategories.includes("wellness"), "Premium should allow wellness.");
assert.ok(HOTEL_SERVICE_PLAN_LIMITS.palace.allowedCategories.includes("wellness"), "Palace should allow wellness.");
assert.ok(
  HOTEL_SERVICE_PLAN_LIMITS.palace.maxActiveServices > HOTEL_SERVICE_PLAN_LIMITS.premium.maxActiveServices,
  "Palace should allow more active services than Premium."
);
assert.ok(HOTEL_SERVICE_PLAN_LIMITS.palace.allowCustomServices, "Palace should allow custom services.");
assert.equal(HOTEL_SERVICE_PLAN_LIMITS.premium.allowCustomServices, false, "Premium should not allow custom services.");

console.log("Package service matrix checks passed.");
