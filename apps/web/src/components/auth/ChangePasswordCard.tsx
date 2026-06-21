import { FormEvent, useState } from "react";
import { CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api";

type ChangePasswordCardProps = {
  token: string;
  title?: string;
  description?: string;
};

const MIN_PASSWORD_LENGTH = 16;

export function ChangePasswordCard({
  token,
  title = "Changer mon mot de passe",
  description = "Mettez à jour votre mot de passe personnel. Utilisez un mot de passe unique et long."
}: ChangePasswordCardProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Tous les champs sont requis.");
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError("Le nouveau mot de passe doit contenir au moins 16 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setSaving(true);
    try {
      await api.changeMyPassword({ currentPassword, newPassword }, token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch {
      setError("Impossible de modifier le mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#111115] p-6 shadow-lg shadow-black/20 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            <ShieldCheck className="h-4 w-4" />
            Sécurité
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
        </div>
      </div>

      {success ? (
        <p className="mt-5 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          Mot de passe modifié avec succès.
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-3">
        <PasswordField
          label="Ancien mot de passe"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />
        <PasswordField
          label="Nouveau mot de passe"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          helper="Minimum 16 caractères."
        />
        <PasswordField
          label="Confirmer le nouveau mot de passe"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-300/20 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Modifier le mot de passe
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  helper
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  helper?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10"
      />
      {helper ? <span className="block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}
