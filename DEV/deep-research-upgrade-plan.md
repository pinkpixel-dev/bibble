# Deep Research Upgrade Implementation Plan

This plan consolidates the documentation bundle in `research_improvements` and sequences the work required to ship the deep, citation-rich research pipeline. Follow each phase in order; every section calls out the source guidance to consult while implementing.

---

## Phase 0 — Orientation & Scope Confirmation
- Review the bundle overview in `research_improvements/00-README.md` to confirm goals, deliverables, and doc map.
- Align on the architecture and rollout expectations described in `research_improvements/01-Deep-Research-Guide.md` (Sections 0, 1, 8, and 11) so stakeholders understand why the upgrade is necessary.
- Catalog existing web search, extraction, and agent modules in the repo to understand bespoke hooks that must be preserved during integration.

## Phase 1 — Core Pipeline & LLM Adapter
1. Implement the lightweight adapter specified in `research_improvements/05-LLM-Adapter.md`; create `src/llm/adapter.ts` using the diff in `research_improvements/03-Patch-Set-Diffs.md` (Section 0).
2. Introduce the new pipeline module (`src/research/research-pipeline.ts`) by copying in the full implementation referenced in `research_improvements/03-Patch-Set-Diffs.md` (Section 1). Ensure exported types match the definitions in `research_improvements/01-Deep-Research-Guide.md` (Section 3).
3. Wire internal prompts per the guidance in `research_improvements/01-Deep-Research-Guide.md` (Section 7), confirming per-source summary length, composition modes, and reference formatting.
4. Verify the pipeline exposes configuration knobs for search depth, domain allow/block lists, deduping, concurrency, and output format as required by `research_improvements/01-Deep-Research-Guide.md` and reiterated in `research_improvements/02-Custom-Search-Integration.md` (Section 2).

## Phase 2 — Multi-Engine Search Integration
1. Update the web search schema following `research_improvements/03-Patch-Set-Diffs.md` (Section 2) to expose `engine`, `engine_order`, `mode`, `format`, depth, and dedupe flags.
2. Connect `src/tools/built-in/web/web-search.ts` to the new pipeline (see `research_improvements/03-Patch-Set-Diffs.md`, Section 3 and `research_improvements/04-Per-File-Diffs.md`, Section 1) so that:
   - `runMultiSearch` is injected as `searchProvider`.
   - User preferences flow through `engine` and `engine_order` with backwards compatibility for existing overrides.
   - Pipeline options (`depth`, `mode`, `format`, domain filters) map cleanly from the tool input.
3. Validate the integration against the expectations in `research_improvements/02-Custom-Search-Integration.md` (Sections 3–5), ensuring ownership boundaries stay intact: provider fetches candidates; pipeline handles filtering, dedupe, extraction, and composition.

## Phase 3 — Agent Progress & Event Streaming
1. Layer in progress events described in `research_improvements/01-Deep-Research-Guide.md` (Section 5) using the diff anchors from `research_improvements/03-Patch-Set-Diffs.md` (Section 6) and the focused walkthrough in `research_improvements/04-Per-File-Diffs.md` (Section 2).
2. Ensure `research-agent.ts` emits structured events for `search:started`, `search:results`, `crawl:started`, `crawl:done`, `summarize:done`, and final completion, preserving existing public event unions.
3. Feed `engine_order` through the agent’s search orchestration per `research_improvements/04-Per-File-Diffs.md` to respect user-configured priorities end-to-end.

## Phase 4 — Extraction & WebFetch Enhancements
1. Upgrade `content-extractor.ts` with Readability support using `research_improvements/03-Patch-Set-Diffs.md` (Section 5) and the explanatory diff in `research_improvements/04-Per-File-Diffs.md` (Section 3). Confirm the fallback behavior matches `research_improvements/01-Deep-Research-Guide.md` (Section 6) requirements.
2. Apply the WebFetch single-page readability improvements outlined in `research_improvements/08-WebFetch-Upgrade.md` and mirrored in `research_improvements/03-Patch-Set-Diffs.md` (Section 4). Validate lazy imports and robust fallbacks for non-HTML content.
3. Configure extractor prioritization so `minUsefulChars`, deduping, and concurrency gates from the pipeline influence crawl behavior (see `research_improvements/01-Deep-Research-Guide.md`, Section 6).

