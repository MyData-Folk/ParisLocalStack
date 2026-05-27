export function AdminMetric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "emerald" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-200" : tone === "amber" ? "text-amber-200" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}
