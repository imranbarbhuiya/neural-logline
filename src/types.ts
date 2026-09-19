export const LABELS = ["timestamp", "level", "source", "message", "other"] as const;
export type Label = (typeof LABELS)[number];

export interface Span {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface ParsedLogLine {
  input: string;
  timestamp?: Span;
  level?: Span & { normalized: "trace" | "debug" | "info" | "warn" | "error" | "fatal" };
  source?: Span;
  message: Span;
  tokens: Array<Span & { label: Label }>;
  confidence: number;
}
