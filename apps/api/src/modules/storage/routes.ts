import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { remoteFileCreateSchema } from "@paris-local/shared";
import { config } from "../../config.js";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, config.uploadDir),
  filename: (_req, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-")}`)
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

export const storageRouter = Router();

storageRouter.get("/hotels/:hotelId/files", authenticate, requireHotelAccess("hotelId"), asyncHandler(async (req, res) => {
  const files = await prisma.file.findMany({
    where: { hotelId: req.params.hotelId },
    orderBy: { createdAt: "desc" }
  });
  return sendOk(res, files);
}));

storageRouter.post("/hotels/:hotelId/files/url", authenticate, requireHotelAccess("hotelId"), validateBody(remoteFileCreateSchema), asyncHandler(async (req, res) => {
  const originalName = req.body.originalName?.trim() || new URL(req.body.url).pathname.split("/").filter(Boolean).pop() || "image distante";
  const file = await prisma.file.create({
    data: {
      hotelId: req.params.hotelId,
      filename: originalName.replace(/[^a-zA-Z0-9._-]/g, "-"),
      originalName,
      mimeType: req.body.mimeType || "image/remote",
      size: req.body.size ?? 0,
      url: req.body.url,
      storageProvider: "remote_url"
    }
  });
  return sendCreated(res, file);
}));

storageRouter.post("/hotels/:hotelId/upload", authenticate, requireHotelAccess("hotelId"), upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing file" });
  const file = await prisma.file.create({
    data: {
      hotelId: req.params.hotelId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      storageProvider: config.uploadProvider
    }
  });
  return sendCreated(res, file);
}));

storageRouter.post("/upload", authenticate, upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing file" });
  const hotelId = String(req.body.hotelId ?? "");
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(hotelId)) return res.status(403).json({ error: "Forbidden" });
  const file = await prisma.file.create({
    data: {
      hotelId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      storageProvider: config.uploadProvider
    }
  });
  return sendCreated(res, file);
}));

storageRouter.delete("/:fileId", authenticate, asyncHandler(async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.fileId } });
  if (!file) return res.status(404).json({ error: "File not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(file.hotelId)) return res.status(403).json({ error: "Forbidden" });
  await prisma.file.delete({ where: { id: file.id } });
  const fullPath = path.join(config.uploadDir, file.filename);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  return sendOk(res, { ok: true });
}));
