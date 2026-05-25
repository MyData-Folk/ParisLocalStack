import { Link } from "react-router-dom";
import { Eye, FileText, Palette, PlusCircle, QrCode, Rocket } from "lucide-react";
import { AuthGate } from "../../components/auth/AuthGate";

export function GeneratorApp() {
  const items = [
    { id: "new-hotel", label: "Nouvel hotel", description: "Initialiser un espace hotel pret a configurer.", icon: <PlusCircle className="h-5 w-5" /> },
    { id: "config", label: "Configuration", description: "Modules, horaires et informations operationnelles.", icon: <FileText className="h-5 w-5" /> },
    { id: "branding", label: "Branding", description: "Couleurs, logo et experience visuelle.", icon: <Palette className="h-5 w-5" /> },
    { id: "content", label: "Contenu", description: "Guides, services et recommandations locales.", icon: <FileText className="h-5 w-5" /> },
    { id: "preview", label: "Preview", description: "Verifier l'app client avant publication.", icon: <Eye className="h-5 w-5" /> },
    { id: "deploy", label: "Deploy", description: "Preparer QR code et deploiement Coolify.", icon: <Rocket className="h-5 w-5" /> }
  ];

  return (
    <AuthGate title="Connexion generateur" subtitle="Acces securise au generateur hotel" defaultEmail="admin@paris-local.test" allowedRoles={["super_admin"]}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.10),transparent_34%),linear-gradient(180deg,#020617,#0f172a)] p-4 text-slate-100 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/20 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Hotel builder</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Generateur Hotel</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Configuration, branding, contenu, preview, QR code et preparation Coolify.</p>
              </div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-emerald-100">
                <QrCode className="h-6 w-6" />
                <p className="mt-2 text-sm font-medium">QR-ready</p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Link key={item.id} to={`/generator/${item.id}`} className="group rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-300/10">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200 transition group-hover:bg-emerald-300 group-hover:text-slate-950">
                  {item.icon}
                </div>
                <h2 className="mt-5 text-lg font-semibold tracking-tight">{item.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
