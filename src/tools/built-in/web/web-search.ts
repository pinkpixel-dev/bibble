/**
 * Web Search Built-in Tool for Bibble
 * Implements the BuiltInTool interface for comprehensive web research
 */

import { z } from 'zod';
import { BuiltInTool } from '../../../ui/tool-display.js';
import type { Engine, ResearchOptions } from '../../../research/research-pipeline.js';
import { research } from '../../../research/research-pipeline.js';
import { llm } from '../../../llm/adapter.js';
import {
  WebSearchConfigSchema,
  WebSearchConfig
} from './types/index.js';
import { EnhancedResearchAgent } from './research/research-agent.js';
import { runMultiSearch, searchMultipleEngines, getSearchEngineConfig } from './research/search-engine.js';

// Global research agent instance
let globalResearchAgent: EnhancedResearchAgent | null = null;

/**
 * Get or create the global research agent
 */
function getResearchAgent(): EnhancedResearchAgent {
  if (!globalResearchAgent) {
    globalResearchAgent = new EnhancedResearchAgent();
  }
  return globalResearchAgent;
}

function mapLegacyEngine(engine: 'duckduckgo' | 'bing' | 'google' | 'brave'): Engine {
  if (engine === 'duckduckgo') return 'ddg';
  return engine;
}

/**
 * Execute web search function implementation
 */
