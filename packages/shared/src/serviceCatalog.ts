export type ServiceId =
  | "wifi_info"
  | "breakfast_info"
  | "checkin_checkout"
  | "taxi"
  | "airport_transfer"
  | "restaurant_booking"
  | "room_service"
  | "towels"
  | "housekeeping"
  | "maintenance"
  | "reception_assistance"
  | "luggage_storage"
  | "late_checkout"
  | "local_recommendations"
  | "partner_restaurants"
  | "partner_bars"
  | "cruises"
  | "bus_tours"
  | "museums_tickets"
  | "local_experiences"
  | "review_feedback"
  | "crm_collection"
  | "post_stay_followup"
  | "analytics_dashboard";

export type ServiceCategory =
  | "transport"
  | "food_beverage"
  | "housekeeping"
  | "maintenance"
  | "reception"
  | "concierge"
  | "local_guide"
  | "feedback"
  | "crm"
  | "partner";

export type ServicePriority = "p1" | "p2" | "p3";

export type CommercialPackage = "starter" | "boutique" | "premium" | "palace";

export type HotelSegment = "economy" | "boutique" | "four_star" | "luxury" | "palace";

export type GuestValueLevel = "low" | "medium" | "high" | "very_high";

export type HotelValueLevel = "low" | "medium" | "high" | "very_high";

export type ImplementationComplexity = "low" | "medium" | "high";

export type ServiceFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "date"
  | "time"
  | "number"
  | "checkbox"
  | "phone"
  | "email"
  | "url";

export type ServiceFieldOption = {
  value: string;
  labelFr: string;
  labelEn: string;
};

export type ServiceFieldDefinition = {
  key: string;
  labelFr: string;
  labelEn: string;
  type: ServiceFieldType;
  required: boolean;
  options?: ServiceFieldOption[];
  maxLength?: number;
};

export type ReceptionDisplayField = {
  key: string;
  labelFr: string;
  labelEn: string;
};

export type ServiceCatalogItem = {
  id: ServiceId;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  category: ServiceCategory;
  priority: ServicePriority;
  minPackage: CommercialPackage;
  hotelSegments: readonly HotelSegment[];
  guestValue: GuestValueLevel;
  hotelValue: HotelValueLevel;
  complexity: ImplementationComplexity;
  defaultPriority: "low" | "medium" | "high" | "urgent";
  isPartnerMonetizable: boolean;
  isGuestVisible: boolean;
  isReceptionVisible: boolean;
  formFields: readonly ServiceFieldDefinition[];
  receptionDisplay: readonly ReceptionDisplayField[];
  commercialUpsellFr: string;
};

export type CommercialPackageDef = {
  id: CommercialPackage;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  targetHotelSegments: readonly HotelSegment[];
  positioningFr: string;
  recommendedMonthlyPriceRange: string;
  highlightedFeatures: readonly string[];
};

function formField(
  key: string,
  labelFr: string,
  type: ServiceFieldType,
  required: boolean,
  opts?: Partial<Omit<ServiceFieldDefinition, "key" | "labelFr" | "type" | "required">>
): ServiceFieldDefinition {
  return { key, labelFr, labelEn: labelFr, type, required, ...opts };
}

function displayField(key: string, labelFr: string): ReceptionDisplayField {
  return { key, labelFr, labelEn: labelFr };
}

export const ALL_HOTEL_SEGMENTS: readonly HotelSegment[] = [
  "economy", "boutique", "four_star", "luxury", "palace"
] as const;

const _allSegments = ALL_HOTEL_SEGMENTS;

const SEGMENTS: Record<string, readonly HotelSegment[]> = {
  ALL:           _allSegments,
  BOUTIQUE_UP:   ["boutique", "four_star", "luxury", "palace"],
  FOUR_STAR_UP:  ["four_star", "luxury", "palace"],
} as const;

