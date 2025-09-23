// Web Search Tool

import { IntelligentResearchAgent } from '../research/research-agent.js';
import { ResearchConfig } from '../types/research.js';

/**
 * OpenAI function definition for web search
 */
export const webSearchTool = {
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Search the web for current information on any topic. You have FULL AUTONOMY to call this function whenever helpful. ESPECIALLY important for Linux troubleshooting: hardware issues, software conflicts, distribution-specific problems, driver issues, recent bugs, compatibility problems. Call this function to: get current solutions, find recent forum discussions, check for known issues, research hardware compatibility, or enhance responses with up-to-date troubleshooting information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query. Be specific and use clear keywords. Examples: "Linux Mint Cinnamon network issues", "Tyler Doering athlete profile", "latest Docker security updates"'
        },
        max_searches: {
          type: 'number',
          description: 'Maximum number of different search queries to perform (1-5). Use 3 for most searches.',
          minimum: 1,
          maximum: 5,
          default: 3
        },
        max_results_per_search: {
          type: 'number',
          description: 'Maximum results to get per search query (5-20). Use 10 for most searches.',
          minimum: 5,
          maximum: 20,
          default: 10
        },
        extract_content: {
          type: 'boolean',
          description: 'Whether to extract full content from the most relevant pages. Use true for detailed research.',
          default: true
        }
      },
      required: ['query', 'max_searches', 'max_results_per_search', 'extract_content'],
      additionalProperties: false
    },
    strict: true
  }
};

/**
 * Execute web search function
 */
export async function executeWebSearch(
  args: {
    query: string;
    max_searches?: number;
    max_results_per_search?: number;
    extract_content?: boolean;
  },
  researchAgent: IntelligentResearchAgent
): Promise<string> {
  try {
    console.log(`[WEB_SEARCH_TOOL] Executing search for: "${args.query}"`);
    console.log(`[WEB_SEARCH_TOOL] Config:`, {
      max_searches: args.max_searches || 3,
      max_results_per_search: args.max_results_per_search || 10,
      extract_content: args.extract_content !== false
    });

    // Configure research based on function arguments - allow AI control
    const maxSearches = Math.min(args.max_searches || 3, 5); // Allow up to 5 searches
    const config: Partial<ResearchConfig> = {
      maxSearches: maxSearches,
      maxResultsPerSearch: Math.min(args.max_results_per_search || 10, 15), // Allow more results
      maxContentExtractions: args.extract_content !== false ? 8 : 0, // Allow more extractions
      enableContentExtraction: args.extract_content !== false,
      enableFollowUpSearches: maxSearches > 1, // Enable follow-up if multiple searches
      relevanceThreshold: 15, // Lower threshold for more results
      timeoutMs: 60000 // 60 second timeout for multiple searches
    };

    // Start research session
    const session = await researchAgent.startResearch(args.query, config);
    
    // Wait for completion with longer timeout for multiple searches
    const maxWaitTime = 90000; // 90 seconds for multiple searches
    const startTime = Date.now();

    while (session.status !== 'completed' && session.status !== 'failed' && session.status !== 'insufficient_results') {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Search timeout - research took too long');
      }

      // Wait 250ms before checking again (faster polling)
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    // Generate research context
    const context = researchAgent.generateResearchContext(session.id);
    
    if (!context || !context.relevantContent) {
      return `Search completed but no relevant results found for "${args.query}". Try a different search query or check if the topic exists.`;
    }

    // Format results for AI consumption
    const searchSummary = `
WEB SEARCH RESULTS for "${args.query}":

RESEARCH SUMMARY:
- Searches performed: ${session.searches.length}
- Total results found: ${session.totalResults}
- Pages extracted: ${session.extractedContent.length}
- Confidence: ${context.confidence}%

RELEVANT CONTENT:
${context.relevantContent}

SOURCES:
${context.sources.slice(0, 10).join('\n')}

This information is current as of ${new Date().toISOString()}.
`;

    console.log(`[WEB_SEARCH_TOOL] Search completed successfully. Context length: ${searchSummary.length}`);
    return searchSummary;

  } catch (error) {
    console.error(`[WEB_SEARCH_TOOL] Search failed:`, error);
    return `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with a different query.`;
  }
}

/**
 * Get all available tools for function calling
 */
export async function getAvailableTools() {
  try {
    // Lazy load tools to avoid circular imports
    const { bibbleTools } = await import('./tools/built-in/index.js');

    // Provide a richer, task-focused toolbox so the model "knows" it can act
    const allowed = [
      // Filesystem
      'list_directory', 'read_file', 'write_file', 'create_directory', 'move_file', 'get_file_info', 'search_files',
      // Terminal / Process
      'start_process', 'interact_with_process', 'read_process_output', 'list_sessions', 'force_terminate',
      'list_processes', 'kill_process',
      // Editing
      'edit_block', 'search_code',
      // Config
      'get_config', 'set_config_value'
    ];
    const essentialTools = bibbleTools.filter(tool => allowed.includes(tool.function.name));

    return [webSearchTool, ...essentialTools];
  } catch (error) {
    console.error('[TOOLS] Failed to load Desktop Commander tools:', error);
    // Fallback to just web search if Desktop Commander tools fail to load
    return [webSearchTool];
  }
}
