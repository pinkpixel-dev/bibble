# Focused Diffs — Three Key Files

This manual explains and shows the diffs for:
- `web-search.ts` (pass engine order; call pipeline)
- `research-agent.ts` (progress events; engine order passthrough)
- `content-extractor.ts` (Readability for cleaner text)

---

## 1) `web-search.ts` — pass engine order w/o breaking behavior

```diff
diff --git a/src/tools/built-in/web/web-search.ts b/src/tools/built-in/web/web-search.ts
index 7b2a9e1..9c3d5ff 100644
--- a/src/tools/built-in/web/web-search.ts
+++ b/src/tools/built-in/web/web-search.ts
@@ -20,6 +20,7 @@ async function executeWebSearch(params: WebSearchConfig): Promise<any> {
     const researchConfig: Partial<ResearchConfig> = {
       maxSearches: params.maxSearches,
       maxResultsPerSearch: params.maxResultsPerSearch,
+      // NEW: pass engine order if present (keeps your multi-engine logic intact)
       maxContentExtractions: params.extractContent ? 8 : 0,
       enableContentExtraction: params.extractContent,
       enableFollowUpSearches: params.maxSearches > 1,
@@ -39,8 +40,16 @@ async function executeWebSearch(params: WebSearchConfig): Promise<any> {
       timeoutMs: 90000, // 90 seconds for comprehensive search
       // Pass per-call preferred engine override if provided
-      searchEngineOverrides: params.preferredEngine ? { preferredEngine: params.preferredEngine } : undefined
+      searchEngineOverrides:
+        (params as any).preferredEngine || (params as any).engine_order
+          ? ({
+              ...(params as any).preferredEngine
+                ? { preferredEngine: (params as any).preferredEngine }
+                : {},
+              ...(params as any).engine_order ? { engineOrder: (params as any).engine_order } : {}
+            } as any)
+          : undefined
     };
```

---

## 2) `research-agent.ts` — richer progress + engine order passthrough

```diff
diff --git a/src/tools/built-in/web/research-agent.ts b/src/tools/built-in/web/research-agent.ts
index 2345abc..3456bcd 100644
--- a/src/tools/built-in/web/research-agent.ts
+++ b/src/tools/built-in/web/research-agent.ts
@@ -140,6 +141,20 @@ class EnhancedResearchAgent extends EventEmitter implements ResearchAgent {
   private async conductResearch(sessionId: string, config: ResearchConfig): Promise<void> {
     const session = this.activeSessions.get(sessionId);
     if (!session) return;
+
+    const step = (subType: string, data: any = {}, percent = this.getCompletionPercentage(session)): void => {
+      try {
+        this.emitStructuredEvent({
+          type: 'progress',
+          percent,
+          data: { subType, ...data },
+          sessionId
+        });
+      } catch {/* non-fatal */}
+    };
@@
     session.status = 'searching';
     this.updateProgress(sessionId);
+    step('search:started', { strategies: searchStrategies.map(s => s.name), baseQuery: session.query });
@@
-          if (searchQuery) {
+          if (searchQuery) {
+            step('search:results', { strategy: strategy.name, query: q, count: searchQuery.resultCount });
             session.searches.push(searchQuery);
             session.totalResults += searchQuery.resultCount;
             this.updateProgress(sessionId);
           }
@@
-        await this.extractRelevantContent(session, config);
+        await this.extractRelevantContentWithProgress(session, config, (url, kind, payload) => {
+          if (kind === 'start') step('crawl:started', { url });
+          if (kind === 'done') step('crawl:done', { url, ...payload });
+        });
@@
-      session.contextSummary = this.generateContextSummary(session);
+      session.contextSummary = this.generateContextSummary(session);
+      step('summarize:done', { sources: session.extractedContent?.length ?? 0 });
@@
-      this.updateProgress(sessionId);
+      this.updateProgress(sessionId);
+      this.emitStructuredEvent({ type: 'done', percent: 100, data: { subType: 'done' }, sessionId });
@@
-  private async performWebSearch(
+  private async performWebSearch(
     query: string,
     maxResults: number,
     overrides?: {
-      preferredEngine?: 'duckduckgo' | 'bing' | 'google' | 'brave';
+      preferredEngine?: 'duckduckgo' | 'bing' | 'google' | 'brave';
+      engineOrder?: string[]; // NEW
       bingApiKey?: string;
       googleApiKey?: string;
       googleSearchEngineId?: string;
       braveApiKey?: string;
@@
-      const results = await searchMultipleEngines(query, maxResults, {
-        ...searchConfig,
-        ...(overrides ?? {})
-      });
+      const results = await searchMultipleEngines(query, maxResults, {
+        ...searchConfig,
+        ...(overrides ?? {}),
+        ...(overrides?.engineOrder ? { engineOrder: overrides.engineOrder } : {})
+      });
@@
+  private async extractRelevantContentWithProgress(
+    session: ResearchSession,
+    config: ResearchConfig,
+    onEvent: (url: string, kind: 'start' | 'done', payload?: { success?: boolean; chars?: number }) => void
+  ): Promise<void> {
+    const allUrls: string[] = [];
+    for (const search of session.searches) {
+      for (const result of search.results) {
+        if (result.relevanceScore && result.relevanceScore >= config.relevanceThreshold) {
+          allUrls.push(result.link);
+        }
+      }
+    }
+    const prioritizedUrls = this.contentExtractor.prioritizeUrls(allUrls);
+    const urlsToExtract = prioritizedUrls.slice(0, config.maxContentExtractions);
+    const extracted: typeof session.extractedContent = [];
+    for (const url of urlsToExtract) {
+      onEvent(url, 'start');
+      const item = await this.contentExtractor.extractContent(url);
+      onEvent(url, 'done', { success: item.success, chars: (item.content || '').length });
+      if (item.success) extracted.push(item);
+      this.updateProgress(session.id);
+    }
+    session.extractedContent = extracted;
+  }
```

---

## 3) `content-extractor.ts` — add Readability (jsdom)

```diff
diff --git a/src/tools/built-in/web/content-extractor.ts b/src/tools/built-in/web/content-extractor.ts
index e7aa001..f0bb442 100644
--- a/src/tools/built-in/web/content-extractor.ts
+++ b/src/tools/built-in/web/content-extractor.ts
@@
+let Readability: any; let JSDOM: any;
+async function ensureReadability() {
+  if (!Readability || !JSDOM) { const r = await import('@mozilla/readability'); const j = await import('jsdom'); Readability = r.Readability; JSDOM = j.JSDOM; }
+}
+async function toReadableText(html: string, url: string) {
+  await ensureReadability();
+  const dom = new JSDOM(html, { url });
+  const reader = new Readability(dom.window.document);
+  const a = reader.parse();
+  return a?.textContent?.replace(/\n{3,}/g, '\n\n').trim()
+      ?? dom.window.document.body?.textContent?.replace(/\s+/g, ' ').trim()
+      ?? '';
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
