import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

type QrCodePdfButtonProps = {
  url: string;
  hotelName: string;
  slug: string;
  variant?: "amber" | "emerald";
};

export function QrCodePdfButton({ url, hotelName, slug, variant = "amber" }: QrCodePdfButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const colorClasses = variant === "emerald"
    ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15 focus:ring-emerald-300/10"
    : "border-amber-300/25 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15 focus:ring-amber-300/10";

  async function exportPdf() {
    if (!url || !canvasRef.current) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const qrDataUrl = canvasRef.current.toDataURL("image/png");
      const title = hotelName || "Hotel";
      const safeSlug = slug || "hotel";

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 297, "F");
      pdf.setTextColor(245, 245, 245);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.text(title, pageWidth / 2, 42, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(203, 213, 225);
      pdf.text("Votre concierge digital", pageWidth / 2, 52, { align: "center" });

      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(55, 70, 100, 100, 6, 6, "F");
      pdf.addImage(qrDataUrl, "PNG", 65, 80, 80, 80);

      pdf.setTextColor(245, 245, 245);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Scannez pour ouvrir l'application sejour", pageWidth / 2, 190, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184);
      pdf.text(url, pageWidth / 2, 202, { align: "center", maxWidth: 170 });
      pdf.setFontSize(9);
      pdf.text("Paris Local - Digital Hotel Concierge", pageWidth / 2, 270, { align: "center" });

      pdf.save(`qr-code-${safeSlug}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void exportPdf()}
        disabled={!url || exporting}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${colorClasses}`}
      >
        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {exporting ? "Export..." : "Exporter le QR en PDF"}
      </button>
      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0" aria-hidden="true">
        <QRCodeCanvas ref={canvasRef} value={url || " "} size={1024} marginSize={4} bgColor="#ffffff" fgColor="#0f172a" />
      </div>
    </>
  );
}

