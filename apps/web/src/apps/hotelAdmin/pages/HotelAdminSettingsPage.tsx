import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { api } from "../../../lib/api";
import { Field } from "../../admin/components/AdminField";
import { ErrorState, LoadingState } from "../../admin/components/AdminSharedUI";
import { guestThemeIds, guestThemes, type GuestThemeId } from "../../../themes";

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "ar", label: "العربية" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" }
];

const MODULE_KEYS = ["guide", "reviews", "messages", "requests", "services", "recommendations"] as const;

export function HotelAdminSettingsPage({ hotelId, token }: { hotelId: string; token: string }) {
  const [form, setForm] = useState({
    wifiName: "",
    wifiPassword: "",
    breakfastHours: "",
    checkinTime: "",
    checkoutTime: "",
    roomServiceHours: "",
    receptionPhone: "",
    whatsappNumber: "",
    guestTheme: "parisian_boutique" as GuestThemeId,
    languages: [] as string[],
    modules: {} as Record<string, boolean>
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotelId) {
      setError("Aucun hotel selectionne.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api.hotelSettings(hotelId, token)
      .then((settings) => {
        setForm({
          wifiName: settings?.wifiName ?? "",
          wifiPassword: settings?.wifiPassword ?? "",
          breakfastHours: settings?.breakfastHours ?? "",
          checkinTime: settings?.checkinTime ?? "",
          checkoutTime: settings?.checkoutTime ?? "",
          roomServiceHours: settings?.roomServiceHours ?? "",
          receptionPhone: settings?.receptionPhone ?? "",
          whatsappNumber: settings?.whatsappNumber ?? "",
          guestTheme: guestThemeIds.includes(settings?.guestTheme) ? settings.guestTheme : "parisian_boutique",
          languages: Array.isArray(settings?.languages) ? settings.languages : ["fr"],
          modules: settings?.modules && typeof settings.modules === "object" ? settings.modules : {}
        });
      })
      .catch(() => setError("Impossible de charger les parametres."))
      .finally(() => setLoading(false));
  }, [hotelId, token]);

  function update(field: string, value: unknown) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleLanguage(lang: string) {
    setForm((current) => ({
      ...current,
      languages: current.languages.includes(lang)
        ? current.languages.filter((l) => l !== lang)
        : [...current.languages, lang]
    }));
  }

  function toggleModule(module: string) {
    setForm((current) => ({
      ...current,
      modules: { ...current.modules, [module]: !current.modules[module] }
    }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!hotelId) {
      setError("Aucun hotel selectionne.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.updateHotelSettings(hotelId, form, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer les parametres.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Chargement des parametres..." />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Configuration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Parametres hotel</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Personnalisez les informations pratiques et l'apparence de votre concierge digital.</p>
          </div>
          <button type="submit" form="settings-form" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saved ? <CheckCircle className="h-4 w-4" /> : null}
            Enregistrer les parametres
          </button>
        </div>

        {error ? <ErrorState message={error} compact /> : null}
        {saved ? <p className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">Parametres enregistres ✓</p> : null}

        <form id="settings-form" onSubmit={save} className="mt-6 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Reseau & Pratique</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Field label="Nom du reseau Wi-Fi" value={form.wifiName} onChange={(v) => update("wifiName", v)} />
              <Field label="Mot de passe Wi-Fi" value={form.wifiPassword} onChange={(v) => update("wifiPassword", v)} />
              <Field label="Horaires petit-dejeuner" value={form.breakfastHours} onChange={(v) => update("breakfastHours", v)} placeholder="07:00 - 10:30" />
              <Field label="Check-in" value={form.checkinTime} onChange={(v) => update("checkinTime", v)} />
              <Field label="Check-out" value={form.checkoutTime} onChange={(v) => update("checkoutTime", v)} />
              <Field label="Room service" value={form.roomServiceHours} onChange={(v) => update("roomServiceHours", v)} />
              <Field label="Telephone reception" value={form.receptionPhone} onChange={(v) => update("receptionPhone", v)} />
              <Field label="WhatsApp" value={form.whatsappNumber} onChange={(v) => update("whatsappNumber", v)} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Theme Guest App</p>
            <p className="mt-1 text-xs text-slate-500">L'identite visuelle appliquee a l'application client de votre hotel.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {guestThemeIds.map((themeId) => {
                const theme = guestThemes[themeId];
                const active = form.guestTheme === themeId;
                return (
                  <button
                    key={themeId}
                    type="button"
                    onClick={() => update("guestTheme", themeId)}
                    className={`overflow-hidden rounded-2xl border text-left transition focus:outline-none focus:ring-4 focus:ring-amber-300/10 ${active ? "border-amber-300/50 bg-amber-300/10" : "border-white/10 bg-slate-950/50 hover:bg-white/5"}`}
                  >
                    <span className={`block h-16 ${theme.preview}`} />
                    <span className="block p-4">
                      <span className="font-semibold tracking-tight text-white text-sm">{theme.name}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-400">{theme.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Langues</p>
            <p className="mt-1 text-xs text-slate-500">Langues disponibles dans l'application client.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {LANGUAGES.map((lang) => {
                const active = form.languages.includes(lang.value);
                return (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => toggleLanguage(lang.value)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-amber-300/10 ${active ? "border-amber-300/50 bg-amber-300/10 text-amber-100" : "border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/5"}`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Modules</p>
            <p className="mt-1 text-xs text-slate-500">Activez ou desactivez les modules de l'application client.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {MODULE_KEYS.map((mod) => {
                const enabled = Boolean(form.modules[mod]);
                return (
                  <label key={mod} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${enabled ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-50" : "border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/5"}`}>
                    <input type="checkbox" checked={enabled} onChange={() => toggleModule(mod)} className="sr-only" />
                    <span className={`flex h-5 w-10 shrink-0 rounded-full p-0.5 transition ${enabled ? "bg-emerald-400" : "bg-white/10"}`}>
                      <span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} />
                    </span>
                    <span className="capitalize">{mod === "recommendations" ? "Recommandations" : mod === "reviews" ? "Avis clients" : mod === "messages" ? "Messagerie" : mod === "requests" ? "Demandes de service" : mod === "services" ? "Services" : "Guide local"}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}