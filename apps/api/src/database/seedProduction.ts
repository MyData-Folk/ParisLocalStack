import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedProduction() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  const hotel = await prisma.hotel.upsert({
    where: { slug: "vendome" },
    update: {},
    create: {
      name: "Hotel Vendome",
      slug: "vendome",
      description: "Digital concierge demo hotel in Paris.",
      address: "1 Place Vendome",
      city: "Paris",
      country: "France",
      phone: "+33 1 00 00 00 00",
      email: "contact@vendome.example",
      website: "https://vendome.example",
      primaryColor: "#c9a84c",
      secondaryColor: "#0f172a",
      status: "active",
      settings: {
        create: {
          wifiName: "Vendome Guests",
          wifiPassword: "Paris2026!",
          breakfastHours: "07:00 - 10:30",
          checkinTime: "15:00",
          checkoutTime: "12:00",
          roomServiceHours: "07:00 - 23:00",
          receptionPhone: "+33 1 00 00 00 00",
          whatsappNumber: "+33 6 00 00 00 00",
          languages: ["fr", "en"],
          modules: { messages: true, requests: true, reviews: true, recommendations: true }
        }
      },
      recommendations: {
        createMany: {
          data: [
            {
              category: "restaurant",
              name: "Le Petit Vendome",
              description: "Classic Parisian bistro close to the hotel.",
              address: "8 Rue des Capucines, Paris",
              distance: "300m",
              isFeatured: true
            },
            {
              category: "transport",
              name: "Metro Opera",
              description: "Metro lines 3, 7 and 8.",
              address: "Place de l'Opera, Paris",
              distance: "450m",
              isFeatured: false
            }
          ]
        }
      }
    }
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@paris-local.test" },
    update: {},
    create: {
      email: "admin@paris-local.test",
      passwordHash,
      name: "Paris Local Admin",
      role: UserRole.super_admin
    }
  });

  const receptionist = await prisma.user.upsert({
    where: { email: "reception@vendome.test" },
    update: {},
    create: {
      email: "reception@vendome.test",
      passwordHash,
      name: "Reception Vendome",
      role: UserRole.receptionist
    }
  });

  await prisma.hotelUser.upsert({
    where: { hotelId_userId: { hotelId: hotel.id, userId: superAdmin.id } },
    update: {},
    create: { hotelId: hotel.id, userId: superAdmin.id, role: UserRole.super_admin }
  });

  await prisma.hotelUser.upsert({
    where: { hotelId_userId: { hotelId: hotel.id, userId: receptionist.id } },
    update: {},
    create: { hotelId: hotel.id, userId: receptionist.id, role: UserRole.receptionist }
  });
}

seedProduction()
  .finally(async () => {
    await prisma.$disconnect();
  });
