import { formatNumber } from "@/lib/utils";

export const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export interface ChartPoint {
  label: string;
  clicks: number;
  uniques?: number;
}

function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const tension = 0.18;
    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = p1.y + (p2.y - p0.y) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function AreaChart({ id, data, height = 240 }: { id: string; data: ChartPoint[]; height?: number }) {
  const W = 720;
  const H = height;
  const padL = 42;
  const padR = 14;
  const padT = 16;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => ({
    x: padL + (data.length === 1 ? innerW / 2 : i * step),
    y: padT + innerH - (d.clicks / max) * innerH,
    ...d,
  }));

  const hasUniques = data.some((d) => Number(d.uniques ?? 0) > 0);
  const uniquePoints = data.map((d, i) => ({
    x: padL + (data.length === 1 ? innerW / 2 : i * step),
    y: padT + innerH - (Number(d.uniques ?? 0) / max) * innerH,
  }));

  const line = smoothPath(points);
  const uniqueLine = hasUniques ? smoothPath(uniquePoints) : "";
  const area = points.length
    ? `${line} L ${points[points.length - 1].x.toFixed(2)} ${(padT + innerH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padT + innerH).toFixed(2)} Z`
    : "";

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const labelIndexes = new Set<number>();
  for (let i = 0; i < data.length; i += labelEvery) labelIndexes.add(i);
  if (data.length > 0) labelIndexes.add(data.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Chart of clicks over time">
      {yTicks.map((tick) => {
        const y = padT + innerH * tick;
        return (
          <g key={tick}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} className="chart-grid-line" />
            <text x={padL - 10} y={y + 4} textAnchor="end" fontSize="12" fill="var(--muted)">
              {formatNumber(Math.round(max * (1 - tick)))}
            </text>
          </g>
        );
      })}

      {area ? <path d={area} fill="var(--brand)" fillOpacity="0.14" /> : null}
      {line ? <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" /> : null}
      {uniqueLine ? (
        <path
          d={uniqueLine}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="5 4"
        />
      ) : null}

      {points.length > 0 ? (
        <>
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="var(--brand)" stroke="var(--card)" strokeWidth="2" />
          {uniqueLine ? (
            <circle
              cx={uniquePoints[uniquePoints.length - 1].x}
              cy={uniquePoints[uniquePoints.length - 1].y}
              r="3"
              fill="var(--accent)"
              stroke="var(--card)"
              strokeWidth="2"
            />
          ) : null}
        </>
      ) : null}

      {[...labelIndexes]
        .sort((a, b) => a - b)
        .map((index) => {
          const point = points[index];
          if (!point) return null;
          const anchor = index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
          return (
            <text key={`${point.label}-${index}`} x={point.x} y={H - 8} textAnchor={anchor} fontSize="12" fill="var(--muted)">
              {point.label}
            </text>
          );
        })}

      {points.map((point, index) => {
        const bandX = Math.max(padL, point.x - step / 2);
        const bandW = Math.max(4, step);
        return (
          <rect
            key={`hit-${index}`}
            x={bandX}
            y={padT}
            width={bandW}
            height={innerH}
            fill="transparent"
            style={{ cursor: "crosshair" }}
          >
            <title>{`${point.label}: ${point.clicks} clicks${point.uniques !== undefined ? ` · ${point.uniques} unique` : ""}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export function Sparkline({ data, color = "var(--brand)", width = 120, height = 36 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((value, index) => ({
    x: index * step,
    y: height - 3 - (value / max) * (height - 6),
  }));
  const line = smoothPath(points);
  const area = points.length
    ? `${line} L ${width} ${height} L 0 ${height} Z`
    : "";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" className="overflow-visible">
      {area ? <path d={area} fill={color} opacity="0.12" /> : null}
      {line ? <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" /> : null}
    </svg>
  );
}

export function BarList({
  items,
  emptyLabel = "No data yet",
  showUnique = false,
}: {
  items: Array<{ label: string; clicks: number; uniques?: number }>;
  emptyLabel?: string;
  showUnique?: boolean;
}) {
  if (items.length === 0) return <p className="text-xs text-muted">{emptyLabel}</p>;
  const total = items.reduce((sum, item) => sum + item.clicks, 0) || 1;
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const pct = Math.round((item.clicks / total) * 1000) / 10;
        return (
          <div key={`${item.label}-${index}`}>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-brand" />
                <span className="truncate text-ink" title={item.label}>{item.label}</span>
              </span>
              <span className="shrink-0 text-muted">
                {formatNumber(item.clicks)}
                {showUnique && item.uniques !== undefined ? <span className="hidden sm:inline"> · {formatNumber(item.uniques)} uniq.</span> : null}
                <span className="ml-2 hidden text-muted/70 sm:inline">{pct}%</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-card2">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Donut({
  items,
  centerLabel = "total",
  size = 150,
}: {
  items: Array<{ label: string; clicks: number }>;
  centerLabel?: string;
  size?: number;
}) {
  const total = items.reduce((sum, item) => sum + item.clicks, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" width={size} height={size} aria-label="Breakdown donut chart" role="img">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--card2)" strokeWidth="14" />
          {total > 0 &&
            items.map((item, index) => {
              const length = (item.clicks / total) * circumference;
              const dash = `${length} ${circumference - length}`;
              const circle = (
                <circle
                  key={item.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={PALETTE[index % PALETTE.length]}
                  strokeWidth="14"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 70 70)"
                  strokeLinecap="butt"
                >
                  <title>{`${item.label}: ${item.clicks}`}</title>
                </circle>
              );
              offset += length;
              return circle;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold">{formatNumber(total)}</span>
          <span className="text-xs uppercase tracking-wider text-muted">{centerLabel}</span>
        </div>
      </div>
      <div className="w-full space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted">No data yet</p>
        ) : (
          items.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[index % PALETTE.length] }} />
                {item.label}
              </span>
              <span className="text-muted">
                {total ? Math.round((item.clicks / total) * 100) : 0}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
