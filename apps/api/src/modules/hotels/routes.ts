import { Router } from "express";
import { hotelCreateSchema, hotelUpdateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";

export const hotelsRouter = Router();
export const publicHotelsRouter = Router();

hotelsRouter.use(authenticate);

hotelsRouter.get("/", asyncHandler(async (req, res) => {
  const where = req.user?.role === "super_admin" ? {} : { id: { in: req.user?.hotelIds ?? [] } };
  const hotels = await prisma.hotel.findMany({ where, include: { settings: true }, orderBy: { createdAt: "desc" } });
  return sendOk(res, hotels);
}));

hotelsRouter.post("/", requireRole("super_admin"), validateBody(hotelCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.create({
    data: {
      ...req.body,
      settings: { create: { modules: { messages: true, requests: true, reviews: true } } }
    },
    include: { settings: true }
  });
  return sendCreated(res, hotel);
}));

hotelsRouter.get("/:id", requireHotelAccess("id"), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id }, include: { settings: true, users: true } });
  if (!hotel) return res.status(404).json({ error: "Hotel not found" });
  return sendOk(res, hotel);
}));

hotelsRouter.patch("/:id", requireHotelAccess("id"), validateBody(hotelUpdateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.update({ where: { id: req.params.id }, data: req.body, include: { settings: true } });
  return sendOk(res, hotel);
}));

hotelsRouter.delete("/:id", requireRole("super_admin"), asyncHandler(async (req, res) => {
  await prisma.hotel.delete({ where: { id: req.params.id } });
  return sendOk(res, { ok: true });
}));

publicHotelsRouter.get("/by-slug/:slug", asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: req.params.slug },
    include: { settings: true }
  });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  return sendOk(res, hotel);
}));
