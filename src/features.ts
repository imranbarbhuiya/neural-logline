import type { Label } from "./types";

export interface Token {
  text: string;
  start: number;
  end: number;
}

export const FEATURE_SIZE = 30;
export const WINDOW_SIZE = FEATURE_SIZE * 3;

export function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  for (const match of line.matchAll(/\S+/g)) {
    const text = match[0];
    const start = match.index ?? 0;
    tokens.push({ text, start, end: start + text.length });
  }
  return tokens;
}

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function baseFeatures(token: string, index: number, count: number): number[] {
  const raw = token;
  const clean = raw.replace(/^[\[({<]+|[\])}>:,;]+$/g, "");
  const chars = [...clean];
  const length = Math.max(chars.length, 1);
  const digits = chars.filter((char) => /\d/.test(char)).length;
  const letters = chars.filter((char) => /[A-Za-z]/.test(char)).length;
  const upper = chars.filter((char) => /[A-Z]/.test(char)).length;
  const punctuation = chars.filter((char) => /[^A-Za-z0-9]/.test(char)).length;
  const values = [
    1,
    Math.min(length, 32) / 32,
    digits / length,
    letters / length,
    upper / length,
    punctuation / length,
    count <= 1 ? 0 : index / (count - 1),
    index === 0 ? 1 : 0,
    index === count - 1 ? 1 : 0,
    /:/.test(raw) ? 1 : 0,
    /-/.test(raw) ? 1 : 0,
    /\//.test(raw) ? 1 : 0,
    /\./.test(raw) ? 1 : 0,
    /T/.test(raw) ? 1 : 0,
    /Z(?:\W|$)/.test(raw) ? 1 : 0,
    /=/.test(raw) ? 1 : 0,
    /^[\[({<]/.test(raw) ? 1 : 0,
    /[\])}>:,;]$/.test(raw) ? 1 : 0,
    /^[A-Z]{2,8}[\]:]?$/i.test(raw) && upper > 0 ? 1 : 0,
    /^\d{4}[-/]\d{2}[-/]\d{2}/.test(clean) ? 1 : 0,
    /^\d{1,2}:\d{2}:\d{2}/.test(clean) ? 1 : 0,
    /^(trace|debug|info|notice|warn|warning|error|err|fatal|critical|crit)$/i.test(clean) ? 1 : 0,
  ];
  const normalized = clean.toLowerCase().replace(/\d/g, "#");
  for (let bucket = 0; bucket < 8; bucket++) {
    let hits = 0;
    for (let i = 0; i < normalized.length - 1; i++) {
      if (hash(normalized.slice(i, i + 2)) % 8 === bucket) hits++;
    }
    values.push(Math.min(hits, 4) / 4);
  }
  return values;
}

export function features(tokens: Token[]): number[][] {
  const base = tokens.map((token, index) => baseFeatures(token.text, index, tokens.length));
  const zero = Array<number>(FEATURE_SIZE).fill(0);
  return base.map((current, index) => [
    ...(base[index - 1] ?? zero),
    ...current,
    ...(base[index + 1] ?? zero),
  ]);
}

export interface LabeledLine {
  line: string;
  labels: Label[];
}
