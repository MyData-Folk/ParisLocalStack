import type { FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import type { HotelFormState } from "../../../lib/hotelOnboarding";
import type { GuestThemeId } from "../../../themes";
import { ErrorState } from "./AdminSharedUI";
import { ColorField, Field, ThemePicker } from "./AdminField";

export function HotelForm({
  form,
  guestTheme,
  onThemeChange,
  onChange,
  onSubmit,
  saving,
  error,
  submitLabel
}: {
  form: HotelFormState;
  guestTheme?: GuestThemeId;
  onThemeChange?: (value: GuestThemeId) => void;
  onChange: <K extends keyof HotelFormState>(field: K, value: HotelFormState[K]) => void;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  error: string | null;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nom hotel" value={form.name} onChange={(value) => onChange("name", value)} placeholder="Hôtel Lumière Demo Paris" required />
        <Field label="Slug" value={form.slug} onChange={(value) => onChange("slug", value)} placeholder="demo-paris-local" helper="Utilise pour les URLs client et reception." required />
        <Field label="Adresse" value={form.address ?? ""} onChange={(value) => onChange("address", value)} placeholder="12 rue de la Paix" />
        <Field label="Ville" value={form.city ?? ""} onChange={(value) => onChange("city", value)} placeholder="Paris" />
        <Field label="Pays" value={form.country ?? ""} onChange={(value) => onChange("country", value)} placeholder="France" />
        <Field label="Telephone" value={form.phone ?? ""} onChange={(value) => onChange("phone", value)} placeholder="+33 1 00 00 00 00" />
        <Field type="email" label="Email" value={form.email} onChange={(value) => onChange("email", value)} placeholder="reception@hotel.fr" required />
        <Field type="url" label="Site web" value={form.website ?? ""} onChange={(value) => onChange("website", value)} placeholder="https://hotel.fr" />
        <Field label="Logo URL" value={form.logoUrl ?? ""} onChange={(value) => onChange("logoUrl", value)} placeholder="https://..." />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">Statut</span>
          <select
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10"
            value={form.status}
            onChange={(event) => onChange("status", event.target.value as HotelFormState["status"])}
          >
            <option value="active">Actif</option>
            <option value="draft">Brouillon</option>
            <option value="inactive">Inactif</option>
          </select>
        </label>
        <ColorField label="Couleur principale" value={form.primaryColor ?? "#c9a84c"} onChange={(value) => onChange("primaryColor", value)} />
        <ColorField label="Couleur secondaire" value={form.secondaryColor ?? "#0f172a"} onChange={(value) => onChange("secondaryColor", value)} />
      </div>
      {guestTheme && onThemeChange ? <ThemePicker value={guestTheme} onChange={onThemeChange} /> : null}
      {error ? <ErrorState message={error} compact /> : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {saving ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}
