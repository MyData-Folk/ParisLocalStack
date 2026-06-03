import { useEffect, useState } from "react";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../../lib/api";
import { guestUrl } from "../../../lib/hotelOnboarding";
import { QrCodePdfButton } from "../../../components/QrCodePdfButton";
import { ErrorState, LoadingState } from "../../admin/components/AdminSharedUI";

export function HotelAdminQRPage({ hotelId, token }: { hotelId: string; token: string }) {
  const [hotel, setHotel] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotelId) { setError("Aucun hotel selectionne."); setLoading(false); return; }
    setLoading(true); setError("");
    api.hotel(hotelId, token)
      .then(setHotel)
      .catch(() => setError("Impossible de charger l'hotel."))
      .finally(() => setLoading(false));
  }, [hotelId, token]);

  const url = hotel?.slug ? guestUrl(hotel.slug) : "";

  if (loading) return <LoadingState label="Chargement du QR code..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">QR Code</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">QR code hotel</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Partagez ce QR code avec vos clients pour leur donner acces a leur concierge digital.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
          <div className="rounded-2xl bg-white p-5">
            {url ? (
              <QRCodeSVG value={url} size={280} marginSize={2} className="mx-auto h-auto w-full max-w-72" />
            ) : (
              <div className="grid aspect-square place-items-center text-sm text-zinc-500">Chargement du QR code</div>
            )}
          </div>
          {url ? (
            <div className="mt-4">
              <QrCodePdfButton url={url} hotelName={hotel?.name || hotel.slug} slug={hotel.slug} variant="amber" />
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-[#111115] p-5 shadow-lg shadow-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Lien client</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{hotel?.name ?? "Hotel"}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Le QR code ouvre l'app client de votre hôtel. Sans session existante, le client arrive directement sur l'enregistrement : identité, coordonnées, chambre et dates de séjour.</p>
          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#09090b] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Lien a partager</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-amber-100">{url || "Chargement..."}</code>
              <button type="button" disabled={!url} onClick={() => void navigator.clipboard?.writeText(url)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-amber-400/15 disabled:opacity-50" aria-label="Copier le lien client">
                <Copy className="h-4 w-4" />
              </button>
              <a href={url || undefined} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.07] focus:outline-none focus:ring-4 focus:ring-amber-400/15 aria-disabled:pointer-events-none aria-disabled:opacity-50" aria-disabled={!url} aria-label="Ouvrir l'app client">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div>
                <p className="text-sm font-medium text-white">Impression reception</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">Exportez le QR code en PDF pour l'imprimer et le placer a la reception ou dans les chambres.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div>
                <p className="text-sm font-medium text-white">Check-in digital</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">Envoyez le lien par email ou SMS avant l'arrivee pour un pre-check-in sans attente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}