// DuckDuckGo Search Engine Implementation
// For integrated web search capabilities

import axios from 'axios';
import * as cheerio from 'cheerio';
// import { v4 as uuidv4 } from 'uuid'; // Not used in this file
import { 
  SearchResult, 
  SearchEngine, 
  RateLimiterState,
  SearchType 
} from '../types/research.js';

/**
 * Rate limiter class to throttle requests and avoid being blocked
 */
class RateLimiter {
  private requestsPerMinute: number;
  private requests: Date[];

  constructor(requestsPerMinute: number = 30) {
    this.requestsPerMinute = requestsPerMinute;
    this.requests = [];
  }

  /**
   * Wait for rate limit availability before making request
   */
  async acquire(): Promise<void> {
    const now = new Date();
    
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(
      req => now.getTime() - req.getTime() < 60 * 1000
    );

    if (this.requests.length >= this.requestsPerMinute) {
      // Calculate wait time until we can make another request
      const oldestRequest = this.requests[0];
      if (oldestRequest) {
        const waitTime = 60 - (now.getTime() - oldestRequest.getTime()) / 1000;

        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
      }
    }

    this.requests.push(now);
  }

  /**
   * Get current rate limiter state
   */
  getState(): RateLimiterState {
    const now = new Date();
    const recentRequests = this.requests.filter(
      req => now.getTime() - req.getTime() < 60 * 1000
    );

    return {
      requestsPerMinute: this.requestsPerMinute,
      requests: recentRequests,
      lastRequest: this.requests[this.requests.length - 1] || undefined
    };
  }
}

/**
 * DuckDuckGo search engine implementation
 * Provides free web search without requiring API keys
 */
export class DuckDuckGoSearchEngine implements SearchEngine {
  public readonly name = 'DuckDuckGo';