export const COMMERCIAL_PACKAGES: readonly CommercialPackageDef[] = [
  {
    id: "starter",
    labelFr: "Starter",
    labelEn: "Starter",
    descriptionFr: "Guide client QR + demandes essentielles + CRM de base. Idéal pour les petits hôtels indépendants.",
    targetHotelSegments: ["economy", "boutique"],
    positioningFr: "Digitalisation simple du concierge hôtelier sans investissement technique.",
    recommendedMonthlyPriceRange: "49–99 €/mois",
    highlightedFeatures: [
      "Guest App QR code",
      "Wi-Fi & infos pratiques",
      "Taxi & demandes essentielles",
      "CRM client",
      "Avis satisfaction"
    ]
  },
  {
    id: "boutique",
    labelFr: "Boutique",
    labelEn: "Boutique",
    descriptionFr: "Concierge digital élégant + recommandations locales + services structurés. Pensé pour les hôtels boutiques parisiens.",
    targetHotelSegments: ["boutique", "four_star"],
    positioningFr: "Expérience locale personnalisée avec recommandations et réservations partenaires.",
    recommendedMonthlyPriceRange: "149–249 €/mois",
    highlightedFeatures: [
      "Tout Starter",
      "Recommandations locales",
      "Restaurants partenaires",
      "Room service structuré",
      "Suivi post-séjour"
    ]
  },
  {
    id: "premium",
    labelFr: "Premium",
    labelEn: "Premium",
    descriptionFr: "Expérience client avancée + partenaires + analytics + personnalisation. Pour les 4 étoiles et hôtels lifestyle.",
    targetHotelSegments: ["four_star", "luxury"],
    positioningFr: "Partenariats touristiques monétisés et analytics complets de satisfaction.",
    recommendedMonthlyPriceRange: "299–499 €/mois",
    highlightedFeatures: [
      "Tout Boutique",
      "Croisières & tours",
      "Billets musées",
      "Expériences locales",
      "Analytics dashboard"
    ]
  },
  {
    id: "palace",
    labelFr: "Palace",
    labelEn: "Palace",
    descriptionFr: "Conciergerie digitale premium + service VIP + personnalisation complète. Sur mesure pour palaces et 5 étoiles.",
    targetHotelSegments: ["luxury", "palace"],
    positioningFr: "Solution entièrement personnalisée avec services VIP et conciergerie digitale haut de gamme.",
    recommendedMonthlyPriceRange: "Sur devis",
    highlightedFeatures: [
      "Tout Premium",
      "Personnalisation complète",
      "Services VIP",
      "Intégrations sur mesure",
      "Support dédié"
    ]
  }
] as const;

type ModuleMeta = {
  labelFr: string; labelEn: string; desc: string; cat: ServiceCategory; pri: ServicePriority;
  min: CommercialPackage; segs: readonly HotelSegment[]; gv: GuestValueLevel; hv: HotelValueLevel;
  cx: ImplementationComplexity; dp: ServiceCatalogItem["defaultPriority"]; pm: boolean;
  gvis: boolean; rvis: boolean; upsell: string;
};

