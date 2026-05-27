import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Hotel, Plus, RefreshCw, Search } from "lucide-react";
import { api } from "../../../lib/api";
import { useAppStore } from "../../../stores/appStore";
import { AdminShell } from "../AdminShell";
import type { HotelRecord } from "../admin.types";
import { HotelTable } from "../components/HotelTable";
import { AdminMetric as Metric } from "../components/AdminMetric";
import { EmptyState, ErrorState, LoadingState } from "../components/AdminSharedUI";

export function AdminHotelsPage() {
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
