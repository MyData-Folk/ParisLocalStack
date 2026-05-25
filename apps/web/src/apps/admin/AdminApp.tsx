import { Link } from "react-router-dom";
import { Building2, Rocket, Settings, Users } from "lucide-react";
import { AuthGate } from "../../components/auth/AuthGate";

export function AdminApp() {
  const items = [
    { id: "hotels", label: "Hotels", description: "Piloter les etablissements et leur statut.", icon: <Building2 className="h-5 w-5" /> },
    { id: "users", label: "Utilisateurs", description: "Gerer les acces plateforme et hotel.", icon: <Users className="h-5 w-5" /> },
    { id: "deployments", label: "Deploiements", description: "Suivre les environnements et releases.", icon: <Rocket className="h-5 w-5" /> },
    { id: "settings", label: "Parametres", description: "Configurer les preferences plateforme.", icon: <Settings className="h-5 w-5" /> }
  ];

  return (
    <AuthGate title="Connexion admin" subtitle="Acces securise a l'administration plateforme" defaultEmail="admin@paris-local.test" allowedRoles={["super_admin"]}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_34%),linear-gradient(180deg,#020617,#0f172a)] p-4 text-slate-100 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/20 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Plateforme</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Admin Principal</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Gestion plateforme, hotels, utilisateurs et deploiements.</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
              <Link key={item.id} to={`/admin/${item.id}`} className="group rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-amber-300/30 hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-300/10">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200 transition group-hover:bg-amber-300 group-hover:text-slate-950">
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
