import { LABELS, type Label } from "./types";
import { weights as bundledWeights } from "./weights";

export interface ModelWeights {
  input: number;
  hidden: number;
  labels: number;
  w1: readonly number[];
  b1: readonly number[];
  w2: readonly number[];
  b2: readonly number[];
}

export function predict(input: number[], model: ModelWeights = bundledWeights): { label: Label; confidence: number } {
  if (model.hidden === 0) return { label: "message", confidence: 0.2 };
  const hidden = new Float32Array(model.hidden);
  for (let h = 0; h < model.hidden; h++) {
    let sum = model.b1[h];
    const offset = h * model.input;
    for (let i = 0; i < model.input; i++) sum += model.w1[offset + i] * input[i];
    hidden[h] = Math.max(0, sum);
  }
  const logits = new Float32Array(model.labels);
  let max = -Infinity;
  for (let label = 0; label < model.labels; label++) {
    let sum = model.b2[label];
    const offset = label * model.hidden;
    for (let h = 0; h < model.hidden; h++) sum += model.w2[offset + h] * hidden[h];
    logits[label] = sum;
    max = Math.max(max, sum);
  }
  let denominator = 0;
  for (let label = 0; label < model.labels; label++) denominator += Math.exp(logits[label] - max);
  let best = 0;
  for (let label = 1; label < model.labels; label++) if (logits[label] > logits[best]) best = label;
  return { label: LABELS[best], confidence: Math.exp(logits[best] - max) / denominator };
}
