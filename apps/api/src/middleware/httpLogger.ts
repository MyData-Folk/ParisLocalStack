import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      requestId: req.requestId ?? "no-id",
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: duration
    }, "request completed");
  });

  next();
}