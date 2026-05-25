import { Router } from "express";
import { reviewCreateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";
import { validateGuestStayScope } from "../../utils/tenantScope.js";

export const reviewsRouter = Router();
export const publicReviewsRouter = Router({ mergeParams: true });

publicReviewsRouter.post("/", validateBody(reviewCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const scoped = await validateGuestStayScope(hotel.id, req.body.guestId, req.body.stayId);
  if (!scoped) return res.status(404).json({ error: "Review context not found" });
  const review = await prisma.review.create({
    data: { ...req.body, hotelId: hotel.id, status: req.body.rating <= 3 ? "negative_alert" : "new" },
    include: { guest: true, stay: true }
  });
  req.app.get("io")?.to(`hotel:${hotel.id}`).emit("review:new", review);
  return sendCreated(res, review);
}));

reviewsRouter.get("/hotels/:hotelId/reviews", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { hotelId: req.params.hotelId },
    include: { guest: true, stay: true },
    orderBy: { createdAt: "desc" }
  });
  return sendOk(res, reviews);
}));

reviewsRouter.patch("/reviews/:id/status", authenticate, asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ error: "Review not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(review.hotelId)) return res.status(403).json({ error: "Forbidden" });
  const updated = await prisma.review.update({
    where: { id: review.id },
    data: { status: req.body.status },
    include: { guest: true, stay: true }
  });
  req.app.get("io")?.to(`hotel:${review.hotelId}`).emit("review:status", updated);
  return sendOk(res, updated);
}));
