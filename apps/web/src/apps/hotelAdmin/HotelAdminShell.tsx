import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Building2, Compass, LayoutDashboard, LogOut, QrCode, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { useAppStore } from "../../stores/appStore";

type ShellProps = {
  activeHotel: any;
  activeHotelId: string;
  availableHotels: any[];
  isSuperAdminView: boolean;
  onHotelChange: (hotelId: string) => void;
  children: ReactNode;
};

export function HotelAdminShell({ activeHotel, activeHotelId, availableHotels, isSuperAdminView, onHotelChange, children }: ShellProps) {
  const { currentUser, logout } = useAppStore();
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 lg:flex">
      <aside className="border-b border-white/[0.07] bg-[#111115]/95 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <Link to="/hotel-admin" className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 transition hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-amber-400/15">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-amber-300">Paris Local</span>
            <span className="block truncate text-sm font-semibold tracking-tight text-white">Admin Hotel</span>
          </span>
        </Link>

        {activeHotel ? (
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-[#09090b] p-3">
            <p className="truncate text-sm font-medium text-white">{activeHotel.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{activeHotel.city ?? "Paris"}{activeHotel.country ? `, ${activeHotel.country}` : ""}</p>
          </div>
        ) : null}

        {isSuperAdminView && availableHotels.length > 1 ? (
          <div className="mt-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">Mode support Super Admin</p>
            <select value={activeHotelId} onChange={(e) => onHotelChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10">
              {availableHotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        ) : null}

        <nav className="mt-5 space-y-5 text-sm">
          <HotelAdminNavGroup label="Hotel">
            <HotelAdminNavLink to="/hotel-admin" label="Tableau de bord" icon={<LayoutDashboard className="h-4 w-4" />} />
            <HotelAdminNavLink to="/hotel-admin/profile" label="Profil hotel" icon={<Building2 className="h-4 w-4" />} />
            <HotelAdminNavLink to="/hotel-admin/recommendations" label="Recommandations" icon={<Compass className="h-4 w-4" />} />
            <HotelAdminNavLink to="/hotel-admin/settings" label="Parametres" icon={<Settings className="h-4 w-4" />} />
          </HotelAdminNavGroup>
          <HotelAdminNavGroup label="Performance">
            <HotelAdminNavLink to="/hotel-admin/modules" label="Modules & offre" icon={<Sparkles className="h-4 w-4" />} />
            <HotelAdminNavLink to="/hotel-admin/analytics" label="Analytics" icon={<BarChart3 className="h-4 w-4" />} />
            <HotelAdminNavLink to="/hotel-admin/qr" label="QR Code" icon={<QrCode className="h-4 w-4" />} />
          </HotelAdminNavGroup>
        </nav>

        <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4 text-sm text-amber-100 lg:mt-auto">
          <p className="font-semibold">Concierge digital</p>
          <p className="mt-1 text-xs leading-5 text-amber-100/70">Personnalisez l'experience client et pilotez la satisfaction.</p>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Link to="/reception" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20 focus:outline-none focus:ring-4 focus:ring-sky-400/15">
            Dashboard Reception
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{currentUser?.name}</p>
              <p className="truncate text-[11px] text-zinc-500">{currentUser?.email}</p>
            </div>
            <button type="button" onClick={() => void logout()} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-100 focus:outline-none focus:ring-4 focus:ring-red-400/10" aria-label="Se deconnecter">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#09090b]/85 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Admin Hotel</p>
              <p className="text-sm font-medium text-zinc-200">Gestion de votre etablissement</p>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-5 md:px-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function HotelAdminNavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 hidden px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 lg:block">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function HotelAdminNavLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== "/hotel-admin" && location.pathname.startsWith(to));
  return (
    <Link className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 font-medium transition focus:outline-none focus:ring-4 focus:ring-amber-400/15 ${active ? "border-amber-400/25 bg-amber-400/10 text-amber-100" : "border-transparent text-zinc-400 hover:border-white/[0.07] hover:bg-white/[0.04] hover:text-white"}`} to={to}>
      <span className={active ? "text-amber-300" : "text-zinc-500"}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}