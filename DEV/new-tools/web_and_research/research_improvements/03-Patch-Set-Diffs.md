# Deep Research Patch Set — Diffs by File

These unified diffs illustrate the changes to integrate the deep pipeline. If `git apply` conflicts, treat them as anchor‑based patches.

---

## 0) New File: `src/llm/adapter.ts`

```diff
diff --git a/src/llm/adapter.ts b/src/llm/adapter.ts
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/src/llm/adapter.ts
@@
+export interface LLM {
+  generate(prompt: string, opts?: { temperature?: number; system?: string }): Promise<string>
+}
+
+// TODO: Wire to your existing client (Claude/OpenAI/etc.)
+export const llm: LLM = {
+  async generate(prompt, opts) {
+    // return myClient.complete({ prompt, temperature: opts?.temperature ?? 0.2 })
+    throw new Error('llm.generate not wired yet')
+  }
+}
```

---

## 1) New File: `src/research/research-pipeline.ts`

Paste the full implementation from your repo/canvas. (It includes search, extraction, per‑source summaries, and composition with references.)

```diff
diff --git a/src/research/research-pipeline.ts b/src/research/research-pipeline.ts
new file mode 100644
index 0000000..2222222
--- /dev/null
+++ b/src/research/research-pipeline.ts
@@
+// Paste full contents from the pipeline module here.
```

---

## 2) Update: `src/tools/built-in/web/schemas.ts`

```diff
diff --git a/src/tools/built-in/web/schemas.ts b/src/tools/built-in/web/schemas.ts
index 3a5b4c1..8b7f9d1 100644
--- a/src/tools/built-in/web/schemas.ts
+++ b/src/tools/built-in/web/schemas.ts
@@ -1,18 +1,47 @@
 export const WebSearchInput = {
   type: 'object',
   properties: {
     query: { type: 'string', description: 'Search query' },
-    allowed_domains: { type: 'array', items: { type: 'string' }, optional: true },
-    blocked_domains: { type: 'array', items: { type: 'string' }, optional: true },
-    max_searches: { type: 'number', description: 'Maximum number of searches (default: 3)', optional: true },
-    max_results: { type: 'number', description: 'Maximum results per search (default: 10)', optional: true },
-    extract_content: { type: 'boolean', description: 'Enable content extraction (default: false)', optional: true }
+    allowed_domains: { type: 'array', items: { type: 'string' }, optional: true },
+    blocked_domains: { type: 'array', items: { type: 'string' }, optional: true },
+
+    // New knobs exposed to LLM
+    engine: { type: 'string', enum: ['auto','custom','google','bing','brave','ddg'], optional: true },
+    engine_order: {
+      type: 'array',
+      items: { type: 'string', enum: ['google','bing','brave','ddg'] },
+      optional: true,
+      description: 'Preferred engine order when engine=auto|custom'
+    },
+    depth: { type: 'number', description: 'Distinct sources to analyze (default: 6)', optional: true },
+    mode: { type: 'string', enum: ['snippet','summary','comprehensive'], optional: true },
+    format: { type: 'string', enum: ['markdown','html','text'], optional: true },
+    dedupe_by_host: { type: 'boolean', optional: true },
+    max_concurrency: { type: 'number', optional: true },
+    min_useful_chars: { type: 'number', optional: true },
+
+    // Legacy options retained for backward compatibility
+    max_searches: { type: 'number', description: 'Maximum number of searches (default: 3)', optional: true },
+    max_results: { type: 'number', description: 'Maximum results per search (default: 10)', optional: true },
+    extract_content: { type: 'boolean', description: 'Enable content extraction (default: false)', optional: true }
   },
   required: ['query']
 } as const;
```

---

## 3) Update: `src/tools/built-in/web/web-search.ts`

```diff
diff --git a/src/tools/built-in/web/web-search.ts b/src/tools/built-in/web/web-search.ts
index 7b2a9e1..9c3d600 100644
--- a/src/tools/built-in/web/web-search.ts
+++ b/src/tools/built-in/web/web-search.ts
@@
-import { research } from '../../../research/research-pipeline.js';
+import { research } from '../../../research/research-pipeline.js';
 import { llm } from '../../../llm/adapter.js';
+import { runMultiSearch } from '../search-engine.js'; // your existing multi-engine orchestrator
@@
   async execute(input: WebSearchInput): Promise<string> {
     const {
       query,
       allowed_domains, blocked_domains,
-      engine = 'auto', depth = 6, mode = 'comprehensive', format = 'markdown',
+      engine = 'auto', engine_order,
+      depth = 6, mode = 'comprehensive', format = 'markdown',
       dedupe_by_host = true, max_concurrency = 3, min_useful_chars = 1200
     } = input;

     const artifact = await research(query, llm, {
       depth,
-      engine,
+      engine,
+      engineOrder: engine_order as any,
       mode,
       format,
       includeDomains: allowed_domains,
       excludeDomains: blocked_domains,
       dedupeByHost: dedupe_by_host,
       maxConcurrency: max_concurrency,
       minUsefulChars: min_useful_chars,
+      searchProvider: runMultiSearch,
     });

     return artifact.content;
   }
 }
```

---

## 4) Update: `src/tools/built-in/web/web.ts` (WebFetch Readability)

