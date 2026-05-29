import { useEffect, useMemo, useState } from "react";
import { Download, FileJson, Users } from "lucide-react";
import { api } from "../../../lib/api";
import { exportRowsAsExcel, exportRowsAsJson } from "../../../lib/export";

type GuestRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  language: string;
  marketingConsent: boolean;
  stays: {
    roomNumber: string;
    checkinDate: string | null;
    checkoutDate: string | null;
    status: string;
  }[];
};

type CrmRow = {
  guest: GuestRecord;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  langue: string;
  consentement: string;
  chambre: string;
  arrivee: string;
  depart: string;
  statut: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function buildCrmExportRows(guests: GuestRecord[]): Record<string, string>[] {
  return guests.map((guest) => {
    const currentStay = guest.stays?.[0] ?? {};
    return {
      prenom: guest.firstName,
      nom: guest.lastName,
      email: guest.email,
      telephone: guest.phone ?? "-",
      langue: guest.language,
      consentement_marketing: guest.marketingConsent ? "Oui" : "Non",
      chambre: currentStay.roomNumber ?? "-",
      date_arrivee: formatDate(currentStay.checkinDate),
      date_depart: formatDate(currentStay.checkoutDate),
      statut_sejour: currentStay.status ?? "-"
    };
  });
}

export function HotelAdminCrmPage({ hotelId, token }: { hotelId: string; token: string }) {
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api.hotelGuests(hotelId, token)
      .then((data) => setGuests(data as GuestRecord[]))
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger la base clients."))
      .finally(() => setLoading(false));
  }, [hotelId, token]);

  const rows = useMemo<CrmRow[]>(() => {
    return guests.map((guest) => {
      const stay = guest.stays?.[0] ?? {};
      return {
        guest,
        prenom: guest.firstName,
        nom: guest.lastName,
        email: guest.email,
        telephone: guest.phone ?? "-",
        langue: guest.language,
        consentement: guest.marketingConsent ? "Oui" : "Non",
        chambre: stay.roomNumber ?? "-",
        arrivee: stay.checkinDate ?? "-",
        depart: stay.checkoutDate ?? "-",
        statut: stay.status ?? "-"
      };
    });
  }, [guests]);

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
          <p className="text-sm text-zinc-400">Chargement de la base clients...</p>
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

  return (
    <div className="space-y-8">
      {/* En-tete */}
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">CRM</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Base clients</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Exportez vos donnees clients pour votre CRM ou vos campagnes marketing.
            </p>
            {rows.length > 0 ? (
              <p className="mt-2 text-xs text-zinc-500">{rows.length} client{rows.length > 1 ? "s" : ""} enregistre{rows.length > 1 ? "s" : ""}</p>
            ) : null}
          </div>
        </div>
      </section>

      {rows.length === 0 ? (
        /* Etat vide */
        <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-8 text-center shadow-lg shadow-black/20">
          <div className="mx-auto max-w-md space-y-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
              <Users className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">Aucun client enregistre pour le moment.</h2>
            <p className="text-sm leading-6 text-zinc-400">
              Les clients apparaitront ici des qu'ils utiliseront votre application concierge.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Actions export */}
          <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-400">Export du tableau : {rows.length} ligne{rows.length > 1 ? "s" : ""}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => exportRowsAsExcel(buildCrmExportRows(guests), "clients-hotel")}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 focus:outline-none focus:ring-4 focus:ring-emerald-300/10"
                >
                  <Download className="h-4 w-4" /> Exporter Excel
                </button>
                <button
                  type="button"
                  onClick={() => exportRowsAsJson(buildCrmExportRows(guests), "clients-hotel")}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-300/25 bg-sky-300/10 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 focus:outline-none focus:ring-4 focus:ring-sky-300/10"
                >
                  <FileJson className="h-4 w-4" /> Exporter JSON
                </button>
              </div>
            </div>
          </section>

          {/* Tableau clients */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-lg shadow-black/20">
            <div className="overflow-x-auto">
              <table className="min-w-[1400px] w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-950/95 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Prenom</th>
                    <th className="px-4 py-3 font-semibold">Nom</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Telephone</th>
                    <th className="px-4 py-3 font-semibold">Langue</th>
                    <th className="px-4 py-3 font-semibold">Consentement</th>
                    <th className="px-4 py-3 font-semibold">Chambre</th>
                    <th className="px-4 py-3 font-semibold">Arrivee</th>
                    <th className="px-4 py-3 font-semibold">Depart</th>
                    <th className="px-4 py-3 font-semibold">Statut sejour</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {rows.map((row, idx) => (
                    <tr key={row.guest.id ?? idx} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-4 text-slate-300">{row.prenom}</td>
                      <td className="px-4 py-4 text-slate-300">{row.nom}</td>
                      <td className="px-4 py-4 text-slate-300">{row.email}</td>
                      <td className="px-4 py-4 text-slate-300">{row.telephone}</td>
                      <td className="px-4 py-4 text-slate-300">{row.langue}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${row.consentement === "Oui" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>
                          {row.consentement}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{row.chambre}</td>
                      <td className="px-4 py-4 text-slate-300">{formatDate(row.arrivee === "-" ? undefined : row.arrivee)}</td>
                      <td className="px-4 py-4 text-slate-300">{formatDate(row.depart === "-" ? undefined : row.depart)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${row.statut === "active" || row.statut === "checked_in" ? "border-blue-300/25 bg-blue-300/10 text-blue-200" : "border-slate-300/20 bg-white/[0.04] text-slate-300"}`}>
                          {row.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Bonnes pratiques */}
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white">Bonnes pratiques CRM</h2>
          <p className="text-sm leading-6 text-zinc-400">
            Exportez uniquement les contacts necessaires et privilegiez les clients ayant donne leur consentement marketing pour vos campagnes commerciales.
          </p>
        </div>
      </section>

      {/* Mention RGPD */}
      <p className="text-xs text-zinc-600 italic">
        Ces donnees sont confidentielles. Leur utilisation est soumise au consentement des clients et a la reglementation RGPD.
      </p>
    </div>
  );
}