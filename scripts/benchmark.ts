import { parse } from "../src/index";
import { generate } from "../training/data";

const lines = generate(10_000, 0xbec4).map((sample) => sample.line);
for (let i = 0; i < 1_000; i++) parse(lines[i]);
const start = performance.now();
for (const line of lines) parse(line);
const elapsed = performance.now() - start;
console.log(JSON.stringify({
  lines: lines.length,
  elapsedMs: Number(elapsed.toFixed(2)),
  linesPerSecond: Math.round(lines.length / (elapsed / 1000)),
  microsecondsPerLine: Number((elapsed * 1000 / lines.length).toFixed(2)),
}, null, 2));
