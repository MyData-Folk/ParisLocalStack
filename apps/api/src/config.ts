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

const jwtSecretValue = process.env.JWT_SECRET;
const fallbackSecret = "change-me-with-a-long-random-secret";

if (config.nodeEnv === "production") {
  if (!jwtSecretValue) {
    console.error("FATAL: JWT_SECRET environment variable is required in production.");
    process.exit(1);
  }
  if (jwtSecretValue.length < 32 || jwtSecretValue === fallbackSecret) {
    console.error(`FATAL: JWT_SECRET is insecure in production. It must be at least 32 characters long and cannot be "${fallbackSecret}".`);
    process.exit(1);
  }
} else {
  if (!jwtSecretValue) {
    console.warn("WARNING: JWT_SECRET is not set. Using dev fallback.");
  } else if (jwtSecretValue.length < 32 || jwtSecretValue === fallbackSecret) {
    console.warn(`WARNING: JWT_SECRET is insecure (length: ${jwtSecretValue?.length ?? 0}). In production, it must be at least 32 characters and cannot be "${fallbackSecret}".`);
  }
}

const databaseUrlValue = process.env.DATABASE_URL;
const fallbackDatabaseUrl = "postgresql://paris_local:paris_local@localhost:5432/paris_local?schema=public";

if (config.nodeEnv === "production") {
  if (!databaseUrlValue || databaseUrlValue === fallbackDatabaseUrl) {
    console.error("FATAL: DATABASE_URL is not set for production");
    process.exit(1);
  }
  if (!databaseUrlValue.startsWith("postgresql://") && !databaseUrlValue.startsWith("postgres://")) {
    console.error("FATAL: DATABASE_URL format is invalid");
    process.exit(1);
  }
} else {
  if (!databaseUrlValue || databaseUrlValue === fallbackDatabaseUrl) {
    console.warn("WARNING: DATABASE_URL is not set or is using the development fallback.");
  } else if (!databaseUrlValue.startsWith("postgresql://") && !databaseUrlValue.startsWith("postgres://")) {
    console.warn("WARNING: DATABASE_URL format is invalid.");
  }
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
