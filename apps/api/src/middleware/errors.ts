import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HttpError } from "../utils/http.js";
import { logger } from "../utils/logger.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ error: error.message });
  }
  if (error instanceof Error && error.message.startsWith("File type ")) {
    return res.status(400).json({ error: error.message });
  }
  const id = req.requestId ?? "no-id";
  const logEntry: Record<string, unknown> = {
    requestId: id,
    err: error instanceof Error ? error : undefined,
    path: req.path,
    method: req.method
  };
  logger.error(logEntry, error instanceof Error ? error.message : "Unknown error");
  return res.status(500).json({ error: "Internal server error", requestId: id });
}
