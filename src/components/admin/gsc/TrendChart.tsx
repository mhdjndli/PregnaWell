"use client";

import { useMemo, useRef, useState } from "react";

export type TrendPoint = { date: string; value: number };

// Single-series area chart with a crosshair tooltip. One y-axis, recessive
// grid, 2px line, values in ink tokens (never the series color).
export default function TrendChart({
  label,
  color,
  points,
  formatValue,
}: {
  label: string;
  color: string;
  points: TrendPoint[];
  formatValue?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const W = 560;
  const H = 180;
  const PAD = { top: 12, right: 12, bottom: 24, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const fmt = formatValue ?? ((v: number) => v.toLocaleString("en-US"));

  const { path, area, xs, ys, maxV, ticks } = useMemo(() => {
    const values = points.map((p) => p.value);
    const rawMax = Math.max(1, ...values);
    // Round the axis max up to a clean step so gridlines land on round numbers.
    const step = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const maxV = Math.ceil(rawMax / step) * step;
    const n = Math.max(1, points.length - 1);
    const xs = points.map((_, i) => PAD.left + (i / n) * innerW);
    const ys = points.map((p) => PAD.top + innerH - (p.value / maxV) * innerH);
    const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
    const area = `${path} L${(PAD.left + innerW).toFixed(1)},${PAD.top + innerH} L${PAD.left},${PAD.top + innerH} Z`;
    const ticks = [0, 0.5, 1].map((t) => ({
      y: PAD.top + innerH - t * innerH,
      value: Math.round(t * maxV),
    }));
    return { path, area, xs, ys, maxV, ticks };
  }, [points, innerW, innerH, PAD.left, PAD.top]);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (points.length === 0 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < xs.length; i++) {
      if (Math.abs(xs[i] - px) < Math.abs(xs[best] - px)) best = i;
    }
    setHover(best);
  }

  const h = hover !== null && points[hover] ? hover : null;
  const dateFmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[var(--brand-purple)]/10">
      <div className="flex items-center gap-2">
        <span className="inline-block h-0.5 w-4 rounded" style={{ background: color }} />
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">{label}</p>
      </div>
      {points.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--brand-muted)]">No data for this period yet.</p>
      ) : (
        <div className="relative mt-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full touch-none select-none"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label={`${label}, ${points.length} days, max ${fmt(maxV)}`}
          >
            {ticks.map((t) => (
              <g key={t.y}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + innerW}
                  y1={t.y}
                  y2={t.y}
                  stroke="var(--brand-purple)"
                  strokeOpacity="0.08"
                />
                <text
                  x={PAD.left - 8}
                  y={t.y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--brand-muted)"
                >
                  {t.value.toLocaleString("en-US")}
                </text>
              </g>
            ))}
            <text x={PAD.left} y={H - 6} fontSize="10" fill="var(--brand-muted)">
              {dateFmt(points[0].date)}
            </text>
            <text x={PAD.left + innerW} y={H - 6} fontSize="10" textAnchor="end" fill="var(--brand-muted)">
              {dateFmt(points[points.length - 1].date)}
            </text>
            <path d={area} fill={color} fillOpacity="0.08" />
            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {h !== null && (
              <g>
                <line
                  x1={xs[h]}
                  x2={xs[h]}
                  y1={PAD.top}
                  y2={PAD.top + innerH}
                  stroke="var(--brand-ink)"
                  strokeOpacity="0.25"
                />
                {/* 2px surface ring so the marker separates from the line */}
                <circle cx={xs[h]} cy={ys[h]} r="6" fill="#ffffff" />
                <circle cx={xs[h]} cy={ys[h]} r="4" fill={color} />
              </g>
            )}
          </svg>
          {h !== null && (
            <div
              className="pointer-events-none absolute top-1 rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-[var(--brand-purple)]/15"
              style={{
                left: `${(xs[h] / W) * 100}%`,
                transform: xs[h] > W / 2 ? "translateX(calc(-100% - 10px))" : "translateX(10px)",
              }}
            >
              <p className="font-semibold text-[var(--brand-ink)]">{fmt(points[h].value)}</p>
              <p className="mt-0.5 text-[var(--brand-muted)]">{dateFmt(points[h].date)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
