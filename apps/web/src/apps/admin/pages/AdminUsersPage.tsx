import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, RefreshCw, Search, ShieldCheck, UserCheck, Users, UserX } from "lucide-react";
import { api } from "../../../lib/api";
import { useAppStore } from "../../../stores/appStore";
import { AdminShell } from "../AdminShell";
import type { AdminHotelUser, HotelRecord } from "../admin.types";
import { Field } from "../components/AdminField";
import { AdminMetric as Metric } from "../components/AdminMetric";
import { ErrorState, LoadingState } from "../components/AdminSharedUI";
import { UserStatusBadge } from "../components/AdminStatusBadge";

export function AdminUsersPage() {
  const { token } = useAppStore();
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [users, setUsers] = useState<AdminHotelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<AdminHotelUser | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminHotelUser | null>(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "receptionist", status: "active", password: "" });

  async function loadUsers() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const loadedHotels = await api.hotels(token);
      setHotels(loadedHotels);
      const memberships = (await Promise.all(loadedHotels.map((hotel) => api.hotelUsers(hotel.id, token)))).flat();
      setUsers(memberships);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [token]);

  function openEditor(entry: AdminHotelUser) {
    setSelected(entry);
    setMessage("");
    setForm({
      name: entry.user.name,
      email: entry.user.email,
      role: entry.role || entry.user.role,
      status: entry.user.status || "active",
      password: ""
    });
  }

  async function saveUser(event: FormEvent) {
    event.preventDefault();
    if (!token || !selected) return;
    setSaving(true);
    setMessage("");
    try {
      const payload: { name: string; email: string; role: string; status: string; password?: string } = {
        name: form.name,
        email: form.email,
        role: form.role,
        status: form.status
      };
      if (form.password.trim()) payload.password = form.password.trim();
      const updated = await api.updateHotelUser(selected.hotelId, selected.user.id, payload, token);
      setUsers((current) => current.map((entry) => entry.id === selected.id ? { ...entry, role: payload.role, user: { ...entry.user, ...updated } } : entry));
      setSelected((current) => current ? { ...current, role: payload.role, user: { ...current.user, ...updated } } : current);
      setForm((current) => ({ ...current, password: "" }));
      setMessage(form.password.trim() ? "Compte mis a jour. Nouveau mot de passe applique." : "Compte mis a jour.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Mise a jour impossible");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(entry: AdminHotelUser) {
    if (!token) return;
    const nextStatus = entry.user.status === "inactive" ? "active" : "inactive";
    setSaving(true);
    setMessage("");
    try {
      const updated = await api.updateHotelUser(entry.hotelId, entry.user.id, { status: nextStatus }, token);
      setUsers((current) => current.map((item) => item.id === entry.id ? { ...item, user: { ...item.user, ...updated } } : item));
      if (selected?.id === entry.id) setSelected({ ...entry, user: { ...entry.user, ...updated } });
      setMessage(nextStatus === "inactive" ? "Compte desactive. La connexion est bloquee." : "Compte reactive.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Changement de statut impossible");
    } finally {
      setSaving(false);
    }
  }

  function openPasswordReset(entry: AdminHotelUser) {
    setPasswordTarget(entry);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setPasswordMessage("");
    setMessage("");
  }

  async function resetHotelAdminPassword(event: FormEvent) {
    event.preventDefault();
    if (!token || !passwordTarget) return;
    setSaving(true);
    setPasswordMessage("");
    try {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        throw new Error("validation");
      }
      if (passwordForm.newPassword.length < 16) {
        throw new Error("validation");
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error("validation");
      }
      await api.resetHotelAdminPassword(passwordTarget.user.id, passwordForm, token);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setPasswordTarget(null);
      setMessage("Mot de passe réinitialisé avec succès.");
    } catch {
      setPasswordMessage("Impossible de réinitialiser le mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((entry) => {
      const status = entry.user.status || "active";
      const values = [entry.user.name, entry.user.email, entry.role, entry.hotel?.name, entry.hotel?.slug];
      const matchesQuery = !normalizedQuery || values.some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, users]);

  const activeCount = users.filter((entry) => (entry.user.status || "active") === "active").length;
  const inactiveCount = users.filter((entry) => entry.user.status === "inactive").length;

  return (
    <AdminShell>
      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Identites et acces</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Utilisateurs hotels</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Pilotez les comptes reception crees pour chaque tenant : identifiant, role, mot de passe et statut d'acces.</p>
            </div>
            <button type="button" onClick={() => void loadUsers()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-amber-400/10">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Metric label="Comptes" value={users.length} />
            <Metric label="Actifs" value={activeCount} tone="emerald" />
            <Metric label="Desactives" value={inactiveCount} tone="amber" />
          </div>
        </div>
        <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 p-6 shadow-lg shadow-black/20">
          <KeyRound className="h-7 w-7 text-sky-200" />
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">Provisioning automatique</h2>
          <p className="mt-3 text-sm leading-6 text-sky-50/75">A la creation d'un hotel, un compte reception est associe. Le Super Admin peut ensuite modifier l'identifiant, reinitialiser le mot de passe ou bloquer l'acces.</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] shadow-lg shadow-black/20">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">Comptes par hotel</h2>
              <p className="mt-1 text-sm text-slate-400">{hotels.length} hotel(s) charges, isolation par hotel_id.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block">
                <span className="sr-only">Rechercher un utilisateur</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-10 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10 sm:w-72"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nom, email, hotel, slug..."
                />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/[0.07] bg-[#09090b] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10">
                <option value="all">Tous statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Desactives</option>
              </select>
            </div>
          </div>
          {loading ? <LoadingState label="Chargement des comptes" /> : null}
          {error ? <ErrorState message={error} /> : null}
          {!loading && !error && filteredUsers.length === 0 ? <div className="p-8 text-sm text-slate-500">Aucun utilisateur trouve.</div> : null}
          {!loading && !error && filteredUsers.length > 0 ? (
            <div className="overflow-hidden">
              <div className="hidden grid-cols-[1fr_1fr_0.65fr_0.65fr_160px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 lg:grid">
                <span>Utilisateur</span>
                <span>Hotel</span>
                <span>Role</span>
                <span>Statut</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-white/[0.07]">
                {filteredUsers.map((entry) => (
                  <article key={entry.id} className="grid gap-4 px-4 py-4 transition hover:bg-white/[0.04] lg:grid-cols-[1fr_1fr_0.65fr_0.65fr_160px] lg:items-center lg:px-5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold tracking-tight text-white">{entry.user.name}</p>
                      <p className="mt-1 truncate font-mono text-[11px] text-zinc-500">{entry.user.email}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">{entry.hotel?.name || "Hotel"}</p>
                      <p className="mt-1 w-fit rounded-lg border border-white/[0.07] bg-[#09090b] px-2 py-0.5 font-mono text-[11px] text-zinc-500">{entry.hotel?.slug || entry.hotelId}</p>
                    </div>
                    <span className="w-fit rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300">{entry.role}</span>
                    <UserStatusBadge status={entry.user.status || "active"} />
                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <button type="button" onClick={() => openEditor(entry)} className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-amber-400/30 hover:bg-amber-400/10 focus:outline-none focus:ring-4 focus:ring-amber-400/10">Editer</button>
                      {entry.role === "hotel_admin" ? (
                        <button type="button" onClick={() => openPasswordReset(entry)} className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 focus:outline-none focus:ring-4 focus:ring-emerald-400/10">Réinitialiser</button>
                      ) : null}
                      <button type="button" onClick={() => void toggleStatus(entry)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-sky-400/30 hover:bg-sky-400/10 focus:outline-none focus:ring-4 focus:ring-sky-400/10 disabled:opacity-60">
                        {entry.user.status === "inactive" ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                        {entry.user.status === "inactive" ? "Activer" : "Bloquer"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
          {selected ? (
            <form onSubmit={saveUser} className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/80">Edition compte</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{selected.hotel?.name || "Hotel"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Les changements sont appliques immediatement a la connexion reception.</p>
              </div>
              <Field label="Nom utilisateur" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
              <Field type="email" label="Identifiant email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} required />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Role</span>
                <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10">
                  <option value="receptionist">Reception</option>
                  <option value="hotel_admin">Admin hotel</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Statut acces</span>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10">
                  <option value="active">Actif</option>
                  <option value="inactive">Desactive</option>
                </select>
              </label>
              <Field type="text" label="Nouveau mot de passe" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} placeholder="Laisser vide pour ne pas changer" helper="Minimum 8 caracteres. Utilisez un mot de passe unique, fort et temporaire, puis communiquez-le de maniere securisee a l'utilisateur." />
              {message ? <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
              <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Enregistrer le compte
              </button>
            </form>
          ) : (
            <div className="grid min-h-96 place-items-center text-center">
              <div>
                <Users className="mx-auto h-10 w-10 text-slate-500" />
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-white">Selectionnez un compte</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Ouvrez un utilisateur pour modifier son identifiant, son role, son statut ou son mot de passe.</p>
              </div>
            </div>
          )}
        </aside>
      </section>

      {passwordTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <form onSubmit={resetHotelAdminPassword} className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#111115] p-6 shadow-2xl shadow-black/40">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/80">Admin hôtel</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Réinitialiser le mot de passe</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Définissez un nouveau mot de passe sécurisé pour ce compte Admin Hôtel.</p>
            </div>
            <div className="mt-5 space-y-4">
              <Field
                type="password"
                label="Nouveau mot de passe"
                value={passwordForm.newPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
                helper="Minimum 16 caractères."
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
              <button type="button" onClick={() => { setPasswordTarget(null); setPasswordMessage(""); }} className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-white/10">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Réinitialiser
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}
