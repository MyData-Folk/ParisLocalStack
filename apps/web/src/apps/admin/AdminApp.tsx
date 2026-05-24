import { Link } from "react-router-dom";

export function AdminApp() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Admin Principal</h1>
      <p className="mt-2 text-slate-400">Gestion plateforme, hotels, utilisateurs et deploiements.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {["hotels", "users", "deployments", "settings"].map((item) => (
          <Link key={item} to={`/admin/${item}`} className="rounded-lg border border-white/10 bg-slate-900 p-4 capitalize hover:bg-white/5">{item}</Link>
        ))}
      </div>
    </div>
  );
}
