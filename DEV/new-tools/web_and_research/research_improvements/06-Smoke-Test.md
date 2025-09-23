# Smoke Test — Verify Deep Research Path

Create `scripts/research-smoke.ts` and run it with Node after building.

```ts
import { research } from '../src/research/research-pipeline';
import { llm } from '../src/llm/adapter';
import { runMultiSearch } from '../src/tools/built-in/web/search-engine';

(async () => {
  const result = await research('post-quantum migration timelines', llm, {
    depth: 8,
    engine: 'custom',
    engineOrder: ['google','bing','brave','ddg'],
    searchProvider: runMultiSearch,
    includeDomains: ['nist.gov','cisa.gov'],
    format: 'markdown',
    mode: 'summary',
    debug: true,
  });
  console.log('Analyzed sources:', result.sourcesAnalyzed);
  console.log(result.content.slice(0, 600));
})();
```

**Pass criteria**
- `sourcesAnalyzed` close to requested `depth` after dedupe.
- References show multiple distinct hosts matching your engines.
- Summary length ≈ 800–1000 words.
