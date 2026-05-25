import { Router } from "express";
import { stayCreateSchema, stayUpdateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";
import { publicGuestSelect } from "../../utils/publicSelects.js";

export const staysRouter = Router();
export const publicStaysRouter = Router({ mergeParams: true });

const activeStayStatuses = ["active", "checked_in"];
const archivedStayStatuses = ["checked_out", "archived", "completed", "closed"];

function todayBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
  return { start, end };
}

function stayScopeWhere(scope?: unknown) {
  const { start, end } = todayBounds();
  if (scope === "active") {
    return {
      status: { in: activeStayStatuses },
      AND: [
        { OR: [{ checkinDate: null }, { checkinDate: { lte: end } }] },
        { OR: [{ checkoutDate: null }, { checkoutDate: { gte: start } }] }
      ]
    };
  }
  if (scope === "archived") {
    return {
      OR: [
        { status: { in: archivedStayStatuses } },
        { checkoutDate: { lt: start } }
      ]
    };
  }
  return {};
}

publicStaysRouter.post("/", validateBody(stayCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });

  const guestId = req.body.guestId ?? (req.body.guest
    ? (await prisma.guest.create({ data: { ...req.body.guest, hotelId: hotel.id } })).id
    : undefined);
  if (!guestId) return res.status(400).json({ error: "guestId or guest is required" });
  const guest = await prisma.guest.findFirst({ where: { id: guestId, hotelId: hotel.id }, select: { id: true } });
  if (!guest) return res.status(404).json({ error: "Guest not found" });

  const stay = await prisma.stay.create({
    data: {
      hotelId: hotel.id,
      guestId,
      roomNumber: req.body.roomNumber,
      checkinDate: req.body.checkinDate ? new Date(req.body.checkinDate) : undefined,
      checkoutDate: req.body.checkoutDate ? new Date(req.body.checkoutDate) : undefined,
      status: req.body.status
    },
    include: { guest: { select: publicGuestSelect } }
  });
  return sendCreated(res, stay);
}));

staysRouter.get("/hotels/:hotelId/stays", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const stays = await prisma.stay.findMany({
    where: { hotelId: req.params.hotelId, ...stayScopeWhere(req.query.status) },
    include: {
      guest: true,
      messages: { orderBy: { createdAt: "desc" }, take: 20 },
      requests: { orderBy: { createdAt: "desc" }, take: 20 },
      reviews: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { messages: true, requests: true, reviews: true } }
    },
    orderBy: [{ checkoutDate: "asc" }, { createdAt: "desc" }]
  });
  return sendOk(res, stays);
}));

staysRouter.patch("/stays/:id", authenticate, validateBody(stayUpdateSchema), asyncHandler(async (req, res) => {
  const stay = await prisma.stay.findUnique({ where: { id: req.params.id } });
  if (!stay) return res.status(404).json({ error: "Stay not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(stay.hotelId)) return res.status(403).json({ error: "Forbidden" });
  const updated = await prisma.stay.update({
    where: { id: stay.id },
    data: {
      roomNumber: req.body.roomNumber,
      checkinDate: req.body.checkinDate === null ? null : req.body.checkinDate ? new Date(req.body.checkinDate) : undefined,
      checkoutDate: req.body.checkoutDate === null ? null : req.body.checkoutDate ? new Date(req.body.checkoutDate) : undefined,
      status: req.body.status
    },
    include: { guest: true, messages: true, requests: true, reviews: true }
  });
  return sendOk(res, updated);
}));
