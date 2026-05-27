import { UserCheck, UserX } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const label = status === "active" ? "Actif" : status === "inactive" ? "Inactif" : "Brouillon";
  const tone = status === "active" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : status === "inactive" ? "border-red-300/20 bg-red-500/10 text-red-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

export function UserStatusBadge({ status }: { status: string }) {
  const active = status !== "inactive";
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${active ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-red-300/20 bg-red-500/10 text-red-100"}`}>
      {active ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
      {active ? "Actif" : "Desactive"}
    </span>
  );
}
