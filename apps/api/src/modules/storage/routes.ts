import { Router } from "express";
import multer from "multer";
import { remoteFileCreateSchema } from "@paris-local/shared";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendOk } from "../../utils/http.js";
import { getStorageProvider } from "./provider.js";

const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/csv"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error(`File type ${file.mimetype} is not allowed`));
    }
  }
});

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

  const provider = getStorageProvider();
  const result = await provider.upload({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    hotelId: req.params.hotelId
  });

  const file = await prisma.file.create({
    data: {
      hotelId: req.params.hotelId,
      filename: result.filename,
      originalName: result.originalName,
      mimeType: result.mimeType,
      size: result.size,
      url: result.url,
      storageProvider: result.storageProvider
    }
  });
  return sendCreated(res, file);
}));

storageRouter.post("/upload", authenticate, upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing file" });
  const hotelId = String(req.body.hotelId ?? "");
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(hotelId)) return res.status(403).json({ error: "Forbidden" });

  const provider = getStorageProvider();
  const result = await provider.upload({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    hotelId
  });

  const file = await prisma.file.create({
    data: {
      hotelId,
      filename: result.filename,
      originalName: result.originalName,
      mimeType: result.mimeType,
      size: result.size,
      url: result.url,
      storageProvider: result.storageProvider
    }
  });
  return sendCreated(res, file);
}));

storageRouter.delete("/:fileId", authenticate, asyncHandler(async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.fileId } });
  if (!file) return res.status(404).json({ error: "File not found" });
  if (req.user?.role !== "super_admin" && !req.user?.hotelIds.includes(file.hotelId)) return res.status(403).json({ error: "Forbidden" });

  const provider = getStorageProvider();
  if (file.storageProvider !== "remote_url") {
    try {
      await provider.delete(file.filename);
    } catch {
      // Silently ignore provider delete errors to avoid blocking DB cleanup
    }
  }

  await prisma.file.delete({ where: { id: file.id } });
  return sendOk(res, { ok: true });
}));