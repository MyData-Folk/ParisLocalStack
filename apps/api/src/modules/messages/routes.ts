import { Router } from "express";
import type { Request } from "express";
import type { Server } from "socket.io";
import { messageCreateSchema, replyCreateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";

export const messagesRouter = Router();
export const publicMessagesRouter = Router({ mergeParams: true });

function emitMessage(req: Request, hotelId: string, payload: unknown) {
  const io = req.app.get("io") as Server | undefined;
  io?.to(`hotel:${hotelId}`).emit("message:new", payload);
}

publicMessagesRouter.post("/", validateBody(messageCreateSchema), asyncHandler(async (req, res) => {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.params.hotelSlug } });
  if (!hotel || hotel.status !== "active") return res.status(404).json({ error: "Hotel not found" });
  const message = await prisma.message.create({
    data: { ...req.body, hotelId: hotel.id, senderType: "guest", status: "sent" },
    include: { guest: true, stay: true }
  });
  emitMessage(req, hotel.id, message);
  return sendCreated(res, message);
}));

messagesRouter.get("/hotels/:hotelId/messages", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { hotelId: req.params.hotelId },
    include: { guest: true, stay: true },
    orderBy: { createdAt: "desc" }
  });
  return sendOk(res, messages);
}));

messagesRouter.post("/messages/:id/reply", authenticate, validateBody(replyCreateSchema), asyncHandler(async (req, res) => {
  const source = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!source) return res.status(404).json({ error: "Message not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(source.hotelId)) return res.status(403).json({ error: "Forbidden" });
  const reply = await prisma.message.create({
    data: {
      hotelId: source.hotelId,
      guestId: source.guestId,
      stayId: source.stayId,
      senderType: "reception",
      senderId: req.user?.id,
      content: req.body.content,
      status: "sent",
      priority: source.priority
    },
    include: { guest: true, stay: true }
  });
  emitMessage(req, source.hotelId, reply);
  return sendCreated(res, reply);
}));

messagesRouter.patch("/messages/:id/status", authenticate, asyncHandler(async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!message) return res.status(404).json({ error: "Message not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(message.hotelId)) return res.status(403).json({ error: "Forbidden" });
  const updated = await prisma.message.update({ where: { id: message.id }, data: { status: req.body.status } });
  return sendOk(res, updated);
}));
