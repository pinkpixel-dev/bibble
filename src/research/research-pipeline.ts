import { writeFile } from 'fs/promises';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import pLimit from 'p-limit';
import type { LLM } from '../llm/adapter.js';
import { getSearchEngineConfig, searchMultipleEngines } from '../tools/built-in/web/research/search-engine.js';

export type OutputFormat = 'markdown' | 'html' | 'text';
export type ResearchMode = 'snippet' | 'summary' | 'comprehensive';
export type Engine = 'auto' | 'custom' | 'google' | 'bing' | 'brave' | 'ddg';

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
}

export interface ResearchOptions {
  depth?: number;
  engine?: Engine;
  engineOrder?: Engine[];
  mode?: ResearchMode;
  format?: OutputFormat;
  maxPerSourceChars?: number;
  minUsefulChars?: number;
  maxConcurrency?: number;
  writeFile?: { path: string } | false;
  includeDomains?: string[];
  excludeDomains?: string[];
  dedupeByHost?: boolean;
  languageHint?: string;
  searchProvider?: (query: string, args: {
    depth: number;
    engine?: Engine;
    engineOrder?: Engine[];
    lang?: string;
  }) => Promise<SearchResult[]>;
  debug?: boolean;
  onProgress?: (event: ResearchProgressEvent) => void;
}

export interface ResearchSourceSummary extends SearchResult {
  summary: string;
  wordCount: number;
  content: string;
}

export interface ResearchArtifact {
  content: string;
  format: OutputFormat;
  mode: ResearchMode;
  sourcesAnalyzed: number;
  references: Array<{
    id: number;
    title: string;
    url: string;
    source?: string;
  }>;
  summaries: ResearchSourceSummary[];
  rawSearchResults: SearchResult[];
}

export interface ResearchProgressEvent {
  event: string;
  data?: Record<string, unknown>;
}

const DEFAULT_MIN_USEFUL_CHARS = 1200;
const DEFAULT_DEPTH = 6;
const DEFAULT_MAX_CONCURRENCY = 3;
const DEFAULT_MAX_SOURCE_CHARS = 120_000;
const FETCH_TIMEOUT_MS = 25_000;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 BibbleResearch/2.0';

interface FetchResult {
  url: string;
  content: string;
  title: string;
  wordCount: number;
  source?: string;
}

type ProgressEmitter = (event: string, data?: Record<string, unknown>) => void;

export async function research(query: string, llm: LLM, options: ResearchOptions = {}): Promise<ResearchArtifact> {
  if (!query || !query.trim()) {
    throw new Error('Query is required for research pipeline');
  }

  const depth = options.depth ?? DEFAULT_DEPTH;
  const mode = options.mode ?? 'comprehensive';
  const format = options.format ?? 'markdown';
  const minUsefulChars = options.minUsefulChars ?? DEFAULT_MIN_USEFUL_CHARS;
  const maxPerSourceChars = options.maxPerSourceChars ?? DEFAULT_MAX_SOURCE_CHARS;
  const maxConcurrency = Math.max(1, options.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY);
  const dedupeByHost = options.dedupeByHost ?? true;
  const emit = createEmitter(options.onProgress);

  emit('search:started', { query, requestedDepth: depth, engine: options.engine ?? 'auto' });

  const rawSearchResults = await fetchCandidates(query, options, depth * 2);
  const filtered = filterCandidates(rawSearchResults, { include: options.includeDomains, exclude: options.excludeDomains, dedupeByHost });
  const candidates = filtered.slice(0, depth);

  emit('search:results', {
    raw: rawSearchResults.length,
    filtered: filtered.length,
    selected: candidates.length
  });

  const sources = await extractSources(candidates, {
    maxConcurrency,
    minUsefulChars,
    maxPerSourceChars,
    debug: options.debug ?? false
  }, emit);

  const summaries = await buildSourceSummaries(sources, llm, {
    maxConcurrency
  }, emit);

  const artifactContent = await composeArtifact(query, summaries, llm, {
    mode,
    format
  }, emit);

  const references = summaries.map((summary, index) => ({
    id: index + 1,
    title: summary.title || `Source ${index + 1}`,
    url: summary.url,
    source: summary.source
  }));

  const referencesBlock = formatReferences(references, format);
  const contentWithReferences = ensureReferencesSection(artifactContent, referencesBlock, format);

  if (options.writeFile && options.writeFile.path) {
    await writeFile(options.writeFile.path, contentWithReferences, 'utf8');
  }

  emit('done', { sourcesAnalyzed: summaries.length, mode, format });

  return {
    content: contentWithReferences,
    format,
    mode,
    sourcesAnalyzed: summaries.length,
    references,
    summaries,
    rawSearchResults
  };
}

