import { Router } from "express";
import { settingsUpdateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendOk } from "../../utils/http.js";

export const settingsRouter = Router();
export const publicSettingsRouter = Router({ mergeParams: true });

publicSettingsRouter.get("/", asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: req.params.hotelSlug },
    select: {
      status: true,
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
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  return sendOk(res, hotel.settings);
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
