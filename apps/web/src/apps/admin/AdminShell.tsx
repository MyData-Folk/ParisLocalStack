import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Hotel, LogOut, Plus, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useAppStore } from "../../stores/appStore";

export function AdminShell({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useAppStore();
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 lg:flex">
      <aside className="border-b border-white/[0.07] bg-[#111115]/95 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
        <Link to="/admin" className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 transition hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-amber-400/15">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-amber-300">Paris Local</span>
              <span className="block truncate text-sm font-semibold tracking-tight text-white">Super Admin</span>
            </span>
        </Link>
        <nav className="mt-5 grid grid-cols-2 gap-2 text-sm lg:block lg:space-y-5">
          <AdminNavGroup label="Gestion">
            <AdminNavLink to="/admin" label="Tableau de bord" icon={<Home className="h-4 w-4" />} />
            <AdminNavLink to="/admin/hotels" label="Hotels" icon={<Hotel className="h-4 w-4" />} />
            <AdminNavLink to="/admin/users" label="Utilisateurs" icon={<Users className="h-4 w-4" />} />
          </AdminNavGroup>
          <AdminNavGroup label="Outils">
            <AdminNavLink to="/generator" label="Generator" icon={<Sparkles className="h-4 w-4" />} />
          </AdminNavGroup>
          <AdminNavGroup label="Configuration">
            <AdminNavLink to="/admin/settings" label="Parametres" icon={<Settings className="h-4 w-4" />} />
          </AdminNavGroup>
        </nav>
        <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4 text-sm text-amber-100 lg:mt-auto">
          <p className="font-semibold">Plateforme multi-tenant</p>
          <p className="mt-1 text-xs leading-5 text-amber-100/70">Une base centrale, isolation par hotel_id, URLs canoniques par slug.</p>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{currentUser?.name}</p>
            <p className="truncate text-[11px] text-zinc-500">{currentUser?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-100 focus:outline-none focus:ring-4 focus:ring-red-400/10"
            aria-label="Se deconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#09090b]/85 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Console plateforme</p>
              <p className="text-sm font-medium text-zinc-200">Pilotage hotels, QR codes et templates</p>
            </div>
            <Link to="/admin/hotels/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-400/20">
              <Plus className="h-4 w-4" />
              Creer un hotel
            </Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-5 md:px-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AdminNavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 hidden px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 lg:block">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function AdminNavLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== "/admin" && location.pathname.startsWith(to));
  return (
    <Link className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 font-medium transition focus:outline-none focus:ring-4 focus:ring-amber-400/15 ${active ? "border-amber-400/25 bg-amber-400/10 text-amber-100" : "border-transparent text-zinc-400 hover:border-white/[0.07] hover:bg-white/[0.04] hover:text-white"}`} to={to}>
      <span className={active ? "text-amber-300" : "text-zinc-500"}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