const ALL_MODULES: Record<ServiceId, ModuleMeta> = {
  wifi_info:          { labelFr: "Wi-Fi",                 labelEn: "Wi-Fi",                desc: "Connexion Wi-Fi et identifiants réseau.",                                cat: "reception",   pri: "p3", min: "starter",  segs: SEGMENTS.ALL,         gv: "low",       hv: "low",       cx: "low",    dp: "low",      pm: false, gvis: true,  rvis: true,  upsell: "Information essentielle pour tout séjour." },
  breakfast_info:     { labelFr: "Petit-déjeuner",        labelEn: "Breakfast",            desc: "Horaires et lieu du petit-déjeuner.",                                   cat: "food_beverage", pri: "p3", min: "starter",  segs: SEGMENTS.ALL,         gv: "medium",    hv: "low",       cx: "low",    dp: "low",      pm: false, gvis: true,  rvis: true,  upsell: "Affiché dès le Starter pour rassurer les clients." },
  checkin_checkout:   { labelFr: "Check-in / Check-out",  labelEn: "Check-in / Checkout",  desc: "Heures d'arrivée et de départ de la chambre.",                          cat: "reception",   pri: "p3", min: "starter",  segs: SEGMENTS.ALL,         gv: "medium",    hv: "low",       cx: "low",    dp: "low",      pm: false, gvis: true,  rvis: true,  upsell: "Indispensable pour une arrivée sans friction." },
  taxi:               { labelFr: "Taxi",                   labelEn: "Taxi",                 desc: "Réservation de taxi par la réception.",                                 cat: "transport",   pri: "p1", min: "starter",  segs: SEGMENTS.ALL,         gv: "very_high", hv: "high",      cx: "low",    dp: "medium",   pm: false, gvis: true,  rvis: true,  upsell: "Service essentiel inclus dès l'offre Starter." },
  airport_transfer:   { labelFr: "Transfert aéroport",     labelEn: "Airport Transfer",     desc: "Transfert privé depuis ou vers l'aéroport.",                            cat: "transport",   pri: "p1", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "high",      hv: "high",      cx: "low",    dp: "medium",   pm: false, gvis: true,  rvis: true,  upsell: "Service très apprécié des clients internationaux." },
  restaurant_booking: { labelFr: "Réservation restaurant", labelEn: "Restaurant Booking",   desc: "Réservation de table dans un restaurant partenaire ou recommandé.",     cat: "food_beverage", pri: "p1", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "very_high", hv: "high",      cx: "medium", dp: "medium",   pm: true,  gvis: true,  rvis: true,  upsell: "Permet de valoriser les restaurants partenaires et d'améliorer l'expérience locale." },
  room_service:       { labelFr: "Room service",           labelEn: "Room Service",         desc: "Commande de repas, boissons ou collations en chambre.",                cat: "food_beverage", pri: "p2", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "high",      hv: "medium",    cx: "low",    dp: "medium",   pm: false, gvis: true,  rvis: true,  upsell: "Améliore la satisfaction clients sans surcharger la réception." },
  towels:             { labelFr: "Serviettes / Linge",     labelEn: "Towels / Linen",       desc: "Demande de serviettes, oreillers ou couvertures supplémentaires.",     cat: "housekeeping", pri: "p1", min: "starter",  segs: SEGMENTS.ALL,         gv: "medium",    hv: "medium",    cx: "low",    dp: "medium",   pm: false, gvis: true,  rvis: true,  upsell: "Service essentiel pour le confort en chambre." },
  housekeeping:       { labelFr: "Ménage",                 labelEn: "Housekeeping",         desc: "Demande de ménage ou entretien de la chambre.",                        cat: "housekeeping", pri: "p2", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "medium",    hv: "high",      cx: "low",    dp: "medium",   pm: false, gvis: true,  rvis: true,  upsell: "Centralise les demandes ménage et réduit les appels." },
  maintenance:        { labelFr: "Maintenance",            labelEn: "Maintenance",          desc: "Signalement d'un problème technique dans la chambre.",                 cat: "maintenance", pri: "p1", min: "starter",  segs: SEGMENTS.ALL,         gv: "high",      hv: "very_high", cx: "medium", dp: "urgent",   pm: false, gvis: true,  rvis: true,  upsell: "Évite les mauvaises surprises et protège la réputation." },
  reception_assistance:{ labelFr: "Assistance réception",  labelEn: "Reception Assistance", desc: "Contacter la réception pour toute question ou besoin particulier.",     cat: "reception",   pri: "p1", min: "starter",  segs: SEGMENTS.ALL,         gv: "very_high", hv: "high",      cx: "low",    dp: "urgent",   pm: false, gvis: true,  rvis: true,  upsell: "Remonte les demandes urgentes en priorité." },
  luggage_storage:    { labelFr: "Consigne bagages",       labelEn: "Luggage Storage",      desc: "Stockage des bagages avant check-in ou après check-out.",              cat: "reception",   pri: "p2", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "medium",    hv: "low",       cx: "low",    dp: "low",      pm: false, gvis: true,  rvis: true,  upsell: "Apprécié pour les arrivées avant check-in ou départs tardifs." },
  late_checkout:      { labelFr: "Late check-out",         labelEn: "Late Check-out",       desc: "Demande de départ tardif le jour du check-out.",                        cat: "reception",   pri: "p2", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "high",      hv: "medium",    cx: "low",    dp: "low",      pm: false, gvis: true,  rvis: true,  upsell: "Service différenciant pour une expérience flexible." },
  local_recommendations:{ labelFr: "Recommandations locales",labelEn:"Local Recommendations",desc: "Guide du quartier avec adresses sélectionnées par l'hôtel.",          cat: "local_guide", pri: "p1", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "very_high", hv: "high",      cx: "medium", dp: "medium",   pm: false, gvis: true,  rvis: false, upsell: "Différencie votre hôtel avec un guide local personnalisé." },
  partner_restaurants:{ labelFr: "Restaurants partenaires", labelEn: "Partner Restaurants",  desc: "Mise en avant des restaurants partenaires dans l'app client.",         cat: "partner",     pri: "p1", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "very_high", hv: "high",      cx: "medium", dp: "medium",   pm: true,  gvis: true,  rvis: true,  upsell: "Valorisez vos partenariats restaurateurs dans l'app client." },
  partner_bars:       { labelFr: "Bars partenaires",       labelEn: "Partner Bars",         desc: "Mise en avant des bars partenaires dans l'app client.",                 cat: "partner",     pri: "p2", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "medium",    hv: "medium",    cx: "medium", dp: "medium",   pm: true,  gvis: true,  rvis: true,  upsell: "Monétisez les établissements du quartier." },
  cruises:            { labelFr: "Croisières",             labelEn: "Cruises",              desc: "Réservation de croisières sur la Seine ou excursions fluviales.",      cat: "partner",     pri: "p2", min: "premium",  segs: SEGMENTS.FOUR_STAR_UP,gv: "high",      hv: "medium",    cx: "medium", dp: "medium",   pm: true,  gvis: true,  rvis: true,  upsell: "Module idéal pour monétiser les partenariats touristiques." },
  bus_tours:          { labelFr: "Tours en bus",           labelEn: "Bus Tours",            desc: "Excursions en bus touristique dans Paris.",                             cat: "partner",     pri: "p2", min: "premium",  segs: SEGMENTS.FOUR_STAR_UP,gv: "high",      hv: "medium",    cx: "medium", dp: "medium",   pm: true,  gvis: true,  rvis: true,  upsell: "Ajoutez des excursions touristiques à votre offre." },
  museums_tickets:    { labelFr: "Billets musées",         labelEn: "Museum Tickets",       desc: "Achat de billets coupe-file pour les principaux musées parisiens.",    cat: "partner",     pri: "p2", min: "premium",  segs: SEGMENTS.FOUR_STAR_UP,gv: "high",      hv: "medium",    cx: "high",   dp: "medium",   pm: true,  gvis: true,  rvis: true,  upsell: "Service à forte valeur pour les clients culturels." },
  local_experiences:  { labelFr: "Expériences locales",    labelEn: "Local Experiences",    desc: "Expériences uniques : cours de cuisine, dégustations, ateliers.",      cat: "partner",     pri: "p2", min: "premium",  segs: SEGMENTS.FOUR_STAR_UP,gv: "very_high", hv: "high",      cx: "high",   dp: "medium",   pm: true,  gvis: true,  rvis: true,  upsell: "Différenciation maximale avec expériences uniques." },
  review_feedback:    { labelFr: "Avis satisfaction",      labelEn: "Review Feedback",      desc: "Collecte des avis clients avant leur départ.",                          cat: "feedback",    pri: "p1", min: "starter",  segs: SEGMENTS.ALL,         gv: "high",      hv: "very_high", cx: "low",    dp: "high",     pm: false, gvis: true,  rvis: true,  upsell: "Captez les avis avant qu'ils n'arrivent sur les plateformes publiques." },
  crm_collection:     { labelFr: "Collecte CRM",           labelEn: "CRM Collection",       desc: "Enrichissement automatique du profil client et préférences.",          cat: "crm",         pri: "p1", min: "starter",  segs: SEGMENTS.ALL,         gv: "low",       hv: "very_high", cx: "low",    dp: "low",      pm: false, gvis: false, rvis: true,  upsell: "Construisez votre base CRM sans effort." },
  post_stay_followup: { labelFr: "Suivi post-séjour",      labelEn: "Post-Stay Follow-up",  desc: "Automatisation de relance après le départ du client.",                 cat: "crm",         pri: "p2", min: "boutique", segs: SEGMENTS.BOUTIQUE_UP, gv: "high",      hv: "high",      cx: "medium", dp: "medium",   pm: false, gvis: false, rvis: true,  upsell: "Fidélisez vos clients après leur départ." },
  analytics_dashboard:{ labelFr: "Analytics dashboard",    labelEn: "Analytics Dashboard",  desc: "Tableau de bord de satisfaction et d'usage de l'app client.",          cat: "crm",         pri: "p2", min: "premium",  segs: SEGMENTS.FOUR_STAR_UP,gv: "low",       hv: "very_high", cx: "high",   dp: "low",      pm: false, gvis: false, rvis: true,  upsell: "Pilotez votre hôtel avec des données de satisfaction et d'usage." },
};

