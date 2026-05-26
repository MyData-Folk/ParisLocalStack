import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Hotel,
  Loader2,
  MessageSquare,
  Palette,
  Phone,
  QrCode,
  Sparkles,
  Wifi
} from "lucide-react";
import { AuthGate } from "../../components/auth/AuthGate";
import { QrCodePdfButton } from "../../components/QrCodePdfButton";
import { api } from "../../lib/api";
import {
  defaultSettingsForm,
  emptyHotelForm,
  guestUrl,
  normalizeHotelPayload,
  normalizeSettingsPayload,
  receptionUrl,
  slugify,
  type HotelFormState,
  type SettingsFormState
} from "../../lib/hotelOnboarding";
import { useAppStore } from "../../stores/appStore";
import { guestThemeIds, guestThemes, type GuestThemeId } from "../../themes";

type CreatedHotel = HotelFormState & { id: string; settings?: unknown };
type StepKey = "identity" | "branding" | "practical" | "modules" | "preview";

const steps: Array<{ key: StepKey; label: string; description: string }> = [
  { key: "identity", label: "Identite", description: "Nom, slug et contacts." },
  { key: "branding", label: "Branding", description: "Couleurs et logo." },
  { key: "practical", label: "Infos pratiques", description: "Wi-Fi, horaires et reception." },
  { key: "modules", label: "Modules", description: "Services actifs cote client." },
  { key: "preview", label: "Preview", description: "URLs finales et QR code." }
];

export function GeneratorApp() {
  return (
    <AuthGate title="Connexion generateur" subtitle="Acces securise au generateur hotel" defaultEmail="admin@paris-local.test" allowedRoles={["super_admin"]}>
      <GeneratorWizard />
    </AuthGate>
  );
}

