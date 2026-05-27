import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Activity, Inbox, ListChecks, Users, Archive, Star, QrCode, Image as ImageIcon, BarChart3, Settings, Radio, LogOut } from "lucide-react";
import { useReceptionNotifications } from "../hooks/useReceptionNotifications";
import { useNotificationSound } from "../hooks/useNotificationSound";
import { useDesktopNotifications } from "../hooks/useDesktopNotifications";
import { NotificationBell } from "./NotificationBell";

interface ReceptionShellProps {
  currentUser: any;
  hotelContext: any;
  tenantSlug: string | null;
  basePath: string;
  logout: () => void;
  children: React.ReactNode;
}

function ReceptionNavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 hidden px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 lg:block">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 font-medium transition focus:outline-none focus:ring-4 focus:ring-sky-400/15 ${active ? "border-sky-400/25 bg-sky-400/10 text-sky-100 shadow-sm" : "border-transparent text-zinc-400 hover:border-white/[0.07] hover:bg-white/[0.04] hover:text-white"}`}>
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${active ? "bg-sky-400 text-zinc-950" : "bg-white/[0.04] text-zinc-500 group-hover:text-white"}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {badge}
    </Link>
  );
}

export function ReceptionShell({
  currentUser,
  hotelContext,
  tenantSlug,
  basePath,
  logout,
  children
}: ReceptionShellProps) {
  const hotelId = hotelContext?.id;
  const {
    unreadMessages,
    unreadRequests,
    totalUnread,
    clearMessages,
    clearRequests
  } = useReceptionNotifications(hotelId);

  const { playPing } = useNotificationSound();
  const { requestPermission, notify } = useDesktopNotifications();

  const prevTotalUnreadRef = React.useRef(totalUnread);

  React.useEffect(() => {
    if (totalUnread > prevTotalUnreadRef.current) {
      playPing();
      notify("Paris Local - Alerte Réception", "Vous avez reçu un nouveau message ou une nouvelle demande.");
    }
    prevTotalUnreadRef.current = totalUnread;
  }, [totalUnread, playPing, notify]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 lg:flex">
      <aside className="border-b border-white/[0.07] bg-[#111115]/95 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[280px] lg:flex-col lg:border-b-0 lg:border-r lg:p-5">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-300 shadow-lg shadow-black/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">Paris Local</p>
              <h1 className="mt-1 truncate text-xl font-bold tracking-tight">Reception</h1>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-[#09090b] p-3">
            <p className="truncate text-sm font-medium text-white">{hotelContext?.name ?? currentUser?.name}</p>
            <p className="mt-1 text-xs text-zinc-500">{tenantSlug ? `admin-${tenantSlug}` : "Centre operationnel hotelier"}</p>
          </div>
        </div>
        <nav className="mt-4 grid grid-cols-2 gap-2 text-sm lg:block lg:space-y-5">
          <ReceptionNavGroup label="Operations">
            <NavItem to={`${basePath}/dashboard`} icon={<Activity className="h-4 w-4" />} label="Dashboard" />
            <NavItem
              to={`${basePath}/inbox`}
              icon={<Inbox className="h-4 w-4" />}
              label="Messagerie"
              badge={
                unreadMessages > 0 ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30">
                    {unreadMessages}
                  </span>
                ) : undefined
              }
            />
            <NavItem
              to={`${basePath}/requests`}
              icon={<ListChecks className="h-4 w-4" />}
              label="Demandes"
              badge={
                unreadRequests > 0 ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-300 ring-1 ring-red-500/30">
                    {unreadRequests}
                  </span>
                ) : undefined
              }
            />
          </ReceptionNavGroup>
          <ReceptionNavGroup label="Clients">
            <NavItem to={`${basePath}/guests`} icon={<Users className="h-4 w-4" />} label="Clients presents" />
            <NavItem to={`${basePath}/history`} icon={<Archive className="h-4 w-4" />} label="Historique CRM" />
            <NavItem to={`${basePath}/reviews`} icon={<Star className="h-4 w-4" />} label="Avis" />
            <NavItem to={`${basePath}/qr`} icon={<QrCode className="h-4 w-4" />} label="QR Code" />
            <NavItem to={`${basePath}/media`} icon={<ImageIcon className="h-4 w-4" />} label="Medias" />
          </ReceptionNavGroup>
          <ReceptionNavGroup label="Pilotage">
            <NavItem to={`${basePath}/analytics`} icon={<BarChart3 className="h-4 w-4" />} label="Analytics" />
            <NavItem to={`${basePath}/settings`} icon={<Settings className="h-4 w-4" />} label="Parametres" />
          </ReceptionNavGroup>
        </nav>
        <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4 text-sm text-emerald-100 lg:mt-auto">
          <div className="flex items-center gap-2 font-semibold">
            <Radio className="h-4 w-4" />
            Synchronisation active
          </div>
          <p className="mt-2 leading-5 text-emerald-100/70">Messages, demandes et avis sont mis a jour en direct.</p>
        </div>
        <button onClick={() => void logout()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10">
          <LogOut className="h-4 w-4" /> Deconnexion
        </button>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#09090b]/85 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Front desk</p>
              <p className="text-sm font-medium text-zinc-200">Messages, demandes, CRM et satisfaction</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell
                unreadMessages={unreadMessages}
                unreadRequests={unreadRequests}
                onClear={() => {
                  clearMessages();
                  clearRequests();
                }}
                onRequestPermission={requestPermission}
              />
              <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-100 sm:flex">
                <Radio className="h-3.5 w-3.5" />
                Live
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6 p-4 md:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
