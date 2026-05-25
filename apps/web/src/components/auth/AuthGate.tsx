import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
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
      <form onSubmit={submit} className="mt-5 space-y-3">
        <input
          className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-slate-100"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email"
          required
        />
        <input
          className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-slate-100"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="mot de passe"
          required
        />
        {submitted && authError && <p className="text-sm text-red-300">{authError}</p>}
        <button disabled={isAuthLoading} className="w-full rounded-md bg-amber-400 px-4 py-2 font-medium text-slate-950 disabled:opacity-60">
          {isAuthLoading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </PrivateShell>
  );
}

function PrivateShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-slate-900 p-5">
        <Lock className="mb-3 h-5 w-5 text-amber-300" />
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
