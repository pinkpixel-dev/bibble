# Environment & Configuration

## Node
- Node **≥ 18** (uses global `fetch`).

## Packages
```bash
npm i x-crawl @mozilla/readability jsdom p-limit
npm i duck-duck-scrape --save-optional
```

## API Keys
- `BRAVE_SEARCH_API_KEY` — if Brave is used by your provider or fallback.
- For Google/Bing, keep your existing keys in your current config.

`.env.example`:
```env
BRAVE_SEARCH_API_KEY=
```

## Rate Limits & Etiquette
- Timeouts, retries, randomized intervals (`x-crawl`).
- Consider robots.txt and domain-friendly crawling behavior.