function buildCatalogItem(
  id: ServiceId,
  m: ModuleMeta,
  formFields: readonly ServiceFieldDefinition[],
  receptionDisplay: readonly ReceptionDisplayField[]
): ServiceCatalogItem {
  return {
    id,
    labelFr: m.labelFr,
    labelEn: m.labelEn,
    descriptionFr: m.desc,
    category: m.cat,
    priority: m.pri,
    minPackage: m.min,
    hotelSegments: m.segs,
    guestValue: m.gv,
    hotelValue: m.hv,
    complexity: m.cx,
    defaultPriority: m.dp,
    isPartnerMonetizable: m.pm,
    isGuestVisible: m.gvis,
    isReceptionVisible: m.rvis,
    formFields,
    receptionDisplay,
    commercialUpsellFr: m.upsell
  };
}

const _asyncF: ServiceFieldDefinition[] = [];
const _asyncD: ReceptionDisplayField[] = [];
const _f = formField;
const _d = displayField;

export const SERVICE_CATALOG: readonly ServiceCatalogItem[] = [
  buildCatalogItem("wifi_info",           ALL_MODULES.wifi_info,            _asyncF, _asyncD),
  buildCatalogItem("breakfast_info",      ALL_MODULES.breakfast_info,       _asyncF, _asyncD),
  buildCatalogItem("checkin_checkout",    ALL_MODULES.checkin_checkout,     _asyncF, _asyncD),
  buildCatalogItem("taxi",                ALL_MODULES.taxi, [
    _f("requestedDate",    "Date souhaitée",    "date",     true),
    _f("requestedTime",    "Heure souhaitée",   "time",     true),
    _f("destinationType",  "Type de destination","select",  true, { options: [{value:"address",labelFr:"Adresse",labelEn:"Address"},{value:"airport",labelFr:"Aéroport",labelEn:"Airport"},{value:"station",labelFr:"Gare",labelEn:"Station"},{value:"other",labelFr:"Autre",labelEn:"Other"}] }),
    _f("destination",      "Destination",        "text",     false),
    _f("passengers",       "Passagers",          "number",   true),
    _f("luggage",          "Bagages",            "number",   false),
    _f("notes",            "Commentaire",        "textarea", false, { maxLength: 300 })
  ], [
    _d("requestedDate",   "Date"),
    _d("requestedTime",   "Heure"),
    _d("destination",     "Destination"),
    _d("passengers",      "Passagers"),
    _d("luggage",         "Bagages")
  ]),
  buildCatalogItem("airport_transfer",    ALL_MODULES.airport_transfer,     _asyncF, _asyncD),
  buildCatalogItem("restaurant_booking",  ALL_MODULES.restaurant_booking, [
    _f("requestedDate",   "Date souhaitée",     "date",     true),
    _f("requestedTime",   "Heure souhaitée",    "time",     true),
    _f("people",          "Nombre de personnes","number",   true),
    _f("cuisine",         "Type de cuisine",    "text",     false),
    _f("budget",          "Budget",             "select",   false, { options: [{value:"economy",labelFr:"Économique",labelEn:"Economy"},{value:"medium",labelFr:"Moyen",labelEn:"Medium"},{value:"premium",labelFr:"Premium",labelEn:"Premium"},{value:"gastronomic",labelFr:"Gastronomique",labelEn:"Gastronomic"}] }),
    _f("occasion",        "Occasion spéciale",  "select",   false),
    _f("area",            "Quartier souhaité",  "text",     false),
    _f("notes",           "Commentaire",        "textarea", false, { maxLength: 300 })
  ], [
    _d("requestedDate",  "Date"),
    _d("requestedTime",  "Heure"),
    _d("people",         "Personnes"),
    _d("cuisine",        "Cuisine"),
    _d("budget",         "Budget"),
    _d("occasion",       "Occasion")
  ]),
  buildCatalogItem("room_service",        ALL_MODULES.room_service, [
    _f("category",        "Catégorie",          "select",   false, { options: [{value:"Petit-dejeuner",labelFr:"Petit-déjeuner",labelEn:"Breakfast"},{value:"Boissons",labelFr:"Boissons",labelEn:"Drinks"},{value:"Collations",labelFr:"Collations",labelEn:"Snacks"},{value:"Repas",labelFr:"Repas",labelEn:"Meals"},{value:"Autre",labelFr:"Autre",labelEn:"Other"}] }),
    _f("quantity",        "Quantité",           "number",   false),
    _f("asap",            "Dès que possible",   "checkbox", false),
    _f("requestedTime",   "Heure souhaitée",    "time",     false),
    _f("notes",           "Commentaire",        "textarea", false, { maxLength: 300 })
  ], [
    _d("category",       "Catégorie"),
    _d("quantity",       "Quantité"),
    _d("asap",           "Urgent")
  ]),
  buildCatalogItem("towels",              ALL_MODULES.towels, [
    _f("itemType",        "Type",               "select",   true,  { options: [{value:"serviettes",labelFr:"Serviettes",labelEn:"Towels"},{value:"oreillers",labelFr:"Oreillers",labelEn:"Pillows"},{value:"couvertures",labelFr:"Couvertures",labelEn:"Blankets"},{value:"autre",labelFr:"Autre",labelEn:"Other"}] }),
    _f("quantity",        "Quantité",           "number",   true),
    _f("urgent",          "Urgent",             "checkbox", false),
    _f("notes",           "Commentaire",        "textarea", false, { maxLength: 300 })
  ], [
    _d("itemType",       "Article"),
    _d("quantity",       "Quantité"),
    _d("urgent",         "Urgent")
  ]),
  buildCatalogItem("housekeeping",        ALL_MODULES.housekeeping,         _asyncF, _asyncD),
  buildCatalogItem("maintenance",         ALL_MODULES.maintenance, [
    _f("category",        "Catégorie",          "select",   true,  { options: [
      {value:"Plomberie",labelFr:"Plomberie",labelEn:"Plumbing"},
      {value:"Electricite / Lumiere",labelFr:"Électricité / Lumière",labelEn:"Electricity / Light"},
      {value:"Climatisation / Chauffage",labelFr:"Climatisation / Chauffage",labelEn:"AC / Heating"},
      {value:"Serrure / Cle",labelFr:"Serrure / Clé",labelEn:"Lock / Key"},
      {value:"TV / Telephone",labelFr:"TV / Téléphone",labelEn:"TV / Phone"},
      {value:"Mobilier / Equipement",labelFr:"Mobilier / Équipement",labelEn:"Furniture / Equipment"},
      {value:"Autre",labelFr:"Autre",labelEn:"Other"}
    ]}),
    _f("description",     "Description",        "textarea", true,  { maxLength: 300 }),
    _f("urgent",          "Intervention urgente", "checkbox", false),
    _f("availability",    "Disponibilité",      "select",   false, { options: [
      {value:"Maintenant",labelFr:"Maintenant",labelEn:"Now"},
      {value:"Dans 1 heure",labelFr:"Dans 1 heure",labelEn:"In 1 hour"},
      {value:"Ce soir",labelFr:"Ce soir",labelEn:"Tonight"},
      {value:"Demain matin",labelFr:"Demain matin",labelEn:"Tomorrow morning"}
    ]})
  ], [
    _d("category",       "Catégorie"),
    _d("description",    "Description"),
    _d("urgent",         "Urgent"),
    _d("availability",   "Disponibilité")
  ]),
  buildCatalogItem("reception_assistance",ALL_MODULES.reception_assistance, [
    _f("subject",         "Sujet",              "text",     true),
    _f("urgent",          "Urgent",             "checkbox", false),
    _f("notes",           "Message",            "textarea", true,  { maxLength: 1000 })
  ], [
    _d("subject",        "Sujet"),
    _d("urgent",         "Urgent")
  ]),
  buildCatalogItem("luggage_storage",     ALL_MODULES.luggage_storage,      _asyncF, _asyncD),
  buildCatalogItem("late_checkout",       ALL_MODULES.late_checkout,        _asyncF, _asyncD),
  buildCatalogItem("local_recommendations",ALL_MODULES.local_recommendations, _asyncF, _asyncD),
  buildCatalogItem("partner_restaurants", ALL_MODULES.partner_restaurants,  _asyncF, _asyncD),
  buildCatalogItem("partner_bars",        ALL_MODULES.partner_bars,         _asyncF, _asyncD),
  buildCatalogItem("cruises",             ALL_MODULES.cruises,              _asyncF, _asyncD),
  buildCatalogItem("bus_tours",           ALL_MODULES.bus_tours,            _asyncF, _asyncD),
  buildCatalogItem("museums_tickets",     ALL_MODULES.museums_tickets,      _asyncF, _asyncD),
  buildCatalogItem("local_experiences",   ALL_MODULES.local_experiences,    _asyncF, _asyncD),
  buildCatalogItem("review_feedback",     ALL_MODULES.review_feedback,      _asyncF, _asyncD),
  buildCatalogItem("crm_collection",      ALL_MODULES.crm_collection,       _asyncF, _asyncD),
  buildCatalogItem("post_stay_followup",  ALL_MODULES.post_stay_followup,   _asyncF, _asyncD),
  buildCatalogItem("analytics_dashboard", ALL_MODULES.analytics_dashboard,  _asyncF, _asyncD),
];

