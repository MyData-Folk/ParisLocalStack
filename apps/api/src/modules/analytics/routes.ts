import { Router } from "express";
import { analyticsEventSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";

export const analyticsRouter = Router();
export const publicAnalyticsRouter = Router({ mergeParams: true });

publicAnalyticsRouter.post("/", validateBody(analyticsEventSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const event = await prisma.analyticsEvent.create({ data: { ...req.body, hotelId: hotel.id } });
  return sendCreated(res, event);
}));

analyticsRouter.get("/hotels/:hotelId/analytics", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const [events, guests, messages, requests, reviews] = await Promise.all([
    prisma.analyticsEvent.count({ where: { hotelId: req.params.hotelId } }),
    prisma.guest.count({ where: { hotelId: req.params.hotelId } }),
    prisma.message.count({ where: { hotelId: req.params.hotelId } }),
    prisma.serviceRequest.count({ where: { hotelId: req.params.hotelId } }),
    prisma.review.findMany({ where: { hotelId: req.params.hotelId }, select: { rating: true } })
  ]);
  const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  return sendOk(res, { events, guests, messages, requests, reviews: reviews.length, avgRating });
}));
