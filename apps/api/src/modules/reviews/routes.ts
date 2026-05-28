import { Router } from "express";
import type { Request } from "express";
import { publicMessagesQuerySchema, reviewCreateSchema, reviewStatusUpdateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";
import { publicGuestSelect } from "../../utils/publicSelects.js";
import { validateGuestStayScope } from "../../utils/tenantScope.js";
import { staffRoom, guestRoom } from "../../socket.js";

export const reviewsRouter = Router();
export const publicReviewsRouter = Router({ mergeParams: true });

function reviewModerationStatus(rating: number) {
  return rating <= 3 ? "negative_alert" : "pending_review";
}

function emitReview(req: Request, hotelId: string, event: "review:new" | "review:status", payload: any) {
  const io = req.app.get("io");
  io?.to(staffRoom(hotelId)).emit(event, payload);
  if (payload?.guestId) {
    io?.to(guestRoom(hotelId, payload.guestId)).emit(event, payload);
  }
}

publicReviewsRouter.post("/", validateBody(reviewCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const scoped = await validateGuestStayScope(hotel.id, req.body.guestId, req.body.stayId);
  if (!scoped) return res.status(404).json({ error: "Review context not found" });

  const existing = await prisma.review.findFirst({
    where: { hotelId: hotel.id, guestId: req.body.guestId, stayId: req.body.stayId },
    orderBy: { createdAt: "desc" }
  });
  const data = {
    rating: req.body.rating,
    comment: req.body.comment,
    status: reviewModerationStatus(req.body.rating)
  };
  const review = existing
    ? await prisma.review.update({
      where: { id: existing.id },
      data,
      include: { guest: { select: publicGuestSelect }, stay: true }
    })
    : await prisma.review.create({
      data: { ...req.body, hotelId: hotel.id, ...data },
      include: { guest: { select: publicGuestSelect }, stay: true }
    });
  emitReview(req, hotel.id, existing ? "review:status" : "review:new", review);
  return sendCreated(res, review);
}));

publicReviewsRouter.get("/current", asyncHandler(async (req, res) => {
  const query = publicMessagesQuerySchema.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Validation failed", details: query.error.flatten() });

  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const scoped = await validateGuestStayScope(hotel.id, query.data.guestId, query.data.stayId);
  if (!scoped) return res.status(404).json({ error: "Review context not found" });

  const review = await prisma.review.findFirst({
    where: { hotelId: hotel.id, guestId: query.data.guestId, stayId: query.data.stayId },
    include: { guest: { select: publicGuestSelect }, stay: true }
  });
  return sendOk(res, review);
}));

publicReviewsRouter.get("/published", asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });

  const reviews = await prisma.review.findMany({
    where: { hotelId: hotel.id, status: "approved" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
      guest: { select: { firstName: true, language: true } },
      stay: { select: { roomNumber: true } }
    },
    orderBy: { updatedAt: "desc" },
    take: 12
  });
  return sendOk(res, reviews);
}));

reviewsRouter.get("/hotels/:hotelId/reviews", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { hotelId: req.params.hotelId },
    include: { guest: true, stay: true },
    orderBy: { createdAt: "desc" }
  });
  return sendOk(res, reviews);
}));

reviewsRouter.patch("/reviews/:id/status", authenticate, validateBody(reviewStatusUpdateSchema), asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ error: "Review not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(review.hotelId)) return res.status(403).json({ error: "Forbidden" });
  const updated = await prisma.review.update({
    where: { id: review.id },
    data: { status: req.body.status },
    include: { guest: true, stay: true }
  });
  emitReview(req, review.hotelId, "review:status", updated);
  return sendOk(res, updated);
}));
