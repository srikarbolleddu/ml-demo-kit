/**
 * The ml-demo-kit/v1 API contract. Every demo service exposes:
 *   GET  {apiUrl}/schema   -> DemoSchema
 *   GET  {apiUrl}/samples  -> DemoSample[]
 *   GET  {apiUrl}/explore  -> ExploreData
 *   POST {apiUrl}/predict  -> Prediction   (body: Record<field name, value>)
 */

export type Format = "percent" | "number" | "integer" | "currency";

export interface FieldOption {
  value: string;
  label: string;
}

interface FieldBase {
  name: string;
  label: string;
  group: string;
  help: string;
  optional: boolean;
}

export interface NumberField extends FieldBase {
  kind: "number";
  min: number | null;
  max: number | null;
  step: number | null;
  unit: string | null;
}

export interface CategoryField extends FieldBase {
  kind: "category";
  options: FieldOption[];
}

export type DemoField = NumberField | CategoryField;

export interface DemoSchema {
  contract: string;
  title: string;
  description: string;
  task: "classification" | "regression";
  target: string;
  groups: { id: string; label: string }[];
  fields: DemoField[];
  model_version: string;
  threshold?: number | null;
}

export type InputValue = string | number | null;
export type Inputs = Record<string, InputValue>;

export interface DemoSample {
  title: string;
  inputs: Inputs;
  actual: string;
}

export interface ExplanationStep {
  label: string;
  field: string;
  value: number;
  count?: number;
}

export interface Explanation {
  /** "path": ordered rules (decision tree). "contributions": signed per-feature effects. */
  kind: "path" | "contributions";
  title: string;
  value_label: string;
  steps: ExplanationStep[];
}

export interface Prediction {
  task: "classification" | "regression";
  /** Probability (0-1) for classification, predicted value for regression. */
  score: number;
  score_label: string;
  threshold?: number | null;
  positive?: boolean | null;
  outcome: string;
  unit?: string | null;
  explanation?: Explanation | null;
  model_version: string;
}

export interface Headline {
  label: string;
  value: number;
  format: Format;
  hint?: string;
}

interface ChartBase {
  id: string;
  title: string;
  caption: string;
}

export interface LineChartSpec extends ChartBase {
  kind: "line";
  x: { key: string; label: string; scale?: "linear" | "log" };
  y: { label: string; format: Format };
  series: { key: string; label: string }[];
  points: Record<string, number>[];
}

export interface BarChartSpec extends ChartBase {
  kind: "bar";
  format: Format;
  items: { label: string; value: number }[];
  reference?: { value: number; label: string };
}

export interface ThresholdPoint {
  threshold: number;
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ThresholdChartSpec extends ChartBase {
  kind: "threshold";
  positive_label: string;
  negative_label: string;
  selected: number;
  sweep: ThresholdPoint[];
}

export interface TableChartSpec extends ChartBase {
  kind: "table";
  columns: { key: string; label: string; format?: Format }[];
  rows: Record<string, string | number>[];
  highlight?: { key: string; value: string | number };
}

export type ChartSpec = LineChartSpec | BarChartSpec | ThresholdChartSpec | TableChartSpec;

export interface ExploreData {
  contract: string;
  headline: Headline[];
  charts: ChartSpec[];
}

/** Anything that can answer the four contract calls: the HTTP client, or a mock. */
export interface DemoClient {
  schema(): Promise<DemoSchema>;
  samples(): Promise<DemoSample[]>;
  explore(): Promise<ExploreData>;
  predict(inputs: Inputs): Promise<Prediction>;
}
