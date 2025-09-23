# Deep Research Upgrade — Documentation Bundle
Date: 2025-09-20

This bundle contains instruction-manual style markdown docs to upgrade your web search & research agent to a **deep, citation-rich pipeline** while preserving your **custom multi‑engine search** (Google/Bing/Brave/DDG) and user preferences.

## Contents

- `01-Deep-Research-Guide.md` — End‑to‑end architecture & rollout plan.
- `02-Custom-Search-Integration.md` — Keep your engines; plug in your provider.
- `03-Patch-Set-Diffs.md` — Unified diffs for the full patch set (with addendum).
- `04-Per-File-Diffs.md` — Focused diffs for `web-search.ts`, `research-agent.ts`, `content-extractor.ts`.
- `05-LLM-Adapter.md` — Minimal adapter instructions to wire your model client.
- `06-Smoke-Test.md` — Quick script & pass criteria.
- `07-Env-and-Config.md` — Environment variables & Node requirements.
- `08-WebFetch-Upgrade.md` — Readability-based single-page analysis for WebFetch.
- `09-FAQ-Troubleshooting.md` — Common issues and fixes.

## TL;DR Upgrade Steps

1. Add **LLM adapter** (05) and **pipeline module** (from your repo/canvas).
2. Extend **schemas** and wire **web-search** to call the pipeline with your `searchProvider` (01, 02).
3. Add **Readability** to extractor and WebFetch (01, 08).
4. Emit **progress events** in the agent (01, 03, 04).
5. Run the **smoke test** (06) and configure environments (07).
