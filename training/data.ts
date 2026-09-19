import type { LabeledLine } from "../src/features";
import type { Label } from "../src/types";

export function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

const levels = ["TRACE", "DEBUG", "INFO", "NOTICE", "WARN", "WARNING", "ERROR", "ERR", "FATAL", "CRITICAL"];
const sources = ["api", "worker", "scheduler", "database", "cache", "gateway", "auth", "billing", "queue.consumer", "http.server"];
const messages = [
  "request completed in 42ms", "connection refused after 3 attempts", "user session refreshed",
  "cache miss for account record", "job started with 12 items", "retrying upstream request",
  "configuration loaded successfully", "failed to decode response body", "health check passed",
  "rate limit reached for route", "transaction committed", "received shutdown signal",
];
const hosts = ["web-01", "node-a", "edge-3", "localhost", "prod-api"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pick = <T>(random: () => number, values: readonly T[]): T => values[Math.floor(random() * values.length)];
const pad = (value: number, size = 2) => String(value).padStart(size, "0");

interface Part { text: string; label: Label }
function line(parts: Part[]): LabeledLine {
  return { line: parts.map((part) => part.text).join(" "), labels: parts.map((part) => part.label) };
}

export function generate(count: number, seed: number, formats: readonly number[] = [0, 1, 2, 3, 4, 5]): LabeledLine[] {
  const random = rng(seed);
  const result: LabeledLine[] = [];
  for (let n = 0; n < count; n++) {
    const year = 2024 + Math.floor(random() * 3), month = 1 + Math.floor(random() * 12), day = 1 + Math.floor(random() * 28);
    const hour = Math.floor(random() * 24), minute = Math.floor(random() * 60), second = Math.floor(random() * 60);
    const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(Math.floor(random() * 1000), 3)}Z`;
    const date = `${year}-${pad(month)}-${pad(day)}`, time = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
    const level = pick(random, levels), source = pick(random, sources), message = pick(random, messages);
    const msgParts = message.split(" ").map((text) => ({ text, label: "message" as const }));
    const format = pick(random, formats);
    if (format === 0) result.push(line([{ text: iso, label: "timestamp" }, { text: level, label: "level" }, { text: source, label: "source" }, ...msgParts]));
    if (format === 1) result.push(line([{ text: `[${iso}]`, label: "timestamp" }, { text: `[${level}]`, label: "level" }, { text: `${source}:`, label: "source" }, ...msgParts]));
    if (format === 2) result.push(line([{ text: date, label: "timestamp" }, { text: time, label: "timestamp" }, { text: level.toLowerCase() + ":", label: "level" }, { text: source, label: "source" }, { text: "-", label: "other" }, ...msgParts]));
    if (format === 3) result.push(line([{ text: pick(random, months), label: "timestamp" }, { text: String(day), label: "timestamp" }, { text: time, label: "timestamp" }, { text: pick(random, hosts), label: "other" }, { text: `${source}[${100 + Math.floor(random() * 9000)}]:`, label: "source" }, ...msgParts]));
    if (format === 4) result.push(line([{ text: level, label: "level" }, { text: `${source}:`, label: "source" }, ...msgParts]));
    if (format === 5) result.push(line([{ text: `${date}`, label: "timestamp" }, { text: `${time},${pad(Math.floor(random() * 1000), 3)}`, label: "timestamp" }, { text: `[${pick(random, ["main", "pool-2", "async-1"])}]`, label: "other" }, { text: level, label: "level" }, { text: source, label: "source" }, { text: "-", label: "other" }, ...msgParts]));
  }
  return result;
}