const PACKAGE_ORDER: Record<CommercialPackage, number> = {
  starter: 0,
  boutique: 1,
  premium: 2,
  palace: 3
};

export function getServiceById(id: ServiceId): ServiceCatalogItem | undefined {
  return SERVICE_CATALOG.find((s) => s.id === id);
}

export function getServicesByPackage(packageId: CommercialPackage): ServiceCatalogItem[] {
  const min = PACKAGE_ORDER[packageId];
  return SERVICE_CATALOG.filter((s) => PACKAGE_ORDER[s.minPackage] <= min);
}

export function getServicesByCategory(category: ServiceCategory): ServiceCatalogItem[] {
  return SERVICE_CATALOG.filter((s) => s.category === category);
}

export function getServicesForHotelSegment(segment: HotelSegment): ServiceCatalogItem[] {
  return SERVICE_CATALOG.filter((s) => s.hotelSegments.includes(segment));
}

export function isServiceAvailableForPackage(serviceId: ServiceId, packageId: CommercialPackage): boolean {
  const service = getServiceById(serviceId);
  if (!service) return false;
  return PACKAGE_ORDER[service.minPackage] <= PACKAGE_ORDER[packageId];
}

export function getPartnerMonetizableServices(): ServiceCatalogItem[] {
  return SERVICE_CATALOG.filter((s) => s.isPartnerMonetizable);
}

export function getGuestVisibleServices(packageId?: CommercialPackage): ServiceCatalogItem[] {
  const visible = SERVICE_CATALOG.filter((s) => s.isGuestVisible);
  if (!packageId) return visible;
  return visible.filter((s) => isServiceAvailableForPackage(s.id, packageId));
}

export function getReceptionVisibleServices(packageId?: CommercialPackage): ServiceCatalogItem[] {
  const visible = SERVICE_CATALOG.filter((s) => s.isReceptionVisible);
  if (!packageId) return visible;
  return visible.filter((s) => isServiceAvailableForPackage(s.id, packageId));
}

export function getPackageById(packageId: CommercialPackage): CommercialPackageDef | undefined {
  return COMMERCIAL_PACKAGES.find((p) => p.id === packageId);
}