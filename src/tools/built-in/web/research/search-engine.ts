/**
 * Search Engine Integration for Bibble Web Search
 * Supports multiple search engines with fallback mechanisms
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG_FILE } from '../../../../config/storage.js';
import { SearchResult } from '../types/index.js';

/**
 * DuckDuckGo search implementation (no API key required)
 */
export async function searchDuckDuckGo(query: string, numResults: number = 10): Promise<SearchResult[]> {
  try {
    // DuckDuckGo Instant Answer API
    const response = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: query,
        format: 'json',
        pretty: 1,
        no_redirect: 1,
        no_html: 1,
        skip_disambig: 1
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 BibbleResearch/1.0'
      }
    });

    const results: SearchResult[] = [];
    const data = response.data;

    // Process instant answer if available
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading || 'DuckDuckGo Instant Answer',
        link: data.AbstractURL,
        snippet: data.AbstractText.substring(0, 200) + (data.AbstractText.length > 200 ? '...' : ''),
        position: 1,
        relevanceScore: 95,
        source: 'duckduckgo',
        timestamp: new Date()
      });
    }

    // Process related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (let i = 0; i < Math.min(data.RelatedTopics.length, numResults - results.length); i++) {
        const topic = data.RelatedTopics[i];
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || 'Related Topic',
            link: topic.FirstURL,
            snippet: topic.Text.substring(0, 200) + (topic.Text.length > 200 ? '...' : ''),
            position: results.length + 1,
            relevanceScore: Math.max(60, 90 - (i * 5)),
            source: 'duckduckgo',
            timestamp: new Date()
          });
        }
      }
    }

    return results.slice(0, numResults);

  } catch (error) {
    // DuckDuckGo search failed
    return [];
  }
}

/**
 * Bing Web Search API integration (requires API key)
 */
export async function searchBing(query: string, numResults: number = 10, apiKey?: string): Promise<SearchResult[]> {
  if (!apiKey) {
    // Bing API key not provided
    return [];
  }

  try {
    const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
      params: {
        q: query,
        count: numResults,
        textDecorations: false,
        textFormat: 'Raw'
      },
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'User-Agent': 'BibbleResearch/1.0'
      },
      timeout: 10000
    });

    const results: SearchResult[] = [];
    const webPages = response.data.webPages;

    if (webPages && webPages.value) {
      for (let i = 0; i < webPages.value.length; i++) {
        const page = webPages.value[i];
        results.push({
          title: page.name || 'Untitled',
          link: page.url,
          snippet: page.snippet || '',
          position: i + 1,
          relevanceScore: Math.max(50, 95 - (i * 3)),
          source: 'bing',
          timestamp: new Date()
        });
      }
    }

    return results;

  } catch (error) {
    // Bing search failed
    return [];
  }
}

/**
 * Google Custom Search API integration (requires API key and search engine ID)
 */
export async function searchGoogle(query: string, numResults: number = 10, apiKey?: string, searchEngineId?: string): Promise<SearchResult[]> {
  if (!apiKey || !searchEngineId) {
    // Google API credentials not provided
    return [];
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: query,
        num: Math.min(numResults, 10) // Google API limits to 10 results per request
      },
      timeout: 10000
    });

    const results: SearchResult[] = [];
    const items = response.data.items;

    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        results.push({
          title: item.title || 'Untitled',
          link: item.link,
          snippet: item.snippet || '',
          position: i + 1,
          relevanceScore: Math.max(50, 95 - (i * 3)),
          source: 'google',
          timestamp: new Date()
        });
      }
    }

    return results;

  } catch (error) {
    // Google search failed
    return [];
  }
}

/**
 * Brave Search API integration (requires API key)
 */
export async function searchBrave(query: string, numResults: number = 10, apiKey?: string): Promise<SearchResult[]> {
  if (!apiKey) {
    // Brave API key not provided
    return [];
  }

  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count: Math.min(numResults, 20)
      },
      headers: {
        'X-Subscription-Token': apiKey,
        'User-Agent': 'BibbleResearch/1.0'
      },
      timeout: 10000
    });

    const results: SearchResult[] = [];
    const web = response.data?.web;
    const items = web?.results || [];

    for (let i = 0; i < Math.min(items.length, numResults); i++) {
      const item = items[i];
      results.push({
        title: item.title || 'Untitled',
        link: item.url,
        snippet: item.description || '',
        position: i + 1,
        relevanceScore: Math.max(50, 95 - (i * 3)),
        source: 'brave',
        timestamp: new Date()
      });
    }

    return results;

  } catch (error) {
    // Brave search failed
    return [];
  }
}

