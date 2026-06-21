import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { ChangePasswordCard } from "../../../components/auth/ChangePasswordCard";
import { api } from "../../../lib/api";
import { Field, ColorField } from "../../admin/components/AdminField";
import { ErrorState, LoadingState } from "../../admin/components/AdminSharedUI";

export function HotelAdminProfilePage({ hotel, hotelId, token, onHotelUpdated }: { hotel: any; hotelId: string; token: string; onHotelUpdated: (hotel: any) => void }) {
  const [form, setForm] = useState({
    name: hotel?.name ?? "",
    description: hotel?.description ?? "",
    address: hotel?.address ?? "",
    city: hotel?.city ?? "",
    country: hotel?.country ?? "",
    phone: hotel?.phone ?? "",
    email: hotel?.email ?? "",
    website: hotel?.website ?? "",
    primaryColor: hotel?.primaryColor ?? "#c9a84c"
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!hotel) return <LoadingState label="Chargement du profil..." />;

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await api.updateHotel(hotelId, form, token);
      onHotelUpdated(updated);
      setForm({
        name: updated.name ?? "",
        description: updated.description ?? "",
        address: updated.address ?? "",
        city: updated.city ?? "",
        country: updated.country ?? "",
        phone: updated.phone ?? "",
        email: updated.email ?? "",
        website: updated.website ?? "",
        primaryColor: updated.primaryColor ?? "#c9a84c"
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Profil</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Profil hotel</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Informations de base de votre etablissement.</p>
          </div>
          <button type="submit" form="profile-form" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saved ? <CheckCircle className="h-4 w-4" /> : null}
            Enregistrer le profil
          </button>
        </div>

        {error ? <ErrorState message={error} compact /> : null}
        {saved ? <p className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">Profil enregistre ✓</p> : null}

        <form id="profile-form" onSubmit={save} className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Nom de l'hotel" value={form.name} onChange={(v) => update("name", v)} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
          <Field label="Adresse" value={form.address} onChange={(v) => update("address", v)} />
          <Field label="Ville" value={form.city} onChange={(v) => update("city", v)} />
          <Field label="Pays" value={form.country} onChange={(v) => update("country", v)} />
          <Field label="Telephone" value={form.phone} onChange={(v) => update("phone", v)} />
          <Field label="Site web" type="url" value={form.website} onChange={(v) => update("website", v)} />
          <ColorField label="Couleur principale" value={form.primaryColor} onChange={(v) => update("primaryColor", v)} />
          <div className="md:col-span-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Description</span>
              <textarea
                className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Decrivez votre hotel..."
              />
            </label>
          </div>
        </form>
      </section>
      <ChangePasswordCard token={token} />
    </div>
  );
}
