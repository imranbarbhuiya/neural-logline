#!/usr/bin/env node
import { parse } from "./index";

const help = `neural-logline — parse an unfamiliar plain-text log prefix

Usage:
  npx neural-logline "2026-09-19T10:42:01Z ERROR api request failed"
  cat application.log | npx neural-logline

Each input line is emitted as one JSON object. Empty lines are skipped.
`;

async function readInput(): Promise<string> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(help);
    process.exit(0);
  }
  if (args.length > 0) return args.join(" ");
  if (process.stdin.isTTY) {
    process.stderr.write(help);
    process.exit(1);
  }
  let input = "";
  for await (const chunk of process.stdin) input += chunk.toString();
  return input;
}

for (const line of (await readInput()).split(/\r?\n/)) {
  if (line.trim().length === 0) continue;
  process.stdout.write(`${JSON.stringify(parse(line))}\n`);
}
