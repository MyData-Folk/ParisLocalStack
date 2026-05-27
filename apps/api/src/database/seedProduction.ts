import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

export async function seedProduction() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("FATAL: SEED_ADMIN_PASSWORD environment variable is required for production seeding.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const email = "admin@paris-local.test";

  console.log(`Seeding production super admin user: ${email}...`);

  const superAdmin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash
    },
    create: {
      email,
      passwordHash,
      name: "Paris Local Admin",
      role: UserRole.super_admin,
      status: "active"
    }
  });

  console.log(`Production super admin seeded successfully (ID: ${superAdmin.id}).`);
}

seedProduction()
  .catch((err) => {
    console.error("Error during production seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
