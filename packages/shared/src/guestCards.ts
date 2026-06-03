import { z } from "zod";
import type { CommercialPackage } from "./serviceCatalog.js";

export const guestCardSlots = ["hero", "shortcut"] as const;
export type GuestCardSlot = (typeof guestCardSlots)[number];

export const guestCardKinds = ["info", "service", "guide", "promo", "custom"] as const;
export type GuestCardKind = (typeof guestCardKinds)[number];

export const guestCardActionTypes = ["section", "service_request", "external_url", "none"] as const;
export type GuestCardActionType = (typeof guestCardActionTypes)[number];

export const guestCardSchema = z.object({
  id: z.string().min(1).max(80),
  slot: z.enum(guestCardSlots),
  slotIndex: z.number().int().nonnegative(),
  kind: z.enum(guestCardKinds),
  title: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  imageUrl: z.string().url().optional(),
  icon: z.string().min(1).max(60).optional(),
  actionLabel: z.string().min(1).max(40).optional(),
  actionType: z.enum(guestCardActionTypes),
  actionTarget: z.string().min(1).max(200).optional(),
  enabled: z.boolean(),
  locked: z.boolean().optional()
});

export const guestCardsSchema = z.array(guestCardSchema);

export type GuestCardConfig = z.infer<typeof guestCardSchema>;
export type GuestCards = z.infer<typeof guestCardsSchema>;

export const guestCardPlanLimitsSchema = z.object({
  plan: z.custom<CommercialPackage>(),
  maxHeroCards: z.number().int().nonnegative(),
  maxShortcutCards: z.number().int().nonnegative(),
  allowedKinds: z.array(z.enum(guestCardKinds)),
  allowCustomImages: z.boolean(),
  allowExternalLinks: z.boolean(),
  maxImageMb: z.number().int().nonnegative()
});

export type GuestCardPlanLimits = z.infer<typeof guestCardPlanLimitsSchema>;

export const GUEST_CARD_PLAN_LIMITS: Record<CommercialPackage, GuestCardPlanLimits> = {
  starter: {
    plan: "starter",
    maxHeroCards: 3,
    maxShortcutCards: 4,
    allowedKinds: ["info"],
    allowCustomImages: false,
    allowExternalLinks: false,
    maxImageMb: 0
  },
  boutique: {
    plan: "boutique",
    maxHeroCards: 3,
    maxShortcutCards: 6,
    allowedKinds: ["info", "guide"],
    allowCustomImages: false,
    allowExternalLinks: false,
    maxImageMb: 0
  },
  premium: {
    plan: "premium",
    maxHeroCards: 4,
    maxShortcutCards: 8,
    allowedKinds: ["info", "guide", "service", "promo", "custom"],
    allowCustomImages: true,
    allowExternalLinks: true,
    maxImageMb: 5
  },
  palace: {
    plan: "palace",
    maxHeroCards: 6,
    maxShortcutCards: 10,
    allowedKinds: ["info", "guide", "service", "promo", "custom"],
    allowCustomImages: true,
    allowExternalLinks: true,
    maxImageMb: 10
  }
};

export function getGuestCardPlanLimits(plan: CommercialPackage): GuestCardPlanLimits {
  return GUEST_CARD_PLAN_LIMITS[plan];
}

export const guestCardsUpdateSchema = z
  .object({
    guestCards: guestCardsSchema.optional()
  })
  .strict();
