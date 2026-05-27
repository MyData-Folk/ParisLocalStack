import { Bell, BellRing } from "lucide-react";

interface NotificationBellProps {
  unreadMessages: number;
  unreadRequests: number;
  onClear: () => void;
  onRequestPermission: () => void;
}

export function NotificationBell({
  unreadMessages,
  unreadRequests,
  onClear,
  onRequestPermission
}: NotificationBellProps) {
  const totalUnread = unreadMessages + unreadRequests;

  const handleClick = () => {
    // Demande la permission desktop
    onRequestPermission();
    // Vide les compteurs
    onClear();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-4 focus:ring-sky-400/15"
      aria-label="Notifications de la réception"
    >
      {totalUnread > 0 ? (
        <BellRing className="h-5 w-5 text-amber-300" />
      ) : (
        <Bell className="h-5 w-5" />
      )}

      {totalUnread > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-[#09090b]">
          {totalUnread}
        </span>
      ) : null}
    </button>
  );
}
