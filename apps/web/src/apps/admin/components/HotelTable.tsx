import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { guestUrl, receptionUrl } from "../../../lib/hotelOnboarding";
import type { HotelRecord } from "../admin.types";
import { CopyableUrl, formatAdminDate } from "./AdminSharedUI";
import { StatusBadge } from "./AdminStatusBadge";

export function HotelTable({ hotels, compact = false }: { hotels: HotelRecord[]; compact?: boolean }) {
  return (
    <div className="overflow-hidden">
      <div className={`hidden gap-4 border-b border-white/[0.07] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 lg:grid ${compact ? "grid-cols-[1.1fr_0.7fr_0.7fr_1fr_88px]" : "grid-cols-[1.1fr_0.8fr_0.6fr_0.7fr_1.2fr_1.2fr_0.7fr_120px]"}`}>
        <span>Hotel</span>
        <span>Slug</span>
        {!compact ? <span>Ville</span> : null}
        <span>Statut</span>
        <span>URL client</span>
        {!compact ? <span>URL reception</span> : null}
        {!compact ? <span>Cree le</span> : null}
        <span className="text-right">Action</span>
      </div>
      <div className="divide-y divide-white/[0.07]">
        {hotels.map((hotel) => (
          <article key={hotel.id} className={`grid gap-4 px-4 py-4 transition hover:bg-white/[0.04] lg:items-center lg:px-5 ${compact ? "lg:grid-cols-[1.1fr_0.7fr_0.7fr_1fr_88px]" : "lg:grid-cols-[1.1fr_0.8fr_0.6fr_0.7fr_1.2fr_1.2fr_0.7fr_120px]"}`}>
            <div>
              <p className="font-semibold tracking-tight text-white">{hotel.name}</p>
              <p className="mt-1 text-sm text-slate-400">{[hotel.city, hotel.country].filter(Boolean).join(", ") || "Adresse a completer"}</p>
            </div>
            <code className="w-fit rounded-xl border border-white/[0.07] bg-[#09090b] px-3 py-1 font-mono text-[11px] text-zinc-300">{hotel.slug}</code>
            {!compact ? <span className="text-sm text-zinc-300">{hotel.city || "-"}</span> : null}
            <StatusBadge status={hotel.status ?? "draft"} />
            <CopyableUrl href={guestUrl(hotel.slug)} label="URL client" />
            {!compact ? <CopyableUrl href={receptionUrl(hotel.slug)} label="URL reception" /> : null}
            {!compact ? <span className="text-sm text-zinc-400">{formatAdminDate(hotel.createdAt)}</span> : null}
            <Link to={`/admin/hotels/${hotel.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-400/10">
              Voir
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
