import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { api, type HotelAdminReceptionist } from "../../../lib/api";
import { Field } from "../../admin/components/AdminField";
import { ErrorState, LoadingState } from "../../admin/components/AdminSharedUI";
import { UserStatusBadge } from "../../admin/components/AdminStatusBadge";

export function HotelAdminTeamPage({ hotelId, token }: { hotelId: string; token: string }) {
  const [receptionists, setReceptionists] = useState<HotelAdminReceptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [passwordTarget, setPasswordTarget] = useState<HotelAdminReceptionist | null>(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");

  async function loadReceptionists() {
    if (!hotelId) {
      setReceptionists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.hotelAdminReceptionists(hotelId, token);
      setReceptionists(data);
    } catch {
      setError("Impossible de charger l'equipe reception.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReceptionists();
  }, [hotelId, token]);

  const activeCount = useMemo(
    () => receptionists.filter((entry) => (entry.user.status || "active") === "active").length,
    [receptionists]
  );

  function openPasswordReset(entry: HotelAdminReceptionist) {
    setPasswordTarget(entry);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setPasswordMessage("");
    setMessage("");
  }

  function closePasswordReset() {
    setPasswordTarget(null);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setPasswordMessage("");
  }

  async function resetReceptionistPassword(event: FormEvent) {
    event.preventDefault();
    if (!passwordTarget) return;

    setSaving(true);
    setPasswordMessage("");
    try {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        throw new Error("validation");
      }
      if (passwordForm.newPassword.length < 16 || passwordForm.newPassword.length > 128) {
        throw new Error("validation");
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error("validation");
      }

      await api.resetReceptionistPassword(hotelId, passwordTarget.user.id, passwordForm, token);
      closePasswordReset();
      setMessage("Mot de passe reinitialise avec succes.");
    } catch {
      setPasswordMessage("Impossible de reinitialiser le mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Equipe</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Comptes reception</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Reinitialisez le mot de passe des receptionnistes rattaches a votre hotel.</p>
          </div>
          <button type="button" onClick={() => void loadReceptionists()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-amber-400/10">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <TeamMetric label="Comptes reception" value={receptionists.length} />
          <TeamMetric label="Actifs" value={activeCount} tone="emerald" />
        </div>
      </section>

      {message ? <p className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}
      {loading ? <LoadingState label="Chargement des comptes reception" /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error ? (
        <section className="rounded-2xl border border-white/[0.07] bg-[#111115] shadow-lg shadow-black/20">
          <div className="border-b border-white/[0.07] p-5">
            <h2 className="text-lg font-semibold tracking-tight text-white">Receptionnistes autorises</h2>
            <p className="mt-1 text-sm text-slate-400">La liste est limitee au hotel actif et aux comptes avec le role reception.</p>
          </div>

          {receptionists.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <UserRound className="mx-auto h-10 w-10 text-slate-500" />
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">Aucun receptionniste</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Aucun compte reception n'est rattache a cet hotel.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {receptionists.map((entry) => (
                <article key={entry.id} className="grid gap-4 px-4 py-4 transition hover:bg-white/[0.04] lg:grid-cols-[1fr_0.45fr_180px] lg:items-center lg:px-5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight text-white">{entry.user.name}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-zinc-500">{entry.user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-fit rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300">receptionist</span>
                    <UserStatusBadge status={entry.user.status || "active"} />
                  </div>
                  <div className="flex justify-start lg:justify-end">
                    <button type="button" onClick={() => openPasswordReset(entry)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 focus:outline-none focus:ring-4 focus:ring-emerald-400/10">
                      <KeyRound className="h-3.5 w-3.5" />
                      Reinitialiser
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {passwordTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <form onSubmit={resetReceptionistPassword} className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#111115] p-6 shadow-2xl shadow-black/40">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/80">Reception</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Reinitialiser le mot de passe</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Definissez un nouveau mot de passe securise pour ce compte reception.</p>
            </div>
            <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#09090b] px-4 py-3">
              <p className="truncate text-sm font-medium text-white">{passwordTarget.user.name}</p>
              <p className="mt-1 truncate font-mono text-[11px] text-zinc-500">{passwordTarget.user.email}</p>
            </div>
            <div className="mt-5 space-y-4">
              <Field
                type="password"
                label="Nouveau mot de passe"
                value={passwordForm.newPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
                helper="Minimum 16 caracteres."
                required
              />
              <Field
                type="password"
                label="Confirmer le nouveau mot de passe"
                value={passwordForm.confirmPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
                required
              />
            </div>
            {passwordMessage ? <p className="mt-5 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{passwordMessage}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closePasswordReset} className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-white/10">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Reinitialiser
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function TeamMetric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "emerald" }) {
  const toneClass = tone === "emerald" ? "text-emerald-200" : "text-white";
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
    </div>
  );
}
