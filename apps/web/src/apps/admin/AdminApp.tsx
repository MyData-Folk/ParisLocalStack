import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Home,
  Hotel,
  Loader2,
  LogOut,
  Palette,
  Plus,
  QrCode,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
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

type RecommendationFormState = {
  category: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  distance: string;
  imageUrl: string;
  tags: string;
  openingHours: string;
  sortOrder: string;
  isFeatured: boolean;
  isActive: boolean;
};

const emptyRecommendationForm: RecommendationFormState = {
  category: "restaurants",
  name: "",
  description: "",
  address: "",
  phone: "",
  website: "",
  distance: "",
  imageUrl: "",
  tags: "",
  openingHours: "",
  sortOrder: "0",
  isFeatured: false,
  isActive: true
};

export function AdminApp() {
  return (
    <AuthGate title="Connexion admin" subtitle="Acces securise a l'administration plateforme" defaultEmail="admin@paris-local.test" allowedRoles={["super_admin"]}>
      <Routes>
        <Route path="/" element={<AdminDashboardPage />} />
        <Route path="/hotels" element={<AdminHotelsPage />} />
        <Route path="/hotels/new" element={<CreateHotelPage />} />
        <Route path="/hotels/:hotelId" element={<HotelDetailsPage />} />
        <Route path="/users" element={<AdminPlaceholder title="Utilisateurs" description="Gestion des comptes plateforme et acces hotel. La creation d'utilisateurs reception sera branchee dans un ticket dedie." icon={<Users className="h-5 w-5" />} />} />
        <Route path="/qr-codes" element={<AdminPlaceholder title="QR Codes" description="Centralisation des supports QR hotels. Les exports PDF restent disponibles dans chaque fiche hotel." icon={<QrCode className="h-5 w-5" />} />} />
        <Route path="/deployments" element={<AdminPlaceholder title="Deploiements" description="Suivi Coolify et releases multi-tenant. Les domaines restent geres dans Coolify." icon={<Sparkles className="h-5 w-5" />} />} />
        <Route path="/settings" element={<AdminPlaceholder title="Parametres" description="Preferences globales de plateforme et gouvernance operationnelle." icon={<Settings className="h-5 w-5" />} />} />
        <Route path="/integrations" element={<AdminPlaceholder title="Integrations" description="Connecteurs DNS, stockage, monitoring et outils externes de la plateforme." icon={<SlidersHorizontal className="h-5 w-5" />} />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthGate>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAppStore();
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 lg:flex">
      <aside className="border-b border-white/[0.07] bg-[#111115]/95 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
        <Link to="/admin" className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 transition hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-amber-400/15">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-amber-300">Paris Local</span>
              <span className="block truncate text-sm font-semibold tracking-tight text-white">Super Admin</span>
            </span>
        </Link>
        <nav className="mt-5 grid grid-cols-2 gap-2 text-sm lg:block lg:space-y-5">
          <AdminNavGroup label="Gestion">
            <AdminNavLink to="/admin" label="Tableau de bord" icon={<Home className="h-4 w-4" />} />
            <AdminNavLink to="/admin/hotels" label="Hotels" icon={<Hotel className="h-4 w-4" />} />
            <AdminNavLink to="/admin/users" label="Utilisateurs" icon={<Users className="h-4 w-4" />} />
          </AdminNavGroup>
          <AdminNavGroup label="Outils">
            <AdminNavLink to="/generator" label="Generator" icon={<Sparkles className="h-4 w-4" />} />
            <AdminNavLink to="/admin/qr-codes" label="QR Codes" icon={<QrCode className="h-4 w-4" />} />
            <AdminNavLink to="/admin/deployments" label="Deploiements" icon={<Rocket className="h-4 w-4" />} />
          </AdminNavGroup>
          <AdminNavGroup label="Configuration">
            <AdminNavLink to="/admin/settings" label="Parametres" icon={<Settings className="h-4 w-4" />} />
            <AdminNavLink to="/admin/integrations" label="Integrations" icon={<SlidersHorizontal className="h-4 w-4" />} />
          </AdminNavGroup>
        </nav>
        <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4 text-sm text-amber-100 lg:mt-auto">
          <p className="font-semibold">Plateforme multi-tenant</p>
          <p className="mt-1 text-xs leading-5 text-amber-100/70">Une base centrale, isolation par hotel_id, URLs canoniques par slug.</p>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{currentUser?.name}</p>
            <p className="truncate text-[11px] text-zinc-500">{currentUser?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-100 focus:outline-none focus:ring-4 focus:ring-red-400/10"
            aria-label="Se deconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#09090b]/85 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Console plateforme</p>
              <p className="text-sm font-medium text-zinc-200">Pilotage hotels, QR codes et templates</p>
            </div>
            <Link to="/admin/hotels/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-400/20">
              <Plus className="h-4 w-4" />
              Creer un hotel
            </Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-5 md:px-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function AdminNavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 hidden px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 lg:block">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function AdminNavLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== "/admin" && location.pathname.startsWith(to));
  return (
    <Link className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 font-medium transition focus:outline-none focus:ring-4 focus:ring-amber-400/15 ${active ? "border-amber-400/25 bg-amber-400/10 text-amber-100" : "border-transparent text-zinc-400 hover:border-white/[0.07] hover:bg-white/[0.04] hover:text-white"}`} to={to}>
      <span className={active ? "text-amber-300" : "text-zinc-500"}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function AdminDashboardPage() {
  const { token } = useAppStore();
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.hotels(token)
      .then(setHotels)
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger la plateforme"))
      .finally(() => setLoading(false));
  }, [token]);

  const activeCount = hotels.filter((hotel) => hotel.status === "active").length;
  const draftCount = hotels.filter((hotel) => hotel.status === "draft").length;
  const recentHotels = hotels.slice(0, 5);

  return (
    <AdminShell>
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Super Admin</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Plateforme hotels</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Vue centrale pour onboarder, verifier et exploiter les hotels clients sans creer d'application separee.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/hotels/new" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-400/20"><Plus className="h-4 w-4" /> Creer un hotel</Link>
            <Link to="/generator" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-white/10"><Sparkles className="h-4 w-4" /> Ouvrir Generator</Link>
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Hotels total" value={hotels.length} />
          <Metric label="Hotels actifs" value={activeCount} tone="emerald" />
          <Metric label="Brouillons" value={draftCount} tone="amber" />
          <Metric label="Templates" value={guestThemeIds.length} tone="amber" />
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] shadow-lg shadow-black/20">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] p-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">Hotels recents</h2>
              <p className="mt-1 text-sm text-zinc-500">Derniers tenants crees ou modifies.</p>
            </div>
            <Link to="/admin/hotels" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04]">Voir tout <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {loading ? <LoadingState label="Chargement plateforme" /> : null}
          {error ? <ErrorState message={error} /> : null}
          {!loading && !error && recentHotels.length > 0 ? <HotelTable hotels={recentHotels} compact /> : null}
          {!loading && !error && recentHotels.length === 0 ? <EmptyState /> : null}
        </div>
        <aside className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-6 shadow-lg shadow-black/20">
          <BarChart3 className="h-7 w-7 text-amber-300" />
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-white">Priorite produit</h2>
          <p className="mt-2 text-sm leading-6 text-amber-50/75">Onboarding hotel, URLs, theme Guest App et QR code doivent rester actionnables depuis la console.</p>
        </aside>
      </section>
    </AdminShell>
  );
}

function AdminHotelsPage() {
  const { token } = useAppStore();
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    return hotels.filter((hotel) => {
      const matchesQuery = !normalizedQuery || [hotel.name, hotel.slug, hotel.city, hotel.email].some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "all" || hotel.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [hotels, query, statusFilter]);

  const activeCount = hotels.filter((hotel) => hotel.status === "active").length;
  const draftCount = hotels.filter((hotel) => hotel.status === "draft").length;

  return (
    <AdminShell>
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
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

      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] shadow-lg shadow-black/20">
        <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 md:flex-row md:items-center md:justify-between md:p-5">
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
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/[0.07] bg-[#09090b] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10">
              <option value="all">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="draft">Brouillons</option>
              <option value="inactive">Inactifs</option>
            </select>
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

function HotelTable({ hotels, compact = false }: { hotels: HotelRecord[]; compact?: boolean }) {
  return (
    <div className="overflow-hidden">
      <div className={`hidden gap-4 border-b border-white/[0.07] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 lg:grid ${compact ? "grid-cols-[1.1fr_0.7fr_0.7fr_1fr_88px]" : "grid-cols-[1.1fr_0.8fr_0.6fr_0.7fr_1.2fr_1.2fr_0.7fr_120px]"}`}>
        <span>Hotel</span>
        <span>Slug</span>
        {!compact ? <span>Ville</span> : null}
        <span>Statut</span>
        <span>URL client</span>
        {!compact ? <span>URL reception</span> : null}
        {!compact ? <span>Cree le</span> : null}
        <span className="text-right">Action</span>
      </div>
      <div className="divide-y divide-white/[0.07]">
        {hotels.map((hotel) => (
          <article key={hotel.id} className={`grid gap-4 px-4 py-4 transition hover:bg-white/[0.04] lg:items-center lg:px-5 ${compact ? "lg:grid-cols-[1.1fr_0.7fr_0.7fr_1fr_88px]" : "lg:grid-cols-[1.1fr_0.8fr_0.6fr_0.7fr_1.2fr_1.2fr_0.7fr_120px]"}`}>
            <div>
              <p className="font-semibold tracking-tight text-white">{hotel.name}</p>
              <p className="mt-1 text-sm text-slate-400">{[hotel.city, hotel.country].filter(Boolean).join(", ") || "Adresse a completer"}</p>
            </div>
            <code className="w-fit rounded-xl border border-white/[0.07] bg-[#09090b] px-3 py-1 font-mono text-[11px] text-zinc-300">{hotel.slug}</code>
            {!compact ? <span className="text-sm text-zinc-300">{hotel.city || "-"}</span> : null}
            <StatusBadge status={hotel.status ?? "draft"} />
            <CopyableUrl href={guestUrl(hotel.slug)} label="URL client" />
            {!compact ? <CopyableUrl href={receptionUrl(hotel.slug)} label="URL reception" /> : null}
            {!compact ? <span className="text-sm text-zinc-400">{formatAdminDate(hotel.createdAt)}</span> : null}
            <Link to={`/admin/hotels/${hotel.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-400/10">
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

  async function saveRecommendation(event: React.FormEvent) {
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
      setReceptionAccess(access);
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

function RecommendationManager({
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
  onFormChange: React.Dispatch<React.SetStateAction<RecommendationFormState>>;
  onSubmit: (event: React.FormEvent) => void;
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

function ReceptionAccessCard({ hotel, access, message, saving, onCreate }: { hotel: HotelRecord; access: any | null; message: string; saving: boolean; onCreate: () => void }) {
  const users = Array.isArray((hotel as any).users) ? (hotel as any).users : [];
  const existing = users.find((entry: any) => entry.role === "receptionist" || entry.user?.role === "receptionist")?.user;
  const email = access?.email || existing?.email || `reception+${hotel.slug}@welcomeparis.hotelmanager.fr`;
  const password = access?.temporaryPassword;

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
        <InfoBlock label="Mot de passe temporaire" value={password || "Non affiche. Regenerez si besoin."} />
      </div>
      {message ? <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-sky-50">{message}</p> : null}
    </div>
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

function CopyableUrl({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <a href={href} target="_blank" rel="noreferrer" className="min-w-0 truncate font-mono text-[11px] text-sky-200 transition hover:text-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-300/10">
        {href}
      </a>
      <button type="button" onClick={() => void navigator.clipboard?.writeText(href)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition hover:border-amber-400/30 hover:text-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-400/10" aria-label={`Copier ${label}`}>
        <Copy className="h-3.5 w-3.5" />
      </button>
      <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition hover:border-sky-400/30 hover:text-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-400/10" aria-label={`Ouvrir ${label}`}>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function formatAdminDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(value));
}

function normalizeRecommendationForm(form: RecommendationFormState) {
  return {
    category: form.category,
    name: form.name,
    description: form.description,
    address: form.address,
    phone: form.phone,
    website: form.website,
    distance: form.distance,
    imageUrl: form.imageUrl,
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    openingHours: form.openingHours,
    sortOrder: Number(form.sortOrder || 0),
    isFeatured: form.isFeatured,
    isActive: form.isActive,
    source: "manual"
  };
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
