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
  webUrl: process.env.WEB_URL ?? "http://localhost:5173",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? ""
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

if (config.nodeEnv === "production") {
  if (!process.env.CORS_ORIGIN) {
    console.warn("WARNING: CORS_ORIGIN not set, using restrictive default");
  }
}

const s3Provider = config.uploadProvider === "s3";
if (s3Provider) {
  const missing: string[] = [];
  if (!config.s3Endpoint) missing.push("S3_ENDPOINT");
  if (!config.s3Bucket) missing.push("S3_BUCKET");
  if (!config.s3AccessKeyId) missing.push("S3_ACCESS_KEY_ID");
  if (!config.s3SecretAccessKey) missing.push("S3_SECRET_ACCESS_KEY");
  if (!config.s3PublicBaseUrl) missing.push("S3_PUBLIC_BASE_URL");
  if (missing.length > 0) {
    const msg = `FATAL: UPLOAD_PROVIDER=s3 requires ${missing.join(", ")}`;
    if (config.nodeEnv === "production") {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(`WARNING: ${msg}. Falling back to local storage.`);
      config.uploadProvider = "local";
    }
  }
}

export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;

  if (config.nodeEnv === "production") {
    const configuredOrigins = (process.env.CORS_ORIGIN || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item && item !== "*");

    if (configuredOrigins.includes(origin)) {
      return true;
    }

    try {
      const url = new URL(origin);
      if (url.protocol !== "https:") return false;
      const hostname = url.hostname;
      return hostname === "welcomeparis.hotelmanager.fr"
        || hostname.endsWith(".welcomeparis.hotelmanager.fr");
    } catch {
      return false;
    }
  } else {
    return origin === "http://localhost:5173";
  }
}
