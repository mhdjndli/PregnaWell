// Headline metric card with an optional change vs the previous period.
export default function StatCard({
  label,
  value,
  delta,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  delta: number | null;
  tone?: "default" | "purple";
  hint?: string;
}) {
  const positive = delta !== null && delta >= 0;
  return (
    <div
      className={`rounded-2xl p-5 ring-1 ring-[var(--brand-purple)]/10 ${
        tone === "purple" ? "bg-[var(--brand-purple-deep)] text-white" : "bg-white text-[var(--brand-purple-deep)]"
      }`}
      title={hint}
    >
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      {delta !== null && (
        <p
          className={`mt-1 text-xs font-semibold ${
            tone === "purple"
              ? "text-white/80"
              : positive
              ? "text-emerald-700"
              : "text-red-700"
          }`}
        >
          {positive ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(0)}% vs previous period
        </p>
      )}
    </div>
  );
}

// Relative change, or null when there's no meaningful baseline.
export function delta(now: number, before: number): number | null {
  if (!Number.isFinite(now) || !Number.isFinite(before) || before === 0) return null;
  return (now - before) / before;
}
