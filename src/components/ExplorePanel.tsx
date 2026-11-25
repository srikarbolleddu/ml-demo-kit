import { formatValue } from "../format";
import { useLoad } from "../hooks";
import type { ChartSpec, ExploreData } from "../types";
import { BarChart } from "./charts/BarChart";
import { DataTable } from "./charts/DataTable";
import { LineChart } from "./charts/LineChart";
import { ThresholdChart } from "./charts/ThresholdChart";
import { ErrorNotice, Loading } from "./Status";
import { useClient, type DemoSource } from "./TabularDemo";

export interface ExplorePanelProps extends DemoSource {
  className?: string;
  /** Render only these chart ids, in this order. */
  only?: string[];
}

export function ExplorePanel({ className, only, ...source }: ExplorePanelProps) {
  const client = useClient(source);
  const [state, retry] = useLoad<ExploreData>(() => client.explore(), [client]);

  return (
    <section className={["mdk-root", "mdk-explore", className].filter(Boolean).join(" ")}>
      {state.status === "loading" && <Loading label="Loading the charts…" />}
      {state.status === "error" && <ErrorNotice error={state.error} onRetry={retry} />}
      {state.status === "ready" && <ExploreContent data={state.data} only={only} />}
    </section>
  );
}

function ExploreContent({ data, only }: { data: ExploreData; only?: string[] }) {
  const charts = only
    ? only.map((id) => data.charts.find((c) => c.id === id)).filter((c): c is ChartSpec => !!c)
    : data.charts;
  return (
    <>
      {data.headline.length > 0 && (
        <dl className="mdk-headline" aria-label="Key results">
          {data.headline.map((h) => (
            <div key={h.label} className="mdk-stat">
              <dt className="mdk-label">{h.label}</dt>
              <dd className="mdk-stat__value">{formatValue(h.value, h.format)}</dd>
              {h.hint && <dd className="mdk-help">{h.hint}</dd>}
            </div>
          ))}
        </dl>
      )}
      {charts.map((chart) => (
        <figure key={chart.id} className="mdk-figure" id={`mdk-${chart.id}`}>
          <figcaption>
            <h4 className="mdk-subtitle">{chart.title}</h4>
            <p className="mdk-muted">{chart.caption}</p>
          </figcaption>
          <Chart spec={chart} />
        </figure>
      ))}
    </>
  );
}

function Chart({ spec }: { spec: ChartSpec }) {
  switch (spec.kind) {
    case "line":
      return <LineChart spec={spec} />;
    case "bar":
      return <BarChart spec={spec} />;
    case "threshold":
      return <ThresholdChart spec={spec} />;
    case "table":
      return <DataTable spec={spec} />;
    default:
      return null;
  }
}