export async function runMultiSearch(
  query: string,
  args: {
    depth: number;
    engine?: 'auto' | 'custom' | 'google' | 'bing' | 'brave' | 'ddg';
    engineOrder?: Array<'google' | 'bing' | 'brave' | 'ddg'>;
    lang?: string;
  }
): Promise<Array<{ title: string; url: string; snippet?: string; source?: string }>> {
  const targetResults = Math.max(args.depth * 2, 10);
  const baseConfig = getSearchEngineConfig();
  const overrides: Record<string, unknown> = {};

  if (args.engine && args.engine !== 'auto' && args.engine !== 'custom') {
    overrides.preferredEngine = args.engine === 'ddg' ? 'duckduckgo' : args.engine;
  }

  if (args.engineOrder && args.engineOrder.length > 0) {
    overrides.engineOrder = args.engineOrder.map(engine => (engine === 'ddg' ? 'duckduckgo' : engine));
  }

  const results = await searchMultipleEngines(query, targetResults, {
    ...baseConfig,
    ...overrides,
    language: args.lang ?? (baseConfig as any)?.language
  });

  return results.map(result => ({
    title: result.title,
    url: 'link' in result ? (result as any).link : result.url,
    snippet: result.snippet,
    source: result.source
  }));
}

/**
 * Enhanced web scraping search as fallback
 */
export async function searchScraping(query: string, numResults: number = 10): Promise<SearchResult[]> {
  try {
    // This is a simple scraping fallback - in production, you might want to use
    // more sophisticated scraping or additional search APIs
    
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000
    });

    // Parse DuckDuckGo HTML results with cheerio
    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    // Try multiple selectors to be resilient to layout changes
    $('.result, .result--more__btn, .results_links, .web-result').each((i, el) => {
      if (results.length >= numResults) return;
      const linkEl = $(el).find('a.result__a, a.result__url, a[href^="http"]').first();
      const href = linkEl.attr('href');
      const title = (linkEl.text() || '').trim();
      const snippet = ($(el).find('.result__snippet, .result__snippet.js-result-snippet, .result__desc').text() || '').trim();

      if (href && title) {
        results.push({
          title,
          link: href,
          snippet: snippet.substring(0, 220),
          position: results.length + 1,
          relevanceScore: Math.max(30, 85 - (results.length * 5)),
          source: 'duckduckgo',
          timestamp: new Date()
        });
      }
    });

    // Fallback: if parsing yielded nothing, return a minimal placeholder
    if (results.length === 0) {
      return [{
        title: `Search results for: ${query}`,
        link: searchUrl,
        snippet: `Scraped search results for "${query}" (fallback).`,
        position: 1,
        relevanceScore: 30,
        source: 'web-search',
        timestamp: new Date()
      }];
    }

    return results.slice(0, numResults);

  } catch (error) {
    // Scraping search failed
    return [];
  }
}

/** Quick connectivity check to provide clearer diagnostics */
async function checkConnectivity(): Promise<boolean> {
  try {
    await axios.get('https://duckduckgo.com', { timeout: 3000, headers: { 'User-Agent': 'BibbleResearch/1.0' } });
    return true;
  } catch {
    // Network check failed
    return false;
  }
}

/**
 * Main search function with multiple engine support and fallbacks
 */
