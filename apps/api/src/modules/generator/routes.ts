import { Router } from "express";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { prisma } from "../../database/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendOk } from "../../utils/http.js";

export const generatorRouter = Router();

generatorRouter.get("/:hotelId/config", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({
    where: { id: req.params.hotelId },
    include: { settings: true, recommendations: true }
  });
  if (!hotel) return res.status(404).json({ error: "Hotel not found" });
  return sendOk(res, {
    hotelSlug: hotel.slug,
    guestUrl: `https://${hotel.slug}.welcomeparis.hotelmanager.fr`,
    receptionUrl: `https://admin.${hotel.slug}.welcomeparis.hotelmanager.fr`,
    hotel
  });
}));
