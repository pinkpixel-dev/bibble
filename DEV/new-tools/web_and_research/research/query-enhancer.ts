// AI-Powered Query Enhancement
// Intelligently rewrites and enhances search queries using AI

import { AIProvider } from '../providers/base.js';
import { Message } from '../types/index.js';

/**
 * Configuration for query enhancement
 */
export interface QueryEnhancementConfig {
  maxRetries: number;
  timeoutMs: number;
  enableSpellCorrection: boolean;
  enableContextExpansion: boolean;
  enableLinuxSpecialization: boolean;
}

/**
 * Default configuration for query enhancement
 */
const DEFAULT_CONFIG: QueryEnhancementConfig = {
  maxRetries: 2,
  timeoutMs: 10000,
  enableSpellCorrection: true,
  enableContextExpansion: true,
  enableLinuxSpecialization: true,
};

/**
 * AI-powered query enhancement service
 */
export class QueryEnhancer {
  private aiProvider: AIProvider | null = null;
  private config: QueryEnhancementConfig;

  constructor(config: Partial<QueryEnhancementConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the AI provider to use for query enhancement
   */
  setAIProvider(provider: AIProvider): void {
    this.aiProvider = provider;
  }

  /**
   * Enhance a search query using AI
   */
  async enhanceQuery(originalQuery: string): Promise<string> {
    if (!this.aiProvider) {
      console.warn('[QueryEnhancer] No AI provider available, returning original query');
      return originalQuery;
    }

    if (!originalQuery || originalQuery.trim().length === 0) {
      return originalQuery;
    }

    try {
      const enhancedQuery = await this.performAIEnhancement(originalQuery);
      
      // Validate the enhanced query
      if (this.isValidEnhancement(originalQuery, enhancedQuery)) {
        return enhancedQuery;
      } else {
        console.warn('[QueryEnhancer] AI enhancement produced invalid result, using original query');
        return originalQuery;
      }
    } catch (error) {
      console.error('[QueryEnhancer] Failed to enhance query:', error);
      return originalQuery;
    }
  }

  /**
   * Perform AI-powered query enhancement
   * Note: Rate limiting is automatically enforced by the AI provider (e.g., 4 second minimum for Pollinations)
   */
  private async performAIEnhancement(query: string): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(query);

    const messages: Message[] = [
      {
        id: 'system',
        role: 'system',
        content: systemPrompt,
        timestamp: new Date(),
      },
      {
        id: 'user',
        role: 'user',
        content: userPrompt,
        timestamp: new Date(),
      },
    ];

    // This call is automatically rate-limited by the provider
    const response = await this.aiProvider!.generateResponse(messages);
    return this.extractEnhancedQuery(response);
  }

  /**
   * Build the system prompt for query enhancement
   */
  private buildSystemPrompt(): string {
    let prompt = `You are an expert search query optimizer for general web search. Your job is to take user queries and enhance them for optimal web search results on any topic.

CORE RESPONSIBILITIES:
1. Fix spelling errors and typos (e.g., "b3st" → "best", "mak3" → "make", "sp1nner" → "spinner")
2. Expand abbreviations and technical terms when helpful
3. Add relevant context when it improves search results
4. Optimize for search engine effectiveness
5. Maintain the user's original intent

ENHANCEMENT GUIDELINES:`;

    if (this.config.enableSpellCorrection) {
      prompt += `
- Fix obvious typos and l33t speak (3→e, 1→i, etc.)
- Correct common misspellings`;
    }

    if (this.config.enableContextExpansion) {
      prompt += `
- Add relevant technical context (e.g., "bash spinner" → "bash script spinner loading animation")
- Include common synonyms for better search coverage`;
    }

    if (this.config.enableLinuxSpecialization) {
      prompt += `
- Add Linux-specific terms when relevant (Ubuntu, Debian, bash, shell, etc.)
- Include common command names and technical terms`;
    }

    prompt += `

OUTPUT FORMAT:
- Return ONLY the enhanced query
- No explanations, quotes, or additional text
- Keep it concise and focused on search effectiveness
- Maximum 12 words unless absolutely necessary
- Remove politeness words like "please", "comprehensive", "detailed"
- Focus on technical keywords and search terms

EXAMPLES:
Input: "how to mak3 sp1nner bash?"
Output: create spinner loading animation bash script

Input: "fix perm1ssion err0r"
Output: fix permission denied error linux chmod chown

Input: "docker not work1ng"
Output: docker not working troubleshoot linux container

Input: "how to create spinners in bash scripting a comprehensive guide please"
Output: bash spinner script loading animation tutorial

Input: "h0w do i fix chrome network reset in google chrome on linux mint cinnamon?"
Output: fix chrome network reset linux mint cinnamon`;

    return prompt;
  }

