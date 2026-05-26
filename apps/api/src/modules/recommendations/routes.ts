import { Router } from "express";
import { recommendationSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";

export const recommendationsRouter = Router();
export const publicRecommendationsRouter = Router({ mergeParams: true });

publicRecommendationsRouter.get("/", asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const recommendations = await prisma.recommendation.findMany({
    where: { hotelId: hotel.id, isActive: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }]
  });
  return sendOk(res, recommendations);
}));

recommendationsRouter.get("/hotels/:hotelId/recommendations", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const recommendations = await prisma.recommendation.findMany({
    where: { hotelId: req.params.hotelId },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }]
  });
  return sendOk(res, recommendations);
}));

recommendationsRouter.post("/hotels/:hotelId/recommendations", authenticate, requireHotelAccess("hotelId"), validateBody(recommendationSchema), asyncHandler(async (req, res) => {
  const recommendation = await prisma.recommendation.create({ data: { ...req.body, hotelId: req.params.hotelId } });
  return sendCreated(res, recommendation);
}));

recommendationsRouter.patch("/recommendations/:id", authenticate, validateBody(recommendationSchema.partial()), asyncHandler(async (req, res) => {
  const current = await prisma.recommendation.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ error: "Recommendation not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(current.hotelId)) return res.status(403).json({ error: "Forbidden" });
  const updated = await prisma.recommendation.update({ where: { id: current.id }, data: req.body });
  return sendOk(res, updated);
}));

recommendationsRouter.delete("/recommendations/:id", authenticate, asyncHandler(async (req, res) => {
  const current = await prisma.recommendation.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ error: "Recommendation not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(current.hotelId)) return res.status(403).json({ error: "Forbidden" });
  await prisma.recommendation.delete({ where: { id: current.id } });
  return sendOk(res, { ok: true });
}));
