import { cn } from "../../utils/cn";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn("h-4 rounded-lg bg-white/[0.06] shimmer", className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-3", className)}>
      <div className="h-4 w-2/3 rounded-lg bg-white/[0.06] shimmer" />
      <div className="h-3 w-full rounded-lg bg-white/[0.04] shimmer" />
      <div className="h-3 w-4/5 rounded-lg bg-white/[0.04] shimmer" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 5, className }: { columns?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 px-4 py-3 border-b border-white/[0.05]", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-md bg-white/[0.05] shimmer"
          style={{ flex: i === 0 ? 2 : 1 }}
        />
      ))}
    </div>
  );
}