async function fetchCandidates(query: string, options: ResearchOptions, desired: number): Promise<SearchResult[]> {
  if (options.searchProvider) {
    const customResults = await options.searchProvider(query, {
      depth: desired,
      engine: options.engine,
      engineOrder: options.engineOrder,
      lang: options.languageHint
    });
    return customResults.map(normalizeResult).filter(Boolean) as SearchResult[];
  }

  const baseConfig = getSearchEngineConfig();
  const overrides: Record<string, unknown> = {};

  if (options.engine && options.engine !== 'auto' && options.engine !== 'custom') {
    overrides.preferredEngine = mapEngineName(options.engine);
  }

  if (options.engineOrder && options.engineOrder.length > 0) {
    overrides.engineOrder = options.engineOrder.map(mapEngineName).filter(Boolean);
  }

  const results = await searchMultipleEngines(query, desired, {
    ...baseConfig,
    ...overrides
  });

  return results.map(result => normalizeResult({
    title: result.title,
    url: 'link' in result ? (result as any).link : result.url,
    snippet: result.snippet,
    source: result.source
  })).filter(Boolean) as SearchResult[];
}

function normalizeResult(result: Partial<SearchResult> & { url?: string }): SearchResult | null {
  const url = result.url || (result as any).link;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      title: result.title ?? parsed.hostname,
      url: parsed.toString(),
      snippet: result.snippet,
      source: result.source
    };
  } catch {
    return null;
  }
}

function mapEngineName(engine: Engine): string | undefined {
  switch (engine) {
    case 'ddg':
      return 'duckduckgo';
    case 'bing':
    case 'google':
    case 'brave':
      return engine;
    default:
      return undefined;
  }
}

function filterCandidates(results: SearchResult[], opts: { include?: string[]; exclude?: string[]; dedupeByHost: boolean }): SearchResult[] {
  const seenUrls = new Set<string>();
  const seenHosts = new Set<string>();
  const includeSet = normalizeDomainList(opts.include);
  const excludeSet = normalizeDomainList(opts.exclude);

  const filtered: SearchResult[] = [];
  for (const result of results) {
    if (seenUrls.has(result.url)) continue;

    const host = safeHostname(result.url);
    if (!host) continue;

    if (includeSet.size > 0 && !includeSet.has(host)) {
      continue;
    }

    if (excludeSet.has(host)) {
      continue;
    }

    if (opts.dedupeByHost && seenHosts.has(host)) {
      continue;
    }

    seenUrls.add(result.url);
    seenHosts.add(host);
    filtered.push(result);
  }

  return filtered;
}

