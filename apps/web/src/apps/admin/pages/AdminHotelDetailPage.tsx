import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Palette, ShieldCheck, Sparkles, Trash2, Upload, Users, X } from "lucide-react";
import { SERVICE_CATALOG, type CommercialPackage, type ServiceCatalogItem } from "@paris-local/shared";
import { api, type CommercialPackageValue, type HotelPlanResponse, type HotelServiceConfig, type HotelServicesResponse } from "../../../lib/api";
import { useAppStore } from "../../../stores/appStore";
import { resolveGuestTheme, type GuestThemeId } from "../../../themes";
import { AdminShell } from "../AdminShell";
import type { HotelRecord, RecommendationFormState } from "../admin.types";
import { emptyRecommendationForm, normalizeRecommendationForm } from "../admin.types";
import { Field, ThemePicker } from "../components/AdminField";
import { ErrorState, InfoBlock, LoadingState } from "../components/AdminSharedUI";
import { StatusBadge, UserStatusBadge } from "../components/AdminStatusBadge";
import { HotelLaunchCard } from "../components/HotelLaunchCard";

export function AdminHotelDetailPage() {
  const { hotelId } = useParams();
  const { token } = useAppStore();
  const [hotel, setHotel] = useState<HotelRecord | null>(null);
  const [guestTheme, setGuestTheme] = useState<GuestThemeId>("parisian_boutique");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [hotelPlan, setHotelPlan] = useState<HotelPlanResponse | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CommercialPackageValue>("boutique");
  const [planSaving, setPlanSaving] = useState(false);
  const [planMessage, setPlanMessage] = useState("");
  const [recommendationForm, setRecommendationForm] = useState<RecommendationFormState>(emptyRecommendationForm);
  const [editingRecommendationId, setEditingRecommendationId] = useState<string | null>(null);
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [receptionAccess, setReceptionAccess] = useState<any | null>(null);
  const [receptionAccessMessage, setReceptionAccessMessage] = useState("");
  const [receptionAccessSaving, setReceptionAccessSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState("");
  const [hotelServices, setHotelServices] = useState<HotelServicesResponse | null>(null);
  const [hotelServicesDraft, setHotelServicesDraft] = useState<HotelServiceConfig[]>([]);
  const [hotelServicesSaving, setHotelServicesSaving] = useState(false);
  const [hotelServicesMessage, setHotelServicesMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !hotelId) return;
    setLoading(true);
    Promise.all([
      api.hotel(hotelId, token),
      api.hotelRecommendations(hotelId, token),
      api.getHotelPlan(hotelId, token),
      api.getHotelServices(hotelId, token).catch(() => null)
    ])
      .then(([loaded, loadedRecommendations, loadedPlan, loadedServices]) => {
        setHotel(loaded);
        setGuestTheme(resolveGuestTheme(loaded.settings?.guestTheme).id);
        setRecommendations(loadedRecommendations);
        setHotelPlan(loadedPlan);
        setSelectedPlan(loadedPlan.commercialPackage);
        if (loadedServices) {
          setHotelServices(loadedServices);
          setHotelServicesDraft(loadedServices.enabledServices);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Hotel introuvable"))
      .finally(() => setLoading(false));
  }, [hotelId, token]);

  async function saveTheme() {
    if (!token || !hotel) return;
    setThemeSaving(true);
    setThemeMessage("");
    try {
      const settings = await api.updateHotelSettings(hotel.id, { guestTheme }, token);
      setHotel({ ...hotel, settings });
      setThemeMessage("Theme client enregistre. Le changement est visible sans redeploiement.");
    } catch (err) {
      setThemeMessage(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setThemeSaving(false);
    }
  }

  async function savePlan() {
    if (!token || !hotel) return;
    setPlanSaving(true);
    setPlanMessage("");
    try {
      const updatedPlan = await api.updateHotelPlan(hotel.id, selectedPlan, token);
      setHotelPlan(updatedPlan);
      setSelectedPlan(updatedPlan.commercialPackage);
      setPlanMessage("Plan mis a jour.");
    } catch (err) {
      setPlanMessage(err instanceof Error ? err.message : "Impossible de mettre a jour le plan");
    } finally {
      setPlanSaving(false);
    }
  }

  async function saveRecommendation(event: FormEvent) {
    event.preventDefault();
    if (!token || !hotel) return;
    setRecommendationMessage("");
    const payload = normalizeRecommendationForm(recommendationForm);
    try {
      const saved = editingRecommendationId
        ? await api.updateRecommendation(editingRecommendationId, payload, token)
        : await api.createRecommendation(hotel.id, payload, token);
      setRecommendations((current) => editingRecommendationId ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setRecommendationForm(emptyRecommendationForm);
      setEditingRecommendationId(null);
      setRecommendationMessage("Recommandation enregistree. Elle est visible cote client si elle est active.");
    } catch (err) {
      setRecommendationMessage(err instanceof Error ? err.message : "Enregistrement impossible");
    }
  }

  async function createReceptionAccess() {
    if (!token || !hotel) return;
    setReceptionAccessSaving(true);
    setReceptionAccessMessage("");
    try {
      const access = await api.createReceptionUser(hotel.id, {}, token);
      const refreshedHotel = await api.hotel(hotel.id, token);
      setReceptionAccess(access);
      setHotel(refreshedHotel);
      setReceptionAccessMessage("Acces reception cree et associe a cet hotel.");
    } catch (err) {
      setReceptionAccessMessage(err instanceof Error ? err.message : "Creation acces reception impossible");
    } finally {
      setReceptionAccessSaving(false);
    }
  }

  async function saveHotelServices() {
    if (!token || !hotel) return;
    setHotelServicesSaving(true);
    setHotelServicesMessage("");
    try {
      const updated = await api.updateHotelServices(hotel.id, hotelServicesDraft, token);
      setHotelServices(updated);
      setHotelServicesDraft(updated.enabledServices);
      setHotelServicesMessage("Services autorises mis a jour. Visibles cote Guest App apres sauvegarde.");
    } catch (err) {
      setHotelServicesMessage(err instanceof Error ? err.message : "Mise a jour des services impossible");
    } finally {
      setHotelServicesSaving(false);
    }
  }

  async function toggleRecommendation(recommendation: any, changes: Record<string, unknown>) {
    if (!token) return;
    const updated = await api.updateRecommendation(recommendation.id, changes, token);
    setRecommendations((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  function editRecommendation(recommendation: any) {
    setEditingRecommendationId(recommendation.id);
    setRecommendationForm({
      category: recommendation.category ?? "",
      name: recommendation.name ?? "",
      description: recommendation.description ?? "",
      address: recommendation.address ?? "",
      phone: recommendation.phone ?? "",
      website: recommendation.website ?? "",
      distance: recommendation.distance ?? "",
      imageUrl: recommendation.imageUrl ?? "",
      tags: Array.isArray(recommendation.tags) ? recommendation.tags.join(", ") : "",
      openingHours: recommendation.openingHours ?? "",
      sortOrder: String(recommendation.sortOrder ?? 0),
      isFeatured: Boolean(recommendation.isFeatured),
      isActive: recommendation.isActive !== false
    });
  }

  return (
    <AdminShell>
      <Link to="/admin/hotels" className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10">
        <ArrowLeft className="h-4 w-4" />
        Retour hotels
      </Link>
      {loading ? <LoadingState label="Chargement de la fiche hotel" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {hotel ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-lg shadow-black/20">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Fiche hotel</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{hotel.name}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{hotel.description || "Description a completer dans le generateur."}</p>
              </div>
              <StatusBadge status={hotel.status ?? "draft"} />
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <InfoBlock label="Slug" value={hotel.slug} />
              <InfoBlock label="Ville" value={[hotel.city, hotel.country].filter(Boolean).join(", ")} />
              <InfoBlock label="Email" value={hotel.email} />
              <InfoBlock label="Telephone" value={hotel.phone || "Non renseigne"} />
              <InfoBlock label="Adresse" value={hotel.address || "Non renseignee"} wide />
              <InfoBlock label="Site web" value={hotel.website || "Non renseigne"} wide />
            </div>
            <div className="mt-7 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/80">Theme Guest App</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Identite visuelle client</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Le theme s'applique a l'app client multi-tenant sans redeploiement.</p>
                </div>
                <button type="button" onClick={() => void saveTheme()} disabled={themeSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:opacity-60">
                  {themeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
                  Enregistrer le theme
                </button>
              </div>
              <ThemePicker value={guestTheme} onChange={setGuestTheme} />
              {themeMessage ? <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{themeMessage}</p> : null}
            </div>
            <HotelPlanCard
              plan={hotelPlan}
              selectedPlan={selectedPlan}
              saving={planSaving}
              message={planMessage}
              onPlanChange={setSelectedPlan}
              onSave={() => void savePlan()}
            />
            <HotelServicesCard
              plan={hotelPlan}
              services={hotelServices}
              draft={hotelServicesDraft}
              saving={hotelServicesSaving}
              message={hotelServicesMessage}
              onChange={setHotelServicesDraft}
              onSave={() => void saveHotelServices()}
            />
            <ReceptionAccessCard hotel={hotel} access={receptionAccess} message={receptionAccessMessage} saving={receptionAccessSaving} onCreate={() => void createReceptionAccess()} />
            <RecommendationManager
              hotelId={hotel.id}
              token={token!}
              recommendations={recommendations}
              form={recommendationForm}
              editingId={editingRecommendationId}
              message={recommendationMessage}
              onFormChange={setRecommendationForm}
              onSubmit={saveRecommendation}
              onEdit={editRecommendation}
              onToggle={(recommendation, changes) => void toggleRecommendation(recommendation, changes)}
              onCancel={() => {
                setEditingRecommendationId(null);
                setRecommendationForm(emptyRecommendationForm);
              }}
            />
          </section>
          <HotelLaunchCard hotel={hotel} previewSlug={hotel.slug} />
        </div>
      ) : null}
    </AdminShell>
  );
}

const PLAN_OPTIONS: Array<{ value: CommercialPackageValue; label: string }> = [
  { value: "starter", label: "Starter" },
  { value: "boutique", label: "Boutique" },
  { value: "premium", label: "Premium" },
  { value: "palace", label: "Palace" }
];

const CARD_KIND_LABELS: Record<string, string> = {
  info: "Information",
  service: "Service",
  guide: "Guide",
  promo: "Promotion",
  custom: "Personnalisee"
};

function formatPlanLabel(plan?: CommercialPackageValue) {
  return PLAN_OPTIONS.find((option) => option.value === plan)?.label ?? "Non renseigne";
}

function formatYesNo(value?: boolean) {
  return value ? "Oui" : "Non";
}

function HotelPlanCard({
  plan,
  selectedPlan,
  saving,
  message,
  onPlanChange,
  onSave
}: {
  plan: HotelPlanResponse | null;
  selectedPlan: CommercialPackageValue;
  saving: boolean;
  message: string;
  onPlanChange: (plan: CommercialPackageValue) => void;
  onSave: () => void;
}) {
  const limits = plan?.limits;

  return (
    <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/90">Plan commercial Guest App</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Offre actuelle : {formatPlanLabel(plan?.commercialPackage)}</h2>
          <p className="mt-2 text-sm leading-6 text-amber-50/75">Pilotez l'offre commerciale et les limites des cartes visibles dans l'app client.</p>
        </div>
        <div className="grid gap-3 sm:min-w-[260px]">
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Modifier l'offre
            <select
              value={selectedPlan}
              onChange={(event) => onPlanChange(event.target.value as CommercialPackageValue)}
              className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10"
            >
              {PLAN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onSave} disabled={saving || selectedPlan === plan?.commercialPackage} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <InfoBlock label="Cartes principales" value={limits ? String(limits.maxHeroCards) : "Chargement"} />
        <InfoBlock label="Raccourcis" value={limits ? String(limits.maxShortcutCards) : "Chargement"} />
        <InfoBlock label="Images personnalisees" value={limits ? formatYesNo(limits.allowCustomImages) : "Chargement"} />
        <InfoBlock label="Liens externes" value={limits ? formatYesNo(limits.allowExternalLinks) : "Chargement"} />
        <InfoBlock label="Taille image max" value={limits?.maxImageMb ? `${limits.maxImageMb} Mo` : "Non inclus"} />
        <InfoBlock label="Types de cartes" value={limits ? limits.allowedKinds.map((kind) => CARD_KIND_LABELS[kind] ?? kind).join(", ") : "Chargement"} />
      </div>

      {message ? <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-amber-50">{message}</p> : null}
    </div>
  );
}

const CATEGORY_SUGGESTIONS = [
  "Restaurants","Bars","Cafes","Boulangeries","Musees","Monuments","Shopping","Transports",
  "Pharmacies","Supermarches","Croisieres","Tours en bus","Experiences locales","Spectacles",
  "Jazz clubs","Marches locaux","Famille","Romantique","Business","Bien-etre","Partenaire hotel",
  "Coup de coeur","Bons plans quartier"
];

export function RecommendationManager({
  hotelId,
  token,
  recommendations,
  form,
  editingId,
  message,
  onFormChange,
  onSubmit,
  onEdit,
  onToggle,
  onCancel
}: {
  hotelId: string;
  token: string;
  recommendations: any[];
  form: RecommendationFormState;
  editingId: string | null;
  message: string;
  onFormChange: Dispatch<SetStateAction<RecommendationFormState>>;
  onSubmit: (event: FormEvent) => void;
  onEdit: (recommendation: any) => void;
  onToggle: (recommendation: any, changes: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  function update<K extends keyof RecommendationFormState>(field: K, value: RecommendationFormState[K]) {
    onFormChange((current) => ({ ...current, [field]: value }));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploadError("");

    if (!file.type.startsWith("image/")) {
      setImageUploadError("Seules les images sont acceptees.");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageUploadError("L'image ne doit pas depasser 10 Mo.");
      event.target.value = "";
      return;
    }

    setImageUploading(true);
    try {
      const uploaded = await api.uploadHotelFile(hotelId, file, token);
      update("imageUrl", uploaded.url ?? "");
    } catch {
      setImageUploadError("L'upload a echoue. Reessayez ou collez une URL manuellement.");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="mt-7 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/80">Guide local</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Recommandations hotel</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Restaurants, transports, commerces et adresses personnalisees par hotel. Les categories restent libres.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400">{recommendations.length} adresse(s)</span>
      </div>
      <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Categorie" value={form.category} onChange={(value) => update("category", value)} placeholder="restaurants, metro, bons plans..." required list="category-suggestions" />
        <Field label="Nom" value={form.name} onChange={(value) => update("name", value)} placeholder="Cafe de la Paix" required />
        <Field label="Description" value={form.description} onChange={(value) => update("description", value)} placeholder="Adresse selectionnee par l'hotel" />
        <Field label="Adresse" value={form.address} onChange={(value) => update("address", value)} placeholder="5 place..." />
        <Field label="Telephone" value={form.phone} onChange={(value) => update("phone", value)} placeholder="+33..." />
        <Field label="Site web" value={form.website} onChange={(value) => update("website", value)} placeholder="https://..." />
        <Field label="Distance" value={form.distance} onChange={(value) => update("distance", value)} placeholder="8 min a pied" />

        <div className="md:col-span-2 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Image</p>
          <p className="text-xs text-slate-500">Cette image sera affichee dans la Guest App.</p>

          {form.imageUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-white/10">
              <img src={form.imageUrl} alt="Apercu recommandation" className="h-40 w-full object-cover" />
              <button
                type="button"
                title="Retirer l'image"
                onClick={() => update("imageUrl", "")}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-slate-950/80 text-slate-200 backdrop-blur transition hover:bg-red-500/20 hover:text-red-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={imageUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:opacity-50"
            >
              {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {imageUploading ? "Upload en cours..." : "Choisir une image"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void handleImageUpload(e)}
            />
            <span className="text-xs text-slate-500">Max 10 Mo</span>
          </div>

          {imageUploadError ? (
            <p className="rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{imageUploadError}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <Field label="Ou coller une URL d'image externe" value={form.imageUrl} onChange={(value) => update("imageUrl", value)} placeholder="https://..." type="url" />
        </div>

        <Field label="Horaires" value={form.openingHours} onChange={(value) => update("openingHours", value)} placeholder="09:00 - 22:00" />
        <Field label="Tags" value={form.tags} onChange={(value) => update("tags", value)} placeholder="romantique, terrasse, famille" />
        <Field label="Ordre" type="number" value={form.sortOrder} onChange={(value) => update("sortOrder", value)} />
        <div className="grid gap-2 md:self-end">
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
            <input type="checkbox" checked={form.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} />
            Mettre en avant
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
            <input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} />
            Visible cote client
          </label>
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20">
            {editingId ? "Mettre a jour" : "Ajouter"}
          </button>
          {editingId ? <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5">Annuler</button> : null}
        </div>
      </form>
      {message ? <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
      <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
        {recommendations.length === 0 ? <p className="p-5 text-sm text-slate-500">Aucune recommandation pour cet hotel.</p> : null}
        {recommendations.map((recommendation) => (
          <div key={recommendation.id} className="grid gap-4 p-4 transition hover:bg-white/[0.03] lg:grid-cols-[1fr_120px_120px_220px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{recommendation.name}</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300">{recommendation.category}</span>
                {recommendation.isFeatured ? <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-xs text-amber-100">Featured</span> : null}
                {recommendation.isActive === false ? <span className="rounded-full border border-red-300/25 bg-red-500/10 px-2 py-1 text-xs text-red-100">Masquee</span> : null}
              </div>
              <p className="mt-1 truncate text-sm text-slate-400">{recommendation.description || recommendation.address || "Description a completer"}</p>
            </div>
            <span className="text-sm text-slate-400">{recommendation.distance || "-"}</span>
            <span className="text-sm text-slate-400">Ordre {recommendation.sortOrder ?? 0}</span>
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              <button type="button" onClick={() => onEdit(recommendation)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5">Editer</button>
              <button type="button" onClick={() => onToggle(recommendation, { isFeatured: !recommendation.isFeatured })} className="rounded-lg border border-amber-300/25 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-300/10">Avant</button>
              <button type="button" onClick={() => onToggle(recommendation, { isActive: recommendation.isActive === false })} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5">{recommendation.isActive === false ? "Activer" : "Masquer"}</button>
              <button type="button" onClick={() => onToggle(recommendation, { isActive: false })} className="rounded-lg border border-red-300/25 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/10" aria-label="Desactiver"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <datalist id="category-suggestions">
        {CATEGORY_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

export function ReceptionAccessCard({ hotel, access, message, saving, onCreate }: { hotel: HotelRecord; access: any | null; message: string; saving: boolean; onCreate: () => void }) {
  const users = Array.isArray((hotel as any).users) ? (hotel as any).users : [];
  const existing = users.find((entry: any) => entry.role === "receptionist" || entry.user?.role === "receptionist")?.user;
  const email = access?.email || existing?.email || `reception+${hotel.slug}@welcomeparis.hotelmanager.fr`;
  const password = access?.temporaryPassword;
  const status = access?.status || existing?.status || "active";

  return (
    <div className="mt-7 rounded-2xl border border-sky-300/20 bg-sky-300/10 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200/90">Acces reception</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Compte dashboard hotel</h2>
          <p className="mt-2 text-sm leading-6 text-sky-50/75">Chaque hotel doit avoir un utilisateur reception associe pour ouvrir son sous-domaine admin sans afficher un autre hotel.</p>
        </div>
        <button type="button" onClick={onCreate} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 focus:outline-none focus:ring-4 focus:ring-sky-300/20 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          {existing || access ? "Regenerer acces" : "Creer acces"}
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoBlock label="Email reception" value={email} />
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Statut acces</p>
          <div className="mt-2"><UserStatusBadge status={status} /></div>
        </div>
        <InfoBlock label="Mot de passe temporaire" value={password || "Non affiche. Regenerez si besoin."} />
      </div>
      {message ? <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-sky-50">{message}</p> : null}
    </div>
  );
}

const PACKAGE_RANK: Record<CommercialPackage, number> = {
  starter: 0,
  boutique: 1,
  premium: 2,
  palace: 3
};

const CATEGORY_LABELS: Record<string, string> = {
  transport: "Transport",
  food_beverage: "Restauration",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  reception: "Reception",
  concierge: "Conciergerie",
  local_guide: "Guide local",
  feedback: "Avis",
  crm: "CRM",
  partner: "Partenaire"
};

function HotelServicesCard({
  plan,
  services,
  draft,
  saving,
  message,
  onChange,
  onSave
}: {
  plan: HotelPlanResponse | null;
  services: HotelServicesResponse | null;
  draft: HotelServiceConfig[];
  saving: boolean;
  message: string;
  onChange: (next: HotelServiceConfig[]) => void;
  onSave: () => void;
}) {
  const planId: CommercialPackage = (plan?.commercialPackage ?? "boutique") as CommercialPackage;
  const planRank = PACKAGE_RANK[planId];
  const limits = services?.limits;
  const maxActive = limits?.maxActiveServices ?? 0;
  const allowedCategories = limits?.allowedCategories ?? [];
  const allowWellness = limits?.allowWellness ?? false;
  const allowPartner = limits?.allowPartnerServices ?? false;
  const allowCustomImages = limits?.allowCustomImages ?? false;
  const allowCustomServices = limits?.allowCustomServices ?? false;

  const draftByCode = useMemo(() => {
    const map = new Map<string, HotelServiceConfig>();
    for (const entry of draft) map.set(entry.serviceCode, entry);
    return map;
  }, [draft]);

  const activeCount = draft.filter((entry) => entry.enabled).length;
  const overLimit = activeCount > maxActive;

  const eligible = (service: ServiceCatalogItem) => {
    if (PACKAGE_RANK[service.minPackage] > planRank) return { allowed: false, reason: `Min ${service.minPackage}` };
    if (service.isPartnerMonetizable && !allowPartner) return { allowed: false, reason: "Partenaire verrouille" };
    if (allowedCategories.length && !allowedCategories.includes(service.category as never)) {
      return { allowed: false, reason: "Categorie verrouillee" };
    }
    return { allowed: true, reason: "" };
  };

  function toggleService(service: ServiceCatalogItem) {
    const check = eligible(service);
    if (!check.allowed) return;
    const existing = draftByCode.get(service.id);
    if (existing) {
      onChange(draft.map((entry) => entry.serviceCode === service.id ? { ...entry, enabled: !entry.enabled } : entry));
    } else {
      const next: HotelServiceConfig = {
        serviceCode: service.id,
        enabled: true,
        order: draft.length,
        visibleInGuestApp: true,
        visibleAsCard: true,
        visibleInServicesPage: true
      };
      onChange([...draft, next]);
    }
  }

  return (
    <div className="mt-7 rounded-2xl border border-violet-300/20 bg-violet-300/5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200/90">Services Guest App</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Services autorises</h2>
          <p className="mt-2 text-sm leading-6 text-violet-50/80">
            Selectionnez les services que le client voit dans l'app. Les services hors forfait sont verrouilles. Le forfait se change plus haut.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${overLimit ? "border-red-300/30 bg-red-500/10 text-red-100" : "border-violet-300/30 bg-violet-300/10 text-violet-100"}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {activeCount} / {maxActive || "?"} services actifs
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || overLimit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-200 focus:outline-none focus:ring-4 focus:ring-violet-300/20 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Enregistrer les services
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoBlock label="Forfait actuel" value={formatPlanLabel(planId)} />
        <InfoBlock label="Services max" value={String(maxActive)} />
        <InfoBlock label="Wellness autorise" value={formatYesNo(allowWellness)} />
        <InfoBlock label="Partenaires autorises" value={formatYesNo(allowPartner)} />
        <InfoBlock label="Images personnalisees" value={formatYesNo(allowCustomImages)} />
        <InfoBlock label="Services custom" value={formatYesNo(allowCustomServices)} />
        <InfoBlock label="Categories autorisees" value={allowedCategories.length ? allowedCategories.join(", ") : "Aucune"} wide />
      </div>

      {overLimit ? (
        <p className="mt-4 rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {activeCount - maxActive} service(s) au dessus de la limite du forfait. Desactivez avant d'enregistrer.
        </p>
      ) : null}
      {message ? <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-violet-50">{message}</p> : null}

      <div className="mt-5 grid gap-2">
        {SERVICE_CATALOG.map((service) => {
          const check = eligible(service);
          const draftEntry = draftByCode.get(service.id);
          const enabled = draftEntry?.enabled ?? false;
          const label = CATEGORY_LABELS[service.category] ?? service.category;
          return (
            <label
              key={service.id}
              className={`flex items-start gap-3 rounded-2xl border p-3 transition ${check.allowed ? (enabled ? "border-violet-300/40 bg-violet-300/10" : "border-white/10 bg-slate-950/40 hover:bg-white/5") : "border-white/5 bg-slate-950/30 opacity-60"}`}
            >
              <input
                type="checkbox"
                checked={enabled}
                disabled={!check.allowed || saving}
                onChange={() => toggleService(service)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-400 focus:ring-violet-300/30 disabled:cursor-not-allowed"
                aria-label={`Activer ${service.labelFr}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{service.labelFr}</p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300">{label}</span>
                  {service.isPartnerMonetizable ? (
                    <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold text-amber-100">Partenaire</span>
                  ) : null}
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300">Min: {service.minPackage}</span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">{service.descriptionFr}</p>
                {!check.allowed ? <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-red-200">Verrouille: {check.reason}</p> : null}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
