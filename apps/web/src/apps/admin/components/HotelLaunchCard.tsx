import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { QrCodePdfButton } from "../../../components/QrCodePdfButton";
import { guestUrl, receptionUrl } from "../../../lib/hotelOnboarding";
import type { HotelRecord } from "../admin.types";

export function HotelLaunchCard({ hotel, previewSlug }: { hotel: HotelRecord | null; previewSlug: string }) {
  const slug = hotel?.slug || previewSlug;
  const clientUrl = slug ? guestUrl(slug) : "";
  const adminUrl = slug ? receptionUrl(slug) : "";

  return (
    <aside className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-black/20 md:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">URLs finales</h2>
          <p className="text-sm text-slate-400">{hotel ? "Hotel cree avec succes." : "Preview generee depuis le slug."}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <LaunchUrl label="URL client" url={clientUrl} />
        <LaunchUrl label="URL reception" url={adminUrl} />
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white p-4 text-slate-950">
        {clientUrl ? (
          <QRCodeSVG value={clientUrl} size={208} marginSize={2} className="mx-auto h-auto w-full max-w-56" />
        ) : (
          <div className="grid aspect-square place-items-center rounded-xl bg-slate-100 text-center text-sm text-slate-500">Le QR code apparaitra apres saisie du slug.</div>
        )}
      </div>
      {clientUrl ? (
        <div className="mt-4">
          <QrCodePdfButton url={clientUrl} hotelName={hotel?.name || slug} slug={slug} />
        </div>
      ) : null}
      {hotel ? (
        <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">Pret pour impression QR code et partage reception.</p>
      ) : null}
    </aside>
  );
}

export function LaunchUrl({ label, url }: { label: string; url: string }) {
  const disabled = !url;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate text-sm text-slate-200">{url || "Slug requis"}</code>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void navigator.clipboard?.writeText(url)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-amber-300/30 hover:text-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Copier ${label}`}
        >
          <Copy className="h-4 w-4" />
        </button>
        <a
          href={url || undefined}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-emerald-300/30 hover:text-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-300/10 aria-disabled:pointer-events-none aria-disabled:opacity-40"
          aria-disabled={disabled}
          aria-label={`Ouvrir ${label}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
