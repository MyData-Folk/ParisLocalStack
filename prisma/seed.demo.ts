import bcrypt from "bcryptjs";
import { HotelStatus, PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();
const demoSlug = "demo-paris-local";
const demoOnlyCredential = "demo-only-not-for-production";

function dateFromToday(days: number) {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

const demoGuestCards = [
  {
    id: "demo-hero-paris-guide",
    slot: "hero",
    slotIndex: 0,
    kind: "guide",
    title: "Paris autour de vous",
    description: "Restaurants, cafes et balades selectionnes par l'hotel pour profiter du quartier.",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    icon: "MapPin",
    actionLabel: "Explorer",
    actionType: "section",
    actionTarget: "recommendations",
    enabled: true
  },
  {
    id: "demo-hero-evening",
    slot: "hero",
    slotIndex: 1,
    kind: "promo",
    title: "Votre soiree parisienne",
    description: "Besoin d'une table, d'un taxi ou d'une idee culture ? La reception vous accompagne.",
    imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80",
    icon: "Sparkles",
    actionLabel: "Contacter",
    actionType: "service_request",
    actionTarget: "reception",
    enabled: true
  },
  {
    id: "demo-shortcut-taxi",
    slot: "shortcut",
    slotIndex: 0,
    kind: "service",
    title: "Taxi & transfert",
    description: "Demandez un taxi ou un transfert aeroport en quelques secondes.",
    icon: "Car",
    actionLabel: "Demander",
    actionType: "service_request",
    actionTarget: "taxi",
    enabled: true
  },
  {
    id: "demo-shortcut-breakfast",
    slot: "shortcut",
    slotIndex: 1,
    kind: "service",
    title: "Petit-dejeuner",
    description: "Horaires, service en chambre et demandes speciales.",
    icon: "Coffee",
    actionLabel: "Voir",
    actionType: "service_request",
    actionTarget: "room_service",
    enabled: true
  },
  {
    id: "demo-shortcut-pressing",
    slot: "shortcut",
    slotIndex: 2,
    kind: "service",
    title: "Pressing",
    description: "Besoin de linge, pressing ou serviettes supplementaires ?",
    icon: "Shirt",
    actionLabel: "Demander",
    actionType: "service_request",
    actionTarget: "towels",
    enabled: true
  },
  {
    id: "demo-shortcut-reception",
    slot: "shortcut",
    slotIndex: 3,
    kind: "info",
    title: "Reception 24h/24",
    description: "Une question, une bagagerie ou une assistance urgente.",
    icon: "Bell",
    actionLabel: "Ecrire",
    actionType: "service_request",
    actionTarget: "reception",
    enabled: true
  }
];

const demoEnabledServices = [
  {
    serviceCode: "taxi",
    enabled: true,
    order: 0,
    customTitle: "Taxi & transfert",
    customDescription: "La reception organise vos trajets dans Paris ou vers les aeroports.",
    visibleInGuestApp: true,
    visibleAsCard: true,
    visibleInServicesPage: true,
    actionLabel: "Demander un taxi"
  },
  {
    serviceCode: "room_service",
    enabled: true,
    order: 1,
    customTitle: "Room service",
    customDescription: "Petit-dejeuner, boissons et encas servis en chambre selon les horaires de l'hotel.",
    visibleInGuestApp: true,
    visibleAsCard: true,
    visibleInServicesPage: true,
    actionLabel: "Commander"
  },
  {
    serviceCode: "reception_assistance",
    enabled: true,
    order: 2,
    customTitle: "Conciergerie",
    customDescription: "Une question, une adresse ou une demande particuliere ? Notre equipe vous repond.",
    visibleInGuestApp: true,
    visibleAsCard: true,
    visibleInServicesPage: true,
    actionLabel: "Contacter"
  },
  {
    serviceCode: "towels",
    enabled: true,
    order: 3,
    customTitle: "Blanchisserie & pressing",
    customDescription: "Demandez du linge, des serviettes supplementaires ou un service pressing.",
    visibleInGuestApp: true,
    visibleAsCard: true,
    visibleInServicesPage: true,
    actionLabel: "Faire une demande"
  },
  {
    serviceCode: "luggage_storage",
    enabled: true,
    order: 4,
    customTitle: "Bagagerie",
    customDescription: "Confiez vos bagages avant l'arrivee ou apres le depart.",
    visibleInGuestApp: true,
    visibleAsCard: false,
    visibleInServicesPage: true,
    actionLabel: "Demander"
  },
  {
    serviceCode: "local_recommendations",
    enabled: true,
    order: 5,
    customTitle: "Recommandations locales",
    customDescription: "Les adresses preferees de l'hotel pour sortir, diner et decouvrir le quartier.",
    visibleInGuestApp: true,
    visibleAsCard: true,
    visibleInServicesPage: true,
    actionLabel: "Explorer"
  }
];

export async function clearDemoTenantData(hotelId: string) {
  await prisma.message.deleteMany({ where: { hotelId } });
  await prisma.serviceRequest.deleteMany({ where: { hotelId } });
  await prisma.review.deleteMany({ where: { hotelId } });
  await prisma.stay.deleteMany({ where: { hotelId } });
  await prisma.guest.deleteMany({ where: { hotelId } });
  await prisma.recommendation.deleteMany({ where: { hotelId } });
}

export async function upsertDemoUser(email: string, name: string, role: UserRole, passwordHash: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name, role, status: UserStatus.active, passwordHash },
    create: { email, name, role, status: UserStatus.active, passwordHash }
  });
}