export async function searchMultipleEngines(
  query: string, 
  numResults: number = 10,
  options: {
    bingApiKey?: string;
    googleApiKey?: string;
    googleSearchEngineId?: string;
    braveApiKey?: string;
    preferredEngine?: 'duckduckgo' | 'bing' | 'google' | 'brave';
    enableFallback?: boolean;
  } = {}
): Promise<SearchResult[]> {
  const { 
    bingApiKey, 
    googleApiKey, 
    googleSearchEngineId, 
    braveApiKey,
    preferredEngine = 'duckduckgo',
    enableFallback = true 
  } = options;

  let results: SearchResult[] = [];

  // Pre-flight connectivity check for clearer logs (does not change behavior)
  const hasNetwork = await checkConnectivity();
  if (!hasNetwork) {
    // Connectivity appears limited
  }

  // Try preferred engine first
  try {
    switch (preferredEngine) {
      case 'brave':
        if (braveApiKey) {
          results = await searchBrave(query, numResults, braveApiKey);
        }
        break;
      case 'bing':
        if (bingApiKey) {
          results = await searchBing(query, numResults, bingApiKey);
        }
        break;
      case 'google':
        if (googleApiKey && googleSearchEngineId) {
          results = await searchGoogle(query, numResults, googleApiKey, googleSearchEngineId);
        }
        break;
      case 'duckduckgo':
      default:
        results = await searchDuckDuckGo(query, numResults);
        break;
    }
  } catch (error) {
    // Primary search engine failed
  }

  // If primary engine failed or returned no results, try fallbacks
  if (results.length === 0 && enableFallback) {
    // Trying fallback engines
    
    // Try DuckDuckGo if it wasn't the primary
    if (preferredEngine !== 'duckduckgo' && results.length === 0) {
      try {
        results = await searchDuckDuckGo(query, numResults);
        // DuckDuckGo fallback completed
      } catch (error) {
        // DuckDuckGo fallback failed
      }
    }

    // Try Bing if available and primary wasn't Bing
    if (preferredEngine !== 'bing' && bingApiKey && results.length === 0) {
      try {
        results = await searchBing(query, numResults, bingApiKey);
        // Bing fallback completed
      } catch (error) {
        // Bing fallback failed
      }
    }

    // Try Google if available and primary wasn't Google
    if (preferredEngine !== 'google' && googleApiKey && googleSearchEngineId && results.length === 0) {
      try {
        results = await searchGoogle(query, numResults, googleApiKey, googleSearchEngineId);
        // Google fallback completed
      } catch (error) {
        // Google fallback failed
      }
    }

    // Try Brave if available and primary wasn't Brave
    if (preferredEngine !== 'brave' && braveApiKey && results.length === 0) {
      try {
        results = await searchBrave(query, numResults, braveApiKey);
        // Brave fallback completed
      } catch (error) {
        // Brave fallback failed
      }
    }

    // Final fallback to scraping if all else fails
    if (results.length === 0) {
      try {
        // Attempting HTML scraping fallback
        results = await searchScraping(query, numResults);
        // Scraping fallback completed
      } catch (error) {
        // Scraping fallback failed
      }
    }
  }

  // Search completed
  return results;
}

/**
 * Get search engine configuration from environment variables or config
 */
export function getSearchEngineConfig(): {
  bingApiKey?: string;
  googleApiKey?: string;
  googleSearchEngineId?: string;
  braveApiKey?: string;
  preferredEngine: 'duckduckgo' | 'bing' | 'google' | 'brave';
} {
  // Defaults from env
  let config = {
    bingApiKey: process.env.BING_SEARCH_API_KEY,
    googleApiKey: process.env.GOOGLE_SEARCH_API_KEY,
    googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
    braveApiKey: process.env.BRAVE_SEARCH_API_KEY,
    preferredEngine: (process.env.PREFERRED_SEARCH_ENGINE as any) || 'duckduckgo'
  } as {
    bingApiKey?: string;
    googleApiKey?: string;
    googleSearchEngineId?: string;
    braveApiKey?: string;
    preferredEngine: 'duckduckgo' | 'bing' | 'google' | 'brave';
  };

  // Try to read optional settings from user config (~/.bibble/config.json)
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const rawUser = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const userJson = JSON.parse(rawUser);
      const web = userJson.webSearch;
      if (web && typeof web === 'object') {
        config = {
          ...config,
          bingApiKey: web.bingApiKey || config.bingApiKey,
          googleApiKey: web.googleApiKey || config.googleApiKey,
          googleSearchEngineId: web.googleSearchEngineId || config.googleSearchEngineId,
          braveApiKey: web.braveApiKey || config.braveApiKey,
          preferredEngine: (web.preferredEngine || config.preferredEngine) as any
        };
      }
    }
  } catch (e) {
    // Failed to read user config
  }

  // Also allow project-local config.json overrides
  try {
    const cfgPath = path.resolve(process.cwd(), 'config.json');
    if (fs.existsSync(cfgPath)) {
      const raw = fs.readFileSync(cfgPath, 'utf-8');
      const json = JSON.parse(raw);
      const web = json.webSearch || json.builtInWebSearch || json.builtInTools?.webSearch;
      if (web && typeof web === 'object') {
        config = {
          ...config,
          bingApiKey: web.bingApiKey || config.bingApiKey,
          googleApiKey: web.googleApiKey || config.googleApiKey,
          googleSearchEngineId: web.googleSearchEngineId || config.googleSearchEngineId,
          braveApiKey: web.braveApiKey || config.braveApiKey,
          preferredEngine: (web.preferredEngine || config.preferredEngine) as any
        };
      }
    }
  } catch (e) {
    // Failed to read config.json
  }

  return config;
}
