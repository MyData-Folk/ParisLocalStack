import React, { useEffect, useState } from "react";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAppStore } from "../../stores/appStore";

type AuthGateProps = {
  title: string;
  subtitle?: string;
  defaultEmail?: string;
  allowedRoles?: string[];
  children: React.ReactNode;
};

export function AuthGate({ title, subtitle, defaultEmail = "reception@vendome.test", allowedRoles, children }: AuthGateProps) {
  const { currentUser, isAuthenticated, isAuthLoading, authError, login, restoreSession } = useAppStore();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("ChangeMe123!");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    await login(email, password);
  }

  if (isAuthenticated && currentUser) {
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      return (
        <PrivateShell title="Acces refuse">
          <p className="text-sm text-slate-400">Votre role ne permet pas d'acceder a cet espace.</p>
        </PrivateShell>
      );
    }
    return <>{children}</>;
  }

  return (
    <PrivateShell title={title} subtitle={subtitle}>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">Adresse email</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-11 py-3 text-slate-100 shadow-sm outline-none transition focus:border-amber-300/60 focus:ring-4 focus:ring-amber-300/10"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="reception@hotel.fr"
              autoComplete="email"
              required
            />
          </span>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">Mot de passe</span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-11 py-3 text-slate-100 shadow-sm outline-none transition focus:border-amber-300/60 focus:ring-4 focus:ring-amber-300/10"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe"
              autoComplete="current-password"
              required
            />
          </span>
        </label>
        {submitted && authError && (
          <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{authError}</p>
        )}
        <button
          disabled={isAuthLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAuthLoading ? "Connexion..." : "Se connecter"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </PrivateShell>
  );
}

function PrivateShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_36%),linear-gradient(135deg,#020617,#0f172a_48%,#111827)] p-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/85 p-6 shadow-lg shadow-black/30 backdrop-blur md:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">Paris Local</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
