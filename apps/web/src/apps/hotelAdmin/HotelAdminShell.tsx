import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Hotel as HotelIcon, LayoutDashboard, LogOut, QrCode, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useAppStore } from "../../stores/appStore";

type ShellProps = {
  activeHotel: any;
  activeHotelId: string;
  availableHotels: any[];
  isSuperAdminView: boolean;
  onHotelChange: (hotelId: string) => void;
  basePath: string;
  children: ReactNode;
};

export function HotelAdminShell({ activeHotel, activeHotelId, availableHotels, isSuperAdminView, onHotelChange, basePath, children }: ShellProps) {
  const { currentUser, logout } = useAppStore();
  const route = (path = "") => `${basePath}${path}` || "/";
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 lg:flex">
      <aside className="border-b border-white/[0.07] bg-[#111115]/95 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <Link to={route()} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 transition hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-amber-400/15">
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
            <p className="mt-0.5 text-xs text-zinc-400">{activeHotel.city ?? "Paris"}{activeHotel.country ? `, ${activeHotel.country}` : ""}</p>
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

        <nav className="mt-5 space-y-1 text-sm">
          <HotelAdminNavLink to={route()} label="Tableau de bord" icon={<LayoutDashboard className="h-4 w-4" />} />
          <HotelAdminNavLink to={route("/profile")} label="Mon hôtel" icon={<HotelIcon className="h-4 w-4" />} secondaryPaths={[route("/settings")]} />
          <HotelAdminNavLink to={route("/modules")} label="Expérience client" icon={<Sparkles className="h-4 w-4" />} secondaryPaths={[route("/recommendations")]} />
          <HotelAdminNavLink to={route("/qr")} label="QR & diffusion" icon={<QrCode className="h-4 w-4" />} />
          <HotelAdminNavLink to={route("/crm")} label="Clients & CRM" icon={<Users className="h-4 w-4" />} secondaryPaths={[route("/analytics")]} />
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
              <p className="truncate text-[11px] text-zinc-400">{currentUser?.email}</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Espace hôtelier</p>
              <p className="text-sm font-medium text-zinc-200">Pilotage de votre établissement</p>
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


function HotelAdminNavLink({ to, label, icon, secondaryPaths }: { to: string; label: string; icon: ReactNode; secondaryPaths?: string[] }) {
  const location = useLocation();
  const isHomeRoute = to === "/" || to === "/hotel-admin";
  const matchesPrimary = location.pathname === to || (!isHomeRoute && location.pathname.startsWith(to));
  const matchesSecondary = secondaryPaths?.some((p) => location.pathname === p || location.pathname.startsWith(p)) ?? false;
  const active = matchesPrimary || matchesSecondary;
  return (
    <Link className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 font-medium transition focus:outline-none focus:ring-4 focus:ring-amber-400/15 ${active ? "border-amber-400/25 bg-amber-400/10 text-amber-100" : "border-transparent text-zinc-400 hover:border-white/[0.07] hover:bg-white/[0.04] hover:text-white"}`} to={to}>
      <span className={active ? "text-amber-300" : "text-zinc-500"}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
