# Possible Enhancements to Bibble's Web and Research Functionality

Reference file: ROADMAPS_AND_DEV/new-tools/web_and_research/reference-web-tools.ts.md
Comparing to Bibble's Web and Research tools located in: src/tools/built-in/web

## Overview

- The reference tool returns a single, richly formatted markdown string for the LLM, while Bibble’s built-ins return structured payloads for downstream rendering or transformation (`reference-web-tools.ts:84`, `src/tools/built-in/web/web-search.ts:125`).
- Both wrap a long-running research agent; the reference keeps the experience self-contained in one module, whereas Bibble spreads responsibilities across dedicated agents, extractors, and UI-facing tools (`reference-web-tools.ts:109`, `src/tools/built-in/web/research/research-agent.ts:42`).
- The reference emphasizes user-visible narration (progress, config, troubleshooting); Bibble emphasizes extensibility and multiple consumption modes (`reference-web-tools.ts:132`, `src/tools/built-in/web/web-search.ts:237`).
- For long-form writing, Bibble assembles a consolidated research context; the reference layers additional storytelling elements to keep the model oriented (`reference-web-tools.ts:161`, `src/tools/built-in/web/research/research-agent.ts:723`).

## Reference Tool Highlights

- Domain-level allow/block filtering is first-class and reflected in both the configuration summary and result pruning logic (`reference-web-tools.ts:78`, `reference-web-tools.ts:169`).
- Streams visible progress snapshots every five seconds, including active query and result counts (`reference-web-tools.ts:132`).
- Result formatting prioritizes high relevance, numbers entries, and surfaces relevance scores and sources in a reader-friendly layout (`reference-web-tools.ts:204`).
- Extracted page content is summarized inline with title, word count, teaser text, then rolled into an agent-generated context (`reference-web-tools.ts:226`, `reference-web-tools.ts:238`).
- Companion WebFetch tool fetches a single URL, echoes raw content (trimmed), and conditionally performs summary, extraction, or plain-text conversion based on the prompt (`reference-web-tools.ts:303`, `reference-web-tools.ts:381`).

## Bibble Agent Highlights

- Enhanced agent builds tailored search strategies, detecting personas, technical issues, and platform cues before multi-engine queries (`src/tools/built-in/web/research/research-agent.ts:281`).
- Follow-up searches, early stopping, and configurable extraction depth keep the workflow adaptive and efficient (`src/tools/built-in/web/research/research-agent.ts:205`).
- Standalone extractor batches multiple URLs, applies rate limiting, and returns reusable formatted blobs for downstream synthesis (`src/tools/built-in/web/content-extractor-tool.ts:26`).
- Generates a consolidated research context that stitches extracted passages and top search hits into a single text block with confidence scoring (`src/tools/built-in/web/research/research-agent.ts:723`).
- Additional built-ins provide a quick-search shortcut and a status probe so the UI or LLM can choose between fast answers and deep dives (`src/tools/built-in/web/web-search.ts:170`, `src/tools/built-in/web/web-search.ts:234`).

## Differences Impacting Research Depth

- Domain filtering is absent from Bibble’s schemas, so the LLM cannot constrain sources despite post-filter logic internally (`reference-web-tools.ts:169`, `src/tools/built-in/web/web-search.ts:164`).
- The reference surfaces progress inline; Bibble emits structured events but does not surface them through the built-in response (`reference-web-tools.ts:132`, `src/tools/built-in/web/research/research-agent.ts:697`).
- Prompt-aware single-page analysis in the reference tool enables quick summarize/extract/text modes for one URL, beyond Bibble’s bulk extractor (`reference-web-tools.ts:303`, `src/tools/built-in/web/content-extractor-tool.ts:54`).
- Reference output is pre-formatted for narration; Bibble’s results string focuses on raw content aggregation. Long-document drafting might benefit from the reference’s configuration recap and numbered highlights (`reference-web-tools.ts:84`, `src/tools/built-in/web/web-search.ts:104`).

## Potential Enhancements to Consider

- Extend `WebSearchConfigSchema` with `allowedDomains`/`blockedDomains`; reuse the reference filtering approach and cascade constraints into `generateResearchContext` for cleaner source lists (`reference-web-tools.ts:99`, `src/tools/built-in/web/types/index.ts:107`).
- Pipe the agent’s progress events into the built-in response (or a separate status channel) so the LLM can narrate progress without polling (`reference-web-tools.ts:143`, `src/tools/built-in/web/research/research-agent.ts:704`).
- Introduce a prompt-driven “analyze URL” tool that wraps the existing extractor but layers the reference summary/extract/text modes for richer single-source insights (`reference-web-tools.ts:381`, `src/tools/built-in/web/content-extractor-tool.ts:55`).
- Mirror the reference’s configuration recap and troubleshooting guidance in the structured response to seed long-form writeups (`reference-web-tools.ts:86`, `src/tools/built-in/web/web-search.ts:125`).
- Expose extracted-content snippets, word counts, and confidence summaries directly in the `web_search` payload to reduce parsing of raw context blocks (`reference-web-tools.ts:231`, `src/tools/built-in/web/research/research-agent.ts:737`).

## Adoption Notes

- Adding domain filters requires updating the Zod schema, the UI form, and the agent’s filtering pipeline to keep relevance scoring aligned with user constraints (`src/tools/built-in/web/types/index.ts:107`).
- Progress messaging can remain optional: reuse the agent’s event emitter and let the UI or LLM request streaming updates only when needed (`src/tools/built-in/web/research/research-agent.ts:697`).
- Prompt-aware fetch can share the extractor’s HTTP stack but needs guardrails for large pages and binary content, following the reference’s content-type checks (`reference-web-tools.ts:356`, `src/tools/built-in/web/research/content-extractor.ts:101`).
- When tailoring output for long-form documents, keep Bibble’s structured payload but attach a narrative “executive summary” modeled on the reference formatting to prime outlines (`reference-web-tools.ts:252`, `src/tools/built-in/web/web-search.ts:125`).