import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { createHttpClient } from "../client";
import { useLoad } from "../hooks";
import type {
  CategoryField,
  DemoClient,
  DemoField,
  DemoSample,
  DemoSchema,
  Inputs,
  NumberField,
  Prediction,
} from "../types";
import { PredictionResult } from "./PredictionResult";
import { ErrorNotice, Loading } from "./Status";

export interface DemoSource {
  /** Base URL of an ml-demo-kit/v1 service, e.g. https://api.example.com/api/v1 */
  apiUrl?: string;
  /** Or any client (e.g. createMockClient) – takes precedence over apiUrl. */
  client?: DemoClient;
}

export function useClient({ apiUrl, client }: DemoSource): DemoClient {
  return useMemo(() => {
    if (client) return client;
    if (!apiUrl) throw new Error("ml-demo-kit: pass either `apiUrl` or `client`.");
    return createHttpClient(apiUrl);
  }, [apiUrl, client]);
}

export interface TabularDemoProps extends DemoSource {
  className?: string;
  /** Hide the schema's title/description when the host page already shows them. */
  hideHeader?: boolean;
  onPredict?: (prediction: Prediction) => void;
}

type Setup = { schema: DemoSchema; samples: DemoSample[] };

export function TabularDemo({ className, hideHeader, onPredict, ...source }: TabularDemoProps) {
  const client = useClient(source);
  const [setup, retry] = useLoad<Setup>(
    () =>
      Promise.all([client.schema(), client.samples()]).then(([schema, samples]) => ({
        schema,
        samples,
      })),
    [client],
  );

  return (
    <section className={["mdk-root", "mdk-tabular", className].filter(Boolean).join(" ")}>
      {setup.status === "loading" && <Loading label="Loading the demo…" />}
      {setup.status === "error" && <ErrorNotice error={setup.error} onRetry={retry} />}
      {setup.status === "ready" && (
        <TabularForm
          client={client}
          schema={setup.data.schema}
          samples={setup.data.samples}
          hideHeader={hideHeader}
          onPredict={onPredict}
        />
      )}
    </section>
  );
}

function initialInputs(schema: DemoSchema, samples: DemoSample[]): Inputs {
  if (samples[0]) return { ...samples[0].inputs };
  return Object.fromEntries(
    schema.fields.map((f) => [
      f.name,
      f.kind === "category" ? (f.options[0]?.value ?? null) : f.optional ? null : (f.min ?? 0),
    ]),
  );
}

type Run =
  | { status: "idle" }
  | { status: "running" }
  | { status: "error"; error: unknown }
  | { status: "done"; prediction: Prediction; sample: DemoSample | null };

