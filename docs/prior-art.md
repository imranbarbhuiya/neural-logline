# Prior art and project boundary

Research checked on 2026-09-19.

| Project | Approach | Relationship to neural-logline |
| --- | --- | --- |
| [Drain3](https://github.com/logpai/Drain3) | Streaming parse-tree clustering that learns message templates and parameters. Its documentation recommends removing timestamps, hosts, and severity first. | Complementary. `neural-logline` extracts that prefix before a template miner receives the message. |
| [drain-ts](https://github.com/AgentiX-E/drain-ts) | TypeScript port of Drain3 with a dependency-free runtime. | A possible downstream template miner. It does not make this project's header-label model redundant. |
| [Loghub-2.0](https://github.com/logpai/Loghub-2.0) | Large annotated benchmark for log-template parsing. | A future external evaluation source, subject to dataset licenses and a format-aware mapping to this project's different task. |
| [looqlog](https://github.com/yushman/looqlog) | Browser log viewer with deterministic recognition for many timestamp and severity shapes. | A strong rule-based baseline. It covers known formats precisely; this project explores a small learned fallback. |
| [gpu-lexer](https://gpu-lexer.vercel.app/) | Tiny browser token classifier for syntax categories. | Architectural inspiration for local token classification and explicit scope reporting. |

## Boundary

The project does not replace JSON, logfmt, syslog, or access-log parsers. It does not mine event templates, cluster messages, detect anomalies, or join multiline events. Its narrow job is to turn an unfamiliar single-line plain-text prefix into four spans that another tool can consume.
