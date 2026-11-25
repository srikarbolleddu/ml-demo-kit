import { describe, expect, it, vi } from "vitest";
import { createHttpClient, DemoApiError } from "./client";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("createHttpClient", () => {
  it("calls the contract endpoints under the base URL", async () => {
    const fetch = vi.fn(async () => json(200, { ok: true }));
    const client = createHttpClient("https://api.test/api/v1/", { fetch });

    await client.schema();
    await client.predict({ age: 30 });

    const calls = fetch.mock.calls as unknown as [string, RequestInit?][];
    expect(calls[0]?.[0]).toBe("https://api.test/api/v1/schema");
    const [url, init] = calls[1] ?? [];
    expect(url).toBe("https://api.test/api/v1/predict");
    expect(init).toMatchObject({ method: "POST", body: '{"age":30}' });
  });

  it.each([
    [429, "rate_limited"],
    [422, "invalid_input"],
    [413, "invalid_input"],
    [500, "server"],
  ])("maps HTTP %i to %s", async (status, kind) => {
    const fetch = vi.fn().mockResolvedValue(json(status, { detail: "x" }));
    const error = await createHttpClient("https://api.test", { fetch })
      .samples()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DemoApiError);
    expect((error as DemoApiError).kind).toBe(kind);
  });

  it("turns FastAPI validation details into a readable message", async () => {
    const detail = [{ loc: ["body", "age"], msg: "Input should be less than or equal to 98" }];
    const fetch = vi.fn().mockResolvedValue(json(422, { detail }));
    const error = await createHttpClient("https://api.test", { fetch })
      .predict({ age: 500 })
      .catch((e: unknown) => e);
    expect((error as Error).message).toBe("age: Input should be less than or equal to 98");
  });

  it("reports network failures", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const error = await createHttpClient("https://api.test", { fetch })
      .schema()
      .catch((e: unknown) => e);
    expect((error as DemoApiError).kind).toBe("network");
  });

  it("times out slow requests", async () => {
    const fetch = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init?.signal?.addEventListener("abort", () => reject(new DOMException("", "AbortError"))),
        ),
    );
    const error = await createHttpClient("https://api.test", { fetch, timeoutMs: 10 })
      .schema()
      .catch((e: unknown) => e);
    expect((error as DemoApiError).kind).toBe("timeout");
  });
});
