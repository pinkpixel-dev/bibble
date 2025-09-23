// Intelligent Research Agent
// Agentic research loop with smart search strategies and context building

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import {
  ResearchAgent,
  ResearchSession,
  ResearchConfig,
  ResearchProgress,
  SearchQuery,
  SearchResult,
  SearchType,
  SearchStrategy,
  LinuxErrorPattern,
  ResearchContext
} from '../types/research.js';
import { searchMultipleEngines } from './search-engine.js';

// Placeholder for web search function - will be injected
declare global {
  var webSearch: ((query: string, numResults?: number) => Promise<Array<{
    url: string;
    title: string;
    snippet: string;
  }>>) | undefined;
}
import { WebContentExtractor } from './content-extractor.js';


/**
 * Default research configuration
 */
const DEFAULT_CONFIG: ResearchConfig = {
  maxSearches: 5,
  maxResultsPerSearch: 15, // Increased for more comprehensive results
  maxContentExtractions: 5, // Reduced to prevent context limit issues
  timeoutMs: 120000, // 2 minutes
  enableContentExtraction: true,
  enableFollowUpSearches: true,
  relevanceThreshold: 15, // Lowered further for more content extraction
  searchStrategies: [],
  minSearches: 1
};

/**
 * Linux-specific search patterns for intelligent query generation
 * TODO: Implement pattern-based search strategies in future versions
 */

/**
 * Common Linux error patterns for automatic detection
 */
const LINUX_ERROR_PATTERNS: LinuxErrorPattern[] = [
  {
    errorType: 'command_not_found',
    patterns: [/command not found/i, /No such file or directory/i],
    searchQueries: ['install {command} linux', '{command} package ubuntu debian'],
    commonSources: ['askubuntu.com', 'packages.ubuntu.com'],
    urgency: 'medium'
  },
  {
    errorType: 'permission_denied',
    patterns: [/permission denied/i, /access denied/i],
    searchQueries: ['permission denied linux fix', 'chmod chown linux'],
    commonSources: ['unix.stackexchange.com', 'askubuntu.com'],
    urgency: 'high'
  },
  {
    errorType: 'disk_space',
    patterns: [/no space left on device/i, /disk full/i],
    searchQueries: ['disk space linux cleanup', 'no space left device fix'],
    commonSources: ['askubuntu.com', 'linuxconfig.org'],
    urgency: 'critical'
  },
  {
    errorType: 'network_error',
    patterns: [/network unreachable/i, /connection refused/i, /timeout/i],
    searchQueries: ['network troubleshooting linux', 'connection refused fix'],
    commonSources: ['askubuntu.com', 'serverfault.com'],
    urgency: 'high'
  }
];

/**
 * Intelligent research agent implementation
 */
export class IntelligentResearchAgent extends EventEmitter implements ResearchAgent {
  private contentExtractor: WebContentExtractor;
  private activeSessions: Map<string, ResearchSession> = new Map();
  private progressCallbacks: Map<string, (progress: ResearchProgress) => void> = new Map();
  
  /**
   * Emit structured event for subscribers
   */
  private emitStructuredEvent(event: { type: 'progress' | 'done' | 'error'; percent: number; data: any; sessionId: string }): void {
    this.emit(event.type, event);
  }

  constructor() {
    super();
    this.contentExtractor = new WebContentExtractor();
  }

  /**
   * Start a new research session
   */
  async startResearch(
    query: string, 
    config: Partial<ResearchConfig> = {}
  ): Promise<ResearchSession> {
    const sessionId = uuidv4();
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    const session: ResearchSession = {
      id: sessionId,
      query,
      originalQuestion: query,
      startTime: new Date(),
      status: 'initializing',
      searches: [],
      extractedContent: [],
      totalResults: 0,
      relevantResults: 0
    };

    this.activeSessions.set(sessionId, session);
    
    // Start the research process asynchronously
    this.conductResearch(sessionId, finalConfig).catch(error => {
      console.error(`Research session ${sessionId} failed:`, error);
      session.status = 'failed';
      session.endTime = new Date();
    });

    return session;
  }

