import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "../../../lib/api";
import { emptyHotelForm, normalizeHotelPayload, slugify, type HotelFormState } from "../../../lib/hotelOnboarding";
import { useAppStore } from "../../../stores/appStore";
import type { GuestThemeId } from "../../../themes";
import { AdminShell } from "../AdminShell";
import type { HotelRecord } from "../admin.types";
import { HotelForm } from "../components/HotelForm";
import { HotelLaunchCard } from "../components/HotelLaunchCard";

export function AdminCreateHotelPage() {
  const { token } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<HotelFormState>(emptyHotelForm);
  const [guestTheme, setGuestTheme] = useState<GuestThemeId>("parisian_boutique");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdHotel, setCreatedHotel] = useState<HotelRecord | null>(null);

  function updateField<K extends keyof HotelFormState>(field: K, value: HotelFormState[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && !slugTouched) next.slug = slugify(String(value));
      if (field === "slug") next.slug = slugify(String(value));
      return next;
    });
    if (field === "slug") setSlugTouched(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.createHotel(normalizeHotelPayload(form), token);
      const settings = await api.updateHotelSettings(created.id, { guestTheme }, token);
      setCreatedHotel({ ...created, settings });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => navigate("/admin/hotels")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10">
          <ArrowLeft className="h-4 w-4" />
          Retour hotels
        </button>
        <Link to="/generator" className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 focus:outline-none focus:ring-4 focus:ring-emerald-300/10">
          Ouvrir le generateur
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-black/20 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Nouvel hotel</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Creation multi-tenant</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Le formulaire cree l'hotel et ses settings par defaut. Aucune nouvelle application React n'est generee.</p>
          <HotelForm form={form} guestTheme={guestTheme} onThemeChange={setGuestTheme} onChange={updateField} onSubmit={submit} saving={saving} error={error} submitLabel="Creer l'hotel" />
        </section>
        <HotelLaunchCard hotel={createdHotel} previewSlug={slugify(form.slug || form.name)} />
      </div>
    </AdminShell>
  );
}
