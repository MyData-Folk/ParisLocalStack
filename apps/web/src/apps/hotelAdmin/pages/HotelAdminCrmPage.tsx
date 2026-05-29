import { useEffect, useMemo, useState } from "react";
import { Download, FileJson, RotateCcw, Search, Users } from "lucide-react";
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

const LANGUAGE_OPTIONS = [
  { value: "", label: "Toutes" },
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "zh", label: "中文" },
  { value: "ar", label: "العربية" },
  { value: "ja", label: "日本語" }
];

const YES_NO_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "yes", label: "Avec" },
  { value: "no", label: "Sans" }
];

const CONSENT_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "yes", label: "Oui" },
  { value: "no", label: "Non" }
];

const STATUS_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "active", label: "Actif" },
  { value: "checked_in", label: "Check-in" },
  { value: "checked_out", label: "Check-out" },
  { value: "completed", label: "Terminé" },
  { value: "archived", label: "Archivé" }
];

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
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterHasEmail, setFilterHasEmail] = useState("");
  const [filterHasPhone, setFilterHasPhone] = useState("");
  const [filterConsent, setFilterConsent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

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

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const stay = guest.stays?.[0];

      if (filterLanguage && guest.language !== filterLanguage) return false;

      if (filterHasEmail === "yes" && !guest.email) return false;
      if (filterHasEmail === "no" && guest.email) return false;

      if (filterHasPhone === "yes" && !guest.phone) return false;
      if (filterHasPhone === "no" && guest.phone) return false;

      if (filterConsent === "yes" && !guest.marketingConsent) return false;
      if (filterConsent === "no" && guest.marketingConsent) return false;

      if (filterStatus && stay?.status !== filterStatus) return false;

      const checkinDate = stay?.checkinDate
        ? String(stay.checkinDate).slice(0, 10)
        : "";

      if (filterDateFrom && (!checkinDate || checkinDate < filterDateFrom)) return false;
      if (filterDateTo && (!checkinDate || checkinDate > filterDateTo)) return false;

      return true;
    });
  }, [
    guests,
    filterLanguage,
    filterHasEmail,
    filterHasPhone,
    filterConsent,
    filterStatus,
    filterDateFrom,
    filterDateTo
  ]);

  const rows = useMemo<CrmRow[]>(() => {
    return filteredGuests.map((guest) => {
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
  }, [filteredGuests]);

  const hasActiveFilters = filterLanguage !== "" || filterHasEmail !== "" || filterHasPhone !== "" || filterConsent !== "" || filterStatus !== "" || filterDateFrom !== "" || filterDateTo !== "";

  function resetFilters() {
    setFilterLanguage("");
    setFilterHasEmail("");
    setFilterHasPhone("");
    setFilterConsent("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

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
            {guests.length > 0 ? (
              <p className="mt-2 text-xs text-zinc-500">
                {guests.length} client{guests.length > 1 ? "s" : ""} enregistre{guests.length > 1 ? "s" : ""}{hasActiveFilters ? ` — ${filteredGuests.length} affiche${filteredGuests.length > 1 ? "s" : ""}` : ""}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {guests.length === 0 ? (
        /* Etat vide initial */
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
          {/* Filtres */}
          <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Filtres</p>
                <p className="text-xs text-zinc-500">
                  Segmentez votre base clients avant export.{hasActiveFilters ? ` ${filteredGuests.length} client${filteredGuests.length > 1 ? "s" : ""} correspond${filteredGuests.length > 1 ? "ent" : ""}.` : ""}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-400">Langue</span>
                  <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10">
                    {LANGUAGE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-400">Email</span>
                  <select value={filterHasEmail} onChange={(e) => setFilterHasEmail(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10">
                    {YES_NO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-400">Telephone</span>
                  <select value={filterHasPhone} onChange={(e) => setFilterHasPhone(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10">
                    {YES_NO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-400">Consent. marketing</span>
                  <select value={filterConsent} onChange={(e) => setFilterConsent(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10">
                    {CONSENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-400">Statut sejour</span>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10">
                    {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-400">Arrivee depuis</span>
                  <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-400">Arrivee jusqu'au</span>
                  <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10" />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reinitialiser
                  </button>
                </div>
              </div>
            </div>
          </section>

          {filteredGuests.length === 0 ? (
            /* Etat vide filtre */
            <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-8 text-center shadow-lg shadow-black/20">
              <div className="mx-auto max-w-md space-y-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
                  <Search className="h-6 w-6" />
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white">Aucun client ne correspond aux filtres selectionnes.</h2>
                <p className="text-sm leading-6 text-zinc-400">
                  Essayez de modifier ou reinitialiser vos filtres pour afficher plus de clients.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/20 focus:outline-none focus:ring-4 focus:ring-amber-300/10"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reinitialiser les filtres
                </button>
              </div>
            </section>
          ) : (
            <>
              {/* Actions export */}
              <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-400">Export du tableau : {rows.length} ligne{rows.length > 1 ? "s" : ""}{hasActiveFilters ? " (filtré)" : ""}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => exportRowsAsExcel(buildCrmExportRows(filteredGuests), "clients-hotel")}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 focus:outline-none focus:ring-4 focus:ring-emerald-300/10"
                    >
                      <Download className="h-4 w-4" /> Exporter Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => exportRowsAsJson(buildCrmExportRows(filteredGuests), "clients-hotel")}
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