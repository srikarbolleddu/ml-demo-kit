import { useState } from "react";
import { formatValue } from "../../format";
import type { ThresholdChartSpec, ThresholdPoint } from "../../types";

export function rates(p: ThresholdPoint) {
  const predictedYes = p.tp + p.fp;
  const actualYes = p.tp + p.fn;
  return {
    precision: predictedYes ? p.tp / predictedYes : 0,
    recall: actualYes ? p.tp / actualYes : 0,
    flagged: predictedYes / (p.tp + p.fp + p.tn + p.fn || 1),
  };
}

/** Threshold slider -> live confusion matrix, precision and recall. */
export function ThresholdChart({ spec }: { spec: ThresholdChartSpec }) {
  const nearest = spec.sweep.reduce(
    (best, p, i) =>
      Math.abs(p.threshold - spec.selected) <
      Math.abs((spec.sweep[best]?.threshold ?? 0) - spec.selected)
        ? i
        : best,
    0,
  );
  const [index, setIndex] = useState(nearest);
  const point = spec.sweep[index];
  if (!point) return null;
  const r = rates(point);
  const isChosen = index === nearest;

  return (
    <div className="mdk-chart">
      <label className="mdk-slider">
        <span className="mdk-label">
          Threshold: <strong>{formatValue(point.threshold, "percent")}</strong>
          {isChosen && (
            <span className="mdk-badge">{spec.selected_label ?? "chosen on validation data"}</span>
          )}
        </span>
        <input
          type="range"
          min={0}
          max={spec.sweep.length - 1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-valuetext={`Threshold ${formatValue(point.threshold, "percent")}`}
        />
      </label>

      <div className="mdk-threshold">
        <table className="mdk-confusion">
          <caption className="mdk-help">Held-out customers by actual and predicted outcome</caption>
          <thead>
            <tr>
              <td />
              <th scope="col">Predicted: {spec.positive_label}</th>
              <th scope="col">Predicted: {spec.negative_label}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Actually {spec.positive_label.toLowerCase()}</th>
              <td className="mdk-cell mdk-cell--good">{formatValue(point.tp, "integer")}</td>
              <td className="mdk-cell mdk-cell--bad">{formatValue(point.fn, "integer")}</td>
            </tr>
            <tr>
              <th scope="row">Actually {spec.negative_label.toLowerCase()}</th>
              <td className="mdk-cell mdk-cell--bad">{formatValue(point.fp, "integer")}</td>
              <td className="mdk-cell mdk-cell--good">{formatValue(point.tn, "integer")}</td>
            </tr>
          </tbody>
        </table>
        <dl className="mdk-readout">
          <div>
            <dt>Precision</dt>
            <dd>{formatValue(r.precision, "percent")}</dd>
          </div>
          <div>
            <dt>Recall</dt>
            <dd>{formatValue(r.recall, "percent")}</dd>
          </div>
          <div>
            <dt>Flagged</dt>
            <dd>{formatValue(r.flagged, "percent")}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
