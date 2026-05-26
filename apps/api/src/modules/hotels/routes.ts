import { Router } from "express";
import bcrypt from "bcryptjs";
import { hotelCreateSchema, hotelUpdateSchema, receptionUserCreateSchema } from "@paris-local/shared";
import { UserRole } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";

export const hotelsRouter = Router();
export const publicHotelsRouter = Router();

const defaultReceptionPassword = "ChangeMe123!";

function defaultReceptionEmail(slug: string) {
  return `reception+${slug}@welcomeparis.hotelmanager.fr`;
}

async function ensureReceptionUser(hotel: { id: string; name: string; slug: string }, input?: { email?: string; password?: string; name?: string }) {
  const email = (input?.email || defaultReceptionEmail(hotel.slug)).trim().toLowerCase();
  const password = input?.password || defaultReceptionPassword;
  const name = input?.name || `Reception ${hotel.name}`;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: UserRole.receptionist, passwordHash },
    create: { email, name, role: UserRole.receptionist, passwordHash }
  });

  await prisma.hotelUser.upsert({
    where: { hotelId_userId: { hotelId: hotel.id, userId: user.id } },
    update: { role: UserRole.receptionist },
    create: { hotelId: hotel.id, userId: user.id, role: UserRole.receptionist }
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role, temporaryPassword: password };
}

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
      settings: { create: { guestTheme: "parisian_boutique", modules: { messages: true, requests: true, reviews: true } } }
    },
    include: { settings: true }
  });
  const receptionUser = await ensureReceptionUser(hotel);
  return sendCreated(res, { ...hotel, receptionUser });
}));

hotelsRouter.get("/:id", requireHotelAccess("id"), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id }, include: { settings: true, users: { include: { user: true } } } });
  if (!hotel) return res.status(404).json({ error: "Hotel not found" });
  return sendOk(res, hotel);
}));

hotelsRouter.post("/:id/reception-user", requireRole("super_admin"), requireHotelAccess("id"), validateBody(receptionUserCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } });
  if (!hotel) return res.status(404).json({ error: "Hotel not found" });
  const receptionUser = await ensureReceptionUser(hotel, req.body);
  return sendOk(res, receptionUser);
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
