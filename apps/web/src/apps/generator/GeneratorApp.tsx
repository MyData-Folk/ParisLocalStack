import { Link } from "react-router-dom";
import { AuthGate } from "../../components/auth/AuthGate";

export function GeneratorApp() {
  return (
    <AuthGate title="Connexion generateur" subtitle="Acces securise au generateur hotel" defaultEmail="admin@paris-local.test" allowedRoles={["super_admin"]}>
      <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
        <h1 className="text-2xl font-semibold">Generateur Hotel</h1>
        <p className="mt-2 text-slate-400">Configuration, branding, contenu, preview, QR code et preparation Coolify.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["new-hotel", "config", "branding", "content", "preview", "deploy"].map((item) => (
            <Link key={item} to={`/generator/${item}`} className="rounded-lg border border-white/10 bg-slate-900 p-4 capitalize hover:bg-white/5">{item}</Link>
          ))}
        </div>
      </div>
    </AuthGate>
  );
}
