import { z } from "zod";

export const commercialPackages = ["starter", "boutique", "premium", "palace"] as const;
export type CommercialPackageValue = (typeof commercialPackages)[number];

export const commercialPackageSchema = z.enum(commercialPackages);

export const hotelPlanUpdateSchema = z
  .object({
    commercialPackage: commercialPackageSchema
  })
  .strict();

export type HotelPlanUpdateInput = z.infer<typeof hotelPlanUpdateSchema>;
