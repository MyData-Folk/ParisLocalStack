import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Plus, Sparkles } from "lucide-react";
import { api } from "../../../lib/api";
import { useAppStore } from "../../../stores/appStore";
import { guestThemeIds } from "../../../themes";
import { AdminShell } from "../AdminShell";
import type { HotelRecord } from "../admin.types";
import { HotelTable } from "../components/HotelTable";
import { AdminMetric as Metric } from "../components/AdminMetric";
import { EmptyState, ErrorState, LoadingState } from "../components/AdminSharedUI";

export function AdminDashboardPage() {
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
