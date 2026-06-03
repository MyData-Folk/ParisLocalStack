import { Router } from "express";
import bcrypt from "bcryptjs";
import { adminUserUpdateSchema, commercialPackageSchema, hotelCreateSchema, hotelPlanUpdateSchema, hotelUpdateSchema, receptionUserCreateSchema, getGuestCardPlanLimits } from "@paris-local/shared";
import { UserRole } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpError, sendCreated, sendOk } from "../../utils/http.js";

export const hotelsRouter = Router();
export const publicHotelsRouter = Router();

type HotelPlanRow = {
  id: string;
  name: string;
  slug: string;
  commercialPackage: string;
};

const defaultReceptionPassword = "ChangeMe123!";
const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

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
    update: { name, role: UserRole.receptionist, status: "active", passwordHash },
    create: { email, name, role: UserRole.receptionist, status: "active", passwordHash }
  });

  await prisma.hotelUser.upsert({
    where: { hotelId_userId: { hotelId: hotel.id, userId: user.id } },
    update: { role: UserRole.receptionist },
    create: { hotelId: hotel.id, userId: user.id, role: UserRole.receptionist }
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status, temporaryPassword: password };
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
  const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id }, include: { settings: true, users: { include: { user: { select: publicUserSelect } } } } });
  if (!hotel) return res.status(404).json({ error: "Hotel not found" });
  return sendOk(res, hotel);
}));

hotelsRouter.get("/:id/users", requireRole("super_admin"), requireHotelAccess("id"), asyncHandler(async (req, res) => {
  const users = await prisma.hotelUser.findMany({
    where: { hotelId: req.params.id, role: { in: [UserRole.hotel_admin, UserRole.receptionist] } },
    include: { hotel: { select: { id: true, name: true, slug: true } }, user: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" }
  });
  return sendOk(res, users);
}));

hotelsRouter.post("/:id/reception-user", requireRole("super_admin"), requireHotelAccess("id"), validateBody(receptionUserCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } });
  if (!hotel) return res.status(404).json({ error: "Hotel not found" });
  const receptionUser = await ensureReceptionUser(hotel, req.body);
  return sendOk(res, receptionUser);
}));

hotelsRouter.patch("/:hotelId/users/:userId", requireRole("super_admin"), requireHotelAccess("hotelId"), validateBody(adminUserUpdateSchema), asyncHandler(async (req, res) => {
  const membership = await prisma.hotelUser.findUnique({
    where: { hotelId_userId: { hotelId: req.params.hotelId, userId: req.params.userId } },
    include: { user: { select: { role: true } } }
  });
  if (!membership) return res.status(404).json({ error: "User not found for this hotel" });
  if ((membership.role !== UserRole.hotel_admin && membership.role !== UserRole.receptionist) || membership.user.role === UserRole.super_admin) {
    return res.status(403).json({ error: "Only hotel users can be managed here" });
  }

  const data: Record<string, unknown> = {};
  if (req.body.email) data.email = req.body.email.trim().toLowerCase();
  if (req.body.name) data.name = req.body.name;
  if (req.body.role) data.role = req.body.role;
  if (req.body.status) data.status = req.body.status;
  if (req.body.password) data.passwordHash = await bcrypt.hash(req.body.password, 12);

  const user = await prisma.user.update({
    where: { id: req.params.userId },
    data,
    select: publicUserSelect
  });

  if (req.body.role) {
    await prisma.hotelUser.update({
      where: { hotelId_userId: { hotelId: req.params.hotelId, userId: req.params.userId } },
      data: { role: req.body.role }
    });
  }

  return sendOk(res, user);
}));

hotelsRouter.patch("/:id", requireHotelAccess("id"), validateBody(hotelUpdateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.update({ where: { id: req.params.id }, data: req.body, include: { settings: true } });
  return sendOk(res, hotel);
}));

hotelsRouter.delete("/:id", requireRole("super_admin"), asyncHandler(async (req, res) => {
  await prisma.hotel.delete({ where: { id: req.params.id } });
  return sendOk(res, { ok: true });
}));

hotelsRouter.get("/:id/plan", requireRole("super_admin", "hotel_admin"), requireHotelAccess("id"), asyncHandler(async (req, res) => {
  const hotel = (await prisma.hotel.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, slug: true, commercialPackage: true }
  })) as HotelPlanRow | null;
  if (!hotel) throw new HttpError(404, "Hotel not found");
  const plan = commercialPackageSchema.parse(hotel.commercialPackage);
  const limits = getGuestCardPlanLimits(plan);
  return sendOk(res, { hotelId: hotel.id, name: hotel.name, slug: hotel.slug, commercialPackage: plan, limits });
}));

hotelsRouter.patch("/:id/plan", requireRole("super_admin"), validateBody(hotelPlanUpdateSchema), asyncHandler(async (req, res) => {
  const updated = (await prisma.hotel.update({
    where: { id: req.params.id },
    data: { commercialPackage: req.body.commercialPackage },
    select: { id: true, name: true, slug: true, commercialPackage: true }
  })) as HotelPlanRow;
  const plan = commercialPackageSchema.parse(updated.commercialPackage);
  const limits = getGuestCardPlanLimits(plan);
  return sendOk(res, { hotelId: updated.id, name: updated.name, slug: updated.slug, commercialPackage: plan, limits });
}));

publicHotelsRouter.get("/by-slug/:slug", asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: req.params.slug },
    include: { settings: true }
  });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  return sendOk(res, hotel);
}));