function TabularForm({
  client,
  schema,
  samples,
  hideHeader,
  onPredict,
}: {
  client: DemoClient;
  schema: DemoSchema;
  samples: DemoSample[];
  hideHeader?: boolean;
  onPredict?: (prediction: Prediction) => void;
}) {
  const [inputs, setInputs] = useState<Inputs>(() => initialInputs(schema, samples));
  const [sampleIndex, setSampleIndex] = useState<number | null>(samples.length ? 0 : null);
  const [run, setRun] = useState<Run>({ status: "idle" });

  const predict = async (values: Inputs, sample: DemoSample | null) => {
    setRun({ status: "running" });
    try {
      const prediction = await client.predict(values);
      setRun({ status: "done", prediction, sample });
      onPredict?.(prediction);
    } catch (error) {
      setRun({ status: "error", error });
    }
  };

  // Show a real prediction straight away instead of an empty result panel.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !samples[0]) return;
    started.current = true;
    void predict({ ...samples[0].inputs }, samples[0]);
  }, []);

  const chooseSample = (index: number) => {
    const sample = samples[index];
    if (!sample) return;
    const values = { ...sample.inputs };
    setInputs(values);
    setSampleIndex(index);
    void predict(values, sample);
  };

  const update = (name: string, value: Inputs[string]) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
    setSampleIndex(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void predict(inputs, sampleIndex === null ? null : (samples[sampleIndex] ?? null));
  };

  const groups = schema.groups.length ? schema.groups : [{ id: "", label: "Inputs" }];

  return (
    <>
      {!hideHeader && (
        <header className="mdk-header">
          <h3 className="mdk-title">{schema.title}</h3>
          {schema.description && <p className="mdk-muted">{schema.description}</p>}
        </header>
      )}

      {samples.length > 0 && (
        <div className="mdk-samples" role="group" aria-label="Example inputs">
          <span className="mdk-label">Try a real example</span>
          <div className="mdk-chips">
            {samples.map((sample, index) => (
              <button
                key={sample.title}
                type="button"
                className="mdk-chip"
                aria-pressed={sampleIndex === index}
                onClick={() => chooseSample(index)}
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mdk-layout">
        <form className="mdk-form" onSubmit={submit}>
          {groups.map((group) => {
            const fields = schema.fields.filter((f) => !group.id || f.group === group.id);
            if (!fields.length) return null;
            return (
              <fieldset key={group.id || "all"} className="mdk-fieldset">
                <legend className="mdk-legend">{group.label}</legend>
                <div className="mdk-grid">
                  {fields.map((field) => (
                    <FieldInput
                      key={field.name}
                      field={field}
                      value={inputs[field.name] ?? null}
                      onChange={(value) => update(field.name, value)}
                    />
                  ))}
                </div>
              </fieldset>
            );
          })}
          <button type="submit" className="mdk-button" disabled={run.status === "running"}>
            {run.status === "running" ? "Predicting…" : "Predict"}
          </button>
        </form>

        <div className="mdk-result" aria-live="polite">
          {run.status === "idle" && (
            <p className="mdk-muted">Pick an example or edit the inputs, then press Predict.</p>
          )}
          {run.status === "running" && <Loading label="Asking the model…" />}
          {run.status === "error" && <ErrorNotice error={run.error} />}
          {run.status === "done" && (
            <PredictionResult prediction={run.prediction} actual={run.sample?.actual} />
          )}
        </div>
      </div>
    </>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: DemoField;
  value: Inputs[string];
  onChange: (value: Inputs[string]) => void;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <div className="mdk-field">
      <label htmlFor={id} className="mdk-label">
        {field.label}
        {field.kind === "number" && field.unit && (
          <span className="mdk-muted"> ({field.unit})</span>
        )}
      </label>
      {field.kind === "category" ? (
        <CategoryInput id={id} helpId={helpId} field={field} value={value} onChange={onChange} />
      ) : (
        <NumberInput id={id} helpId={helpId} field={field} value={value} onChange={onChange} />
      )}
      <small id={helpId} className="mdk-help">
        {field.help}
      </small>
    </div>
  );
}

function CategoryInput({
  id,
  helpId,
  field,
  value,
  onChange,
}: {
  id: string;
  helpId: string;
  field: CategoryField;
  value: Inputs[string];
  onChange: (value: Inputs[string]) => void;
}) {
  return (
    <select
      id={id}
      className="mdk-input"
      aria-describedby={helpId}
      value={value === null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
    >
      {field.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function NumberInput({
  id,
  helpId,
  field,
  value,
  onChange,
}: {
  id: string;
  helpId: string;
  field: NumberField;
  value: Inputs[string];
  onChange: (value: Inputs[string]) => void;
}) {
  const isNull = value === null;
  return (
    <div className="mdk-number">
      <input
        id={id}
        className="mdk-input"
        type="number"
        inputMode="decimal"
        aria-describedby={helpId}
        required={!field.optional}
        disabled={field.optional && isNull}
        min={field.min ?? undefined}
        max={field.max ?? undefined}
        step={field.step ?? "any"}
        value={isNull ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
      {field.optional && (
        <label className="mdk-check">
          <input
            type="checkbox"
            checked={isNull}
            onChange={(e) => onChange(e.target.checked ? null : (field.min ?? 0))}
          />
          <span>Not applicable</span>
        </label>
      )}
    </div>
  );
}
