import { formatValue } from "../format";
import type { Explanation, Prediction } from "../types";

export function PredictionResult({
  prediction,
  actual,
}: {
  prediction: Prediction;
  /** The real outcome, when the inputs are an untouched sample. */
  actual?: string;
}) {
  const isClassification = prediction.task === "classification";
  const tone =
    prediction.positive === true
      ? "positive"
      : prediction.positive === false
        ? "negative"
        : "neutral";

  return (
    <div className="mdk-prediction">
      <p className={`mdk-outcome mdk-outcome--${tone}`}>{prediction.outcome}</p>
      {isClassification ? (
        <Gauge
          score={prediction.score}
          threshold={prediction.threshold}
          label={prediction.score_label}
        />
      ) : (
        <p className="mdk-big">
          <span className="mdk-label">{prediction.score_label}</span>
          {formatValue(prediction.score, "number", prediction.unit)}
        </p>
      )}
      {actual && (
        <p className="mdk-muted mdk-actual">
          Real outcome for this example: <strong>{actual}</strong>
        </p>
      )}
      {prediction.explanation && <ExplanationView explanation={prediction.explanation} />}
      <p className="mdk-version">Model {prediction.model_version}</p>
    </div>
  );
}

function Gauge({
  score,
  threshold,
  label,
}: {
  score: number;
  threshold?: number | null;
  label: string;
}) {
  const pct = Math.max(0, Math.min(1, score)) * 100;
  return (
    <div className="mdk-gauge">
      <div className="mdk-gauge__head">
        <span className="mdk-label">{label}</span>
        <span className="mdk-gauge__value">{formatValue(score, "percent")}</span>
      </div>
      <div
        className="mdk-gauge__track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div className="mdk-gauge__fill" style={{ width: `${pct}%` }} />
        {threshold != null && (
          <div
            className="mdk-gauge__threshold"
            style={{ left: `${threshold * 100}%` }}
            title={`Decision threshold ${formatValue(threshold, "percent")}`}
          />
        )}
      </div>
      {threshold != null && (
        <p className="mdk-help">
          Predicted “yes” at or above the {formatValue(threshold, "percent")} threshold.
        </p>
      )}
    </div>
  );
}

function ExplanationView({ explanation }: { explanation: Explanation }) {
  if (!explanation.steps.length) return null;
  if (explanation.kind === "path") {
    return (
      <div className="mdk-explanation">
        <h4 className="mdk-subtitle">{explanation.title}</h4>
        <p className="mdk-help">{explanation.value_label}</p>
        <ol className="mdk-path">
          {explanation.steps.map((step, index) => (
            <li key={`${index}-${step.label}`} className="mdk-path__step">
              <span className="mdk-path__rule">{step.label}</span>
              <span className="mdk-bar" aria-hidden="true">
                <span className="mdk-bar__fill" style={{ width: `${step.value * 100}%` }} />
              </span>
              <span className="mdk-path__value">
                {formatValue(step.value, "percent")}
                {step.count != null && (
                  <span className="mdk-muted"> of {formatValue(step.count, "integer")}</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const max = Math.max(...explanation.steps.map((s) => Math.abs(s.value)), 1e-9);
  return (
    <div className="mdk-explanation">
      <h4 className="mdk-subtitle">{explanation.title}</h4>
      <p className="mdk-help">{explanation.value_label}</p>
      <ul className="mdk-contrib">
        {explanation.steps.map((step) => (
          <li key={step.label} className="mdk-contrib__row">
            <span className="mdk-contrib__label">{step.label}</span>
            <span className="mdk-contrib__axis" aria-hidden="true">
              <span
                className={`mdk-contrib__bar mdk-contrib__bar--${step.value >= 0 ? "up" : "down"}`}
                style={{ width: `${(Math.abs(step.value) / max) * 50}%` }}
              />
            </span>
            <span className="mdk-contrib__value">
              {step.value >= 0 ? "+" : "−"}
              {formatValue(Math.abs(step.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
