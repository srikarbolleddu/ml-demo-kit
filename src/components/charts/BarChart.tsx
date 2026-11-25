import { formatValue } from "../../format";
import type { BarChartSpec } from "../../types";

/** Horizontal bars (HTML, so long labels wrap), with an optional reference line. */
export function BarChart({ spec }: { spec: BarChartSpec }) {
  const max = Math.max(...spec.items.map((i) => i.value), spec.reference?.value ?? 0) || 1;
  return (
    <div className="mdk-chart">
      <ul className="mdk-bars" aria-label={spec.title}>
        {spec.items.map((item) => (
          <li key={item.label} className="mdk-bars__row">
            <span className="mdk-bars__label">{item.label}</span>
            <span className="mdk-bars__track">
              <span className="mdk-bars__fill" style={{ width: `${(item.value / max) * 100}%` }} />
              {spec.reference && (
                <span
                  className="mdk-bars__ref"
                  style={{ left: `${(spec.reference.value / max) * 100}%` }}
                  aria-hidden="true"
                />
              )}
            </span>
            <span className="mdk-bars__value">{formatValue(item.value, spec.format)}</span>
          </li>
        ))}
      </ul>
      {spec.reference && (
        <p className="mdk-help">
          <span className="mdk-ref-key" aria-hidden="true" /> {spec.reference.label}:{" "}
          {formatValue(spec.reference.value, spec.format)}
        </p>
      )}
    </div>
  );
}