  /**
   * Build the user prompt with the query to enhance
   */
  private buildUserPrompt(query: string): string {
    return `Enhance this search query for optimal web search results:

"${query}"

Remember: Return ONLY the enhanced query, no explanations.`;
  }

  /**
   * Extract the enhanced query from AI response
   */
  private extractEnhancedQuery(response: string): string {
    // Clean up the response
    let enhanced = response.trim();
    
    // Remove common AI response patterns
    enhanced = enhanced.replace(/^(Enhanced query:|Query:|Output:)\s*/i, '');
    enhanced = enhanced.replace(/^["']|["']$/g, ''); // Remove quotes
    enhanced = enhanced.split('\n')[0] || enhanced; // Take only first line
    
    return enhanced.trim();
  }

  /**
   * Validate that the enhanced query is reasonable
   */
  private isValidEnhancement(original: string, enhanced: string): boolean {
    // Basic validation checks
    if (!enhanced || enhanced.length === 0) {
      return false;
    }

    // Don't allow queries that are too long
    if (enhanced.length > 200) {
      return false;
    }

    // Don't allow queries that are completely different (too aggressive)
    const originalWords = original.toLowerCase().split(/\s+/);
    const enhancedWords = enhanced.toLowerCase().split(/\s+/);
    
    // Check if at least some original words are preserved (allowing for typo fixes)
    const preservedWords = originalWords.filter(word => {
      return enhancedWords.some(enhancedWord => 
        enhancedWord.includes(word) || 
        word.includes(enhancedWord) ||
        this.areSimilarWords(word, enhancedWord)
      );
    });

    // At least 30% of original words should be preserved in some form
    const preservationRatio = preservedWords.length / originalWords.length;
    if (preservationRatio < 0.3) {
      console.warn(`[QueryEnhancer] Enhancement too aggressive: ${preservationRatio * 100}% preservation`);
      return false;
    }

    return true;
  }

  /**
   * Check if two words are similar (for typo detection)
   */
  private areSimilarWords(word1: string, word2: string): boolean {
    // Simple similarity check for common typos
    const commonReplacements = [
      ['3', 'e'], ['1', 'i'], ['0', 'o'], ['4', 'a'], ['5', 's'],
      ['@', 'a'], ['$', 's'], ['!', 'i']
    ];

    let normalized1 = word1.toLowerCase();
    let normalized2 = word2.toLowerCase();

    // Apply common l33t speak replacements
    for (const [leet, normal] of commonReplacements) {
      if (leet && normal) {
        normalized1 = normalized1.replace(new RegExp(leet, 'g'), normal);
        normalized2 = normalized2.replace(new RegExp(leet, 'g'), normal);
      }
    }

    return normalized1 === normalized2;
  }
}

/**
 * Global instance for easy access
 */
let globalQueryEnhancer: QueryEnhancer | null = null;

/**
 * Initialize the global query enhancer with an AI provider
 */
export function initializeQueryEnhancer(aiProvider: AIProvider, config?: Partial<QueryEnhancementConfig>): void {
  globalQueryEnhancer = new QueryEnhancer(config);
  globalQueryEnhancer.setAIProvider(aiProvider);
  
  // Inject into global scope for research agent
  (global as any).enhanceQuery = async (query: string) => {
    if (!globalQueryEnhancer) {
      return query;
    }
    return await globalQueryEnhancer.enhanceQuery(query);
  };

  // Query enhancer initialized successfully
}

/**
 * Standalone function for enhancing queries (used by global injection)
 */
export async function enhanceSearchQuery(query: string): Promise<string> {
  if (!globalQueryEnhancer) {
    console.warn('[QueryEnhancer] Not initialized, returning original query');
    return query;
  }
  
  return await globalQueryEnhancer.enhanceQuery(query);
}

/**
 * Get the current query enhancer instance
 */
export function getQueryEnhancer(): QueryEnhancer | null {
  return globalQueryEnhancer;
}
