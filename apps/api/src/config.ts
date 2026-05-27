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

if (config.nodeEnv === "production" && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is required in production.");
  process.exit(1);
}

export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  const configured = config.corsOrigin.split(",").map((item) => item.trim()).filter(Boolean);
  if (configured.includes(origin) || configured.includes("*")) return true;

  try {
    const hostname = new URL(origin).hostname;
    return hostname === "welcomeparis.hotelmanager.fr"
      || hostname.endsWith(".welcomeparis.hotelmanager.fr")
      || hostname === "localhost"
      || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}
