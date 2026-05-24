import { Router } from "express";
import { stayCreateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";

export const staysRouter = Router();
export const publicStaysRouter = Router({ mergeParams: true });

publicStaysRouter.post("/", validateBody(stayCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });

  const guestId = req.body.guestId ?? (req.body.guest
    ? (await prisma.guest.create({ data: { ...req.body.guest, hotelId: hotel.id } })).id
    : undefined);
  if (!guestId) return res.status(400).json({ error: "guestId or guest is required" });

  const stay = await prisma.stay.create({
    data: {
      hotelId: hotel.id,
      guestId,
      roomNumber: req.body.roomNumber,
      checkinDate: req.body.checkinDate ? new Date(req.body.checkinDate) : undefined,
      checkoutDate: req.body.checkoutDate ? new Date(req.body.checkoutDate) : undefined,
      status: req.body.status
    },
    include: { guest: true }
  });
  return sendCreated(res, stay);
}));

staysRouter.get("/hotels/:hotelId/stays", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const stays = await prisma.stay.findMany({
    where: { hotelId: req.params.hotelId },
    include: { guest: true },
    orderBy: { createdAt: "desc" }
  });
  return sendOk(res, stays);
}));

staysRouter.patch("/stays/:id", authenticate, asyncHandler(async (req, res) => {
  const stay = await prisma.stay.findUnique({ where: { id: req.params.id } });
  if (!stay) return res.status(404).json({ error: "Stay not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(stay.hotelId)) return res.status(403).json({ error: "Forbidden" });
  const updated = await prisma.stay.update({ where: { id: stay.id }, data: req.body });
  return sendOk(res, updated);
}));
