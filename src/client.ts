import type { DemoClient, DemoSample, DemoSchema, ExploreData, Inputs, Prediction } from "./types";

export type DemoErrorKind = "rate_limited" | "invalid_input" | "timeout" | "network" | "server";

export class DemoApiError extends Error {
  readonly kind: DemoErrorKind;
  readonly status?: number;

  constructor(kind: DemoErrorKind, message: string, status?: number) {
    super(message);
    this.name = "DemoApiError";
    this.kind = kind;
    this.status = status;
  }
}

export interface HttpClientOptions {
  /** Abort a request after this long. Covers a Lambda cold start with room to spare. */
  timeoutMs?: number;
  fetch?: typeof fetch;
}

function describeValidation(detail: unknown): string {
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : undefined;
        return field ? `${String(field)}: ${d.msg ?? "invalid"}` : (d.msg ?? "invalid");
      })
      .join("; ");
  }
  return typeof detail === "string" ? detail : "Some inputs are invalid.";
}

/** Client for a service implementing the ml-demo-kit/v1 contract at `apiUrl` (e.g. .../api/v1). */
export function createHttpClient(apiUrl: string, options: HttpClientOptions = {}): DemoClient {
  const base = apiUrl.replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? 20_000;
  const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await doFetch(`${base}${path}`, { ...init, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new DemoApiError("timeout", "The model took too long to answer. Please try again.");
      }
      throw new DemoApiError("network", "Couldn't reach the model. Check your connection.");
    } finally {
      clearTimeout(timer);
    }

    if (response.ok) return (await response.json()) as T;

    const body = (await response.json().catch(() => ({}))) as { detail?: unknown };
    if (response.status === 429) {
      throw new DemoApiError(
        "rate_limited",
        "The demo is busy. Please wait a minute and try again.",
        429,
      );
    }
    if (response.status === 422 || response.status === 413) {
      throw new DemoApiError("invalid_input", describeValidation(body.detail), response.status);
    }
    throw new DemoApiError(
      "server",
      "The model hit an error. Please try again shortly.",
      response.status,
    );
  }

  return {
    schema: () => request<DemoSchema>("/schema"),
    samples: () => request<DemoSample[]>("/samples"),
    explore: () => request<ExploreData>("/explore"),
    predict: (inputs: Inputs) =>
      request<Prediction>("/predict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(inputs),
      }),
  };
}

export interface MockData {
  schema: DemoSchema;
  samples: DemoSample[];
  explore: ExploreData;
  /** Return a prediction for any inputs (e.g. look up the closest sample). */
  predict: (inputs: Inputs) => Prediction;
}

/** An in-memory client for tests, Storybook-style previews and mock-API dev modes. */
export function createMockClient(data: MockData, latencyMs = 150): DemoClient {
  const later = <T>(value: () => T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value()), latencyMs));
  return {
    schema: () => later(() => data.schema),
    samples: () => later(() => data.samples),
    explore: () => later(() => data.explore),
    predict: (inputs) => later(() => data.predict(inputs)),
  };
}
