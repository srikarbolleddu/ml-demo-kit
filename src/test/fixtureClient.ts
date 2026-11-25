import purchase from "../../fixtures/purchase.json";
import { createMockClient } from "../client";
import type { DemoSample, DemoSchema, ExploreData, Inputs, Prediction } from "../types";

const samples = purchase.samples as DemoSample[];
const predictions = purchase.predictions as Prediction[];

/** The recorded prediction of whichever sample shares the most input values. */
export function closestPrediction(inputs: Inputs): Prediction {
  let best = 0;
  let bestScore = -1;
  samples.forEach((sample, i) => {
    const score = Object.entries(sample.inputs).filter(([k, v]) => inputs[k] === v).length;
    if (score > bestScore) [best, bestScore] = [i, score];
  });
  return predictions[best]!;
}

export const fixtureData = {
  schema: purchase.schema as DemoSchema,
  samples,
  explore: purchase.explore as ExploreData,
  predict: closestPrediction,
};

export const fixtureClient = (latencyMs = 0) => createMockClient(fixtureData, latencyMs);
