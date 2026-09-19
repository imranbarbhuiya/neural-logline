import { parse } from "../src/index";
import { generate } from "./data";

const samples = generate(1000, 0xdecafbad);
let fieldCorrect = 0, tokenCorrect = 0, tokenTotal = 0;
for (const sample of samples) {
  const parsed = parse(sample.line);
  const expected = Object.fromEntries(["timestamp", "level", "source", "message"].map((label) => [label, sample.labels.map((value, index) => value === label ? sample.line.split(/\s+/)[index] : null).filter(Boolean).join(" ")]));
  const actual = { timestamp: parsed.timestamp?.text ?? "", level: parsed.level?.text ?? "", source: parsed.source?.text ?? "", message: parsed.message.text };
  if (Object.keys(expected).every((key) => expected[key] === actual[key as keyof typeof actual])) fieldCorrect++;
  parsed.tokens.forEach((token, index) => { if (token.label === sample.labels[index]) tokenCorrect++; tokenTotal++; });
}
const report = {
  corpus: "1,000 deterministic synthetic held-out lines",
  seed: "0xdecafbad",
  exactLineAccuracy: fieldCorrect / samples.length,
  tokenAccuracy: tokenCorrect / tokenTotal,
  lines: samples.length,
  tokens: tokenTotal,
};
console.log(JSON.stringify(report, null, 2));
if (report.exactLineAccuracy < 0.94 || report.tokenAccuracy < 0.98) process.exit(1);
