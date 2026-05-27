import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Palette, Trash2, Users } from "lucide-react";
import { api } from "../../../lib/api";
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
  const [recommendationForm, setRecommendationForm] = useState<RecommendationFormState>(emptyRecommendationForm);
  const [editingRecommendationId, setEditingRecommendationId] = useState<string | null>(null);
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [receptionAccess, setReceptionAccess] = useState<any | null>(null);
  const [receptionAccessMessage, setReceptionAccessMessage] = useState("");
  const [receptionAccessSaving, setReceptionAccessSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !hotelId) return;
    setLoading(true);
    Promise.all([api.hotel(hotelId, token), api.hotelRecommendations(hotelId, token)])
      .then(([loaded, loadedRecommendations]) => {
        setHotel(loaded);
        setGuestTheme(resolveGuestTheme(loaded.settings?.guestTheme).id);
        setRecommendations(loadedRecommendations);
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
            <ReceptionAccessCard hotel={hotel} access={receptionAccess} message={receptionAccessMessage} saving={receptionAccessSaving} onCreate={() => void createReceptionAccess()} />
            <RecommendationManager
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

export function RecommendationManager({
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
  function update<K extends keyof RecommendationFormState>(field: K, value: RecommendationFormState[K]) {
    onFormChange((current) => ({ ...current, [field]: value }));
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
        <Field label="Categorie" value={form.category} onChange={(value) => update("category", value)} placeholder="restaurants, metro, bons plans..." required />
        <Field label="Nom" value={form.name} onChange={(value) => update("name", value)} placeholder="Cafe de la Paix" required />
        <Field label="Description" value={form.description} onChange={(value) => update("description", value)} placeholder="Adresse selectionnee par l'hotel" />
        <Field label="Adresse" value={form.address} onChange={(value) => update("address", value)} placeholder="5 place..." />
        <Field label="Telephone" value={form.phone} onChange={(value) => update("phone", value)} placeholder="+33..." />
        <Field label="Site web" value={form.website} onChange={(value) => update("website", value)} placeholder="https://..." />
        <Field label="Distance" value={form.distance} onChange={(value) => update("distance", value)} placeholder="8 min a pied" />
        <Field label="Image URL" value={form.imageUrl} onChange={(value) => update("imageUrl", value)} placeholder="https://..." />
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
