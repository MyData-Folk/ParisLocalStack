import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Compass, Hotel, QrCode, Settings } from "lucide-react";
import { COMMERCIAL_PACKAGES, SERVICE_CATALOG, type CommercialPackage } from "@paris-local/shared";

export function HotelAdminDashboard({ hotel, hotelId: _hotelId }: { hotel: any; hotelId: string }) {
  const previewServices = SERVICE_CATALOG.filter((s) =>
    ["taxi", "restaurant_booking", "room_service", "maintenance", "local_recommendations"].includes(s.id)
  );

  const quickActions = [
    { to: "/hotel-admin/recommendations", icon: <Compass className="h-5 w-5" />, label: "Gerer recommandations" },
    { to: "/hotel-admin/settings", icon: <Settings className="h-5 w-5" />, label: "Modifier parametres hotel" },
    { to: "/hotel-admin/qr", icon: <QrCode className="h-5 w-5" />, label: "Voir QR Code" },
    { to: "/hotel-admin/analytics", icon: <BarChart3 className="h-5 w-5" />, label: "Voir analytics" }
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-300/10 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300 shadow-lg shadow-amber-950/20">
              <Hotel className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Pilotage hôtelier</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Bienvenue dans votre espace Admin Hôtel</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Configurez votre concierge digital, vos recommandations locales et vos modules client.</p>
            </div>
          </div>
        </div>
        {hotel ? (
          <div className="relative mt-6 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Hôtel</p>
              <p className="mt-1 font-semibold text-white">{hotel.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Ville</p>
              <p className="mt-1 font-semibold text-white">{[hotel.city, hotel.country].filter(Boolean).join(", ") || "Paris"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Statut</p>
              <p className="mt-1">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${hotel.status === "active" ? "bg-emerald-400/20 text-emerald-200" : "bg-zinc-500/20 text-zinc-300"}`}>
                  {hotel.status === "active" ? "Actif" : hotel.status ?? "Brouillon"}
                </span>
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Offre</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Votre offre</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Les packages disponibles pour votre etablissement.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COMMERCIAL_PACKAGES.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} isCurrent={pkg.id === "boutique"} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Modules</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Services configurables</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Fonctionnalites disponibles pour personnaliser votre concierge digital.</p>
          </div>
        </div>
        <div className="mt-5 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10">
          {previewServices.map((service) => (
            <div key={service.id} className="flex flex-col gap-2 p-4 transition hover:bg-white/[0.03] md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-white">{service.labelFr}</p>
                <p className="mt-1 text-sm leading-5 text-zinc-400">{service.descriptionFr}</p>
                <p className="mt-1 text-xs text-zinc-500">{service.commercialUpsellFr}</p>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
                Inclus
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Actions</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Actions rapides</h2>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-white/20 hover:bg-white/[0.03] focus:outline-none focus:ring-4 focus:ring-amber-400/15">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">{action.icon}</span>
              <span className="min-w-0 flex-1 text-sm font-medium text-white">{action.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function PackageCard({ pkg, isCurrent }: { pkg: { id: CommercialPackage; labelFr: string; descriptionFr: string; recommendedMonthlyPriceRange: string }; isCurrent: boolean }) {
  return (
    <div className={`relative rounded-2xl border p-5 transition ${isCurrent ? "border-amber-400/30 bg-amber-400/5" : "border-white/10 bg-slate-950/50"}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-white">{pkg.labelFr}</p>
        {isCurrent ? (
          <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
            Votre offre
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{pkg.descriptionFr}</p>
      <p className="mt-3 text-xs font-semibold text-zinc-500">{pkg.recommendedMonthlyPriceRange}</p>
    </div>
  );
}