import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Hotel,
  Loader2,
  LogOut,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { AuthGate } from "../../components/auth/AuthGate";
import { QrCodePdfButton } from "../../components/QrCodePdfButton";
import { api, type HotelPayload } from "../../lib/api";
import { emptyHotelForm, guestUrl, receptionUrl, normalizeHotelPayload, slugify, type HotelFormState } from "../../lib/hotelOnboarding";
import { useAppStore } from "../../stores/appStore";
import { guestThemeIds, guestThemes, resolveGuestTheme, type GuestThemeId } from "../../themes";

type HotelRecord = HotelPayload & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  settings?: { guestTheme?: GuestThemeId } | null;
};

export function AdminApp() {
  return (
    <AuthGate title="Connexion admin" subtitle="Acces securise a l'administration plateforme" defaultEmail="admin@paris-local.test" allowedRoles={["super_admin"]}>
      <Routes>
        <Route path="/" element={<AdminHotelsPage />} />
        <Route path="/hotels" element={<AdminHotelsPage />} />
        <Route path="/hotels/new" element={<CreateHotelPage />} />
        <Route path="/hotels/:hotelId" element={<HotelDetailsPage />} />
        <Route path="/users" element={<AdminPlaceholder title="Utilisateurs" description="Gestion des comptes plateforme et acces hotel. La creation d'utilisateurs reception sera branchee dans un ticket dedie." icon={<Users className="h-5 w-5" />} />} />
        <Route path="/deployments" element={<AdminPlaceholder title="Deploiements" description="Suivi Coolify et releases multi-tenant. Les domaines restent geres dans Coolify." icon={<Sparkles className="h-5 w-5" />} />} />
        <Route path="/settings" element={<AdminPlaceholder title="Parametres" description="Preferences globales de plateforme et gouvernance operationnelle." icon={<Settings className="h-5 w-5" />} />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthGate>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAppStore();
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_34%),linear-gradient(180deg,#020617,#0f172a)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-8 md:py-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between md:p-5">
          <Link to="/admin" className="flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-amber-300/10">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Paris Local</span>
              <span className="block text-lg font-semibold tracking-tight text-white">Super Admin</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <AdminNavLink to="/admin/hotels" label="Hotels" />
            <AdminNavLink to="/generator" label="Generateur" />
            <AdminNavLink to="/admin/users" label="Utilisateurs" />
          </nav>
          <div className="flex items-center justify-between gap-3 md:justify-end">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{currentUser?.name}</p>
              <p className="text-xs text-slate-400">{currentUser?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-red-300/30 hover:bg-red-500/10 hover:text-red-100 focus:outline-none focus:ring-4 focus:ring-red-300/10"
              aria-label="Se deconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function AdminNavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-slate-300 transition hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-300/10" to={to}>
      {label}
    </Link>
  );
}

function AdminHotelsPage() {
  const { token } = useAppStore();
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function loadHotels() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setHotels(await api.hotels(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les hotels");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHotels();
  }, [token]);

  const filteredHotels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return hotels;
    return hotels.filter((hotel) => [hotel.name, hotel.slug, hotel.city, hotel.email].some((value) => value?.toLowerCase().includes(normalizedQuery)));
  }, [hotels, query]);

  const activeCount = hotels.filter((hotel) => hotel.status === "active").length;
  const draftCount = hotels.filter((hotel) => hotel.status === "draft").length;

  return (
    <AdminShell>
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-lg shadow-black/20 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Onboarding hotels</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Hotels clients</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Creez un hotel une seule fois. Le sous-domaine client, le dashboard reception et le QR code utilisent ensuite le slug multi-tenant.</p>
            </div>
            <Link to="/admin/hotels/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20">
              <Plus className="h-4 w-4" />
              Creer un hotel
            </Link>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Metric label="Hotels" value={hotels.length} />
            <Metric label="Actifs" value={activeCount} tone="emerald" />
            <Metric label="Brouillons" value={draftCount} tone="amber" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-6 shadow-lg shadow-black/20">
          <Hotel className="h-7 w-7 text-emerald-200" />
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">Workflow sans code</h2>
          <p className="mt-3 text-sm leading-6 text-emerald-50/75">Chaque creation ajoute une ligne `hotels`, initialise `hotel_settings`, expose les URLs canoniques et produit un QR code immediatement exploitable.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/75 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Liste des hotels</h2>
            <p className="mt-1 text-sm text-slate-400">URLs client et reception generees depuis le slug.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Rechercher un hotel</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-10 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10 sm:w-72"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher nom, slug, ville..."
              />
            </label>
            <button type="button" onClick={() => void loadHotels()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>
        {loading ? <LoadingState label="Chargement des hotels" /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && filteredHotels.length === 0 ? <EmptyState /> : null}
        {!loading && !error && filteredHotels.length > 0 ? <HotelTable hotels={filteredHotels} /> : null}
      </section>
    </AdminShell>
  );
}

function HotelTable({ hotels }: { hotels: HotelRecord[] }) {
  return (
    <div className="overflow-hidden">
      <div className="hidden grid-cols-[1.1fr_0.8fr_0.7fr_1.4fr_1.4fr_96px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid">
        <span>Nom</span>
        <span>Slug</span>
        <span>Statut</span>
        <span>URL client</span>
        <span>URL reception</span>
        <span className="text-right">Action</span>
      </div>
      <div className="divide-y divide-white/10">
        {hotels.map((hotel) => (
          <article key={hotel.id} className="grid gap-4 px-4 py-4 transition hover:bg-white/[0.03] lg:grid-cols-[1.1fr_0.8fr_0.7fr_1.4fr_1.4fr_96px] lg:items-center lg:px-5">
            <div>
              <p className="font-semibold tracking-tight text-white">{hotel.name}</p>
              <p className="mt-1 text-sm text-slate-400">{[hotel.city, hotel.country].filter(Boolean).join(", ") || "Adresse a completer"}</p>
            </div>
            <code className="w-fit rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1 text-sm text-slate-300">{hotel.slug}</code>
            <StatusBadge status={hotel.status ?? "draft"} />
            <UrlLink href={guestUrl(hotel.slug)} />
            <UrlLink href={receptionUrl(hotel.slug)} />
            <Link to={`/admin/hotels/${hotel.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-300/10">
              Voir
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

function CreateHotelPage() {
  const { token } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<HotelFormState>(emptyHotelForm);
  const [guestTheme, setGuestTheme] = useState<GuestThemeId>("parisian_boutique");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdHotel, setCreatedHotel] = useState<HotelRecord | null>(null);

  function updateField<K extends keyof HotelFormState>(field: K, value: HotelFormState[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && !slugTouched) next.slug = slugify(String(value));
      if (field === "slug") next.slug = slugify(String(value));
      return next;
    });
    if (field === "slug") setSlugTouched(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.createHotel(normalizeHotelPayload(form), token);
      const settings = await api.updateHotelSettings(created.id, { guestTheme }, token);
      setCreatedHotel({ ...created, settings });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => navigate("/admin/hotels")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10">
          <ArrowLeft className="h-4 w-4" />
          Retour hotels
        </button>
        <Link to="/generator" className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 focus:outline-none focus:ring-4 focus:ring-emerald-300/10">
          Ouvrir le generateur
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-black/20 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Nouvel hotel</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Creation multi-tenant</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Le formulaire cree l'hotel et ses settings par defaut. Aucune nouvelle application React n'est generee.</p>
          <HotelForm form={form} guestTheme={guestTheme} onThemeChange={setGuestTheme} onChange={updateField} onSubmit={submit} saving={saving} error={error} submitLabel="Creer l'hotel" />
        </section>
        <HotelLaunchCard hotel={createdHotel} previewSlug={slugify(form.slug || form.name)} />
      </div>
    </AdminShell>
  );
}

function HotelDetailsPage() {
  const { hotelId } = useParams();
  const { token } = useAppStore();
  const [hotel, setHotel] = useState<HotelRecord | null>(null);
  const [guestTheme, setGuestTheme] = useState<GuestThemeId>("parisian_boutique");
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !hotelId) return;
    setLoading(true);
    api.hotel(hotelId, token)
      .then((loaded) => {
        setHotel(loaded);
        setGuestTheme(resolveGuestTheme(loaded.settings?.guestTheme).id);
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
          </section>
          <HotelLaunchCard hotel={hotel} previewSlug={hotel.slug} />
        </div>
      ) : null}
    </AdminShell>
  );
}

function HotelForm({
  form,
  guestTheme,
  onThemeChange,
  onChange,
  onSubmit,
  saving,
  error,
  submitLabel
}: {
  form: HotelFormState;
  guestTheme?: GuestThemeId;
  onThemeChange?: (value: GuestThemeId) => void;
  onChange: <K extends keyof HotelFormState>(field: K, value: HotelFormState[K]) => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
  error: string | null;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nom hotel" value={form.name} onChange={(value) => onChange("name", value)} placeholder="Hotel Vendome" required />
        <Field label="Slug" value={form.slug} onChange={(value) => onChange("slug", value)} placeholder="vendome" helper="Utilise pour les URLs client et reception." required />
        <Field label="Adresse" value={form.address ?? ""} onChange={(value) => onChange("address", value)} placeholder="12 rue de la Paix" />
        <Field label="Ville" value={form.city ?? ""} onChange={(value) => onChange("city", value)} placeholder="Paris" />
        <Field label="Pays" value={form.country ?? ""} onChange={(value) => onChange("country", value)} placeholder="France" />
        <Field label="Telephone" value={form.phone ?? ""} onChange={(value) => onChange("phone", value)} placeholder="+33 1 00 00 00 00" />
        <Field type="email" label="Email" value={form.email} onChange={(value) => onChange("email", value)} placeholder="reception@hotel.fr" required />
        <Field type="url" label="Site web" value={form.website ?? ""} onChange={(value) => onChange("website", value)} placeholder="https://hotel.fr" />
        <Field label="Logo URL" value={form.logoUrl ?? ""} onChange={(value) => onChange("logoUrl", value)} placeholder="https://..." />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">Statut</span>
          <select
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10"
            value={form.status}
            onChange={(event) => onChange("status", event.target.value as HotelFormState["status"])}
          >
            <option value="active">Actif</option>
            <option value="draft">Brouillon</option>
            <option value="inactive">Inactif</option>
          </select>
        </label>
        <ColorField label="Couleur principale" value={form.primaryColor ?? "#c9a84c"} onChange={(value) => onChange("primaryColor", value)} />
        <ColorField label="Couleur secondaire" value={form.secondaryColor ?? "#0f172a"} onChange={(value) => onChange("secondaryColor", value)} />
      </div>
      {guestTheme && onThemeChange ? <ThemePicker value={guestTheme} onChange={onThemeChange} /> : null}
      {error ? <ErrorState message={error} compact /> : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {saving ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}

function HotelLaunchCard({ hotel, previewSlug }: { hotel: HotelRecord | null; previewSlug: string }) {
  const slug = hotel?.slug || previewSlug;
  const clientUrl = slug ? guestUrl(slug) : "";
  const adminUrl = slug ? receptionUrl(slug) : "";

  return (
    <aside className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-black/20 md:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">URLs finales</h2>
          <p className="text-sm text-slate-400">{hotel ? "Hotel cree avec succes." : "Preview generee depuis le slug."}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <LaunchUrl label="URL client" url={clientUrl} />
        <LaunchUrl label="URL reception" url={adminUrl} />
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white p-4 text-slate-950">
        {clientUrl ? (
          <QRCodeSVG value={clientUrl} size={208} marginSize={2} className="mx-auto h-auto w-full max-w-56" />
        ) : (
          <div className="grid aspect-square place-items-center rounded-xl bg-slate-100 text-center text-sm text-slate-500">Le QR code apparaitra apres saisie du slug.</div>
        )}
      </div>
      {clientUrl ? (
        <div className="mt-4">
          <QrCodePdfButton url={clientUrl} hotelName={hotel?.name || slug} slug={slug} />
        </div>
      ) : null}
      {hotel ? (
        <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">Pret pour impression QR code et partage reception.</p>
      ) : null}
    </aside>
  );
}

function LaunchUrl({ label, url }: { label: string; url: string }) {
  const disabled = !url;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate text-sm text-slate-200">{url || "Slug requis"}</code>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void navigator.clipboard?.writeText(url)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-amber-300/30 hover:text-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Copier ${label}`}
        >
          <Copy className="h-4 w-4" />
        </button>
        <a
          href={url || undefined}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-emerald-300/30 hover:text-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-300/10 aria-disabled:pointer-events-none aria-disabled:opacity-40"
          aria-disabled={disabled}
          aria-label={`Ouvrir ${label}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, helper, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helper?: string; type?: string; required?: boolean }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span className="flex rounded-xl border border-white/10 bg-slate-950/70 p-2 transition focus-within:border-amber-300/50 focus-within:ring-4 focus-within:ring-amber-300/10">
        <input className="h-10 w-12 rounded-lg border-0 bg-transparent" type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} />
        <input className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-100 outline-none" value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function ThemePicker({ value, onChange }: { value: GuestThemeId; onChange: (value: GuestThemeId) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-300">Theme app client</p>
        <p className="mt-1 text-xs text-slate-500">Choisissez le template UX/UI applique au sous-domaine client.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {guestThemeIds.map((themeId) => {
          const theme = guestThemes[themeId];
          const active = value === themeId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange(theme.id)}
              className={`overflow-hidden rounded-2xl border text-left transition focus:outline-none focus:ring-4 focus:ring-amber-300/10 ${active ? "border-amber-300/50 bg-amber-300/10" : "border-white/10 bg-slate-950/50 hover:bg-white/5"}`}
            >
              <span className={`block h-20 ${theme.preview}`} />
              <span className="block p-4">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold tracking-tight text-white">{theme.name}</span>
                  {active ? <CheckCircle2 className="h-4 w-4 text-amber-200" /> : null}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-400">{theme.description}</span>
                <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{theme.mood}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status === "active" ? "Actif" : status === "inactive" ? "Inactif" : "Brouillon";
  const tone = status === "active" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : status === "inactive" ? "border-red-300/20 bg-red-500/10 text-red-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function UrlLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="min-w-0 truncate text-sm text-sky-200 transition hover:text-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-300/10">
      {href}
    </a>
  );
}

function Metric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "emerald" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-200" : tone === "amber" ? "text-amber-200" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function InfoBlock({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-950/50 p-4 ${wide ? "md:col-span-2" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm text-slate-200">{value}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function ErrorState({ message, compact = false }: { message: string; compact?: boolean }) {
  return <div className={`rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100 ${compact ? "" : "m-5"}`}>{message}</div>;
}

function EmptyState() {
  return (
    <div className="grid place-items-center p-10 text-center">
      <Building2 className="h-10 w-10 text-slate-500" />
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">Aucun hotel trouve</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Creez le premier hotel client pour generer ses URLs et son QR code.</p>
      <Link to="/admin/hotels/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20">
        <Plus className="h-4 w-4" />
        Creer un hotel
      </Link>
    </div>
  );
}

function AdminPlaceholder({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <AdminShell>
      <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">{icon}</div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
        <Link to="/admin/hotels" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10">
          Retour hotels
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </AdminShell>
  );
}
