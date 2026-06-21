import { Settings } from "lucide-react";
import { ChangePasswordCard } from "../../../components/auth/ChangePasswordCard";
import { useAppStore } from "../../../stores/appStore";

export function AdminSettingsPage() {
  const { token } = useAppStore();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              <Settings className="h-4 w-4" />
              Paramètres
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Sécurité du compte</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Gérez les accès personnels de votre compte administrateur.
            </p>
          </div>
        </div>
      </section>

      {token ? <ChangePasswordCard token={token} /> : null}
    </div>
  );
}
