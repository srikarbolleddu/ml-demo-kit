import type { Format } from "./types";

export function formatValue(
  value: number,
  format: Format = "number",
  unit?: string | null,
): string {
  let text: string;
  switch (format) {
    case "percent":
      // One decimal only where it matters: small, non-round percentages (6.4%, not 6%).
      text = `${Number((value * 100).toFixed(Math.abs(value) < 0.1 ? 1 : 0))}%`;
      break;
    case "integer":
      text = Math.round(value).toLocaleString("en-US");
      break;
    case "currency":
      text = value.toLocaleString("en-US", { style: "currency", currency: "USD" });
      break;
    default:
      text = Number.isInteger(value)
        ? value.toLocaleString("en-US")
        : value.toLocaleString("en-US", { maximumFractionDigits: 3 });
  }
  return unit ? `${text} ${unit}` : text;
}
