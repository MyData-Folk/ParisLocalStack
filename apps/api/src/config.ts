import dotenv from "dotenv";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiPort: Number(process.env.API_PORT ?? process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  uploadProvider: process.env.UPLOAD_PROVIDER ?? "local",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  webUrl: process.env.WEB_URL ?? "http://localhost:5173"
};
