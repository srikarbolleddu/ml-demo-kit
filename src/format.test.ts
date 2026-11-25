import { expect, it } from "vitest";
import { formatValue } from "./format";

it.each([
  [0.4364, "percent", "44%"],
  [0.064, "percent", "6.4%"],
  [4581, "integer", "4,581"],
  [0.4519, "number", "0.452"],
] as const)("formats %s as %s", (value, format, expected) => {
  expect(formatValue(value, format)).toBe(expected);
});

it("appends units", () => {
  expect(formatValue(30, "number", "years")).toBe("30 years");
});
