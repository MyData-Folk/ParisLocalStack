import { useEffect, useState } from "react";
import { Activity, MessageSquare, Users, ListChecks, Star, BarChart3, TrendingUp, ShieldCheck, Target } from "lucide-react";
import { api } from "../../../lib/api";

type AnalyticsData = {
  events: number;
  guests: number;
  messages: number;
  requests: number;
  reviews: number;
  avgRating: number;
};

export function HotelAdminAnalyticsPage({ hotel, hotelId, token }: { hotel: any; hotelId: string; token: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api.hotelAnalytics(hotelId, token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les statistiques."))
      .finally(() => setLoading(false));
  }, [hotelId, token]);

  const hotelName = hotel?.name ?? "";

  if (!hotelId) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-8 text-center shadow-lg shadow-black/20">
          <p className="text-sm text-zinc-400">Aucun hotel selectionne.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-8 text-center shadow-lg shadow-black/20">
          <p className="text-sm text-zinc-400">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-lg shadow-black/20">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isEmpty = data.guests === 0 && data.messages === 0 && data.requests === 0 && data.reviews === 0 && data.events === 0;

  return (
    <div className="space-y-8">
      {/* En-tete */}
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Analytics</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Tableau de bord</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Activite de votre hotel sur la periode disponible.
            </p>
            {hotelName ? (
              <p className="mt-2 text-xs text-zinc-500">Etablissement : {hotelName}</p>
            ) : null}
          </div>
        </div>
      </section>

      {isEmpty ? (
        /* Etat vide */
        <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-8 text-center shadow-lg shadow-black/20">
          <div className="mx-auto max-w-md space-y-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
              <BarChart3 className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">Aucune activite enregistree pour le moment.</h2>
            <p className="text-sm leading-6 text-zinc-400">
              Les donnees apparaitront des que vos premiers clients utiliseront l'application.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-zinc-400">
                Pensez a afficher votre QR code a la reception, dans les chambres et dans vos messages de pre-arrivee.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* KPI principaux */}
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard
                icon={<Users className="h-5 w-5" />}
                label="Clients enregistres"
                description="Voyageurs identifies via l'experience digitale."
                value={data.guests}
                color="sky"
              />
              <KpiCard
                icon={<MessageSquare className="h-5 w-5" />}
                label="Messages recus"
                description="Echanges entre vos clients et votre equipe."
                value={data.messages}
                color="violet"
              />
              <KpiCard
                icon={<ListChecks className="h-5 w-5" />}
                label="Demandes de service"
                description="Demandes envoyees depuis l'application client."
                value={data.requests}
                color="amber"
              />
              <KpiCard
                icon={<Star className="h-5 w-5" />}
                label="Avis clients"
                description="Retours collectes aupres de vos voyageurs."
                value={data.reviews}
                color="emerald"
              />
              <KpiCard
                icon={<Star className="h-5 w-5" />}
                label="Note moyenne"
                description={data.avgRating > 0 ? "Moyenne des evaluations clients." : "Aucune note enregistree."}
                value={data.avgRating > 0 ? `${data.avgRating.toFixed(1)} / 5` : "—"}
                color="rose"
                isRating={data.avgRating > 0}
                ratingValue={data.avgRating}
              />
              <KpiCard
                icon={<Activity className="h-5 w-5" />}
                label="Evenements traces"
                description="Interactions suivies dans le concierge digital."
                value={data.events}
                color="slate"
              />
            </div>
          </section>

          {/* Lecture commerciale */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Ce que ces chiffres indiquent</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-white">Engagement client</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Les messages, demandes et evenements montrent comment vos voyageurs utilisent le concierge digital pendant leur sejour.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-white">Qualite de service</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Les avis clients et la note moyenne vous aident a identifier les points forts et les axes d'amelioration.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                  <Target className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-white">Opportunites CRM</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Les clients enregistres et les interactions collectees preparent vos futures actions CRM et campagnes de fidelisation.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Note de bas de page */}
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="space-y-3">
          <p className="text-sm leading-6 text-zinc-400">
            Les statistiques refletent l'ensemble de l'activite enregistree sur votre etablissement.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">
              Des analyses plus avancees pourront etre ajoutees avec les exports CRM et les rapports detailles.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  description,
  value,
  color,
  isRating,
  ratingValue
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number | string;
  color: "sky" | "violet" | "amber" | "emerald" | "rose" | "slate";
  isRating?: boolean;
  ratingValue?: number;
}) {
  const palette: Record<string, string> = {
    sky: "bg-sky-500/15 text-sky-300",
    violet: "bg-violet-500/15 text-violet-300",
    amber: "bg-amber-500/15 text-amber-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
    rose: "bg-rose-500/15 text-rose-300",
    slate: "bg-slate-500/15 text-slate-300"
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette[color]}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4">
        {isRating && ratingValue !== undefined && ratingValue > 0 ? (
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
            <div className="mb-0.5 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= Math.round(ratingValue)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-3xl font-bold tracking-tight text-white">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </p>
        )}
        <p className="mt-1 text-sm font-medium text-zinc-200">{label}</p>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>
    </div>
  );
}