function normalizeDomainList(domains?: string[]): Set<string> {
  const set = new Set<string>();
  if (!domains) return set;
  for (const domain of domains) {
    if (!domain) continue;
    try {
      const host = new URL(domain.startsWith('http') ? domain : `https://${domain}`).hostname.toLowerCase();
      set.add(host);
    } catch {
      set.add(domain.toLowerCase());
    }
  }
  return set;
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

async function extractSources(
  results: SearchResult[],
  opts: { maxConcurrency: number; minUsefulChars: number; maxPerSourceChars: number; debug: boolean },
  progress?: ProgressEmitter
): Promise<FetchResult[]> {
  const limiter = pLimit(opts.maxConcurrency);

  const jobs = results.map(result => limiter(async () => {
    try {
      progress?.('crawl:started', { url: result.url });
      const fetched = await fetchAndExtract(result.url);
      const truncatedContent = fetched.content.slice(0, opts.maxPerSourceChars);
      if (truncatedContent.length < opts.minUsefulChars) {
        progress?.('crawl:done', {
          url: result.url,
          success: false,
          reason: 'insufficient_content',
          chars: truncatedContent.length
        });
        return null;
      }

      const record = {
        url: result.url,
        title: fetched.title || result.title,
        content: truncatedContent,
        wordCount: Math.round(truncatedContent.split(/\s+/).filter(Boolean).length),
        source: result.source
      } satisfies FetchResult;

      progress?.('crawl:done', {
        url: result.url,
        success: true,
        chars: truncatedContent.length
      });

      return record;
    } catch (error) {
      if (opts.debug) {
        console.warn(`Failed to extract ${result.url}:`, error);
      }
      progress?.('crawl:done', {
        url: result.url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      });
      return null;
    }
  }));

  const fetched = await Promise.all(jobs);
  return fetched.filter((item): item is FetchResult => Boolean(item));
}

async function fetchAndExtract(url: string): Promise<{ content: string; title: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const raw = await response.text();
    const isHtml = contentType.includes('text/html') || /<!doctype html/i.test(raw) || /<html/i.test(raw);

    if (!isHtml) {
      const title = safeHostname(url) ?? url;
      return { content: raw, title };
    }

    const dom = new JSDOM(raw, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const title = article?.title ?? dom.window.document.title ?? safeHostname(url) ?? url;
    const textContent = article?.textContent?.trim() || dom.window.document.body?.textContent?.trim() || '';
    const normalized = normalizeWhitespace(textContent);

    return { content: normalized, title };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, '').replace(/\t/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').trim();
}

async function buildSourceSummaries(
  sources: FetchResult[],
  llm: LLM,
  opts: { maxConcurrency: number },
  progress?: ProgressEmitter
): Promise<ResearchSourceSummary[]> {
  const limiter = pLimit(Math.max(1, Math.min(opts.maxConcurrency, 4)));

  progress?.('summarize:started', { total: sources.length });

  const jobs = sources.map((source, index) => limiter(async () => {
    progress?.('summarize:source', { url: source.url, index: index + 1 });
    const prompt = buildSummarizationPrompt(source, index + 1);
    const summary = await llm.generate(prompt, {
      temperature: 0.2,
      system: 'You distill web pages for a research pipeline. Extract concrete facts, figures, dates, named entities, and claims. 180-220 words. End with a parenthetical citation of the source domain.'
    });

    const record = {
      ...source,
      summary,
      wordCount: source.wordCount
    } satisfies ResearchSourceSummary;

    progress?.('summarize:source', { url: source.url, index: index + 1, status: 'done' });

    return record;
  }));

  const results = await Promise.all(jobs);
  progress?.('summarize:done', { total: results.filter(item => Boolean(item.summary?.trim())).length });
  return results.filter(item => Boolean(item.summary?.trim()));
}

function buildSummarizationPrompt(source: FetchResult, slot: number): string {
  return `Summarize the following source for a research brief. Keep between 180 and 220 words, include concrete facts, dates, statistics, and named entities, and close with the citation marker "(Key points from ${safeHostname(source.url) ?? source.url})".

[Source ${slot}] Title: ${source.title}
URL: ${source.url}

Content:
${source.content}`;
}

async function composeArtifact(
  query: string,
  summaries: ResearchSourceSummary[],
  llm: LLM,
  opts: { mode: ResearchMode; format: OutputFormat },
  progress?: ProgressEmitter
): Promise<string> {
  if (summaries.length === 0) {
    throw new Error('No sources met usefulness criteria; cannot compose artifact.');
  }

  const compositionInstructions = getCompositionInstructions(opts.mode, opts.format);
  const sourcesDigest = summaries.map((summary, index) => formatSourceDigest(summary, index + 1)).join('\n\n');

  const prompt = `${compositionInstructions}

Research query: ${query}

Use only the source digests below. Cite inline with [n] referencing the source index. Finish with a References section that lists all sources.

Source digests:
${sourcesDigest}`;
  progress?.('compose:started', { totalSources: summaries.length, mode: opts.mode, format: opts.format });
  const content = await llm.generate(prompt, {
    temperature: 0.3,
    system: 'You are an expert research synthesizer. Produce structured, citation-rich deliverables that reflect the evidence provided. Never fabricate information or sources.'
  });

  progress?.('compose:chunk', { index: 0, length: content.length });
  progress?.('compose:done', { length: content.length });

  return content;
}

function getCompositionInstructions(mode: ResearchMode, format: OutputFormat): string {
  const formatHint = format === 'markdown'
    ? 'Return valid markdown.'
    : format === 'html'
      ? 'Return valid semantic HTML with headings.'
      : 'Return plain text paragraphs.';

  switch (mode) {
    case 'snippet':
      return `Write a concise briefing (<300 words) with 2-3 short paragraphs covering definition/context, why the topic matters, and one recent development. ${formatHint}`;
    case 'summary':
      return `Write an approximately 800-1000 word analytical summary with an introduction, key findings, supporting evidence, and implications. ${formatHint}`;
    case 'comprehensive':
    default:
      return `Write a multi-section comprehensive report. Start with an introduction, then cover foundations/background, current landscape, advanced developments, and challenges or outlook. Use headings appropriate for the output format. Target 3-4 well-developed sections. ${formatHint}`;
  }
}

function formatSourceDigest(summary: ResearchSourceSummary, index: number): string {
  return `[${index}] ${summary.title} — ${summary.url}\nSummary:\n${summary.summary}`;
}

function formatReferences(references: ResearchArtifact['references'], format: OutputFormat): string {
  if (references.length === 0) return '';

  switch (format) {
    case 'html':
      return `\n<h2>References</h2>\n<ol>\n${references.map(ref => `  <li><a href="${ref.url}">${escapeHtml(ref.title)}</a>${ref.source ? ` — ${ref.source}` : ''}</li>`).join('\n')}\n</ol>`;
    case 'text':
      return `\nReferences\n${references.map(ref => `${ref.id}. ${ref.title} (${ref.url})${ref.source ? ` — ${ref.source}` : ''}`).join('\n')}`;
    case 'markdown':
    default:
      return `\n\n## References\n${references.map(ref => `${ref.id}. [${ref.title}](${ref.url})${ref.source ? ` — ${ref.source}` : ''}`).join('\n')}`;
  }
}

function ensureReferencesSection(content: string, referencesBlock: string, format: OutputFormat): string {
  if (!referencesBlock.trim()) {
    return content;
  }

  const lower = content.toLowerCase();
  const hasReferences = format === 'html'
    ? /<h\d[^>]*>\s*references\s*<\/h\d>/.test(lower)
    : lower.includes('references');

  if (hasReferences) {
    return content;
  }

  return `${content.trim()}${referencesBlock}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createEmitter(onProgress?: (event: ResearchProgressEvent) => void): ProgressEmitter {
  return (event, data) => {
    if (!onProgress) return;
    try {
      onProgress({ event, data });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('research pipeline progress handler failed', error);
      }
    }
  };
}
