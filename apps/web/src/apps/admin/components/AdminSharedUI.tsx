import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Copy, ExternalLink, Loader2, Plus } from "lucide-react";
import { AdminShell } from "../AdminShell";

export function CopyableUrl({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <a href={href} target="_blank" rel="noreferrer" className="min-w-0 truncate font-mono text-[11px] text-sky-200 transition hover:text-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-300/10">
        {href}
      </a>
      <button type="button" onClick={() => void navigator.clipboard?.writeText(href)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition hover:border-amber-400/30 hover:text-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-400/10" aria-label={`Copier ${label}`}>
        <Copy className="h-3.5 w-3.5" />
      </button>
      <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition hover:border-sky-400/30 hover:text-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-400/10" aria-label={`Ouvrir ${label}`}>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export function formatAdminDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(value));
}

export function InfoBlock({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-950/50 p-4 ${wide ? "md:col-span-2" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm text-slate-200">{value}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message, compact = false }: { message: string; compact?: boolean }) {
  return <div className={`rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100 ${compact ? "" : "m-5"}`}>{message}</div>;
}

export function EmptyState() {
  return (
    <div className="grid place-items-center p-10 text-center">
      <Building2 className="h-10 w-10 text-slate-500" />
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">Aucun hotel trouve</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Creez le premier hotel client pour generer ses URLs et son QR code.</p>
      <Link to="/admin/hotels/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20">
        <Plus className="h-4 w-4" />
        Creer un hotel
      </Link>
    </div>
  );
}

export function AdminPlaceholder({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <AdminShell>
      <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">{icon}</div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
        <Link to="/admin/hotels" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10">
          Retour hotels
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </AdminShell>
  );
}
