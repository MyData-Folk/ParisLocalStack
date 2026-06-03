import { Router } from "express";
import { commercialPackageSchema, guestCardsSchema, guestCardsUpdateSchema, settingsUpdateSchema, type CommercialPackage, type GuestCardConfig } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { enforceGuestCardPlanLimits } from "../../utils/guestCardLimits.js";
import { HttpError } from "../../utils/http.js";
import { sendOk } from "../../utils/http.js";

export const settingsRouter = Router();
export const publicSettingsRouter = Router({ mergeParams: true });

function parseStoredGuestCards(value: unknown): GuestCardConfig[] {
  return guestCardsSchema.parse(Array.isArray(value) ? value : []);
}

function guestCardsResponse(hotel: { id: string; commercialPackage: string; settings: { guestCards: unknown } | null }) {
  const commercialPackage = commercialPackageSchema.parse(hotel.commercialPackage) as CommercialPackage;
  const guestCards = parseStoredGuestCards(hotel.settings?.guestCards);
  const limits = enforceGuestCardPlanLimits(guestCards, commercialPackage).limits;
  return { hotelId: hotel.id, commercialPackage, limits, guestCards };
}

function publicGuestCardsPayload(hotel: { id: string; commercialPackage: string; settings: { guestCards: unknown } | null }) {
  const { limits, commercialPackage } = guestCardsResponse(hotel);
  const allCards = parseStoredGuestCards(hotel.settings?.guestCards);
  const enabledCards = allCards.filter((card) => card.enabled);
  const slotOrder: Record<string, number> = { hero: 0, shortcut: 1 };
  const sorted = [...enabledCards].sort((a, b) => {
    const slotDiff = (slotOrder[a.slot] ?? 99) - (slotOrder[b.slot] ?? 99);
    if (slotDiff !== 0) return slotDiff;
    return a.slotIndex - b.slotIndex;
  });
  const heroCount = sorted.filter((c) => c.slot === "hero").length;
  const shortcutCount = sorted.filter((c) => c.slot === "shortcut").length;
  const truncated = [
    ...sorted.filter((c) => c.slot === "hero").slice(0, limits.maxHeroCards),
    ...sorted.filter((c) => c.slot === "shortcut").slice(0, limits.maxShortcutCards)
  ];
  return {
    hotelId: hotel.id,
    commercialPackage,
    limits,
    guestCards: truncated,
    _meta: {
      totalEnabled: enabledCards.length,
      heroCount,
      shortcutCount
    }
  };
}

publicSettingsRouter.get("/", asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: req.params.hotelSlug },
    select: {
      id: true,
      status: true,
      commercialPackage: true,
      settings: {
        select: {
          id: true,
          hotelId: true,
          wifiName: true,
          // wifiPassword is excluded
          breakfastHours: true,
          checkinTime: true,
          checkoutTime: true,
          roomServiceHours: true,
          receptionPhone: true,
          // whatsappNumber is excluded
          guestTheme: true,
          languages: true,
          modules: true,
          guestCards: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const payload = publicGuestCardsPayload({
    id: hotel.id,
    commercialPackage: hotel.commercialPackage,
    settings: hotel.settings
  });
  return sendOk(res, { ...hotel.settings, ...payload });
}));

settingsRouter.get("/hotels/:hotelId/settings", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const settings = await prisma.hotelSettings.findUnique({ where: { hotelId: req.params.hotelId } });
  return sendOk(res, settings);
}));

settingsRouter.patch("/hotels/:hotelId/settings", authenticate, requireHotelAccess("hotelId"), requireRole("super_admin", "hotel_admin"), validateBody(settingsUpdateSchema), asyncHandler(async (req, res) => {
  const settings = await prisma.hotelSettings.upsert({
    where: { hotelId: req.params.hotelId },
    update: req.body,
    create: { ...req.body, hotelId: req.params.hotelId }
  });
  return sendOk(res, settings);
}));

settingsRouter.get("/hotels/:hotelId/guest-cards", authenticate, requireHotelAccess("hotelId"), requireRole("super_admin", "hotel_admin"), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({
    where: { id: req.params.hotelId },
    select: {
      id: true,
      commercialPackage: true,
      settings: { select: { guestCards: true } }
    }
  });
  if (!hotel) throw new HttpError(404, "Hotel not found");
  return sendOk(res, guestCardsResponse(hotel));
}));

settingsRouter.patch("/hotels/:hotelId/guest-cards", authenticate, requireHotelAccess("hotelId"), requireRole("super_admin", "hotel_admin"), validateBody(guestCardsUpdateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({
    where: { id: req.params.hotelId },
    select: {
      id: true,
      commercialPackage: true,
      settings: { select: { guestCards: true } }
    }
  });
  if (!hotel) throw new HttpError(404, "Hotel not found");

  const commercialPackage = commercialPackageSchema.parse(hotel.commercialPackage) as CommercialPackage;
  const guestCards = req.body.guestCards ?? [];
  const limitResult = enforceGuestCardPlanLimits(guestCards, commercialPackage);
  if (!limitResult.ok) {
    return res.status(400).json({
      error: "Guest cards exceed the current plan limits",
      details: limitResult.errors,
      limits: limitResult.limits
    });
  }

  const settings = await prisma.hotelSettings.upsert({
    where: { hotelId: req.params.hotelId },
    update: { guestCards },
    create: { hotelId: req.params.hotelId, guestCards }
  });
  return sendOk(res, { hotelId: hotel.id, commercialPackage, limits: limitResult.limits, guestCards: parseStoredGuestCards(settings.guestCards) });
}));