  /**
   * Get progress for a research session
   */
  getProgress(sessionId: string): ResearchProgress | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

      const totalSteps = 5; // Clean, Initialize, Search, Extract, Analyze
    let currentStep = 0;
    let stepName = 'Initializing';

    switch (session.status) {
      case 'cleaning':
        currentStep = 0;
        stepName = 'Cleaning query';
        break;
      case 'initializing':
        currentStep = 1;
        stepName = 'Initializing research session';
        break;
      case 'searching':
        // Show detailed search progress with actual config values
        const searchCount = session.searches.length;
        const maxSearches = 5; // Updated to match DEFAULT_CONFIG
        if (searchCount === 0) {
          stepName = 'Starting web search...';
          currentStep = 2;
        } else {
          stepName = `Performing search ${searchCount}/${maxSearches}...`;
          // Progressive step calculation based on search progress
          currentStep = 2 + (searchCount / maxSearches) * 0.8;
        }
        break;
      case 'extracting':
        currentStep = 3;
        stepName = 'Extracting content';
        break;
      case 'analyzing':
        currentStep = 4;
        stepName = 'Analyzing results';
        break;
      case 'completed':
      case 'failed':
        currentStep = 4;
        stepName = session.status === 'completed' ? 'Research completed' : 'Research failed';
        break;
    }

    const progress = Math.round((currentStep / totalSteps) * 100);