export async function runDemoSeed() {
  const passwordHash = await bcrypt.hash(demoOnlyCredential, 12);

  const hotel = await prisma.hotel.upsert({
    where: { slug: demoSlug },
    update: {
      name: "Hôtel Lumière Demo Paris",
      description: "Boutique hôtel parisien fictif pour démonstrations ParisLocalStack.",
      address: "10 Rue Demo Lumiere",
      city: "Paris",
      country: "France",
      phone: "+33 1 00 00 00 00",
      email: "contact@demo-paris-local.test",
      website: "https://demo-paris-local.example",
      primaryColor: "#c9a84c",
      secondaryColor: "#111827",
      status: HotelStatus.active,
      commercialPackage: "premium"
    },
    create: {
      name: "Hôtel Lumière Demo Paris",
      slug: demoSlug,
      description: "Boutique hôtel parisien fictif pour démonstrations ParisLocalStack.",
      address: "10 Rue Demo Lumiere",
      city: "Paris",
      country: "France",
      phone: "+33 1 00 00 00 00",
      email: "contact@demo-paris-local.test",
      website: "https://demo-paris-local.example",
      primaryColor: "#c9a84c",
      secondaryColor: "#111827",
      status: HotelStatus.active,
      commercialPackage: "premium"
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
      receptionPhone: "+33 1 00 00 00 10",
      whatsappNumber: "+33 1 00 00 00 11",
      guestTheme: "parisian_boutique",
      languages: ["fr", "en", "it"],
      modules: { messages: true, requests: true, reviews: true, recommendations: true },
      guestCards: demoGuestCards,
      enabledServices: demoEnabledServices
    },
    create: {
      hotelId: hotel.id,
      wifiName: "Lumiere Demo WiFi",
      wifiPassword: "demo-wifi-only",
      breakfastHours: "07:00 - 10:30",
      checkinTime: "15:00",
      checkoutTime: "11:00",
      roomServiceHours: "07:00 - 23:00",
      receptionPhone: "+33 1 00 00 00 10",
      whatsappNumber: "+33 1 00 00 00 11",
      guestTheme: "parisian_boutique",
      languages: ["fr", "en", "it"],
      modules: { messages: true, requests: true, reviews: true, recommendations: true },
      guestCards: demoGuestCards,
      enabledServices: demoEnabledServices
    }
  });

  const receptionist = await upsertDemoUser(
    "reception@demo-paris-local.test",
    "Réception Demo Paris",
    UserRole.receptionist,
    passwordHash
  );
  const manager = await upsertDemoUser(
    "manager@demo-paris-local.test",
    "Manager Hôtel Lumière Demo",
    UserRole.hotel_admin,
    passwordHash
  );

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

  await clearDemoTenantData(hotel.id);

  const camille = await prisma.guest.create({
    data: {
      hotelId: hotel.id,
      firstName: "Camille",
      lastName: "Martin",
      email: "camille.martin@demo-paris-local.test",
      phone: "+33 1 00 00 00 01",
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
      phone: "+33 1 00 00 00 02",
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
      phone: "+33 1 00 00 00 03",
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
      phone: "+33 1 00 00 00 04",
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
      {
        hotelId: hotel.id,
        guestId: camille.id,
        stayId: camilleStay.id,
        senderType: "guest",
        content: "Bonjour, pouvez-vous me rappeler les horaires du petit-déjeuner ?",
        status: "answered",
        priority: "medium"
      },
      {
        hotelId: hotel.id,
        guestId: camille.id,
        stayId: camilleStay.id,
        senderType: "reception",
        senderId: receptionist.id,
        content: "Bonjour Camille, le petit-déjeuner est servi de 07:00 à 10:30 dans le salon principal.",
        status: "sent",
        priority: "medium"
      },
      {
        hotelId: hotel.id,
        guestId: alex.id,
        stayId: alexStay.id,
        senderType: "guest",
        content: "Could you help me book a taxi to CDG tomorrow morning?",
        status: "new",
        priority: "high"
      },
      {
        hotelId: hotel.id,
        guestId: lea.id,
        stayId: leaStay.id,
        senderType: "guest",
        content: "Auriez-vous une recommandation de café calme près de l'hôtel ?",
        status: "new",
        priority: "medium"
      }
    ]
  });

  await prisma.serviceRequest.createMany({
    data: [
      {
        hotelId: hotel.id,
        guestId: alex.id,
        stayId: alexStay.id,
        type: "taxi",
        title: "Demande taxi CDG",
        description: "Taxi vers CDG, 2 passagers, 3 bagages.",
        details: { airport: "CDG", passengers: 2, luggage: 3, requestedTime: "08:30" },
        status: "new",
        priority: "high"
      },
      {
        hotelId: hotel.id,
        guestId: sofia.id,
        stayId: sofiaStay.id,
        type: "restaurant",
        title: "Réservation restaurant",
        description: "Table fictive pour 2 personnes, cuisine française, budget premium.",
        details: { people: 2, cuisine: "française", budget: "premium", requestedTime: "20:00" },
        status: "in_progress",
        priority: "medium"
      },
      {
        hotelId: hotel.id,
        guestId: lea.id,
        stayId: leaStay.id,
        type: "towels",
        title: "Serviettes supplémentaires",
        description: "Deux serviettes supplémentaires demandées en chambre 410.",
        details: { itemType: "serviettes", quantity: 2 },
        status: "completed",
        priority: "medium"
      },
      {
        hotelId: hotel.id,
        guestId: camille.id,
        stayId: camilleStay.id,
        type: "maintenance",
        title: "Assistance climatisation",
        description: "Assistance fictive demandée pour régler la climatisation.",
        details: { category: "Climatisation / Chauffage", urgent: true },
        status: "urgent",
        priority: "urgent"
      }
    ]
  });

  await prisma.review.createMany({
    data: [
      {
        hotelId: hotel.id,
        guestId: camille.id,
        stayId: camilleStay.id,
        rating: 5,
        comment: "Accueil très attentionné et concierge digital simple à utiliser.",
        status: "approved"
      },
      {
        hotelId: hotel.id,
        guestId: sofia.id,
        stayId: sofiaStay.id,
        rating: 4,
        comment: "Très bon guide local fictif pour préparer la soirée.",
        status: "approved"
      },
      {
        hotelId: hotel.id,
        guestId: lea.id,
        stayId: leaStay.id,
        rating: 2,
        comment: "Délai fictif de room service à traiter en priorité.",
        status: "negative_alert"
      }
    ]
  });

  await prisma.recommendation.createMany({
    data: [
      {
        hotelId: hotel.id,
        category: "restaurant",
        name: "Le Comptoir Lumiere",
        description: "Bistrot parisien fictif pour un diner elegant a deux pas de l'hotel.",
        address: "14 Rue Saint-Honore, 75001 Paris",
        distance: "450m",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
        tags: ["restaurant", "bistrot", "diner"],
        isFeatured: true,
        sortOrder: 1
      },
      {
        hotelId: hotel.id,
        category: "cafe",
        name: "Cafe des Arcades",
        description: "Cafe fictif lumineux pour un espresso, un rendez-vous ou une pause lecture.",
        address: "4 Passage des Arcades, 75001 Paris",
        distance: "300m",
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
        tags: ["cafe", "calme", "matin"],
        isFeatured: true,
        sortOrder: 2
      },
      {
        hotelId: hotel.id,
        category: "museum",
        name: "Galerie du Passage",
        description: "Lieu culturel fictif avec une exposition photo accessible en fin d'apres-midi.",
        address: "18 Passage Vivienne, 75002 Paris",
        distance: "900m",
        imageUrl: "https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=1200&q=80",
        tags: ["musee", "culture", "exposition"],
        sortOrder: 3
      },
      {
        hotelId: hotel.id,
        category: "event",
        name: "Soiree Jazz Rive Droite",
        description: "Evenement fictif recommande pour une sortie parisienne simple a organiser.",
        address: "22 Rue Montorgueil, 75002 Paris",
        distance: "1.1km",
        imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80",
        tags: ["jazz", "sortie", "soir"],
        sortOrder: 4
      },
      {
        hotelId: hotel.id,
        category: "shopping",
        name: "Atelier Parisien",
        description: "Boutique fictive de createurs pour un cadeau local et facile a rapporter.",
        address: "7 Rue des Petits Champs, 75001 Paris",
        distance: "650m",
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
        tags: ["shopping", "createurs", "cadeau"],
        sortOrder: 5
      },
      {
        hotelId: hotel.id,
        category: "walk",
        name: "Balade Palais Royal",
        description: "Promenade fictive de 25 minutes entre galeries, jardins et facades parisiennes.",
        address: "Jardins du Palais Royal, 75001 Paris",
        distance: "700m",
        imageUrl: "https://images.unsplash.com/photo-1508050919630-b135583b29ab?auto=format&fit=crop&w=1200&q=80",
        tags: ["balade", "quartier", "photo"],
        sortOrder: 6
      }
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
      recommendations: 6
    }
  };
}

export { demoSlug };

if (process.argv[1] && process.argv[1].endsWith("seed.demo.ts")) {
  runDemoSeed()
    .then((result) => {
      console.log("Demo seed completed:", JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
