import { CheckCircle2 } from "lucide-react";
import { guestThemeIds, guestThemes, type GuestThemeId } from "../../../themes";

export function Field({ label, value, onChange, placeholder, helper, type = "text", required = false, list }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helper?: string; type?: string; required?: boolean; list?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        list={list}
      />
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span className="flex rounded-xl border border-white/10 bg-slate-950/70 p-2 transition focus-within:border-amber-300/50 focus-within:ring-4 focus-within:ring-amber-300/10">
        <input className="h-10 w-12 rounded-lg border-0 bg-transparent" type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} />
        <input className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-100 outline-none" value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

export function ThemePicker({ value, onChange }: { value: GuestThemeId; onChange: (value: GuestThemeId) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-300">Theme app client</p>
        <p className="mt-1 text-xs text-slate-500">Choisissez le template UX/UI applique au sous-domaine client.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {guestThemeIds.map((themeId) => {
          const theme = guestThemes[themeId];
          const active = value === themeId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange(theme.id)}
              className={`overflow-hidden rounded-2xl border text-left transition focus:outline-none focus:ring-4 focus:ring-amber-300/10 ${active ? "border-amber-300/50 bg-amber-300/10" : "border-white/10 bg-slate-950/50 hover:bg-white/5"}`}
            >
              <span className={`block h-20 ${theme.preview}`} />
              <span className="block p-4">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold tracking-tight text-white">{theme.name}</span>
                  {active ? <CheckCircle2 className="h-4 w-4 text-amber-200" /> : null}
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
