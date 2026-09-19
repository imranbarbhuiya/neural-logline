import { describe, expect, test } from "bun:test";
import { parse, parseMany } from "../src/index";

describe("parse", () => {
  test.each([
    ["2026-09-19T10:42:01.123Z INFO api request completed in 42ms", "2026-09-19T10:42:01.123Z", "info", "api", "request completed in 42ms"],
    ["[2026-09-19T10:42:01.123Z] [ERROR] worker: failed to decode response body", "[2026-09-19T10:42:01.123Z]", "error", "worker:", "failed to decode response body"],
    ["2026-09-19 10:42:01 warn: gateway - retrying upstream request", "2026-09-19 10:42:01", "warn", "gateway", "retrying upstream request"],
    ["Sep 19 10:42:01 web-01 auth[431]: user session refreshed", "Sep 19 10:42:01", undefined, "auth[431]:", "user session refreshed"],
    ["FATAL database: connection refused after 3 attempts", undefined, "fatal", "database:", "connection refused after 3 attempts"],
  ])("parses %s", (line, timestamp, level, source, message) => {
    const result = parse(line);
    expect(result.timestamp?.text).toBe(timestamp);
    expect(result.level?.normalized).toBe(level);
    expect(result.source?.text).toBe(source);
    expect(result.message.text).toBe(message);
  });

  test("handles empty lines", () => expect(parse("").message.text).toBe(""));
  test("parses batches", () => expect(parseMany(["INFO api ready", "WARN cache retrying"])).toHaveLength(2));
});

describe("cli", () => {
  test("parses an argument as JSON Lines", () => {
    const result = Bun.spawnSync([
      process.execPath,
      new URL("../src/cli.ts", import.meta.url).pathname,
      "2026-09-19T10:42:01Z ERROR api request failed",
    ]);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout.toString());
    expect(parsed.level.normalized).toBe("error");
    expect(parsed.message.text).toBe("request failed");
  });

  test("parses piped lines", async () => {
    const process = Bun.spawn([globalThis.process.execPath, new URL("../src/cli.ts", import.meta.url).pathname], {
      stdin: "pipe",
      stdout: "pipe",
    });
    process.stdin.write("INFO api ready\nWARN cache retrying\n");
    process.stdin.end();
    expect(await process.exited).toBe(0);
    expect((await new Response(process.stdout).text()).trim().split("\n")).toHaveLength(2);
  });
});
