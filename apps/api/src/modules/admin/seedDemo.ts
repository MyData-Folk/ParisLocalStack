import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { HotelStatus, PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { config } from "../../config.js";
import { logger } from "../../utils/logger.js";

/**
 * TEMPORARY one-off endpoint to seed the demo DB with the demo hotel
 * "Hôtel Lumière Demo Paris" (slug: demo-paris-local).
 *
 * This endpoint is intentionally protected by three layers:
 *   1. SEED_DEMO_ENABLED must be exactly "true"
 *   2. SEED_DEMO_SECRET must be configured
 *   3. The X-Seed-Secret header must match SEED_DEMO_SECRET
 *
 * A soft additional check is performed on WEB_URL / CORS_ORIGIN to confirm
 * the deployment is the demo clone (not production).
 *
 * After successful use, set SEED_DEMO_ENABLED=false on the API clone to
 * disable the endpoint. The endpoint can then be removed in a follow-up PR.
 *
 * IMPORTANT: The seed logic below is intentionally duplicated from
 * prisma/seed.demo.ts because that file lives outside the API TypeScript
 * project (it is in the prisma/ folder) and is not compiled by the API
 * build. Keep both files in sync when modifying the demo dataset.
 */

export const seedDemoRouter = Router();

const DEMO_SLUG = "demo-paris-local";
const DEMO_DOMAIN_MARKER = "demo.hotelmanager.fr";
const DEMO_PASSWORD = "demo-only-not-for-production";

function isDemoDeployment(): boolean {
  const webUrl = config.webUrl ?? "";
  const corsOrigin = config.corsOrigin ?? "";
  return webUrl.includes(DEMO_DOMAIN_MARKER) || corsOrigin.includes(DEMO_DOMAIN_MARKER);
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function dateFromToday(days: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function runDemoSeedInPlace() {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  try {
    const hotel = await prisma.hotel.upsert({
      where: { slug: DEMO_SLUG },
      update: {
        name: "Hôtel Lumière Demo Paris",
        description: "Boutique hôtel parisien fictif pour démonstrations ParisLocalStack.",
        address: "10 Rue Demo Lumiere",
        city: "Paris",
        country: "France",
        phone: "demo-phone-hotel",
        email: "contact@demo-paris-local.test",
        website: "https://demo-paris-local.example",
        primaryColor: "#c9a84c",
        secondaryColor: "#111827",
        status: HotelStatus.active
      },
      create: {
        name: "Hôtel Lumière Demo Paris",
        slug: DEMO_SLUG,
        description: "Boutique hôtel parisien fictif pour démonstrations ParisLocalStack.",
        address: "10 Rue Demo Lumiere",
        city: "Paris",
        country: "France",
        phone: "demo-phone-hotel",
        email: "contact@demo-paris-local.test",
        website: "https://demo-paris-local.example",
        primaryColor: "#c9a84c",
        secondaryColor: "#111827",
        status: HotelStatus.active
      }
    });

    await prisma.hotelSettings.upsert({
      where: { hotelId: hotel.id },
      update: {
        wifiName: "Lumiere Demo WiFi",
        wifiPassword: "demo-wifi-only",
        breakfastHours: "07:00 - 10:30",
        checkinTime: "15:00",
        checkoutTime: "11:00",
        roomServiceHours: "07:00 - 23:00",
        receptionPhone: "demo-phone-reception",
        whatsappNumber: "demo-phone-whatsapp",
        guestTheme: "parisian_boutique",
        languages: ["fr", "en", "it"],
        modules: { messages: true, requests: true, reviews: true, recommendations: true }
      },
      create: {
        hotelId: hotel.id,
        wifiName: "Lumiere Demo WiFi",
        wifiPassword: "demo-wifi-only",
        breakfastHours: "07:00 - 10:30",
        checkinTime: "15:00",
        checkoutTime: "11:00",
        roomServiceHours: "07:00 - 23:00",
        receptionPhone: "demo-phone-reception",
        whatsappNumber: "demo-phone-whatsapp",
        guestTheme: "parisian_boutique",
        languages: ["fr", "en", "it"],
        modules: { messages: true, requests: true, reviews: true, recommendations: true }
      }
    });

    const receptionist = await prisma.user.upsert({
      where: { email: "reception@demo-paris-local.test" },
      update: { name: "Réception Demo Paris", role: UserRole.receptionist, status: UserStatus.active, passwordHash },
      create: {
        email: "reception@demo-paris-local.test",
        name: "Réception Demo Paris",
        role: UserRole.receptionist,
        status: UserStatus.active,
        passwordHash
      }
    });
    const manager = await prisma.user.upsert({
      where: { email: "manager@demo-paris-local.test" },
      update: { name: "Manager Hôtel Lumière Demo", role: UserRole.hotel_admin, status: UserStatus.active, passwordHash },
      create: {
        email: "manager@demo-paris-local.test",
        name: "Manager Hôtel Lumière Demo",
        role: UserRole.hotel_admin,
        status: UserStatus.active,
        passwordHash
      }
    });

    await prisma.hotelUser.upsert({
      where: { hotelId_userId: { hotelId: hotel.id, userId: receptionist.id } },
      update: { role: UserRole.receptionist },
      create: { hotelId: hotel.id, userId: receptionist.id, role: UserRole.receptionist }
    });
    await prisma.hotelUser.upsert({
      where: { hotelId_userId: { hotelId: hotel.id, userId: manager.id } },
      update: { role: UserRole.hotel_admin },
      create: { hotelId: hotel.id, userId: manager.id, role: UserRole.hotel_admin }
    });

    await prisma.message.deleteMany({ where: { hotelId: hotel.id } });
    await prisma.serviceRequest.deleteMany({ where: { hotelId: hotel.id } });
    await prisma.review.deleteMany({ where: { hotelId: hotel.id } });
    await prisma.stay.deleteMany({ where: { hotelId: hotel.id } });
    await prisma.guest.deleteMany({ where: { hotelId: hotel.id } });
    await prisma.recommendation.deleteMany({ where: { hotelId: hotel.id } });

    const camille = await prisma.guest.create({
      data: {
        hotelId: hotel.id,
        firstName: "Camille",
        lastName: "Martin",
        email: "camille.martin@demo-paris-local.test",
        phone: "demo-phone-guest-001",
        language: "fr",
        marketingConsent: true,
        internalNotes: "Cliente fictive sensible à la rapidité de réponse.",
        crmTags: ["VIP", "Business"],
        preferences: { room: "calme", transport: "taxi van" },
        relationshipStatus: "priority"
      }
    });
    const alex = await prisma.guest.create({
      data: {
        hotelId: hotel.id,
        firstName: "Alex",
        lastName: "Turner",
        email: "alex.turner@demo-paris-local.test",
        phone: "demo-phone-guest-002",
        language: "en",
        marketingConsent: false,
        internalNotes: "Client fictif préfère les réponses en anglais.",
        crmTags: ["Business"],
        preferences: { language: "en", breakfast: "early" },
        relationshipStatus: "normal"
      }
    });
    const sofia = await prisma.guest.create({
      data: {
        hotelId: hotel.id,
        firstName: "Sofia",
        lastName: "Rossi",
        email: "sofia.rossi@demo-paris-local.test",
        phone: "demo-phone-guest-003",
        language: "it",
        marketingConsent: true,
        internalNotes: "Cliente fictive intéressée par les restaurants végétariens.",
        crmTags: ["Famille", "Allergie alimentaire"],
        preferences: { restaurant: "vegetarien", room: "calme" },
        relationshipStatus: "normal"
      }
    });
    const lea = await prisma.guest.create({
      data: {
        hotelId: hotel.id,
        firstName: "Léa",
        lastName: "Dubois",
        email: "lea.dubois@demo-paris-local.test",
        phone: "demo-phone-guest-004",
        language: "fr",
        marketingConsent: true,
        internalNotes: "Cliente fictive avec demande récurrente d'oreillers supplémentaires.",
        crmTags: ["VIP", "Famille"],
        preferences: { comfort: "oreillers supplementaires", checkout: "depart tardif" },
        relationshipStatus: "priority"
      }
    });

    const camilleStay = await prisma.stay.create({
      data: { hotelId: hotel.id, guestId: camille.id, roomNumber: "204", checkinDate: dateFromToday(-1), checkoutDate: dateFromToday(2), status: "active" }
    });
    const alexStay = await prisma.stay.create({
      data: { hotelId: hotel.id, guestId: alex.id, roomNumber: "101", checkinDate: dateFromToday(0), checkoutDate: dateFromToday(3), status: "active" }
    });
    const sofiaStay = await prisma.stay.create({
      data: { hotelId: hotel.id, guestId: sofia.id, roomNumber: "305", checkinDate: dateFromToday(-3), checkoutDate: dateFromToday(-1), status: "checked_out" }
    });
    const leaStay = await prisma.stay.create({
      data: { hotelId: hotel.id, guestId: lea.id, roomNumber: "410", checkinDate: dateFromToday(0), checkoutDate: dateFromToday(4), status: "checked_in" }
    });

    await prisma.message.createMany({
      data: [
        { hotelId: hotel.id, guestId: camille.id, stayId: camilleStay.id, senderType: "guest", content: "Bonjour, pouvez-vous me rappeler les horaires du petit-déjeuner ?", status: "answered", priority: "medium" },
        { hotelId: hotel.id, guestId: camille.id, stayId: camilleStay.id, senderType: "reception", senderId: receptionist.id, content: "Bonjour Camille, le petit-déjeuner est servi de 07:00 à 10:30 dans le salon principal.", status: "sent", priority: "medium" },
        { hotelId: hotel.id, guestId: alex.id, stayId: alexStay.id, senderType: "guest", content: "Could you help me book a taxi to CDG tomorrow morning?", status: "new", priority: "high" },
        { hotelId: hotel.id, guestId: lea.id, stayId: leaStay.id, senderType: "guest", content: "Auriez-vous une recommandation de café calme près de l'hôtel ?", status: "new", priority: "medium" }
      ]
    });

    await prisma.serviceRequest.createMany({
      data: [
        { hotelId: hotel.id, guestId: alex.id, stayId: alexStay.id, type: "taxi", title: "Demande taxi CDG", description: "Taxi vers CDG, 2 passagers, 3 bagages.", details: { airport: "CDG", passengers: 2, luggage: 3, requestedTime: "08:30" }, status: "new", priority: "high" },
        { hotelId: hotel.id, guestId: sofia.id, stayId: sofiaStay.id, type: "restaurant", title: "Réservation restaurant", description: "Table fictive pour 2 personnes, cuisine française, budget premium.", details: { people: 2, cuisine: "française", budget: "premium", requestedTime: "20:00" }, status: "in_progress", priority: "medium" },
        { hotelId: hotel.id, guestId: lea.id, stayId: leaStay.id, type: "towels", title: "Serviettes supplémentaires", description: "Deux serviettes supplémentaires demandées en chambre 410.", details: { itemType: "serviettes", quantity: 2 }, status: "completed", priority: "medium" },
        { hotelId: hotel.id, guestId: camille.id, stayId: camilleStay.id, type: "maintenance", title: "Assistance climatisation", description: "Assistance fictive demandée pour régler la climatisation.", details: { category: "Climatisation / Chauffage", urgent: true }, status: "urgent", priority: "urgent" }
      ]
    });

    await prisma.review.createMany({
      data: [
        { hotelId: hotel.id, guestId: camille.id, stayId: camilleStay.id, rating: 5, comment: "Accueil très attentionné et concierge digital simple à utiliser.", status: "approved" },
        { hotelId: hotel.id, guestId: sofia.id, stayId: sofiaStay.id, rating: 4, comment: "Très bon guide local fictif pour préparer la soirée.", status: "approved" },
        { hotelId: hotel.id, guestId: lea.id, stayId: leaStay.id, rating: 2, comment: "Délai fictif de room service à traiter en priorité.", status: "negative_alert" }
      ]
    });

    await prisma.recommendation.createMany({
      data: [
        { hotelId: hotel.id, category: "restaurant", name: "Bistrot Demo Rive Droite", description: "Adresse fictive de cuisine française pour une démonstration.", address: "12 Rue Exemple, 75001 Paris", distance: "450m", tags: ["demo", "français"], isFeatured: true, sortOrder: 1 },
        { hotelId: hotel.id, category: "cafe", name: "Café Demo Palais", description: "Café fictif calme pour travailler ou lire.", address: "4 Passage Exemple, 75001 Paris", distance: "300m", tags: ["demo", "calme"], isFeatured: true, sortOrder: 2 },
        { hotelId: hotel.id, category: "museum", name: "Galerie Demo Paris", description: "Lieu culturel fictif pour illustrer le guide local.", address: "18 Avenue Demo, 75002 Paris", distance: "900m", tags: ["demo", "culture"], sortOrder: 3 },
        { hotelId: hotel.id, category: "pharmacy", name: "Pharmacie Demo Centrale", description: "Pharmacie fictive utile pour la démonstration.", address: "2 Rue Locale, 75002 Paris", distance: "250m", tags: ["demo", "utile"], sortOrder: 4 },
        { hotelId: hotel.id, category: "transport", name: "Métro Demo Ligne 1", description: "Point transport fictif pour montrer les recommandations pratiques.", address: "Place Demo, 75001 Paris", distance: "200m", tags: ["demo", "transport"], sortOrder: 5 }
      ]
    });

    return {
      hotelId: hotel.id,
      hotelSlug: hotel.slug,
      counts: {
        hotelSettings: 1,
        users: 2,
        hotelUsers: 2,
        guests: 4,
        stays: 4,
        messages: 4,
        serviceRequests: 4,
        reviews: 3,
        recommendations: 5
      }
    };
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoRouter.post("/seed-demo", (req: Request, res: Response) => {
  if (process.env.SEED_DEMO_ENABLED !== "true") {
    logger.warn({ requestId: req.requestId, path: "/api/admin/seed-demo" }, "seed demo rejected: feature flag disabled");
    return res.status(403).json({ ok: false, error: "Demo seed endpoint is disabled" });
  }

  const configuredSecret = process.env.SEED_DEMO_SECRET;
  if (!configuredSecret) {
    logger.error({ requestId: req.requestId, path: "/api/admin/seed-demo" }, "seed demo misconfigured: SEED_DEMO_SECRET missing");
    return res.status(500).json({ ok: false, error: "Demo seed endpoint is misconfigured" });
  }

  const providedSecret = req.header("X-Seed-Secret") ?? "";
  if (!providedSecret || !safeEqual(providedSecret, configuredSecret)) {
    logger.warn({ requestId: req.requestId, path: "/api/admin/seed-demo" }, "seed demo rejected: invalid X-Seed-Secret");
    return res.status(403).json({ ok: false, error: "Invalid X-Seed-Secret" });
  }

  if (!isDemoDeployment()) {
    logger.warn({ requestId: req.requestId, path: "/api/admin/seed-demo" }, "seed demo rejected: deployment is not the demo clone");
    return res.status(403).json({ ok: false, error: "Deployment is not the demo clone" });
  }

  runDemoSeedInPlace()
    .then((result) => {
      logger.info({ requestId: req.requestId, path: "/api/admin/seed-demo", hotelSlug: result.hotelSlug, counts: result.counts }, "seed demo completed");
      return res.json({ ok: true, hotelSlug: result.hotelSlug, counts: result.counts });
    })
    .catch((error) => {
      logger.error({ requestId: req.requestId, path: "/api/admin/seed-demo", err: error }, "seed demo failed");
      return res.status(500).json({ ok: false, error: "Seed failed" });
    });
});
