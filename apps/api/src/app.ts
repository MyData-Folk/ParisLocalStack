import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { config } from "./config.js";
import { authRouter } from "./modules/auth/routes.js";
import { hotelsRouter, publicHotelsRouter } from "./modules/hotels/routes.js";
import { guestsRouter, publicGuestsRouter } from "./modules/guests/routes.js";
import { staysRouter, publicStaysRouter } from "./modules/stays/routes.js";
import { messagesRouter, publicMessagesRouter } from "./modules/messages/routes.js";
import { requestsRouter, publicRequestsRouter } from "./modules/requests/routes.js";
import { reviewsRouter, publicReviewsRouter } from "./modules/reviews/routes.js";
import { recommendationsRouter, publicRecommendationsRouter } from "./modules/recommendations/routes.js";
import { settingsRouter, publicSettingsRouter } from "./modules/settings/routes.js";
import { analyticsRouter, publicAnalyticsRouter } from "./modules/analytics/routes.js";
import { storageRouter } from "./modules/storage/routes.js";
import { generatorRouter } from "./modules/generator/routes.js";
import { errorHandler, notFound } from "./middleware/errors.js";

export function createApp() {
  const app = express();
  const publicLimiter = rateLimit({ windowMs: 60_000, limit: 120 });

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin.split(","), credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static(path.resolve(config.uploadDir)));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);
  app.use("/api/hotels", hotelsRouter);
  app.use("/api/public/hotels", publicLimiter, publicHotelsRouter);
  app.use("/api/public/:hotelSlug/guests", publicLimiter, publicGuestsRouter);
  app.use("/api/public/:hotelSlug/stays", publicLimiter, publicStaysRouter);
  app.use("/api/public/:hotelSlug/messages", publicLimiter, publicMessagesRouter);
  app.use("/api/public/:hotelSlug/requests", publicLimiter, publicRequestsRouter);
  app.use("/api/public/:hotelSlug/reviews", publicLimiter, publicReviewsRouter);
  app.use("/api/public/:hotelSlug/recommendations", publicLimiter, publicRecommendationsRouter);
  app.use("/api/public/:hotelSlug/settings", publicLimiter, publicSettingsRouter);
  app.use("/api/public/:hotelSlug/analytics", publicLimiter, publicAnalyticsRouter);
  app.use("/api", guestsRouter);
  app.use("/api", staysRouter);
  app.use("/api", messagesRouter);
  app.use("/api", requestsRouter);
  app.use("/api", reviewsRouter);
  app.use("/api", recommendationsRouter);
  app.use("/api", settingsRouter);
  app.use("/api", analyticsRouter);
  app.use("/api/storage", storageRouter);
  app.use("/api/generator", generatorRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
