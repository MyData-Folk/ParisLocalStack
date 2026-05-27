import { Router } from "express";
import { publicMessagesQuerySchema, serviceRequestCreateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";
import { publicGuestSelect } from "../../utils/publicSelects.js";
import { validateGuestStayScope } from "../../utils/tenantScope.js";

export const requestsRouter = Router();
export const publicRequestsRouter = Router({ mergeParams: true });

publicRequestsRouter.post("/", validateBody(serviceRequestCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const scoped = await validateGuestStayScope(hotel.id, req.body.guestId, req.body.stayId);
  if (!scoped) return res.status(404).json({ error: "Request context not found" });
  const request = await prisma.serviceRequest.create({
    data: { ...req.body, hotelId: hotel.id, status: "new" },
    include: { guest: { select: publicGuestSelect }, stay: true }
  });
  req.app.get("io")?.to(`hotel:staff:${hotel.id}`).emit("request:new", request);
  return sendCreated(res, request);
}));

publicRequestsRouter.get("/", asyncHandler(async (req, res) => {
  const query = publicMessagesQuerySchema.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Validation failed", details: query.error.flatten() });

  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });

  const stay = await prisma.stay.findFirst({
    where: { id: query.data.stayId, guestId: query.data.guestId, hotelId: hotel.id }
  });
  if (!stay) return res.status(404).json({ error: "Requests not found" });

  const requests = await prisma.serviceRequest.findMany({
    where: { hotelId: hotel.id, guestId: query.data.guestId, stayId: query.data.stayId },
    include: { guest: { select: publicGuestSelect }, stay: true },
    orderBy: { createdAt: "desc" }
  });
  return sendOk(res, requests);
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
  const updated = await prisma.serviceRequest.update({
    where: { id: request.id },
    data: { status: req.body.status },
    include: { guest: true, stay: true }
  });
  const io = req.app.get("io");
  io?.to(`hotel:staff:${request.hotelId}`).emit("request:status", updated);
  io?.to(`hotel:guest:${request.hotelId}`).emit("request:status", updated);
  return sendOk(res, updated);
}));
