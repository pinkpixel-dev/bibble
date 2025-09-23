# Deep Research Guide — End‑to‑End Upgrade (TypeScript/Node)

This manual upgrades your research agent to produce deeper, longer, **citation‑rich** docs using robust crawling and summarization—while keeping your **Google/Bing/Brave/DDG** search stack intact.

---

## 0) What We’re Fixing

- Short outputs and shallow coverage.
- Noisy HTML extraction; poor handling of dynamic pages.
- Missing domain allow/block filters and dedupe across hosts.
- Token blowups when feeding raw pages to the model.
- Opaque progress for UIs/LLMs.

---

## 1) Architecture Overview

**Four stages (callable as separate tools or a composite):**

1) **Search (multi‑engine; your provider)** — respects user preferences; returns diverse candidates.
2) **Crawl & Extract** — x‑crawl (static → dynamic) + Mozilla **Readability** fallback.
3) **Per‑Source Summaries** — 150–250 words, facts/dates/entities + provenance.
4) **Compose** — `snippet` (<300 words), `summary` (~800–1000 words), or `comprehensive` (chunked multi‑section) with References.

**Deliverables:** final content (md/html/text) + structured citations + source count. Optional: write to disk.

---

## 2) Packages

```bash
npm i x-crawl @mozilla/readability jsdom p-limit
npm i duck-duck-scrape --save-optional   # optional fallback
```

Node ≥ 18 (global fetch).

---

## 3) Types & Options (LLM‑friendly knobs)

Add or verify these in your pipeline module:

```ts
export type OutputFormat = 'markdown' | 'html' | 'text';
export type ResearchMode = 'snippet' | 'summary' | 'comprehensive';

// Preserve your engines and allow a custom provider
export type Engine = 'auto' | 'custom' | 'google' | 'bing' | 'brave' | 'ddg';

export interface ResearchOptions {
  depth?: number;                     // sources to analyze (default 6)
  engine?: Engine;                    // 'auto' or a single engine
  engineOrder?: Engine[];             // e.g., ['google','bing','brave','ddg']
  mode?: ResearchMode;                // snippet|summary|comprehensive
  format?: OutputFormat;              // markdown|html|text
  maxPerSourceChars?: number;         // default 120_000
  minUsefulChars?: number;            // default 1_200
  maxConcurrency?: number;            // default 3
  writeFile?: { path: string } | false;
  includeDomains?: string[];          // allowlist
  excludeDomains?: string[];          // blocklist
  dedupeByHost?: boolean;             // default true
  languageHint?: string;              // e.g., 'en'
  searchProvider?: (query: string, args: {
    depth: number; engine?: Engine; engineOrder?: Engine[]; lang?: string;
  }) => Promise<SearchResult[]>;      // plug YOUR multi-engine search here
  debug?: boolean;
}
```

**Search step preference:**
```ts
const rawResults = await (
  opt.searchProvider
    ? opt.searchProvider(query, {
        depth: opt.depth, engine: opt.engine, engineOrder: opt.engineOrder, lang: opt.languageHint
      })
    : multiSearch(query, opt) // built-in fallback (Brave/DDG)
);
```

**Downstream stays in pipeline:** domain filters, dedupe, extraction, summarization, composition.

---

## 4) Wiring the WebSearch Tool

Expose knobs through your schema (`engine`, optional `engine_order`, `depth`, `mode`, `format`, domain filters, dedupe flags) and call the pipeline:

```ts
const artifact = await research(query, llm, {
  depth, mode, format,
  engine: engine as any,
  engineOrder: engine_order as any,
  searchProvider: runMultiSearch, // YOUR multi-engine orchestrator
  includeDomains: allowed_domains,
  excludeDomains: blocked_domains,
  dedupeByHost: dedupe_by_host,
  maxConcurrency: max_concurrency,
  minUsefulChars: min_useful_chars,
});
return artifact.content;
```

---

## 5) Agent Loop Enhancements (Progress Events)

Emit granular progress (non-breaking by using a `subType` inside your existing `progress` payload):
- `search:started` / `search:results`
- `crawl:started` / `crawl:done`
- `summarize:done`
- `compose:chunk`
- `done`

UI/LLM can stream these for narration.

---

## 6) Quality Controls

- Fetch **2× depth**, **dedupe by host**, then cap to `depth` for diversity.
- Extraction strategy: **crawlHTML → crawlPage → fetch + Readability**.
- **minUsefulChars** gate skips thin pages.
- Per-source **150–250 word** summaries to avoid token cliffs.
- Chunked composition to avoid repetition/drift.
- Auto **References** section.

---

## 7) Prompt Templates (short)

**Per-source summary (150–250 words):** facts, dates, figures, entities; end with `(Key points from example.com)`.

**Snippet:** 2–3 short paragraphs (<300 words): definition, why it matters, one recent/important fact.

**Summary:** ~800–1000 words: overview, key points, background, current relevance.

**Comprehensive:** intro + foundations, then advanced concepts/applications/trends/challenges (chunked).

---

## 8) Implementation Plan (Day‑by‑Day)

- **Day 1**: Install deps; add LLM adapter; add pipeline module.
- **Day 2**: Extend schemas; wire WebSearch to call pipeline with `searchProvider`.
- **Day 3**: Emit agent events; stream to UI/LLM.
- **Day 4**: Add Readability to WebFetch and batch extractor.
- **Day 5**: Domain allow/block + dedupe plumbing end‑to‑end.
- **Day 6**: Docs & smoke tests.

---

## 9) Testing

See `06-Smoke-Test.md` for a runnable script and pass criteria.

---

## 10) Security & Etiquette

- `http/https` only; timeouts/retries; avoid binary fetch; respect `content-type`.
- Consider robots.txt checks if needed.
- Rate-limit crawling; avoid hammering a single host.

---

## 11) Rollout

1) Feature-flag the deep path.  
2) Dogfood across 10 topics; record: unique hosts, words, references count.  
3) Make deep path default for report-like prompts.  
4) Keep quick path for fast answers / budget-sensitive runs.
