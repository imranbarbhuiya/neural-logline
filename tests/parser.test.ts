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

  test("parses NestJS access and error lines", () => {
    const access = parse("[Nest] 1  - 09/19/2026, 7:09:15 PM     LOG [HTTP]  | GET | 404 | /wp/wp/v2/users | 1ms");
    expect(access.timestamp?.text).toBe("[Nest] 1  - 09/19/2026, 7:09:15 PM");
    expect(access.level?.normalized).toBe("info");
    expect(access.level?.text).toBe("LOG");
    expect(access.source?.text).toBe("[HTTP]");
    expect(access.message.text).toStartWith("GET | 404");

    const error = parse("[Nest] 1  - 09/19/2026, 7:09:15 PM   ERROR [BodySizeExceptionFilter] Exception caught");
    expect(error.timestamp?.text).toBe("[Nest] 1  - 09/19/2026, 7:09:15 PM");
    expect(error.level?.normalized).toBe("error");
    expect(error.source?.text).toBe("[BodySizeExceptionFilter]");
    expect(error.message.text).toBe("Exception caught");
  });

  test("treats JavaScript stack frames as continuation messages", () => {
    const frame = parse("    at callback (file:///app/router.js:82:19)");
    expect(frame.timestamp).toBeUndefined();
    expect(frame.level).toBeUndefined();
    expect(frame.source).toBeUndefined();
    expect(frame.message.text).toBe("at callback (file:///app/router.js:82:19)");
  });
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
