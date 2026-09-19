import { features, tokenize, WINDOW_SIZE } from "../src/features";
import { LABELS } from "../src/types";
import { generate, rng } from "./data";

const HIDDEN = 20;
const random = rng(0x51a7c0de);
const rand = () => (random() * 2 - 1) * Math.sqrt(2 / WINDOW_SIZE);
const w1 = Array.from({ length: HIDDEN * WINDOW_SIZE }, rand);
const b1 = Array(HIDDEN).fill(0);
const w2 = Array.from({ length: LABELS.length * HIDDEN }, () => (random() * 2 - 1) * Math.sqrt(2 / HIDDEN));
const b2 = Array(LABELS.length).fill(0);
const labelIndex = new Map(LABELS.map((label, index) => [label, index]));

const examples = generate(2600, 0xabc123).flatMap((sample) => {
  const tokens = tokenize(sample.line);
  return features(tokens).map((x, index) => ({ x, y: labelIndex.get(sample.labels[index])! }));
});

for (let epoch = 0; epoch < 10; epoch++) {
  let loss = 0;
  const rate = 0.035 * (1 - epoch / 14);
  for (let step = examples.length - 1; step > 0; step--) {
    const swap = Math.floor(random() * (step + 1));
    [examples[step], examples[swap]] = [examples[swap], examples[step]];
  }
  for (const { x, y } of examples) {
    const hidden = new Float64Array(HIDDEN), logits = new Float64Array(LABELS.length);
    for (let h = 0; h < HIDDEN; h++) {
      let value = b1[h];
      for (let i = 0; i < WINDOW_SIZE; i++) value += w1[h * WINDOW_SIZE + i] * x[i];
      hidden[h] = Math.max(0, value);
    }
    let max = -Infinity;
    for (let c = 0; c < LABELS.length; c++) {
      let value = b2[c];
      for (let h = 0; h < HIDDEN; h++) value += w2[c * HIDDEN + h] * hidden[h];
      logits[c] = value; max = Math.max(max, value);
    }
    let sum = 0;
    for (let c = 0; c < LABELS.length; c++) { logits[c] = Math.exp(logits[c] - max); sum += logits[c]; }
    for (let c = 0; c < LABELS.length; c++) logits[c] /= sum;
    loss -= Math.log(Math.max(logits[y], 1e-9));
    const outputGradient = Array.from(logits, (value, c) => value - (c === y ? 1 : 0));
    const hiddenGradient = new Float64Array(HIDDEN);
    for (let c = 0; c < LABELS.length; c++) {
      for (let h = 0; h < HIDDEN; h++) hiddenGradient[h] += outputGradient[c] * w2[c * HIDDEN + h];
    }
    for (let c = 0; c < LABELS.length; c++) {
      for (let h = 0; h < HIDDEN; h++) w2[c * HIDDEN + h] -= rate * outputGradient[c] * hidden[h];
      b2[c] -= rate * outputGradient[c];
    }
    for (let h = 0; h < HIDDEN; h++) {
      if (hidden[h] <= 0) continue;
      const gradient = Math.max(-2, Math.min(2, hiddenGradient[h]));
      for (let i = 0; i < WINDOW_SIZE; i++) w1[h * WINDOW_SIZE + i] -= rate * gradient * x[i];
      b1[h] -= rate * gradient;
    }
  }
  console.log(`epoch ${epoch + 1}: loss ${(loss / examples.length).toFixed(4)}`);
}

const round = (values: number[]) => values.map((value) => Number(value.toFixed(6)));
const model = { input: WINDOW_SIZE, hidden: HIDDEN, labels: LABELS.length, w1: round(w1), b1: round(b1), w2: round(w2), b2: round(b2) };
const source = `// Generated deterministically by \`bun run train\`.\nexport const weights = ${JSON.stringify(model)} as const;\n`;
await Bun.write(new URL("../src/weights.ts", import.meta.url), source);
console.log(`wrote ${source.length} bytes to src/weights.ts`);
