import { useState } from "react";
import { formatValue } from "../../format";
import type { LineChartSpec } from "../../types";

const W = 640;
const H = 280;
const PAD = { top: 16, right: 16, bottom: 44, left: 52 };

/** Multi-series line chart with a slider that walks the points (e.g. pruning strength). */
export function LineChart({ spec }: { spec: LineChartSpec }) {
  const points = spec.points;
  const [index, setIndex] = useState(() => bestIndex(spec));
  if (!points.length) return null;

  const xs = points.map((p) => p[spec.x.key] ?? 0);
  const log = spec.x.scale === "log";
  const tx = (v: number) => (log ? Math.log10(Math.max(v, 1)) : v);
  const [xMin, xMax] = [Math.min(...xs.map(tx)), Math.max(...xs.map(tx))];
  const ys = points.flatMap((p) => spec.series.map((s) => p[s.key] ?? 0));
  const yMax = Math.max(...ys) * 1.05 || 1;
  const sx = (v: number) =>
    PAD.left + ((tx(v) - xMin) / (xMax - xMin || 1)) * (W - PAD.left - PAD.right);
  const sy = (v: number) => H - PAD.bottom - (v / yMax) * (H - PAD.top - PAD.bottom);

  const xTicks = log ? logTicks(Math.min(...xs), Math.max(...xs)) : linearTicks(xMin, xMax);
  const yTicks = linearTicks(0, yMax);
  const current = points[Math.min(index, points.length - 1)] ?? points[0]!;

  return (
    <div className="mdk-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="mdk-svg" role="img" aria-label={spec.title}>
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line className="mdk-gridline" x1={PAD.left} x2={W - PAD.right} y1={sy(t)} y2={sy(t)} />
            <text
              className="mdk-tick"
              x={PAD.left - 8}
              y={sy(t)}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatValue(t, spec.y.format)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text
            key={`x${t}`}
            className="mdk-tick"
            x={sx(t)}
            y={H - PAD.bottom + 18}
            textAnchor="middle"
          >
            {formatValue(t, "integer")}
          </text>
        ))}
        <text className="mdk-axis-label" x={(W + PAD.left) / 2} y={H - 6} textAnchor="middle">
          {spec.x.label}
          {log ? " (log scale)" : ""}
        </text>
        <text
          className="mdk-axis-label"
          transform={`translate(14 ${(H - PAD.bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          {spec.y.label}
        </text>
        {spec.series.map((s, i) => (
          <polyline
            key={s.key}
            className={`mdk-line mdk-series-${(i % 4) + 1}`}
            points={points.map((p) => `${sx(p[spec.x.key] ?? 0)},${sy(p[s.key] ?? 0)}`).join(" ")}
          />
        ))}
        <line
          className="mdk-cursor"
          x1={sx(current[spec.x.key] ?? 0)}
          x2={sx(current[spec.x.key] ?? 0)}
          y1={PAD.top}
          y2={H - PAD.bottom}
        />
        {spec.series.map((s, i) => (
          <circle
            key={s.key}
            className={`mdk-dot mdk-series-${(i % 4) + 1}`}
            cx={sx(current[spec.x.key] ?? 0)}
            cy={sy(current[s.key] ?? 0)}
            r={5}
          />
        ))}
      </svg>

      <Legend series={spec.series} />

      <label className="mdk-slider">
        <span className="mdk-label">
          {spec.x.label}: <strong>{formatValue(current[spec.x.key] ?? 0, "integer")}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={points.length - 1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-valuetext={`${spec.x.label} ${current[spec.x.key]}`}
        />
      </label>
      <dl className="mdk-readout">
        {spec.series.map((s) => (
          <div key={s.key}>
            <dt>{s.label}</dt>
            <dd>{formatValue(current[s.key] ?? 0, spec.y.format)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Legend({ series }: { series: { key: string; label: string }[] }) {
  return (
    <ul className="mdk-legend-list">
      {series.map((s, i) => (
        <li key={s.key}>
          <span className={`mdk-swatch mdk-series-${(i % 4) + 1}`} aria-hidden="true" />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/** Start the slider where the last series (validation) peaks: the "right" model. */
function bestIndex(spec: LineChartSpec): number {
  const key = spec.series[spec.series.length - 1]?.key;
  if (!key) return 0;
  let best = 0;
  spec.points.forEach((p, i) => {
    if ((p[key] ?? 0) > (spec.points[best]?.[key] ?? 0)) best = i;
  });
  return best;
}

function linearTicks(min: number, max: number, count = 4): number[] {
  // Round the step to 1, 2 or 5 x 10^n so ticks land on readable values.
  const raw = (max - min) / count || 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * magnitude >= raw) ?? 10) * magnitude;
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) {
    ticks.push(Number(t.toPrecision(6)));
  }
  return ticks;
}

function logTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  for (let p = Math.floor(Math.log10(Math.max(min, 1))); 10 ** p <= max; p++) {
    if (10 ** p >= min) ticks.push(10 ** p);
  }
  return ticks;
}
