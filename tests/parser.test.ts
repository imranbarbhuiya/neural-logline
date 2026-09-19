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
