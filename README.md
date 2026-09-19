# neural-logline

A tiny local model that extracts the timestamp, severity, source, and message from an unfamiliar log line.

```ts
import { parse } from "neural-logline";

parse("2026-09-19T10:42:01.123Z ERROR worker failed to decode response body");
// {
//   timestamp: { text: "2026-09-19T10:42:01.123Z", ... },
//   level: { text: "ERROR", normalized: "error", ... },
//   source: { text: "worker", ... },
//   message: { text: "failed to decode response body", ... }
// }
```

## Why

Template miners such as Drain3 work best after structured headers have been removed. Existing log viewers commonly maintain regular expressions for each known timestamp and prefix. This experiment asks whether a very small model can provide a local fallback for unfamiliar plain-text prefixes.

The model handles the ambiguous token labels. Plain TypeScript assembles spans, normalizes levels, and enforces the rule that the message is a suffix. There is no server, inference framework, telemetry, or runtime dependency.

## Scope

- Plain-text, single-line logs
- Timestamp, level, source, and message extraction
- Node.js, Bun, workers, and modern browsers
- Deterministic synthetic training and evaluation

Known structured formats should still use their exact parsers. The model is a fallback, not an RFC parser or a security boundary.

## Development

Requires Bun 1.3 or newer.

```sh
bun run train
bun test
bun run evaluate
bun run build
```

The training script is dependency free and writes the reproducible weights to `src/weights.ts`. See [MODEL_CARD.md](./MODEL_CARD.md) for data, metrics, intended use, and limitations.

The current checked-in proof is in [`benchmarks/latest.json`](./benchmarks/latest.json). `bun run check` reruns tests, evaluation, the production build, and a private-identifier scan. The CI workflow also retrains the model and verifies that the weight file is byte-for-byte reproducible.

## Prior art

- [Drain3](https://github.com/logpai/Drain3) mines templates from message bodies.
- [Loghub-2.0](https://github.com/logpai/Loghub-2.0) provides a broader benchmark for template-mining research.
- [gpu-lexer](https://gpu-lexer.vercel.app/) demonstrated that a small local token classifier can be useful in the browser.

See [docs/prior-art.md](./docs/prior-art.md) for the comparison and project boundary.

## License

MIT
