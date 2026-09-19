await Bun.build({
  entrypoints: [
    new URL("../src/index.ts", import.meta.url).pathname,
    new URL("../src/cli.ts", import.meta.url).pathname,
  ],
  outdir: new URL("../dist", import.meta.url).pathname,
  format: "esm",
  target: "node",
  minify: true,
});
const declaration = `export type Label = "timestamp" | "level" | "source" | "message" | "other";\nexport interface Span { start: number; end: number; text: string; confidence: number }\nexport interface ParsedLogLine { input: string; timestamp?: Span; level?: Span & { normalized: "trace" | "debug" | "info" | "warn" | "error" | "fatal" }; source?: Span; message: Span; tokens: Array<Span & { label: Label }>; confidence: number }\nexport interface ModelWeights { input: number; hidden: number; labels: number; w1: readonly number[]; b1: readonly number[]; w2: readonly number[]; b2: readonly number[] }\nexport declare function parse(line: string, options?: { weights?: ModelWeights }): ParsedLogLine;\nexport declare function parseMany(lines: readonly string[], options?: { weights?: ModelWeights }): ParsedLogLine[];\n`;
await Bun.write(new URL("../dist/index.d.ts", import.meta.url), declaration);
const file = Bun.file(new URL("../dist/index.js", import.meta.url));
console.log(`dist/index.js: ${file.size} bytes`);