  private static readonly BASE_URL = "https://html.duckduckgo.com/html";
  private static readonly HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  };

  private rateLimiter: RateLimiter;
  private static instance: DuckDuckGoSearchEngine;

  constructor() {
    this.rateLimiter = new RateLimiter(10); // Very conservative rate limit
  }

  // Singleton pattern to reuse the same instance
  static getInstance(): DuckDuckGoSearchEngine {
    if (!DuckDuckGoSearchEngine.instance) {
      DuckDuckGoSearchEngine.instance = new DuckDuckGoSearchEngine();
    }
    return DuckDuckGoSearchEngine.instance;
  }

  /**
   * Check if the search engine is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(DuckDuckGoSearchEngine.BASE_URL, {
        headers: DuckDuckGoSearchEngine.HEADERS,
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current rate limiter state
   */
  getRateLimit(): RateLimiterState {
    return this.rateLimiter.getState();
  }

  /**
   * Perform a web search using DuckDuckGo
   */
  async search(query: string, maxResults: number = 10): Promise<SearchResult[]> {

    try {
      // Apply rate limiting
      await this.rateLimiter.acquire();

      // Create form data for POST request (exact copy from working reference)
      const data = {
        q: query,
        b: "",
        kl: "",
      };

      const response = await axios.post(
        DuckDuckGoSearchEngine.BASE_URL,
        new URLSearchParams(data),
        {
          headers: DuckDuckGoSearchEngine.HEADERS,
          timeout: 30000
        }
      );


      // Parse HTML response (exact copy from working reference)
      const $ = cheerio.load(response.data);
      if (!$) {
        return [];
      }

      const results: SearchResult[] = [];
      $('.result').each((_, element) => {
        const titleElem = $(element).find('.result__title');
        if (!titleElem.length) return true;

        const linkElem = titleElem.find('a');
        if (!linkElem.length) return true;

        const title = linkElem.text().trim();
        let link = linkElem.attr('href') || "";

        // Skip ad results
        if (link.includes("y.js")) return true;

        // Clean up DuckDuckGo redirect URLs
        if (link.startsWith("//duckduckgo.com/l/?uddg=")) {
          try {
            const parts = link.split("uddg=");
            if (parts.length > 1 && parts[1]) {
              const urlPart = parts[1].split("&")[0];
              if (urlPart) {
                link = decodeURIComponent(urlPart);
              }
            }
          } catch (error) {
            // Skip if URL parsing failed
            return true;
          }
        }

        const snippetElem = $(element).find('.result__snippet');
        const snippet = snippetElem.length ? snippetElem.text().trim() : "";

        results.push({
          title,
          link,
          snippet,
          position: results.length + 1,
          relevanceScore: calculateRelevanceScore(title, snippet, query),
          source: 'duckduckgo',
          timestamp: new Date()
        });

        if (results.length >= maxResults) {
          return false; // Break out of the loop
        }

        return true;
      });


      return results;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Search request timed out. Please try again.');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before searching again.');
        } else {
          throw new Error(`Search failed: ${error.message}`);
        }
      } else {
        throw new Error(`Unexpected error during search: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }



  /**
   * Format search results for display
   */
  formatResults(results: SearchResult[]): string {
    if (!results.length) {
      return "No search results found. Try rephrasing your query or checking your internet connection.";
    }

    const output: string[] = [];
    output.push(`🔍 Found ${results.length} search results:\n`);

    results.forEach((result, index) => {
      output.push(`${index + 1}. ${result.title}`);
      output.push(`   🔗 ${result.link}`);
      if (result.snippet) {
        output.push(`   📝 ${result.snippet}`);
      }
      if (result.relevanceScore !== undefined) {
        output.push(`   📊 Relevance: ${Math.round(result.relevanceScore)}%`);
      }
      output.push(""); // Empty line between results
    });

    return output.join("\n");
  }

  /**
   * Generate Linux-specific search queries
   */
  generateLinuxQueries(originalQuery: string, searchType: SearchType): string[] {
    const queries: string[] = [];
    
    switch (searchType) {
      case 'linux_specific':
        queries.push(`${originalQuery} linux`);
        queries.push(`${originalQuery} ubuntu debian`);
        queries.push(`${originalQuery} terminal command`);
        break;
        
      case 'error_lookup':
        queries.push(`"${originalQuery}" linux error`);
        queries.push(`${originalQuery} fix solution`);
        queries.push(`${originalQuery} troubleshoot`);
        break;
        
      case 'documentation':
        queries.push(`${originalQuery} documentation manual`);
        queries.push(`${originalQuery} man page`);
        queries.push(`${originalQuery} official guide`);
        break;
        
      case 'forum_discussion':
        queries.push(`${originalQuery} askubuntu stackoverflow`);
        queries.push(`${originalQuery} reddit linux`);
        queries.push(`${originalQuery} forum discussion`);
        break;
        
      case 'troubleshooting':
        queries.push(`how to fix ${originalQuery}`);
        queries.push(`${originalQuery} not working solution`);
        queries.push(`${originalQuery} troubleshooting guide`);
        break;
        
      case 'command_usage':
        queries.push(`${originalQuery} command examples`);
        queries.push(`${originalQuery} usage syntax`);
        queries.push(`how to use ${originalQuery}`);
        break;
        
      default:
        queries.push(originalQuery);
    }
    
    return queries;
  }
}

/**
 * Google search engine implementation (scraping-based)
 * Provides additional search results to complement DuckDuckGo
 */
export class GoogleSearchEngine implements SearchEngine {
  public readonly name = 'Google';

  private static readonly BASE_URL = "https://www.google.com/search";
  private static readonly HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 LinuxHelper/1.1.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
  };

  private rateLimiter = new RateLimiter(20); // More conservative for Google

  async search(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    try {
      await this.rateLimiter.acquire();

      const params = new URLSearchParams({
        q: query,
        num: Math.min(maxResults, 20).toString(),
        hl: 'en',
        safe: 'off'
      });

      const response = await axios.get(`${GoogleSearchEngine.BASE_URL}?${params}`, {
        headers: GoogleSearchEngine.HEADERS,
        timeout: 15000,
        validateStatus: (status) => status < 500
      });

      if (response.status !== 200) {
        console.warn(`Google search returned status ${response.status}`);
        return [];
      }

      return this.parseGoogleResults(response.data, query);
    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  }

  private parseGoogleResults(html: string, query: string): SearchResult[] {
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    // Google uses different selectors for search results
    $('div.g, div[data-ved]').each((_index, element) => {
      const titleElem = $(element).find('h3');
      if (!titleElem.length) return true;

      const linkElem = $(element).find('a[href^="http"], a[href^="/url?"]').first();
      if (!linkElem.length) return true;

      let url = linkElem.attr('href');
      if (!url) return true;

      // Handle Google's redirect URLs
      if (url.startsWith('/url?')) {
        const urlParams = new URLSearchParams(url.substring(5));
        url = urlParams.get('url') || url;
      }

      const title = titleElem.text().trim();
      const snippet = $(element).find('span[data-ved], .VwiC3b, .s3v9rd').first().text().trim();

      if (title && url && !url.includes('google.com')) {
        results.push({
          title,
          link: url,
          snippet: snippet || '',
          position: results.length + 1,
          relevanceScore: this.calculateRelevance(title, snippet, query),
          source: 'google',
          timestamp: new Date()
        });
      }

      return results.length < 20; // Continue until we have enough results
    });

    return results.slice(0, 10); // Limit to requested number
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.head('https://www.google.com', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  getRateLimit(): RateLimiterState {
    return this.rateLimiter.getState();
  }

  private calculateRelevance(title: string, snippet: string, query: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const snippetLower = snippet.toLowerCase();

    let score = 0;

    // Base score for having content
    if (title && snippet) {
      score += 30;
    }

    // Query word matching
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 15;
      }
      if (snippetLower.includes(word)) {
        score += 10;
      }
    }

    // Linux-specific bonus
    const linuxTerms = ['linux', 'ubuntu', 'debian', 'mint', 'bash', 'shell', 'terminal', 'command'];
    for (const term of linuxTerms) {
      if (titleLower.includes(term) || snippetLower.includes(term)) {
        score += 10;
        break;
      }
    }

    // Technical content indicators
    const techIndicators = ['tutorial', 'guide', 'how-to', 'fix', 'solve', 'troubleshoot', 'solution'];
    for (const indicator of techIndicators) {
      if (titleLower.includes(indicator) || snippetLower.includes(indicator)) {
        score += 8;
      }
    }

    return Math.min(score, 100);
  }
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(title: string, snippet: string, query: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  const snippetLower = snippet.toLowerCase();

  let score = 0;

  // Base score for having content
  if (title && snippet) {
    score += 30;
  }

  // Query word matching
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
  for (const word of queryWords) {
    if (titleLower.includes(word)) {
      score += 15;
    }
    if (snippetLower.includes(word)) {
      score += 10;
    }
  }

  // Linux-specific bonus
  const linuxTerms = ['linux', 'ubuntu', 'debian', 'mint', 'bash', 'shell', 'terminal', 'command'];
  for (const term of linuxTerms) {
    if (titleLower.includes(term) || snippetLower.includes(term)) {
      score += 10;
      break;
    }
  }

  // Technical content indicators
  const techIndicators = ['tutorial', 'guide', 'how-to', 'fix', 'solve', 'troubleshoot', 'solution'];
  for (const indicator of techIndicators) {
    if (titleLower.includes(indicator) || snippetLower.includes(indicator)) {
      score += 8;
    }
  }

  return Math.min(score, 100);
}

/**
 * Multi-engine search function that combines results from multiple search engines
 */
// Real DuckDuckGo search with bot protection bypass
async function realDuckDuckGoSearch(query: string, maxResults: number = 10): Promise<SearchResult[]> {

  try {
    // Use a different approach to avoid bot detection
    // Method 1: Try the instant answer API first
    try {
      const instantUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

      const instantResponse = await axios.get(instantUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site"
        },
        timeout: 15000
      });


      if (instantResponse.data && instantResponse.data.RelatedTopics) {
        const results: SearchResult[] = [];

        // Process related topics
        instantResponse.data.RelatedTopics.slice(0, maxResults).forEach((topic: any, index: number) => {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
              link: topic.FirstURL,
              snippet: topic.Text,
              position: index + 1,
              relevanceScore: calculateRelevanceScore(topic.Text.split(' - ')[0] || topic.Text.substring(0, 100), topic.Text, query),
              source: 'duckduckgo',
              timestamp: new Date()
            });
          }
        });

        if (results.length > 0) {
          return results;
        }
      }
    } catch (instantError) {
      // Instant API failed, try HTML search instead
    }

    // Method 2: Try HTML search with better headers and timing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // Random delay

    const searchParams = new URLSearchParams({
      q: query,
      kl: 'us-en',
      s: '0',
      df: '',
      vqd: '',
      o: 'json',
      sp: '0'
    });

    const response = await axios.post(
      'https://html.duckduckgo.com/html',
      searchParams,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Content-Type": "application/x-www-form-urlencoded",
          "Origin": "https://duckduckgo.com",
          "Referer": "https://duckduckgo.com/",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-site",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "max-age=0"
        },
        timeout: 30000,
        maxRedirects: 5
      }
    );


    if (response.status === 200 && response.data.length > 20000) {
      // Parse the HTML response
      const $ = cheerio.load(response.data);
      const results: SearchResult[] = [];

      $('.result').each((_, element) => {
        if (results.length >= maxResults) return false;

        const titleElem = $(element).find('.result__title');
        if (!titleElem.length) return true;

        const linkElem = titleElem.find('a');
        if (!linkElem.length) return true;

        const title = linkElem.text().trim();
        let link = linkElem.attr('href') || "";

        if (!title || !link || link.includes("y.js")) return true;

        // Clean up DuckDuckGo redirect URLs
        if (link.startsWith("//duckduckgo.com/l/?uddg=")) {
          try {
            const parts = link.split("uddg=");
            if (parts.length > 1 && parts[1]) {
              const urlPart = parts[1].split("&")[0];
              if (urlPart) {
                link = decodeURIComponent(urlPart);
              }
            }
          } catch (error) {
            return true;
          }
        }

        const snippetElem = $(element).find('.result__snippet');
        const snippet = snippetElem.length ? snippetElem.text().trim() : "";

        results.push({
          title,
          link,
          snippet,
          position: results.length + 1,
          relevanceScore: calculateRelevanceScore(title, snippet, query),
          source: 'duckduckgo',
          timestamp: new Date()
        });

        return true;
      });

      return results;
    }

    return [];

  } catch (error) {
    console.error(`Real DuckDuckGo search error:`, error);
    return [];
  }
}

export async function searchMultipleEngines(
  query: string,
  maxResults: number = 10
): Promise<SearchResult[]> {

  // Use real DuckDuckGo search with bot protection bypass
  return await realDuckDuckGoSearch(query, maxResults);
}