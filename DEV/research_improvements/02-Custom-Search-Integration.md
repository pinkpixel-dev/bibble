# Custom Search Integration — Keep Google/Bing/Brave/DDG

This manual preserves your existing **multi‑engine search** and user‑preferred order while adopting the deep pipeline.

---

## 1) Goal

- Keep your engine implementations and preferences intact.
- Pass a **`searchProvider`** function and optional **`engineOrder`** to the pipeline.
- Pipeline enforces filters/dedupe and handles extraction → summaries → composition.

---

## 2) Pipeline Types

```ts
export type Engine = 'auto' | 'custom' | 'google' | 'bing' | 'brave' | 'ddg';

export interface ResearchOptions {
  engine?: Engine;
  engineOrder?: Engine[];
  searchProvider?: (query: string, args: {
    depth: number; engine?: Engine; engineOrder?: Engine[]; lang?: string;
  }) => Promise<SearchResult[]>;
  // ... other options
}
```

**Search call preference:**
```ts
const rawResults = await (
  opt.searchProvider
    ? opt.searchProvider(query, { depth: opt.depth, engine: opt.engine, engineOrder: opt.engineOrder, lang: opt.languageHint })
    : multiSearch(query, opt)
);
```

---

## 3) Tool Schema

```ts
engine: { type: 'string', enum: ['auto','custom','google','bing','brave','ddg'], optional: true },
engine_order: {
  type: 'array',
  items: { type: 'string', enum: ['google','bing','brave','ddg'] },
  optional: true,
  description: 'Preferred engine order when engine=auto|custom'
},
```

---

## 4) Wiring Example

```ts
import { research } from '../../research/research-pipeline';
import { llm } from '../../llm/adapter';
import { runMultiSearch } from './search-engine';

const artifact = await research(query, llm, {
  depth, mode, format,
  engine: engine as any,
  engineOrder: engine_order as any,
  searchProvider: runMultiSearch,
  includeDomains: allowed_domains,
  excludeDomains: blocked_domains,
  dedupeByHost: dedupe_by_host,
  maxConcurrency: max_concurrency,
  minUsefulChars: min_useful_chars,
});
```

---

## 5) Who Does What

- **Your provider**: choose engines, honors user order, fetch candidates.
- **Pipeline**: filters, dedupes, extracts, summarizes, composes, cites.

---

## 6) Testing

Use the smoke test (06) with `engine='custom'` and `engineOrder=['google','bing','brave','ddg']`. Verify references contain multiple distinct hosts.
