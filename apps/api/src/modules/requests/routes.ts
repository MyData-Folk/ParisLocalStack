import { Router } from "express";
import { serviceRequestCreateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";

export const requestsRouter = Router();
export const publicRequestsRouter = Router({ mergeParams: true });

publicRequestsRouter.post("/", validateBody(serviceRequestCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const request = await prisma.serviceRequest.create({
    data: { ...req.body, hotelId: hotel.id, status: "new" },
    include: { guest: true, stay: true }
  });
  req.app.get("io")?.to(`hotel:${hotel.id}`).emit("request:new", request);
  return sendCreated(res, request);
}));

requestsRouter.get("/hotels/:hotelId/requests", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const requests = await prisma.serviceRequest.findMany({
    where: { hotelId: req.params.hotelId },
    include: { guest: true, stay: true },
    orderBy: { createdAt: "desc" }
  });
  return sendOk(res, requests);
}));

requestsRouter.patch("/requests/:id/status", authenticate, asyncHandler(async (req, res) => {
  const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return res.status(404).json({ error: "Request not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(request.hotelId)) return res.status(403).json({ error: "Forbidden" });
  const updated = await prisma.serviceRequest.update({ where: { id: request.id }, data: { status: req.body.status } });
  return sendOk(res, updated);
}));