## Phase 5 — Environment, Dependencies, and Configuration
1. Install packages enumerated in `research_improvements/01-Deep-Research-Guide.md` (Section 2) and reiterated in `research_improvements/07-Env-and-Config.md` (Node ≥ 18, `x-crawl`, `@mozilla/readability`, `jsdom`, `p-limit`, optional `duck-duck-scrape`).
2. Update `.env.example` with `BRAVE_SEARCH_API_KEY` as shown in `research_improvements/03-Patch-Set-Diffs.md` (Section 7) and documented in `research_improvements/07-Env-and-Config.md`.
3. Confirm rate-limiting, timeout, and polite crawling defaults per `research_improvements/07-Env-and-Config.md` and safety notes in `research_improvements/01-Deep-Research-Guide.md` (Section 10).

## Phase 6 — Verification & Tooling
1. Create `scripts/research-smoke.ts` following `research_improvements/03-Patch-Set-Diffs.md` (Section 7) and `research_improvements/06-Smoke-Test.md`. Ensure the script runs against the upgraded pipeline and logs the required metrics.
2. Establish pass criteria from `research_improvements/06-Smoke-Test.md`: analyzed sources near requested depth, multi-host references, and correct summary length.
3. Extend existing automated tests (if present) or add unit coverage for pipeline components, focusing on domain filters, dedupe logic, and mode formatting as implied by `research_improvements/01-Deep-Research-Guide.md` (Sections 6–7).
4. Document troubleshooting pathways (Phase 7) so QA and support teams can reference `research_improvements/09-FAQ-Troubleshooting.md` during validation.

## Phase 7 — Rollout, Monitoring, and Support
1. Follow the rollout sequence laid out in `research_improvements/01-Deep-Research-Guide.md` (Section 11): feature flag, dogfood across diverse prompts, capture metrics (unique hosts, word counts, references), and graduate to default for report-style tasks.
2. Maintain a quick-response checklist sourced from `research_improvements/09-FAQ-Troubleshooting.md` to handle shallow outputs, repetition, extraction failures, token growth, and search preference regressions.
3. Provide UI/UX updates so progress events stream to clients, ensuring end-user visibility of search, crawl, and composition stages (see `research_improvements/01-Deep-Research-Guide.md`, Section 5).
4. Publish internal documentation summarizing the new knobs (mode, format, depth, domain filters) and link back to `research_improvements/02-Custom-Search-Integration.md` and `research_improvements/06-Smoke-Test.md` so on-call engineers can reproduce results.

## Suggested Timeline
Use the day-by-day outline in `research_improvements/01-Deep-Research-Guide.md` (Section 8) as a baseline:
- **Day 1**: Complete Phase 1 (LLM adapter & pipeline file).
- **Day 2**: Finish Phase 2 (schema + web-search wiring).
- **Day 3**: Execute Phase 3 (agent progress events).
- **Day 4**: Execute Phase 4 (Readability upgrades for extractor and WebFetch).
- **Day 5**: Harden filters/dedupe and confirm configuration from Phases 2, 4, and 5.
- **Day 6**: Run smoke tests, document rollout, and prep support materials using `research_improvements/06-Smoke-Test.md` and `research_improvements/09-FAQ-Troubleshooting.md`.

## Deliverables Checklist
- [ ] `src/llm/adapter.ts` implemented (`research_improvements/05-LLM-Adapter.md`).
- [ ] `src/research/research-pipeline.ts` added and exported (`research_improvements/03-Patch-Set-Diffs.md`).
- [ ] Web search schema and tool updated with engine order support (`research_improvements/03-Patch-Set-Diffs.md`, `research_improvements/04-Per-File-Diffs.md`).
- [ ] Research agent emits new progress events (`research_improvements/03-Patch-Set-Diffs.md`, `research_improvements/01-Deep-Research-Guide.md`).
- [ ] Content extractor and WebFetch upgraded with Readability (`research_improvements/08-WebFetch-Upgrade.md`).
- [ ] Dependencies and environment variables aligned (`research_improvements/07-Env-and-Config.md`).
- [ ] Smoke test script written and passing (`research_improvements/06-Smoke-Test.md`).
- [ ] Support & troubleshooting guide circulated (`research_improvements/09-FAQ-Troubleshooting.md`).

## Risk Mitigation & Notes
- Monitor token usage and summary lengths to avoid overages (`research_improvements/09-FAQ-Troubleshooting.md`, token guidance; `research_improvements/01-Deep-Research-Guide.md`, Sections 6–7).
- Ensure domain allow/block logic is correctly wired before rollout (Phase 2 and 4 references) to prevent accidental exclusion of vital sources.
- Keep the legacy quick-answer path feature-flagged until deep mode proves stable (see rollout advice in `research_improvements/01-Deep-Research-Guide.md`).
- Record metrics during pilot runs (sources analyzed, unique hosts, citation counts) for future regression detection.

---

By following this plan and consulting each referenced document in `research_improvements`, the team can integrate the deep research workflow while preserving existing multi-engine search behaviors and delivering richer, citation-heavy outputs.
