# WebFetch Upgrade — Readability for Single-Page Analysis

Upgrade your `WebFetch` tool so summaries/extractions run on **clean article text** rather than raw HTML.

## Additions
- Lazy import `@mozilla/readability` and `jsdom`.
- If `content-type` is `text/html`, parse with Readability; fallback to DOM text.

## Patch (anchor-style)
```diff
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
+        if (article?.textContent) content = article.textContent.replace(/\n{3,}/g, '\n\n').trim();
+        else content = dom.window.document.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
+      } catch {}
+    }
```

**Result:** better summaries for news/technical articles and blog posts.