function GeneratorWizard() {
  const { token } = useAppStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [hotelForm, setHotelForm] = useState<HotelFormState>(emptyHotelForm);
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>(defaultSettingsForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdHotel, setCreatedHotel] = useState<CreatedHotel | null>(null);
  const currentStep = steps[stepIndex];
  const slug = slugify(hotelForm.slug || hotelForm.name);
  const clientUrl = slug ? guestUrl(slug) : "";
  const adminUrl = slug ? receptionUrl(slug) : "";

  const completion = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex]);

  function updateHotel<K extends keyof HotelFormState>(field: K, value: HotelFormState[K]) {
    setHotelForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && !slugTouched) next.slug = slugify(String(value));
      if (field === "slug") next.slug = slugify(String(value));
      return next;
    });
    if (field === "slug") setSlugTouched(true);
  }

  function updateSettings<K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) {
    setSettingsForm((current) => ({ ...current, [field]: value }));
  }

  function toggleModule(module: string) {
    setSettingsForm((current) => ({
      ...current,
      modules: { ...current.modules, [module]: !current.modules[module] }
    }));
  }

  async function saveHotel() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const payload = normalizeHotelPayload(hotelForm);
      const hotel = createdHotel?.id
        ? await api.updateHotel(createdHotel.id, payload, token)
        : await api.createHotel(payload, token);
      const settings = await api.updateHotelSettings(hotel.id, normalizeSettingsPayload(settingsForm), token);
      setCreatedHotel({ ...hotel, settings });
      setStepIndex(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'hotel");
    } finally {
      setSaving(false);
    }
  }

  function nextStep() {
    if (stepIndex < steps.length - 1) setStepIndex((current) => current + 1);
  }

  function previousStep() {
    if (stepIndex > 0) setStepIndex((current) => current - 1);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.10),transparent_34%),linear-gradient(180deg,#020617,#0f172a)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-8 md:py-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between md:p-5">
          <Link to="/admin/hotels" className="inline-flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-emerald-300/10">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Hotel builder</span>
              <span className="block text-lg font-semibold tracking-tight text-white">Generateur Hotel</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/admin/hotels" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10">
              <ArrowLeft className="h-4 w-4" />
              Admin hotels
            </Link>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[320px_1fr_360px]">
          <aside className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Progression</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Onboarding hotel</h1>
            <div className="mt-5 flex gap-1" aria-label={`Progression ${completion}%`}>
              {steps.map((step, index) => (
                <span key={step.key} className={`h-2 flex-1 rounded-full transition ${index <= stepIndex ? "bg-emerald-300" : "bg-white/10"}`} />
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {steps.map((step, index) => (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={`w-full rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-emerald-300/10 ${index === stepIndex ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10 bg-slate-950/40 hover:bg-white/5"}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 place-items-center rounded-xl text-sm font-semibold ${index < stepIndex ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-slate-200"}`}>
                      {index < stepIndex ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{step.label}</span>
                      <span className="mt-1 block text-xs text-slate-400">{step.description}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <main className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-black/20 md:p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Etape {stepIndex + 1} / {steps.length}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{currentStep.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{currentStep.description}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <BadgeCheck className="h-3.5 w-3.5" />
                Multi-tenant
              </span>
            </div>

            {currentStep.key === "identity" ? <IdentityStep form={hotelForm} update={updateHotel} /> : null}
            {currentStep.key === "branding" ? <BrandingStep form={hotelForm} settingsForm={settingsForm} update={updateHotel} updateSettings={updateSettings} /> : null}
            {currentStep.key === "practical" ? <PracticalStep form={settingsForm} update={updateSettings} /> : null}
            {currentStep.key === "modules" ? <ModulesStep form={settingsForm} toggle={toggleModule} /> : null}
            {currentStep.key === "preview" ? <PreviewStep hotelForm={hotelForm} settingsForm={settingsForm} createdHotel={createdHotel} saving={saving} error={error} onSave={() => void saveHotel()} /> : null}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={previousStep}
                disabled={stepIndex === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              {stepIndex < steps.length - 1 ? (
                <button type="button" onClick={nextStep} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20">
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={() => void saveHotel()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {createdHotel ? "Mettre a jour" : "Creer l'hotel"}
                </button>
              )}
            </div>
          </main>

          <aside className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                <QrCode className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">Preview live</h2>
                <p className="text-sm text-slate-400">Slug et URLs canoniques.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <PreviewUrl label="Client" url={clientUrl} />
              <PreviewUrl label="Reception" url={adminUrl} />
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white p-4">
              {clientUrl ? <QRCodeSVG value={clientUrl} size={198} marginSize={2} className="mx-auto h-auto w-full max-w-52" /> : <div className="grid aspect-square place-items-center rounded-xl bg-slate-100 text-center text-sm text-slate-500">Slug requis</div>}
            </div>
            {clientUrl ? (
              <div className="mt-4">
                <QrCodePdfButton url={clientUrl} hotelName={hotelForm.name || slug} slug={slug} variant="emerald" />
              </div>
            ) : null}
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Resume</p>
              <p className="mt-2 text-sm font-semibold text-white">{hotelForm.name || "Nom hotel"}</p>
              <p className="mt-1 text-sm text-slate-400">{[hotelForm.city, hotelForm.country].filter(Boolean).join(", ")}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/80">{guestThemes[settingsForm.guestTheme].name}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(settingsForm.modules).filter(([, enabled]) => enabled).map(([module]) => (
                  <span key={module} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{module}</span>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function IdentityStep({ form, update }: { form: HotelFormState; update: <K extends keyof HotelFormState>(field: K, value: HotelFormState[K]) => void }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Field label="Nom hotel" value={form.name} onChange={(value) => update("name", value)} placeholder="Hotel Saint-Germain" required icon={<Hotel className="h-4 w-4" />} />
      <Field label="Slug" value={form.slug} onChange={(value) => update("slug", value)} placeholder="saint-germain" required helper="Le slug pilote les sous-domaines." />
      <Field label="Adresse" value={form.address ?? ""} onChange={(value) => update("address", value)} placeholder="14 rue..." />
      <Field label="Ville" value={form.city ?? ""} onChange={(value) => update("city", value)} placeholder="Paris" />
      <Field label="Pays" value={form.country ?? ""} onChange={(value) => update("country", value)} placeholder="France" />
      <Field label="Telephone" value={form.phone ?? ""} onChange={(value) => update("phone", value)} placeholder="+33 1..." icon={<Phone className="h-4 w-4" />} />
      <Field type="email" label="Email" value={form.email} onChange={(value) => update("email", value)} placeholder="reception@hotel.fr" required />
      <Field type="url" label="Site web" value={form.website ?? ""} onChange={(value) => update("website", value)} placeholder="https://hotel.fr" />
    </div>
  );
}

function BrandingStep({ form, settingsForm, update, updateSettings }: { form: HotelFormState; settingsForm: SettingsFormState; update: <K extends keyof HotelFormState>(field: K, value: HotelFormState[K]) => void; updateSettings: <K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) => void }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Field label="Logo URL" value={form.logoUrl ?? ""} onChange={(value) => update("logoUrl", value)} placeholder="https://..." icon={<Building2 className="h-4 w-4" />} />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-300">Statut initial</span>
        <select className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300/50 focus:ring-4 focus:ring-emerald-300/10" value={form.status} onChange={(event) => update("status", event.target.value as HotelFormState["status"])}>
          <option value="active">Actif</option>
          <option value="draft">Brouillon</option>
          <option value="inactive">Inactif</option>
        </select>
      </label>
      <ColorField label="Couleur principale" value={form.primaryColor ?? "#c9a84c"} onChange={(value) => update("primaryColor", value)} />
      <ColorField label="Couleur secondaire" value={form.secondaryColor ?? "#0f172a"} onChange={(value) => update("secondaryColor", value)} />
      <label className="block space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-slate-300">Description courte</span>
        <textarea className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 focus:ring-4 focus:ring-emerald-300/10" value={form.description ?? ""} onChange={(event) => update("description", event.target.value)} placeholder="Boutique hotel premium au coeur de Paris." />
      </label>
      <div className="md:col-span-2">
        <ThemePicker value={settingsForm.guestTheme} onChange={(value) => updateSettings("guestTheme", value)} />
      </div>
    </div>
  );
}

function PracticalStep({ form, update }: { form: SettingsFormState; update: <K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) => void }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Field label="Wi-Fi" value={form.wifiName} onChange={(value) => update("wifiName", value)} placeholder="Hotel Guests" icon={<Wifi className="h-4 w-4" />} />
      <Field label="Mot de passe Wi-Fi" value={form.wifiPassword} onChange={(value) => update("wifiPassword", value)} placeholder="Paris2026!" />
      <Field label="Petit dejeuner" value={form.breakfastHours} onChange={(value) => update("breakfastHours", value)} placeholder="07:00 - 10:30" icon={<Clock className="h-4 w-4" />} />
      <Field label="Room service" value={form.roomServiceHours} onChange={(value) => update("roomServiceHours", value)} placeholder="18:00 - 22:30" />
      <Field label="Check-in" value={form.checkinTime} onChange={(value) => update("checkinTime", value)} placeholder="15:00" />
      <Field label="Check-out" value={form.checkoutTime} onChange={(value) => update("checkoutTime", value)} placeholder="12:00" />
      <Field label="Telephone reception" value={form.receptionPhone} onChange={(value) => update("receptionPhone", value)} placeholder="+33 1..." />
      <Field label="WhatsApp" value={form.whatsappNumber} onChange={(value) => update("whatsappNumber", value)} placeholder="+33 6..." />
    </div>
  );
}

function ModulesStep({ form, toggle }: { form: SettingsFormState; toggle: (module: string) => void }) {
  const moduleLabels: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
    guide: { label: "Guide hotel", description: "Informations pratiques client.", icon: <Hotel className="h-5 w-5" /> },
    services: { label: "Services", description: "Taxi, restaurant, demandes.", icon: <Sparkles className="h-5 w-5" /> },
    messages: { label: "Messagerie", description: "Client vers reception.", icon: <MessageSquare className="h-5 w-5" /> },
    requests: { label: "Demandes", description: "Suivi operationnel.", icon: <BadgeCheck className="h-5 w-5" /> },
    reviews: { label: "Avis", description: "Satisfaction client.", icon: <Check className="h-5 w-5" /> },
    recommendations: { label: "Recommandations", description: "Adresses locales.", icon: <Palette className="h-5 w-5" /> }
  };

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {Object.entries(moduleLabels).map(([module, item]) => {
        const enabled = form.modules[module];
        return (
          <button
            key={module}
            type="button"
            onClick={() => toggle(module)}
            className={`rounded-2xl border p-5 text-left transition focus:outline-none focus:ring-4 focus:ring-emerald-300/10 ${enabled ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10 bg-slate-950/50 hover:bg-white/5"}`}
          >
            <span className="flex items-start justify-between gap-4">
              <span className="flex gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${enabled ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-slate-300"}`}>{item.icon}</span>
                <span>
                  <span className="block font-semibold text-white">{item.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-400">{item.description}</span>
                </span>
              </span>
              <span className={`mt-1 h-5 w-9 rounded-full p-0.5 transition ${enabled ? "bg-emerald-300" : "bg-white/10"}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-4" : ""}`} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PreviewStep({ hotelForm, settingsForm, createdHotel, saving, error, onSave }: { hotelForm: HotelFormState; settingsForm: SettingsFormState; createdHotel: CreatedHotel | null; saving: boolean; error: string | null; onSave: () => void }) {
  const slug = slugify(hotelForm.slug || hotelForm.name);
  const clientUrl = slug ? guestUrl(slug) : "";
  const adminUrl = slug ? receptionUrl(slug) : "";

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard label="Hotel" value={hotelForm.name || "A renseigner"} description={[hotelForm.city, hotelForm.country].filter(Boolean).join(", ")} />
        <SummaryCard label="Slug" value={slug || "A renseigner"} description="Identifiant multi-tenant" />
        <SummaryCard label="Wi-Fi" value={settingsForm.wifiName || "Non renseigne"} description={settingsForm.wifiPassword || "Mot de passe non renseigne"} />
        <SummaryCard label="Theme client" value={guestThemes[settingsForm.guestTheme].name} description={guestThemes[settingsForm.guestTheme].mood} />
        <SummaryCard label="Modules actifs" value={String(Object.values(settingsForm.modules).filter(Boolean).length)} description="Fonctions client activees" />
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <h3 className="text-lg font-semibold tracking-tight text-white">Creation finale</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">Cette action cree ou met a jour l'hotel, puis applique les settings operationnels.</p>
        {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
        {createdHotel ? <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">Hotel enregistre. Les URLs et le QR code sont prets.</p> : null}
        {createdHotel ? (
          <a href={`/admin/hotels/${createdHotel.id}`} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-emerald-300/10">
            Gerer les recommandations locales
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
        <button type="button" onClick={onSave} disabled={saving || !hotelForm.name || !hotelForm.email || !slug} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {createdHotel ? "Mettre a jour l'hotel" : "Creer l'hotel"}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <PreviewUrl label="URL client" url={clientUrl} />
        <PreviewUrl label="URL reception" url={adminUrl} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, helper, type = "text", required = false, icon }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helper?: string; type?: string; required?: boolean; icon?: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span className="relative block">
        {icon ? <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span> : null}
        <input className={`w-full rounded-xl border border-white/10 bg-slate-950/70 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 focus:ring-4 focus:ring-emerald-300/10 ${icon ? "px-11" : "px-4"}`} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
      </span>
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span className="flex rounded-xl border border-white/10 bg-slate-950/70 p-2 transition focus-within:border-emerald-300/50 focus-within:ring-4 focus-within:ring-emerald-300/10">
        <input className="h-10 w-12 rounded-lg border-0 bg-transparent" type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} />
        <input className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-100 outline-none" value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function ThemePicker({ value, onChange }: { value: GuestThemeId; onChange: (value: GuestThemeId) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-300">Theme app client</p>
        <p className="mt-1 text-xs text-slate-500">Le style visuel est stocke dans les settings de l'hotel et charge dynamiquement par la Guest App.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {guestThemeIds.map((themeId) => {
          const theme = guestThemes[themeId];
          const active = value === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange(theme.id)}
              className={`overflow-hidden rounded-2xl border text-left transition focus:outline-none focus:ring-4 focus:ring-emerald-300/10 ${active ? "border-emerald-300/50 bg-emerald-300/10" : "border-white/10 bg-slate-950/50 hover:bg-white/5"}`}
            >
              <span className={`block h-20 ${theme.preview}`} />
              <span className="block p-4">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold tracking-tight text-white">{theme.name}</span>
                  {active ? <Check className="h-4 w-4 text-emerald-200" /> : null}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-400">{theme.description}</span>
                <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{theme.mood}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewUrl({ label, url }: { label: string; url: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate text-sm text-slate-200">{url || "Slug requis"}</code>
        <button type="button" disabled={!url} onClick={() => void navigator.clipboard?.writeText(url)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-emerald-300/30 hover:text-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Copier ${label}`}>
          <Copy className="h-4 w-4" />
        </button>
        <a href={url || undefined} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-emerald-300/30 hover:text-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-300/10 aria-disabled:pointer-events-none aria-disabled:opacity-40" aria-disabled={!url} aria-label={`Ouvrir ${label}`}>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{description || "A completer"}</p>
    </div>
  );
}
