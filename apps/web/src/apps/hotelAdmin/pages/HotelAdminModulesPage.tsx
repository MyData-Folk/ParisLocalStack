import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BadgeCheck, Crown, Gem, Mail, Plus, Save, Sparkles, Star, Trash2, Zap } from "lucide-react";
import {
  COMMERCIAL_PACKAGES,
  getServicesByPackage,
  getPartnerMonetizableServices,
  type CommercialPackage,
  type ServiceCatalogItem,
  type CommercialPackageDef
} from "@paris-local/shared";
import { api, type GuestCardConfig, type GuestCardPlanLimits, type HotelGuestCardsResponse, type HotelPlanResponse } from "../../../lib/api";

const HIGHLIGHT_SERVICE_IDS = new Set([
  "taxi",
  "room_service",
  "maintenance",
  "restaurant_booking",
  "local_recommendations",
  "review_feedback",
  "crm_collection"
]);

const CATEGORY_LABELS: Record<string, string> = {
  transport: "Transport",
  food_beverage: "Restauration",
  housekeeping: "Entretien",
  maintenance: "Maintenance",
  reception: "Reception",
  concierge: "Conciergerie",
  local_guide: "Guide local",
  feedback: "Avis",
  crm: "CRM",
  partner: "Partenaires"
};

const CARD_KIND_LABELS: Record<GuestCardConfig["kind"], string> = {
  info: "Information",
  service: "Service",
  guide: "Guide",
  promo: "Promotion",
  custom: "Personnalisee"
};

const ACTION_TYPE_LABELS: Record<GuestCardConfig["actionType"], string> = {
  section: "Section Guest App",
  service_request: "Demande de service",
  external_url: "Lien externe",
  none: "Aucune action"
};

const ACTION_TYPES: GuestCardConfig["actionType"][] = ["none", "section", "service_request", "external_url"];

