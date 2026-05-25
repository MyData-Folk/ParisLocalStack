import { Router } from "express";
import { guestCreateSchema, guestCrmUpdateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";
import { publicGuestSelect } from "../../utils/publicSelects.js";

export const guestsRouter = Router();
export const publicGuestsRouter = Router({ mergeParams: true });

publicGuestsRouter.post("/", validateBody(guestCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const guest = await prisma.guest.create({
    data: { ...req.body, hotelId: hotel.id },
    select: publicGuestSelect
  });
  return sendCreated(res, guest);
}));

guestsRouter.get("/hotels/:hotelId/guests", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const guests = await prisma.guest.findMany({
    where: { hotelId: req.params.hotelId },
    include: { stays: true },
    orderBy: { createdAt: "desc" }
  });
  return sendOk(res, guests);
}));

guestsRouter.get("/guests/:id", authenticate, asyncHandler(async (req, res) => {
  const guest = await prisma.guest.findUnique({ where: { id: req.params.id }, include: { stays: true } });
  if (!guest) return res.status(404).json({ error: "Guest not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(guest.hotelId)) return res.status(403).json({ error: "Forbidden" });
  return sendOk(res, guest);
}));

guestsRouter.patch("/guests/:id", authenticate, validateBody(guestCrmUpdateSchema), asyncHandler(async (req, res) => {
  const guest = await prisma.guest.findUnique({ where: { id: req.params.id } });
  if (!guest) return res.status(404).json({ error: "Guest not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(guest.hotelId)) return res.status(403).json({ error: "Forbidden" });

  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: {
      internalNotes: req.body.internalNotes,
      crmTags: req.body.crmTags,
      preferences: req.body.preferences,
      relationshipStatus: req.body.relationshipStatus
    },
    include: { stays: true }
  });
  return sendOk(res, updated);
}));
