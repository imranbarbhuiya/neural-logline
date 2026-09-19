# Model card

## Task

`neural-logline` labels whitespace-delimited tokens as `timestamp`, `level`, `source`, `message`, or `other`. Deterministic TypeScript joins those labels into spans and normalizes severity.

## Architecture

- Input: 30 numeric token features for the previous, current, and next token (90 values).
- Network: `90 → 20 → 5`, ReLU hidden layer and softmax output.
- Parameters: 1,925.
- Runtime: dependency-free JavaScript on CPU. Inputs never leave the process.

## Training data

All training data is generated locally from synthetic templates, placeholder hosts, component names, and messages. The repository contains no production logs or personal data. `bun run train` deterministically generates 2,600 lines and trains from scratch.

## Evaluation

`bun run evaluate` regenerates 1,000 held-out synthetic lines from a separate seed and reports token accuracy and exact line accuracy. The release gate requires at least 98% token accuracy and 94% exact line accuracy. These results measure the included synthetic format family, not arbitrary production logs.

## Intended use

Use it as a small local front end before template miners such as Drain3, or as a fallback when a log format is unknown. Prefer deterministic parsers for known JSON, logfmt, RFC syslog, or access-log formats.

## Limitations

- One physical line per event; stack traces and multiline events are outside scope.
- The message must be a suffix of the line.
- Tokenization is whitespace based.
- Confidence is the model's softmax score and is not calibrated probability.
- Synthetic accuracy can overstate performance on unfamiliar vendors and formats. Evaluate on a site-separated, licensed real-log corpus before production use.