```diff
diff --git a/src/tools/built-in/web/web.ts b/src/tools/built-in/web/web.ts
index 12cc8e0..44dd9aa 100644
--- a/src/tools/built-in/web/web.ts
+++ b/src/tools/built-in/web/web.ts
@@
+let Readability: any; let JSDOM: any;
+async function ensureReadability() { if (!Readability || !JSDOM) { const r = await import('@mozilla/readability'); const j = await import('jsdom'); Readability = r.Readability; JSDOM = j.JSDOM; } }
@@
-    const content = await response.text();
+    const raw = await response.text();
+    let content = raw;
+    const ct = response.headers.get('content-type') || '';
+    if (ct.includes('text/html')) {
+      try {
+        await ensureReadability();
+        const dom = new JSDOM(raw, { url });
+        const reader = new Readability(dom.window.document);
+        const article = reader.parse();
+        if (article?.textContent) {
+          content = article.textContent.replace(/\n{3,}/g, '\n\n').trim();
+        } else {
+          content = dom.window.document.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
+        }
+      } catch {}
+    }
```

---

## 5) Update: `src/tools/built-in/web/content-extractor.ts` (Readability)

```diff
diff --git a/src/tools/built-in/web/content-extractor.ts b/src/tools/built-in/web/content-extractor.ts
index e7aa001..f0bb442 100644
--- a/src/tools/built-in/web/content-extractor.ts
+++ b/src/tools/built-in/web/content-extractor.ts
@@
+let Readability: any; let JSDOM: any;
+async function ensureReadability() { if (!Readability || !JSDOM) { const r = await import('@mozilla/readability'); const j = await import('jsdom'); Readability = r.Readability; JSDOM = j.JSDOM; } }
+async function toReadableText(html: string, url: string) {
+  await ensureReadability(); const dom = new JSDOM(html, { url }); const reader = new Readability(dom.window.document); const a = reader.parse();
+  return a?.textContent?.replace(/\n{3,}/g, '\n\n').trim() ?? dom.window.document.body?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
+}
@@
-    const res = await crawl.crawlHTML(url);
-    const html = res?.data?.resBody || '';
-    return html;
+    const res = await crawl.crawlHTML(url);
+    const html = res?.data?.resBody || '';
+    if (/<!doctype html|<html/i.test(html)) {
+      try { return await toReadableText(html, url); } catch {}
+    }
+    return html;
```

---

## 6) Update: `src/tools/built-in/web/research-agent.ts` (events + engine order passthrough)

```diff
diff --git a/src/tools/built-in/web/research-agent.ts b/src/tools/built-in/web/research-agent.ts
index 2345abc..3456bcd 100644
--- a/src/tools/built-in/web/research-agent.ts
+++ b/src/tools/built-in/web/research-agent.ts
@@
+// Helper to emit subType without changing public event union
+const step = (subType: string, data: any = {}) => this.emitStructuredEvent({ type: 'progress', data: { subType, ...data }, sessionId, percent: this.getCompletionPercentage(session) });
@@
+step('search:started', { strategies: searchStrategies.map(s => s.name), baseQuery: session.query });
@@
+step('search:results', { strategy: strategy.name, query: q, count: searchQuery.resultCount });
@@
-const results = await this.performWebSearch(searchQuery.query, Math.min(strategy.maxResults, config.maxResultsPerSearch), config.searchEngineOverrides);
+const results = await this.performWebSearch(searchQuery.query, Math.min(strategy.maxResults, config.maxResultsPerSearch), { ...(config as any).searchEngineOverrides, ...(config as any).engine_order ? { engineOrder: (config as any).engine_order } : {} });
@@
+step('crawl:started', { url });
+// ... after extraction
+step('crawl:done', { url, chars: (item.content || '').length, success: item.success });
@@
+step('summarize:done', { sources: session.extractedContent?.length ?? 0 });
@@
+this.emitStructuredEvent({ type: 'done', percent: 100, data: { subType: 'done' }, sessionId });
```

---

## 7) Environment & Scripts

```diff
diff --git a/.env.example b/.env.example
index abcdef0..abcdef1 100644
--- a/.env.example
+++ b/.env.example
@@
+BRAVE_SEARCH_API_KEY=
```

```diff
diff --git a/scripts/research-smoke.ts b/scripts/research-smoke.ts
new file mode 100644
index 0000000..3333334
--- /dev/null
+++ b/scripts/research-smoke.ts
@@
+import { research } from '../src/research/research-pipeline.js';
+import { llm } from '../src/llm/adapter.js';
+import { runMultiSearch } from '../src/tools/built-in/web/search-engine.js';
+
+(async () => {
+  const a = await research('post-quantum cryptography migration timelines', llm, {
+    depth: 8,
+    engine: 'custom',
+    engineOrder: ['google','bing','brave','ddg'],
+    searchProvider: runMultiSearch,
+    mode: 'summary', format: 'markdown',
+    includeDomains: ['nist.gov','cisa.gov','cloudflare.com'], debug: true
+  });
+  console.log(a.sourcesAnalyzed, 'sources');
+  console.log(a.content.slice(0, 800));
+})();
```

---

That’s the full patch set with the custom-search addendum.