    return {
      sessionId,
      currentStep: stepName,
      progress,
      status: session.status,
      currentQuery: session.searches[session.searches.length - 1]?.query || undefined,
      resultsFound: session.totalResults,
      contentExtracted: session.extractedContent.length,
      estimatedTimeRemaining: this.estimateTimeRemaining(session)
    };
  }

  /**
   * Stop a research session
   */
  async stopResearch(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status !== 'completed' && session.status !== 'failed') {
      session.status = 'failed';
      session.endTime = new Date();
    }
  }

  /**
   * Get a specific research session
   */
  getSession(sessionId: string): ResearchSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all research sessions
   */
  getAllSessions(): ResearchSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Conduct the actual research process
   */
  private async conductResearch(sessionId: string, config: ResearchConfig): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      // --- Phase 0: Clean / normalise the query text ---
      session.status = 'cleaning';
      this.updateProgress(sessionId);

      const cleanedQuery = await this.cleanQuery(session.query);
      if (cleanedQuery && cleanedQuery !== session.query) {
        session.query = cleanedQuery;
      }
      // Phase 1: Initialize and analyze query
      session.status = 'initializing';
      this.updateProgress(sessionId);
      
      const searchStrategies = this.generateSearchStrategies(session.query);
      
      // Phase 2: Execute searches
      session.status = 'searching';
      this.updateProgress(sessionId);
      
      outer: for (const strategy of searchStrategies.slice(0, config.maxSearches)) {
        // Build list of query variants (primary + follow-ups)
        const allQueries: string[] = [...strategy.queryTemplates];
        if (config.enableFollowUpSearches && strategy.followUpQueries?.length) {
          allQueries.push(...strategy.followUpQueries);
        }

        let attempt = 0;
        for (const q of allQueries) {
          const searchQuery = await this.executeSearchWithQuery(session, strategy, q, config);
          attempt++;
          if (searchQuery) {
            session.searches.push(searchQuery);
            session.totalResults += searchQuery.resultCount;

            // Update progress after each search
            this.updateProgress(sessionId);
          }

          // Only allow early stopping after reaching minSearches
          const minSearches = Math.max(1, config.minSearches ?? 1);
          if (session.searches.length >= minSearches) {
            if (this.hasEnoughResults(session, config)) {
              break outer;
            }
          }

          // Guard against too many overall searches
          if (session.searches.length >= config.maxSearches) {
            break outer;
          }
        }
      }

      // Phase 3: Extract content from top results
      if (config.enableContentExtraction && session.totalResults > 0) {
        session.status = 'extracting';
        this.updateProgress(sessionId);
        
        await this.extractRelevantContent(session, config);
      }

      // Phase 4: Analyze and summarize
      session.status = 'analyzing';
      this.updateProgress(sessionId);
      
      session.contextSummary = this.generateContextSummary(session);
      session.relevantResults = this.countRelevantResults(session, config.relevanceThreshold);

      // Complete the session
      session.status = session.relevantResults > 0 ? 'completed' : 'insufficient_results';
      session.endTime = new Date();

      this.updateProgress(sessionId);

      // Emit final structured event
      const context = this.generateResearchContext(sessionId);
      const statusFlag: 'success' | 'limited' = session.status === 'completed' ? 'success' : 'limited';
      this.emitStructuredEvent({
        type: 'done',
        percent: 100,
        data: { context, status: statusFlag },
        sessionId
      });

    } catch (error) {
      session.status = 'failed';
      session.endTime = new Date();
      console.error(`Research failed for session ${sessionId}:`, error);
      // Emit error structured event
      this.emitStructuredEvent({
        type: 'error',
        percent: 100,
        data: { error: (error as Error).message },
        sessionId
      });
    }
  }

  /**
   * Generate search strategies based on the query
   */
  private generateSearchStrategies(query: string): SearchStrategy[] {
    const strategies: SearchStrategy[] = [];
    
    // Detect error patterns
    const detectedError = this.detectErrorPattern(query);
    if (detectedError) {
      strategies.push({
        name: `error_${detectedError.errorType}`,
        description: `Search for ${detectedError.errorType} solutions`,
        queryTemplates: detectedError.searchQueries,
        maxResults: 8,
        contentExtraction: true,
        followUpQueries: []
      });
    }

    // General search (use original query first) + smart follow-ups for people/biography queries
    const baseFollowUps: string[] = [];
    const qBare = query.replace(/["']/g, '').trim();
    const qQuoted = `"${qBare}"`;
    const words = qBare.split(/\s+/);
    const looksLikePerson = words.length >= 2 && words.length <= 5;
    if (looksLikePerson) {
      baseFollowUps.push(
        qQuoted,
        `${qBare} linkedin`,
        `${qBare} biography`,
        `${qBare} profile`,
        `${qBare} resume`,
        `${qBare} cv`,
        `${qBare} university`,
        `${qBare} publications`,
        `${qBare} news`,
      );
    } else {
      baseFollowUps.push(
        qQuoted,
        `${qBare} documentation`,
        `${qBare} overview`,
        `${qBare} examples`
      );
    }

    strategies.push({
      name: 'general',
      description: 'General web search',
      queryTemplates: [query],
      maxResults: 10,
      contentExtraction: true,
      followUpQueries: baseFollowUps
    });

    // Linux-specific search (only if query seems Linux-related)
    const isLinuxQuery = query.toLowerCase().includes('linux') ||
                        query.toLowerCase().includes('ubuntu') ||
                        query.toLowerCase().includes('debian') ||
                        query.toLowerCase().includes('command') ||
                        query.toLowerCase().includes('terminal') ||
                        query.toLowerCase().includes('bash');

    if (isLinuxQuery) {
      strategies.push({
        name: 'linux_general',
        description: 'Linux-specific search',
        queryTemplates: [`${query} linux`, `${query} ubuntu debian`],
        maxResults: 6,
        contentExtraction: true,
        followUpQueries: [`how to fix ${query}`, `${query} troubleshoot`, `${query} solution guide`]
      });

      // Documentation search (only for Linux queries)
      strategies.push({
        name: 'documentation',
        description: 'Official documentation search',
        queryTemplates: [`${query} documentation`, `${query} manual man page`],
        maxResults: 4,
        contentExtraction: true,
        followUpQueries: [`${query} tutorial`, `${query} examples`]
      });

      // Community and forum search
      strategies.push({
        name: 'community',
        description: 'Community and forum search',
        queryTemplates: [`${query} stackoverflow`, `${query} askubuntu forum`],
        maxResults: 4,
        contentExtraction: true,
        followUpQueries: [`${query} reddit linux`, `${query} unix stackexchange`]
      });
    }

    // Forum search (only for Linux-specific queries)
    if (query.toLowerCase().includes('linux') || query.toLowerCase().includes('ubuntu') || query.toLowerCase().includes('debian')) {
      strategies.push({
        name: 'forums',
        description: 'Community forum search',
        queryTemplates: [`${query} site:askubuntu.com`, `${query} site:unix.stackexchange.com`],
        maxResults: 4,
        contentExtraction: true,
        followUpQueries: []
      });
    }

    // People-focused strategy for biography/name queries
    if (looksLikePerson) {
      strategies.push({
        name: 'people_profile',
        description: 'People/profile focused search',
        queryTemplates: [
          `${qBare} site:linkedin.com`,
          `${qBare} site:zoominfo.com`,
          `${qBare} site:crunchbase.com`,
          `${qBare} biography`,
          `${qBare} profile`
        ],
        maxResults: 8,
        contentExtraction: true,
        followUpQueries: [
          `${qBare} site:university.edu`,
          `${qBare} site:github.com`,
          `${qBare} awards`,
          `${qBare} publications`
        ]
      });
    }

    return strategies;
  }

  /**
   * Execute a search using a specific strategy
   */
  private async executeSearchWithQuery(
    session: ResearchSession,
    strategy: SearchStrategy,
    explicitQuery: string,
    config: ResearchConfig
  ): Promise<SearchQuery | null> {
    try {
      const queryId = uuidv4();
      const searchQuery: SearchQuery = {
        id: queryId,
        query: explicitQuery || session.query,
        searchType: this.determineSearchType(strategy.name),
        timestamp: new Date(),
        results: [],
        resultCount: 0,
        strategy
      };

      // Execute the search using multiple engines, with fallback to native web search

      let results = await searchMultipleEngines(
        searchQuery.query,
        Math.min(strategy.maxResults, config.maxResultsPerSearch)
      );


      // If no results from custom engines, try native web search
      if (results.length === 0 && global.webSearch) {
        try {
          const webResults = await global.webSearch(searchQuery.query, Math.min(strategy.maxResults, config.maxResultsPerSearch));
          results = webResults.map((result, index) => ({
            title: result.title,
            link: result.url,
            snippet: result.snippet,
            position: index + 1,
            relevanceScore: this.calculateRelevanceScore(result, searchQuery.query), // Calculate actual relevance
            source: 'web-search' as any,
            timestamp: new Date()
          }));
        } catch (error) {
          console.error(`Native web search failed:`, error);
        }
      }

      searchQuery.results = results;
      searchQuery.resultCount = results.length;

      return searchQuery;

    } catch (error) {
      console.error(`Search failed for query "${explicitQuery}":`, error);
      return null;
    }
  }

  /**
   * Clean / normalise the user’s query. If an external AI-powered helper is available (e.g., global.enhanceQuery),
   * use it; otherwise, perform lightweight spell-checking heuristics.
   * Note: AI enhancement calls are automatically rate-limited by the provider (e.g., 4 second minimum for Pollinations)
   */
  private async cleanQuery(query: string): Promise<string> {
    try {
      // First try AI-powered query enhancement (automatically rate-limited)
      if (typeof (global as any).enhanceQuery === 'function') {
        const enhanced = await (global as any).enhanceQuery(query);
        if (typeof enhanced === 'string' && enhanced.trim() && enhanced !== query) {
          return enhanced.trim();
        }
      }

      // Fallback to legacy cleanQuery function
      if (typeof (global as any).cleanQuery === 'function') {
        const cleaned = await (global as any).cleanQuery(query);
        if (typeof cleaned === 'string' && cleaned.trim()) {
          return cleaned.trim();
        }
      }

      // If the host app provides an LLM-powered rewrite helper, use it.
      if (typeof (global as any).rewriteQuery === 'function') {
        try {
          const rewritten = await (global as any).rewriteQuery(query);
          if (typeof rewritten === 'string' && rewritten.trim()) {
            query = rewritten.trim();
          }
        } catch (e) {
          console.warn('rewriteQuery failed:', (e as Error).message);
        }
      }

      // As a final fallback just normalise whitespace
      try {
        // Dynamically import to avoid startup cost
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore – optional dependency
        const spell = await import('simple-spellchecker');
        const dictionary = await spell.getDictionary("en-US");
        const correctedWords = query.split(/\s+/).map(word => {
          const clean = word.replace(/[^A-Za-z]/g, '');
          if (clean && dictionary && dictionary.spellCheck && !dictionary.spellCheck(clean)) {
            const suggestions = dictionary.getSuggestions(clean, 1);
            if (suggestions && suggestions.length) {
              return word.replace(clean, suggestions[0]);
            }
          }
          return word;
        });
        query = correctedWords.join(' ');
      } catch (_err) {
        // Ignore if dictionary not available
      }

      // Final clean-up: collapse extra whitespace
      return query.replace(/\s{2,}/g, ' ').trim();
    } catch (err) {
      console.warn('cleanQuery failed, using original query');
      return query;
    }
  }

  /**
   * Extract content from the most relevant search results
   */
  private async extractRelevantContent(session: ResearchSession, config: ResearchConfig): Promise<void> {
    // Collect all URLs from search results
    const allUrls: string[] = [];
    
    for (const search of session.searches) {
      for (const result of search.results) {
        if (result.relevanceScore && result.relevanceScore >= config.relevanceThreshold) {
          allUrls.push(result.link);
        }
      }
    }

    // Prioritize URLs for Linux content
    const prioritizedUrls = this.contentExtractor.prioritizeUrls(allUrls);
    const urlsToExtract = prioritizedUrls.slice(0, config.maxContentExtractions);

    if (urlsToExtract.length > 0) {
      const extractedContent = await this.contentExtractor.extractMultiple(urlsToExtract);
      session.extractedContent = extractedContent.filter(content => content.success);

      // Log extraction failures for debugging
      const failures = extractedContent.filter(content => !content.success);
      if (failures.length > 0) {
        // Failures are tracked but not logged in production
      }
    }
  }

  /**
   * Generate a context summary from the research session
   */
  private generateContextSummary(session: ResearchSession): string {
    const summaryParts: string[] = [];
    
    summaryParts.push(`Research Summary for: "${session.query}"`);
    summaryParts.push(`Total searches: ${session.searches.length}`);
    summaryParts.push(`Total results: ${session.totalResults}`);
    summaryParts.push(`Content extracted: ${session.extractedContent.length} pages`);
    
    if (session.extractedContent.length > 0) {
      summaryParts.push('\nKey Sources:');
      session.extractedContent.forEach((content, index) => {
        if (content.success && content.wordCount > 50) {
          summaryParts.push(`${index + 1}. ${content.title} (${content.wordCount} words)`);
          summaryParts.push(`   ${content.url}`);
        }
      });
    }

    return summaryParts.join('\n');
  }

  /**
   * Helper methods
   */
  private detectErrorPattern(query: string): LinuxErrorPattern | null {
    for (const pattern of LINUX_ERROR_PATTERNS) {
      if (pattern.patterns.some(regex => regex.test(query))) {
        return pattern;
      }
    }
    return null;
  }

  private determineSearchType(strategyName: string): SearchType {
    if (strategyName.startsWith('error_')) return 'error_lookup';
    if (strategyName.includes('documentation')) return 'documentation';
    if (strategyName.includes('forum')) return 'forum_discussion';
    return 'linux_specific';
  }

  private hasEnoughResults(session: ResearchSession, config: ResearchConfig): boolean {
    const relevantCount = this.countRelevantResults(session, config.relevanceThreshold);
    const extractedCount = session.extractedContent.filter(c => c.success).length;

    // Consider we have enough results if:
    // 1. We have at least 2 relevant results AND 8+ total results, OR
    // 2. We have successfully extracted content from at least 2 pages, OR
    // 3. We have 5+ relevant results regardless of total
    return (relevantCount >= 2 && session.totalResults >= 8) ||
           extractedCount >= 2 ||
           relevantCount >= 5;
  }

  private countRelevantResults(session: ResearchSession, threshold: number): number {
    let count = 0;
    for (const search of session.searches) {
      for (const result of search.results) {
        if (result.relevanceScore && result.relevanceScore >= threshold) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Calculate relevance score for a search result based on query matching
   */
  private calculateRelevanceScore(result: any, query: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = (result.title || '').toLowerCase();
    const snippetLower = (result.snippet || '').toLowerCase();
    const urlLower = (result.url || '').toLowerCase();

    let score = 0;

    // Base score for having content
    if (result.title && result.snippet) {
      score += 30; // Increased base score
    }

    // Query word matching in title (high weight)
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 15;
      }
      if (snippetLower.includes(word)) {
        score += 10;
      }
      if (urlLower.includes(word)) {
        score += 5;
      }
    }

    // Linux-specific bonus
    const linuxTerms = ['linux', 'ubuntu', 'debian', 'bash', 'shell', 'terminal', 'command'];
    for (const term of linuxTerms) {
      if (titleLower.includes(term) || snippetLower.includes(term)) {
        score += 10;
        break; // Only add bonus once
      }
    }

    // Authoritative source bonus
    const authoritativeDomains = [
      'stackoverflow.com', 'askubuntu.com', 'unix.stackexchange.com',
      'linuxconfig.org', 'linuxcommand.org', 'tldp.org',
      'kernel.org', 'gnu.org', 'freedesktop.org',
      'ubuntu.com', 'debian.org', 'redhat.com',
      'digitalocean.com', 'linode.com', 'aws.amazon.com'
    ];

    for (const domain of authoritativeDomains) {
      if (urlLower.includes(domain)) {
        score += 20;
        break;
      }
    }

    // Technical content indicators
    const techIndicators = ['tutorial', 'guide', 'how-to', 'documentation', 'manual', 'fix', 'solve', 'troubleshoot'];
    for (const indicator of techIndicators) {
      if (titleLower.includes(indicator) || snippetLower.includes(indicator)) {
        score += 8;
      }
    }

    // Cap the score at 100
    const finalScore = Math.min(score, 100);
    return finalScore;
  }

  private estimateTimeRemaining(session: ResearchSession): number | undefined {
    const elapsed = Date.now() - session.startTime.getTime();
    const totalEstimate = 60000; // 1 minute estimate
    return Math.max(0, totalEstimate - elapsed);
  }

  private updateProgress(sessionId: string): void {
    const callback = this.progressCallbacks.get(sessionId);
    if (callback) {
      const progress = this.getProgress(sessionId);
      if (progress) {
        callback(progress);
      }
      // Emit progress structured event
      if (progress) {
        this.emitStructuredEvent({
          type: 'progress',
          percent: progress.progress,
          data: progress,
          sessionId
        });
      }
    }
  }

  /**
   * Register a progress callback for UI updates
   */
  onProgress(sessionId: string, callback: (progress: ResearchProgress) => void): void {
    this.progressCallbacks.set(sessionId, callback);
  }

  /**
   * Generate research context for AI integration
   */
  generateResearchContext(sessionId: string): ResearchContext | null {
    const DEBUG = Boolean(process.env['LINUX_HELPER_DEBUG'] || (process.env['DEBUG'] && process.env['DEBUG']!.includes('linux-helper')));
    const session = this.activeSessions.get(sessionId);

    // Enhanced logging for debugging
    if (DEBUG) console.error(`[RESEARCH_AGENT] generateResearchContext called for session: ${sessionId}`);
    if (DEBUG) console.error(`[RESEARCH_AGENT] Session found: ${!!session}`);
    if (DEBUG) console.error(`[RESEARCH_AGENT] Session status: ${session?.status}`);
    if (DEBUG) console.error(`[RESEARCH_AGENT] Session searches: ${session?.searches?.length}`);
    if (DEBUG) console.error(`[RESEARCH_AGENT] Session results: ${session?.totalResults}`);
    if (DEBUG) console.error(`[RESEARCH_AGENT] Session extracted: ${session?.extractedContent?.length}`);

    if (!session) {
      console.error(`[RESEARCH_AGENT] No session found for ID: ${sessionId}`);
      return null;
    }

    // More lenient status check - allow any session that has results
    if (!['completed', 'insufficient_results', 'failed'].includes(session.status) && session.totalResults === 0) {
      if (DEBUG) console.error(`[RESEARCH_AGENT] Session ${sessionId} not ready - status: ${session.status}, results: ${session.totalResults}`);
      return null;
    }

    // If session has results but status isn't completed yet, still generate context
    if (session.totalResults > 0 || session.extractedContent.length > 0) {
      if (DEBUG) console.error(`[RESEARCH_AGENT] Generating context for session with ${session.totalResults} results and ${session.extractedContent.length} extracted content`);
    } else {
      console.warn(`[RESEARCH_AGENT] Session ${sessionId} has no results or extracted content`);
      return null;
    }

    // Combine extracted content AND search results for comprehensive context
    let relevantContent = '';
    let sources: string[] = [];

    // First, add extracted content (highest quality)
    const extractedContent = session.extractedContent
      .filter(content => content.success && content.wordCount > 100)
      .map(content => `EXTRACTED CONTENT:\n${content.title}\n${content.content.substring(0, 20000)}...`)
      .join('\n\n---\n\n');

    if (extractedContent) {
      relevantContent += extractedContent;
      sources.push(...session.extractedContent
        .filter(content => content.success)
        .map(content => content.url));
    }

    // Then, add search results for broader context (even if we have extracted content)
    const allResults = session.searches.flatMap(search => search.results);
    const topResults = allResults
      .filter(result => result.relevanceScore && result.relevanceScore >= 10)
      .slice(0, 20) // include even more results for richer context
      .map((result: SearchResult) => `SEARCH RESULT:\n${result.title}\n${result.snippet}\nSource: ${result.link}\nRelevance: ${result.relevanceScore}%`)
      .join('\n\n---\n\n');

    if (topResults) {
      if (relevantContent) {
        relevantContent += '\n\n=== ADDITIONAL SEARCH RESULTS ===\n\n' + topResults;
      } else {
        relevantContent = topResults;
      }

      // Add unique sources from search results
      const searchSources = allResults.slice(0, 8).map((result: SearchResult) => result.link);
      sources.push(...searchSources.filter(source => !sources.includes(source)));
    }

    const confidence = Math.min(100, (session.relevantResults / 5) * 100);


    return {
      sessionId,
      query: session.query,
      relevantContent,
      sources,
      confidence,
      lastUpdated: session.endTime || new Date()
    };
  }

  /**
   * Get the most recent research context from any completed session
   */
  getMostRecentContext(): ResearchContext | null {
    
    let mostRecentSession: ResearchSession | null = null;
    let mostRecentTime = 0;

    for (const session of this.activeSessions.values()) {
      
      if (['completed', 'insufficient_results'].includes(session.status) && session.endTime) {
        const sessionTime = session.endTime.getTime();
        if (sessionTime > mostRecentTime) {
          mostRecentTime = sessionTime;
          mostRecentSession = session;
        }
      }
    }

    if (mostRecentSession) {
      return this.generateResearchContext(mostRecentSession.id);
    }

    return null;
  }
}