async function executeWebSearch(params: WebSearchConfig): Promise<any> {
  const researchAgent = getResearchAgent();
  let tracker: ReturnType<EnhancedResearchAgent['beginSession']> | null = null;

  try {
    const legacyEngine = params.preferredEngine ? mapLegacyEngine(params.preferredEngine) : undefined;
    const engine: Engine | undefined = (params.engine ?? legacyEngine) as Engine | undefined;

    const pipelineOptions = {
      depth: params.depth,
      mode: params.mode,
      format: params.format,
      engine,
      engineOrder: params.engine_order as Engine[] | undefined,
      includeDomains: params.allowed_domains,
      excludeDomains: params.blocked_domains,
      dedupeByHost: params.dedupe_by_host,
      maxConcurrency: params.max_concurrency,
      minUsefulChars: params.min_useful_chars,
      maxPerSourceChars: params.max_per_source_chars,
      writeFile: params.write_file ? { path: params.write_file.path } : false,
      languageHint: params.language,
      searchProvider: runMultiSearch
    } satisfies Partial<ResearchOptions>;

    tracker = researchAgent.beginSession(params.query, pipelineOptions);

    const artifact = await research(params.query, llm, {
      ...pipelineOptions,
      onProgress: tracker.onProgress
    });

    tracker.complete(artifact);

    return {
      success: true,
      data: {
        query: params.query,
        mode: artifact.mode,
        format: artifact.format,
        content: artifact.content,
        sourcesAnalyzed: artifact.sourcesAnalyzed,
        references: artifact.references,
        summaries: artifact.summaries
      },
      message: `Produced a ${artifact.mode} research artifact with ${artifact.sourcesAnalyzed} sourced references.`
    };

  } catch (error) {
    if (tracker) {
      tracker.fail(error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error'));
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      success: false,
      error: `Web search failed: ${errorMessage}. Please try again with a different query or adjust the parameters.`,
      data: {
        query: params.query,
        error: errorMessage
      }
    };
  }
}

/**
 * Web Search Built-in Tool Definition
 */
export const webSearchTool: BuiltInTool = {
  name: 'web_search',
  description: 'Search the web for comprehensive information on any topic. Supports general research, technical troubleshooting (Windows/Linux), people/biography searches, and more. Automatically extracts content from relevant pages and provides detailed context.',
  category: 'web',
  parameters: WebSearchConfigSchema,
  async execute(params: WebSearchConfig): Promise<any> {
    return await executeWebSearch(params);
  }
};

/**
 * Quick Search Tool (simplified version)
 */
export const quickWebSearchTool: BuiltInTool = {
  name: 'quick_web_search',
  description: 'Perform a quick web search for immediate answers. Faster than full web_search but with less detail.',
  category: 'web',
  parameters: z.object({
    query: z.string().min(1, 'Search query is required'),
    numResults: z.number().min(1).max(20).default(5),
    preferredEngine: z.enum(['duckduckgo', 'bing', 'google', 'brave']).optional()
  }).strict(),
  async execute(params: { query: string; numResults?: number; preferredEngine?: 'duckduckgo' | 'bing' | 'google' | 'brave' }): Promise<any> {
    try {
      const searchEngineConfig = getSearchEngineConfig();
      const results = await searchMultipleEngines(
        params.query,
        params.numResults || 5,
        {
          ...searchEngineConfig,
          ...(params.preferredEngine ? { preferredEngine: params.preferredEngine } : {})
        }
      );

      if (results.length === 0) {
        return {
          success: false,
          error: `No search results found for "${params.query}". Try a different query.`,
          data: { query: params.query, resultsCount: 0 }
        };
      }

      const formattedResults = results.map((result, index) => 
        `${index + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.link} (${result.source})`
      ).join('\n\n');

      const summary = `QUICK WEB SEARCH RESULTS for "${params.query}":

${formattedResults}

Search completed at ${new Date().toISOString()}`;

      return {
        success: true,
        data: {
          query: params.query,
          resultsCount: results.length,
          results: results,
          summary: summary
        },
        message: `Found ${results.length} results for "${params.query}"`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Quick web search failed: ${errorMessage}`,
        data: { query: params.query, error: errorMessage }
      };
    }
  }
};

/**
 * Research Status Tool (check ongoing research)
 */
export const researchStatusTool: BuiltInTool = {
  name: 'research_status',
  description: 'Check the status of ongoing research sessions or get the most recent research results.',
  category: 'web',
  parameters: z.object({
    sessionId: z.string().optional(),
    getMostRecent: z.boolean().default(false)
  }).strict(),
  async execute(params: { sessionId?: string; getMostRecent?: boolean }): Promise<any> {
    try {
      const researchAgent = getResearchAgent();
      
      if (params.getMostRecent) {
        const context = researchAgent.getMostRecentContext();
        if (!context) {
          return {
            success: false,
            error: 'No recent research sessions found',
            data: { hasRecentResults: false }
          };
        }
        
        return {
          success: true,
          data: {
            sessionId: context.sessionId,
            query: context.query,
            confidence: context.confidence,
            sourcesCount: context.sources.length,
            lastUpdated: context.lastUpdated,
            hasResults: true,
            relevantContent: context.relevantContent.substring(0, 500) + '...'
          },
          message: `Most recent research: "${context.query}" (${context.confidence}% confidence)`
        };
      }
      
      if (params.sessionId) {
        const session = researchAgent.getSession(params.sessionId);
        const progress = researchAgent.getProgress(params.sessionId);
        
        if (!session) {
          return {
            success: false,
            error: `Research session ${params.sessionId} not found`,
            data: { sessionId: params.sessionId }
          };
        }
        
        return {
          success: true,
          data: {
            sessionId: session.id,
            query: session.query,
            status: session.status,
            progress: progress,
            searchesPerformed: session.searches.length,
            totalResults: session.totalResults,
            startTime: session.startTime,
            endTime: session.endTime
          },
          message: `Research session ${params.sessionId}: ${session.status}`
        };
      }
      
      // List all active sessions
      const allSessions = researchAgent.getAllSessions();
      const activeSessions = allSessions.filter(s => 
        s.status !== 'completed' && s.status !== 'failed'
      );
      
      return {
        success: true,
        data: {
          totalSessions: allSessions.length,
          activeSessions: activeSessions.length,
          completedSessions: allSessions.filter(s => s.status === 'completed').length,
          sessions: allSessions.map(s => ({
            id: s.id,
            query: s.query,
            status: s.status,
            startTime: s.startTime,
            totalResults: s.totalResults
          }))
        },
        message: `Found ${allSessions.length} research sessions (${activeSessions.length} active)`
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to get research status: ${errorMessage}`,
        data: { error: errorMessage }
      };
    }
  }
};
