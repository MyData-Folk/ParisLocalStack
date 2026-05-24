import { Router } from "express";
import { settingsUpdateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendOk } from "../../utils/http.js";

export const settingsRouter = Router();
export const publicSettingsRouter = Router({ mergeParams: true });

publicSettingsRouter.get("/", asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug }, include: { settings: true } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  return sendOk(res, hotel.settings);
}));

settingsRouter.get("/hotels/:hotelId/settings", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const settings = await prisma.hotelSettings.findUnique({ where: { hotelId: req.params.hotelId } });
  return sendOk(res, settings);
}));

settingsRouter.patch("/hotels/:hotelId/settings", authenticate, requireHotelAccess("hotelId"), validateBody(settingsUpdateSchema), asyncHandler(async (req, res) => {
  const settings = await prisma.hotelSettings.upsert({
    where: { hotelId: req.params.hotelId },
    update: req.body,
    create: { ...req.body, hotelId: req.params.hotelId }
  });
  return sendOk(res, settings);
}));