export function HotelAdminModulesPage({ hotel, hotelId, token }: { hotel: any; hotelId: string; token: string }) {
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [hotelPlan, setHotelPlan] = useState<HotelPlanResponse | null>(null);
  const [planError, setPlanError] = useState("");

  useEffect(() => {
    if (!hotelId || !token) return;
    setPlanError("");
    api.getHotelPlan(hotelId, token)
      .then(setHotelPlan)
      .catch(() => setPlanError("Impossible de charger votre offre actuelle."));
  }, [hotelId, token]);

  const currentPackageId = (hotelPlan?.commercialPackage ?? hotel?.commercialPackage ?? "boutique") as CommercialPackage;
  const currentPackage = COMMERCIAL_PACKAGES.find((p) => p.id === currentPackageId);
  const includedServices = getServicesByPackage(currentPackageId);
  const premiumServices = getServicesByPackage("premium");
  const includedIds = new Set(includedServices.map((s) => s.id));
  const premiumOnly = premiumServices.filter((s) => !includedIds.has(s.id));
  const partnerServices = getPartnerMonetizableServices();

  const hotelName = hotel?.name ?? "Votre hotel";
  const hotelCity = hotel?.city ?? "";

  function handleUpgradeRequest() {
    setUpgradeMessage("Pour modifier l'offre, contactez l'administrateur Paris Local.");
    setTimeout(() => setUpgradeMessage(""), 4000);
  }

  return (
    <div className="space-y-8">
      {/* En-tete */}
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Offre</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Modules & offre</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Visualisez les services inclus dans votre espace client et les options disponibles
              pour enrichir l'experience de vos voyageurs.
            </p>
            {(hotelName || hotelCity) ? (
              <p className="mt-2 text-xs text-zinc-500">
                {hotelName}{hotelCity ? ` — ${hotelCity}` : ""}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Section 1 — Votre offre actuelle */}
      {currentPackage ? (
        <section className="rounded-2xl border border-amber-300/20 bg-gradient-to-b from-amber-300/5 to-transparent p-6 shadow-lg shadow-black/20 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Votre offre actuelle
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Offre {currentPackage.labelFr}</h2>
              <p className="text-sm leading-6 text-zinc-300 max-w-xl">{currentPackage.descriptionFr}</p>
              <p className="text-sm text-zinc-400">{currentPackage.positioningFr}</p>
              <div className="flex flex-wrap gap-2">
                {currentPackage.highlightedFeatures.map((feat) => (
                  <span key={feat} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                    <Star className="h-3 w-3 text-amber-300/70" />
                    {feat}
                  </span>
                ))}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-zinc-400">
                  Les prix affiches sont indicatifs. Votre offre reelle peut dependre de votre contrat et des options activees.
                </p>
              </div>
              {hotelPlan?.limits ? (
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <PlanLimit label="Cartes principales" value={String(hotelPlan.limits.maxHeroCards)} />
                  <PlanLimit label="Raccourcis" value={String(hotelPlan.limits.maxShortcutCards)} />
                  <PlanLimit label="Images personnalisees" value={hotelPlan.limits.allowCustomImages ? "Oui" : "Non"} />
                  <PlanLimit label="Liens externes" value={hotelPlan.limits.allowExternalLinks ? "Oui" : "Non"} />
                </div>
              ) : null}
              {planError ? (
                <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{planError}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-2xl font-semibold tracking-tight text-amber-200">
                {currentPackage.recommendedMonthlyPriceRange}
              </span>
              <span className="text-xs text-zinc-500">/ mois indicatif</span>
            </div>
          </div>
        </section>
      ) : null}

      <GuestCardsEditor hotelId={hotelId} token={token} currentPackageLabel={currentPackage?.labelFr ?? currentPackageId} />

      {/* Section 2 — Packages disponibles */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Packages disponibles</h2>
          <p className="mt-1 text-sm text-zinc-400">Comparez les offres et choisissez celle qui correspond a vos besoins.</p>
        </div>

        {upgradeMessage ? (
          <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-200 animate-in fade-in">
            {upgradeMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COMMERCIAL_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isCurrent={pkg.id === currentPackageId}
              onUpgrade={handleUpgradeRequest}
            />
          ))}
        </div>
      </section>

      {/* Section 3 — Services inclus dans votre offre */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Services inclus dans votre offre</h2>
          <p className="mt-1 text-sm text-zinc-400">Modules disponibles avec l'offre {currentPackage?.labelFr ?? "actuelle"}.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {includedServices.map((svc) => (
              <ServiceCard key={svc.id} svc={svc} highlighted={HIGHLIGHT_SERVICE_IDS.has(svc.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Options premium disponibles */}
      {premiumOnly.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Options premium disponibles</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Ces modules sont disponibles avec une offre superieure.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {premiumOnly.map((svc) => (
                <div key={svc.id} className="rounded-xl border border-purple-400/15 bg-purple-400/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{svc.labelFr}</p>
                      <p className="text-xs leading-relaxed text-zinc-400">{svc.descriptionFr}</p>
                      <p className="text-xs italic text-zinc-500">Disponible avec une offre superieure</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                      <Sparkles className="h-3 w-3" />
                      Premium
                    </span>
                    <span className="text-[11px] text-zinc-500">{CATEGORY_LABELS[svc.category] ?? svc.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Section 5 — Partenaires & monetisation */}
      {partnerServices.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Partenaires & monetisation</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              Ces modules peuvent vous aider a valoriser vos partenaires locaux et a enrichir l'experience de vos clients.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {partnerServices.map((svc) => (
                <div key={svc.id} className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{svc.labelFr}</p>
                      <p className="text-xs leading-relaxed text-zinc-400">{svc.descriptionFr}</p>
                      {svc.commercialUpsellFr ? (
                        <p className="text-xs text-zinc-500">{svc.commercialUpsellFr}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      <Zap className="h-3 w-3" />
                      Partenaire
                    </span>
                    <span className="text-[11px] text-zinc-500">{CATEGORY_LABELS[svc.category] ?? svc.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Section 6 — Contact commercial */}
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Besoin d'adapter votre offre ?</h2>
            <p className="max-w-lg text-sm leading-6 text-zinc-400">
              Votre offre peut etre ajustee selon la taille de votre hotel, vos services,
              vos partenaires locaux et votre strategie commerciale.
            </p>
            <p className="text-sm text-zinc-500">
              <span className="font-medium text-zinc-300">Contact :</span>{" "}
              <a href="mailto:contact@paris-local.fr" className="text-amber-300 underline-offset-2 hover:underline">
                contact@paris-local.fr
              </a>
            </p>
          </div>
          <a
            href="mailto:contact@paris-local.fr?subject=Demande%20d%27%C3%A9volution%20offre%20ParisLocalStack"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20"
          >
            <Mail className="h-4 w-4" />
            Contacter ParisLocalStack
          </a>
        </div>
      </section>
    </div>
  );
}

function PackageCard({
  pkg,
  isCurrent,
  onUpgrade
}: {
  pkg: CommercialPackageDef;
  isCurrent: boolean;
  onUpgrade: () => void;
}) {
  const isRecommended = pkg.id === "premium";
  const isPalace = pkg.id === "palace";

  let badge: { label: string; icon: React.ReactNode; className: string } | null = null;

  if (isCurrent) {
    badge = {
      label: "Votre offre actuelle",
      icon: <BadgeCheck className="h-3.5 w-3.5" />,
      className: "text-amber-300 bg-amber-300/10 border-amber-300/30"
    };
  } else if (isRecommended) {
    badge = {
      label: "Upgrade recommande",
      icon: <Crown className="h-3.5 w-3.5" />,
      className: "text-purple-300 bg-purple-400/10 border-purple-400/30"
    };
  } else if (isPalace) {
    badge = {
      label: "Sur devis",
      icon: <Gem className="h-3.5 w-3.5" />,
      className: "text-sky-300 bg-sky-400/10 border-sky-400/30"
    };
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border p-5 shadow-lg shadow-black/20 transition ${
        isCurrent
          ? "border-amber-300/20 bg-gradient-to-b from-amber-300/5 to-transparent"
          : "border-white/[0.07] bg-[#111115]"
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-bold text-white">{pkg.labelFr}</h3>
      </div>

      {badge ? (
        <span
          className={`mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
        >
          {badge.icon}
          {badge.label}
        </span>
      ) : null}

      <p className="text-xs leading-relaxed text-zinc-400 flex-1">{pkg.descriptionFr}</p>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-semibold text-amber-200">{pkg.recommendedMonthlyPriceRange}</p>
        <p className="text-[11px] text-zinc-500">{pkg.positioningFr}</p>
      </div>

      {pkg.highlightedFeatures.length > 0 ? (
        <ul className="mt-4 space-y-1.5 border-t border-white/5 pt-4">
          {pkg.highlightedFeatures.map((feat) => (
            <li key={feat} className="flex items-start gap-2 text-xs text-zinc-400">
              <Star className="mt-0.5 h-3 w-3 shrink-0 text-amber-300/50" />
              {feat}
            </li>
          ))}
        </ul>
      ) : null}

      {!isCurrent ? (
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/10"
        >
          Demander une evolution d'offre
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function PlanLimit({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function GuestCardsEditor({
  hotelId,
  token,
  currentPackageLabel
}: {
  hotelId: string;
  token: string;
  currentPackageLabel: string;
}) {
  const [guestCardsConfig, setGuestCardsConfig] = useState<HotelGuestCardsResponse | null>(null);
  const [guestCards, setGuestCards] = useState<GuestCardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!hotelId || !token) return;
    setLoading(true);
    setError("");
    api.getHotelGuestCards(hotelId, token)
      .then((response) => {
        setGuestCardsConfig(response);
        setGuestCards(sortGuestCards(response.guestCards));
      })
      .catch(() => setError("Impossible de charger les cartes Guest App."))
      .finally(() => setLoading(false));
  }, [hotelId, token]);

  const limits = guestCardsConfig?.limits;
  const validationErrors = useMemo(() => validateGuestCards(guestCards, limits), [guestCards, limits]);
  const heroCards = useMemo(() => cardsForSlot(guestCards, "hero"), [guestCards]);
  const shortcutCards = useMemo(() => cardsForSlot(guestCards, "shortcut"), [guestCards]);
  const canAddHero = Boolean(limits && heroCards.length < limits.maxHeroCards);
  const canAddShortcut = Boolean(limits && shortcutCards.length < limits.maxShortcutCards);

  function updateCard(cardId: string, patch: Partial<GuestCardConfig>) {
    setGuestCards((current) => sortGuestCards(current.map((card) => {
      if (card.id !== cardId) return card;
      const next = { ...card, ...patch };
      if (patch.actionType === "none") return { ...next, actionTarget: "", actionLabel: "" };
      if (patch.actionType === "external_url" && !limits?.allowExternalLinks) {
        return { ...next, actionType: "none", actionTarget: "" };
      }
      return next;
    })));
    setSuccess("");
  }

  function addCard(slot: GuestCardConfig["slot"]) {
    if (!limits) return;
    const existing = cardsForSlot(guestCards, slot);
    const kind = (limits.allowedKinds.includes("info") ? "info" : limits.allowedKinds[0]) as GuestCardConfig["kind"];
    const nextCard: GuestCardConfig = {
      id: `card-${Date.now()}-${slot}`,
      slot,
      slotIndex: existing.length,
      kind,
      title: slot === "hero" ? "Nouvelle carte principale" : "Nouveau raccourci",
      description: "",
      imageUrl: "",
      icon: "",
      actionLabel: "",
      actionType: "none",
      actionTarget: "",
      enabled: true
    };
    setGuestCards((current) => sortGuestCards([...current, nextCard]));
    setSuccess("");
  }

  function removeCard(cardId: string) {
    setGuestCards((current) => normalizeSlotIndexes(current.filter((card) => card.id !== cardId)));
    setSuccess("");
  }

  async function saveCards() {
    if (!limits) return;
    const errors = validateGuestCards(guestCards, limits);
    if (errors.length > 0) {
      setError(errors[0]);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const sanitizedCards = normalizeSlotIndexes(guestCards).map((card) => sanitizeCardForPlan(card, limits));
      const response = await api.updateHotelGuestCards(hotelId, sanitizedCards, token);
      setGuestCardsConfig(response);
      setGuestCards(sortGuestCards(response.guestCards));
      setSuccess("Cartes Guest App enregistrees.");
    } catch {
      setError("Impossible d'enregistrer les cartes Guest App.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Cartes Guest App</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Preparez les cartes visibles dans l'application client. Elles seront affichees cote Guest App dans une prochaine evolution.
          </p>
        </div>
        <button
          type="button"
          onClick={saveCards}
          disabled={saving || loading || validationErrors.length > 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        {loading ? (
          <p className="text-sm text-zinc-400">Chargement des cartes Guest App...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PlanLimit label="Offre" value={guestCardsConfig?.commercialPackage ?? currentPackageLabel} />
              <PlanLimit label="Cartes principales" value={`${heroCards.length}/${limits?.maxHeroCards ?? 0}`} />
              <PlanLimit label="Raccourcis" value={`${shortcutCards.length}/${limits?.maxShortcutCards ?? 0}`} />
              <PlanLimit label="Liens externes" value={limits?.allowExternalLinks ? "Autorises" : "Non inclus"} />
            </div>

            {limits ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-xs text-zinc-400">
                  Types autorises : {limits.allowedKinds.map((kind) => CARD_KIND_LABELS[kind as GuestCardConfig["kind"]] ?? kind).join(", ")}.
                  {" "}Images personnalisees : {limits.allowCustomImages ? `oui, jusqu'a ${limits.maxImageMb} Mo` : "non incluses"}.
                </p>
              </div>
            ) : null}

            {validationErrors.length > 0 ? (
              <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-200">
                {validationErrors[0]}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
            ) : null}
            {success ? (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>
            ) : null}

            <GuestCardSlotEditor
              title="Cartes principales"
              description="Cartes mises en avant dans l'accueil client."
              cards={heroCards}
              slot="hero"
              limits={limits}
              canAdd={canAddHero}
              onAdd={() => addCard("hero")}
              onRemove={removeCard}
              onUpdate={updateCard}
            />
            <GuestCardSlotEditor
              title="Raccourcis"
              description="Acces rapides vers les services ou contenus utiles."
              cards={shortcutCards}
              slot="shortcut"
              limits={limits}
              canAdd={canAddShortcut}
              onAdd={() => addCard("shortcut")}
              onRemove={removeCard}
              onUpdate={updateCard}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function GuestCardSlotEditor({
  title,
  description,
  cards,
  slot,
  limits,
  canAdd,
  onAdd,
  onRemove,
  onUpdate
}: {
  title: string;
  description: string;
  cards: GuestCardConfig[];
  slot: GuestCardConfig["slot"];
  limits?: GuestCardPlanLimits;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: (cardId: string) => void;
  onUpdate: (cardId: string, patch: Partial<GuestCardConfig>) => void;
}) {
  const maxCards = slot === "hero" ? limits?.maxHeroCards ?? 0 : limits?.maxShortcutCards ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      </div>
      {!canAdd ? (
        <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-200">
          Limite atteinte pour votre offre : {cards.length}/{maxCards}.
        </p>
      ) : null}
      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-zinc-500">
          Aucune carte configuree pour cette section.
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <GuestCardForm
              key={card.id}
              card={card}
              limits={limits}
              onRemove={() => onRemove(card.id)}
              onUpdate={(patch) => onUpdate(card.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GuestCardForm({
  card,
  limits,
  onRemove,
  onUpdate
}: {
  card: GuestCardConfig;
  limits?: GuestCardPlanLimits;
  onRemove: () => void;
  onUpdate: (patch: Partial<GuestCardConfig>) => void;
}) {
  const allowedKinds = (limits?.allowedKinds ?? ["info"]) as GuestCardConfig["kind"][];
  const actionTypes = ACTION_TYPES.filter((actionType) => actionType !== "external_url" || limits?.allowExternalLinks);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <input
            type="checkbox"
            checked={card.enabled}
            onChange={(event) => onUpdate({ enabled: event.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-amber-300 focus:ring-amber-300/30"
          />
          Carte active
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/15"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Supprimer
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Titre">
          <input
            value={card.title}
            maxLength={60}
            onChange={(event) => onUpdate({ title: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/50"
            placeholder="Titre affiche au client"
          />
        </Field>
        <Field label="Ordre">
          <input
            type="number"
            min={0}
            value={card.slotIndex}
            onChange={(event) => onUpdate({ slotIndex: Math.max(0, Number(event.target.value) || 0) })}
            className="w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-white outline-none transition focus:border-amber-300/50"
          />
        </Field>
        <Field label="Type de carte">
          <select
            value={allowedKinds.includes(card.kind) ? card.kind : allowedKinds[0]}
            onChange={(event) => onUpdate({ kind: event.target.value as GuestCardConfig["kind"] })}
            className="w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-white outline-none transition focus:border-amber-300/50"
          >
            {allowedKinds.map((kind) => (
              <option key={kind} value={kind}>{CARD_KIND_LABELS[kind]}</option>
            ))}
          </select>
        </Field>
        <Field label="Action">
          <select
            value={actionTypes.includes(card.actionType) ? card.actionType : "none"}
            onChange={(event) => onUpdate({ actionType: event.target.value as GuestCardConfig["actionType"] })}
            className="w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-white outline-none transition focus:border-amber-300/50"
          >
            {actionTypes.map((actionType) => (
              <option key={actionType} value={actionType}>{ACTION_TYPE_LABELS[actionType]}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Description">
          <textarea
            value={card.description ?? ""}
            maxLength={200}
            rows={3}
            onChange={(event) => onUpdate({ description: event.target.value })}
            className="w-full resize-none rounded-xl border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/50"
            placeholder="Texte court affiche au client"
          />
        </Field>
        <Field label="Image">
          <input
            value={card.imageUrl ?? ""}
            disabled={!limits?.allowCustomImages}
            onChange={(event) => onUpdate({ imageUrl: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/50 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={limits?.allowCustomImages ? "https://..." : "Images non incluses dans cette offre"}
          />
          {!limits?.allowCustomImages ? (
            <p className="mt-1 text-[11px] text-zinc-500">Les images personnalisees sont reservees aux offres superieures.</p>
          ) : null}
        </Field>
        <Field label="Libelle du bouton">
          <input
            value={card.actionLabel ?? ""}
            maxLength={40}
            disabled={card.actionType === "none"}
            onChange={(event) => onUpdate({ actionLabel: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/50 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Ex. Voir le service"
          />
        </Field>
        <Field label="Cible de l'action">
          <input
            value={card.actionTarget ?? ""}
            disabled={card.actionType === "none"}
            onChange={(event) => onUpdate({ actionTarget: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/50 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={card.actionType === "external_url" ? "https://..." : "Identifiant section ou service"}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function cardsForSlot(cards: GuestCardConfig[], slot: GuestCardConfig["slot"]) {
  return cards.filter((card) => card.slot === slot).sort((a, b) => a.slotIndex - b.slotIndex);
}

function sortGuestCards(cards: GuestCardConfig[]) {
  return [...cards].sort((a, b) => a.slot === b.slot ? a.slotIndex - b.slotIndex : a.slot.localeCompare(b.slot));
}

function normalizeSlotIndexes(cards: GuestCardConfig[]) {
  return (["hero", "shortcut"] as GuestCardConfig["slot"][]).flatMap((slot) =>
    cardsForSlot(cards, slot).map((card, slotIndex) => ({ ...card, slotIndex }))
  );
}

function sanitizeCardForPlan(card: GuestCardConfig, limits: GuestCardPlanLimits): GuestCardConfig {
  const allowedKinds = limits.allowedKinds as GuestCardConfig["kind"][];
  const kind = allowedKinds.includes(card.kind) ? card.kind : allowedKinds[0];
  const actionType = card.actionType === "external_url" && !limits.allowExternalLinks ? "none" : card.actionType;
  return {
    ...card,
    kind,
    imageUrl: limits.allowCustomImages ? normalizeOptionalText(card.imageUrl) : undefined,
    description: normalizeOptionalText(card.description),
    icon: normalizeOptionalText(card.icon),
    actionLabel: actionType === "none" ? undefined : normalizeOptionalText(card.actionLabel),
    actionType,
    actionTarget: actionType === "none" ? undefined : normalizeOptionalText(card.actionTarget)
  };
}

function validateGuestCards(cards: GuestCardConfig[], limits?: GuestCardPlanLimits) {
  if (!limits) return [];
  const errors: string[] = [];
  const heroCount = cardsForSlot(cards, "hero").length;
  const shortcutCount = cardsForSlot(cards, "shortcut").length;
  if (heroCount > limits.maxHeroCards) errors.push(`Votre offre autorise ${limits.maxHeroCards} cartes principales maximum.`);
  if (shortcutCount > limits.maxShortcutCards) errors.push(`Votre offre autorise ${limits.maxShortcutCards} raccourcis maximum.`);

  cards.forEach((card) => {
    if (!card.title.trim()) errors.push("Chaque carte doit avoir un titre.");
    if (!limits.allowedKinds.includes(card.kind)) errors.push(`Le type ${CARD_KIND_LABELS[card.kind]} n'est pas inclus dans votre offre.`);
    if (card.imageUrl?.trim() && !limits.allowCustomImages) errors.push("Les images personnalisees ne sont pas incluses dans votre offre.");
    if (card.actionType === "external_url" && !limits.allowExternalLinks) errors.push("Les liens externes ne sont pas inclus dans votre offre.");
  });
  return errors;
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function ServiceCard({ svc, highlighted }: { svc: ServiceCatalogItem; highlighted: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        highlighted
          ? "border-amber-300/10 bg-amber-300/5"
          : "border-white/5 bg-white/[0.02]"
      }`}
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{svc.labelFr}</p>
          {highlighted ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-amber-300/15 px-1.5 py-0.5">
              <Star className="h-3 w-3 text-amber-300" />
            </span>
          ) : null}
        </div>
        <p className="text-xs leading-relaxed text-zinc-400">{svc.descriptionFr}</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] text-zinc-500">{CATEGORY_LABELS[svc.category] ?? svc.category}</span>
        {svc.isPartnerMonetizable ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/10 bg-emerald-400/5 px-1.5 py-0.5 text-[10px] text-emerald-400">
            Partenaire
          </span>
        ) : null}
      </div>
    </div>
  );
}
