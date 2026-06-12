import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Users, ListChecks, Star, QrCode, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import { useAppStore } from "../../stores/appStore";

type DashboardKPIs = {
  guests: number;
  messages: number;
  requests: number;
  reviews: number;
  avgRating: number;
};

export function HotelAdminDashboard({ hotel, hotelId, token, basePath = "/hotel-admin" }: { hotel: any; hotelId: string; token: string; basePath?: string }) {
  const { currentUser } = useAppStore();
  const route = (path = "") => `${basePath}${path}` || "/";
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    if (!hotelId || !token) return;
    api.hotelAnalytics(hotelId, token)
      .then((data) => setKpis({ guests: data.guests, messages: data.messages, requests: data.requests, reviews: data.reviews, avgRating: data.avgRating }))
      .catch(() => setKpis(null));
  }, [hotelId, token]);

  const greeting = currentUser?.name ? `Bonjour ${currentUser.name.split(" ")[0]}` : "Bienvenue";
  const hotelName = hotel?.name ?? "Votre hôtel";
  const packageLabel = hotel?.commercialPackage === "premium" ? "Premium" : hotel?.commercialPackage === "palace" ? "Palace" : "Boutique";

  return (
    <div className="space-y-6">
      {/* ZONE 1 — HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111115] p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-300/8 via-transparent to-transparent" />
        <div className="relative">
          <p className="text-sm text-zinc-400">{greeting}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">{hotelName}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">
              Actif
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
              Offre {packageLabel}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={route("/modules")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#09090b] shadow-sm transition hover:bg-zinc-100">
              <Sparkles className="h-4 w-4" />
              Personnaliser l'app client
            </Link>
            <Link to={route("/qr")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
              <QrCode className="h-4 w-4" />
              Voir le QR Code
            </Link>
          </div>
        </div>
      </section>

      {/* ZONE 2 — KPI */}
      {kpis ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard icon={<Users className="h-4 w-4" />} label="Clients" value={kpis.guests} color="sky" />
          <KpiCard icon={<MessageSquare className="h-4 w-4" />} label="Messages" value={kpis.messages} color="amber" />
          <KpiCard icon={<ListChecks className="h-4 w-4" />} label="Demandes" value={kpis.requests} color="violet" />
          <KpiCard icon={<Star className="h-4 w-4" />} label="Avis" value={kpis.reviews} suffix={kpis.avgRating > 0 ? `(${kpis.avgRating.toFixed(1)}★)` : undefined} color="emerald" />
        </section>
      ) : null}

      {/* ZONE 3 — ACTIONS RAPIDES */}
      <section className="grid gap-3 md:grid-cols-2">
        <ActionCard to={route("/crm")} title="Clients & CRM" description="Consultez votre base clients, exportez et segmentez." icon={<Users className="h-5 w-5" />} />
        <ActionCard to={route("/recommendations")} title="Recommandations locales" description="Gérez vos adresses et conseils pour les clients." icon={<Star className="h-5 w-5" />} />
        <ActionCard to={route("/profile")} title="Mon hôtel" description="Informations, paramètres et thème de votre établissement." icon={<Sparkles className="h-5 w-5" />} />
        <ActionCard to="/reception" title="Dashboard Réception" description="Accédez au tableau de bord opérationnel." icon={<MessageSquare className="h-5 w-5" />} />
      </section>

      {/* ZONE 4 — MON OFFRE (bandeau compact) */}
      <section className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#111115] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300/10 text-amber-300">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Offre {packageLabel}</p>
            <p className="text-xs text-zinc-500">{kpis ? `${kpis.guests} clients enregistrés` : "Votre concierge digital actif"}</p>
          </div>
        </div>
        <Link to={route("/modules")} className="text-xs font-semibold text-amber-300 transition hover:text-amber-200">
          Détails <ArrowRight className="ml-1 inline h-3 w-3" />
        </Link>
      </section>
    </div>
  );
}

function KpiCard({ icon, label, value, suffix, color }: { icon: React.ReactNode; label: string; value: number; suffix?: string; color: string }) {
  const colorClasses: Record<string, string> = {
    sky: "border-sky-400/20 bg-sky-400/5 text-sky-300",
    amber: "border-amber-300/20 bg-amber-300/5 text-amber-300",
    violet: "border-violet-400/20 bg-violet-400/5 text-violet-300",
    emerald: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color] ?? colorClasses.sky}`}>
      <div className="flex items-center gap-2 opacity-80">{icon}<span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="mt-2 text-2xl font-bold text-white">{value}{suffix ? <span className="ml-1.5 text-sm font-medium opacity-60">{suffix}</span> : null}</p>
    </div>
  );
}

function ActionCard({ to, title, description, icon }: { to: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-[#111115] p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.03]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-400 transition group-hover:bg-amber-300/10 group-hover:text-amber-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-zinc-400" />
    </Link>
  );
}
