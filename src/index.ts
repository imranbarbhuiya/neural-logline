import { features, tokenize } from "./features";
import { predict, type ModelWeights } from "./model";
import type { Label, ParsedLogLine, Span } from "./types";

export type { Label, ModelWeights, ParsedLogLine, Span };

const LEVELS: Record<string, "trace" | "debug" | "info" | "warn" | "error" | "fatal"> = {
  trace: "trace", debug: "debug", info: "info", notice: "info", warn: "warn", warning: "warn",
  error: "error", err: "error", fatal: "fatal", critical: "fatal", crit: "fatal",
};

function clean(text: string): string {
  return text.replace(/^[\[({<]+|[\])}>:,;]+$/g, "");
}

function merge(line: string, spans: Array<Span & { label: Label }>, label: Label): Span | undefined {
  const selected = spans.filter((span) => span.label === label);
  if (selected.length === 0) return undefined;
  const start = selected[0].start;
  const end = selected[selected.length - 1].end;
  return {
    start,
    end,
    text: line.slice(start, end),
    confidence: selected.reduce((sum, span) => sum + span.confidence, 0) / selected.length,
  };
}

export function parse(line: string, options: { weights?: ModelWeights } = {}): ParsedLogLine {
  if (typeof line !== "string") throw new TypeError("line must be a string");
  const rawTokens = tokenize(line);
  if (rawTokens.length === 0) {
    const empty = { start: 0, end: 0, text: "", confidence: 1 };
    return { input: line, message: empty, tokens: [], confidence: 1 };
  }
  const vectors = features(rawTokens);
  const tokens = rawTokens.map((token, index) => ({ ...token, ...predict(vectors[index], options.weights) }));

  // A message is a suffix by contract. This prevents an isolated level-like word inside prose
  // from splitting the output and gives deterministic span assembly after neural labeling.
  const firstMessage = tokens.findIndex((token) => token.label === "message");
  if (firstMessage >= 0) {
    for (let i = firstMessage; i < tokens.length; i++) tokens[i].label = "message";
  } else {
    tokens[tokens.length - 1].label = "message";
  }

  const timestamp = merge(line, tokens, "timestamp");
  const levelSpan = merge(line, tokens, "level");
  const source = merge(line, tokens, "source");
  const message = merge(line, tokens, "message") ?? { start: 0, end: line.length, text: line, confidence: 0 };
  const normalized = levelSpan ? LEVELS[clean(levelSpan.text).toLowerCase()] : undefined;
  const confidence = tokens.reduce((sum, token) => sum + token.confidence, 0) / tokens.length;
  return {
    input: line,
    ...(timestamp ? { timestamp } : {}),
    ...(levelSpan && normalized ? { level: { ...levelSpan, normalized } } : {}),
    ...(source ? { source } : {}),
    message,
    tokens,
    confidence,
  };
}

export function parseMany(lines: readonly string[], options: { weights?: ModelWeights } = {}): ParsedLogLine[] {
  return lines.map((line) => parse(line, options));
}
