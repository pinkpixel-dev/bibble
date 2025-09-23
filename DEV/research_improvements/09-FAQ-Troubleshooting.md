# FAQ & Troubleshooting

**Docs are short.**  
Increase `depth` to 8–10, ensure dynamic crawl is enabled, lower `dedupeByHost=false` if you truly need multiple articles from one domain.

**Too repetitive.**  
Chunk size is already small; ensure per‑source summaries are 150–250 words and composition is in sections (intro/foundations → advanced/applications → trends/challenges).

**Extraction fails.**  
Readability fallback + `crawlPage` give robustness. Check `minUsefulChars` (e.g., 1200). Some sites block headless browsers; the HTTP fallback often still works.

**Tokens blow up.**  
You should never feed raw pages—only per‑source summaries go to the composer. Lower `maxPerSourceChars` if needed (80k).

**Engines preference lost.**  
Pass your provider as `searchProvider` and include `engineOrder`. If not provided, your provider should use stored user defaults.

**Legal/safety.**  
Respect site terms and robots.txt where appropriate. Avoid scraping authenticated/paid content. Handle PII responsibly.
