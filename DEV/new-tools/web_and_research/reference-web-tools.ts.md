/**
 * Web Tools for Linux-Helper
 * Advanced web search using intelligent research agent
 */

import { ClaudeCodeTool } from './index.js';
import { WebFetchInput, WebSearchInput } from './schemas.js';
import { IntelligentResearchAgent } from '../research/research-agent.js';
import { ResearchConfig } from '../types/research.js';

// Global research agent instance
let researchAgent: IntelligentResearchAgent;

/**
 * Get or create research agent instance
 */
function getResearchAgent(): IntelligentResearchAgent {
  if (!researchAgent) {
    researchAgent = new IntelligentResearchAgent();
  }
  return researchAgent;
}

/**
 * Web Search Tool - Advanced intelligent web search using research agent
 */
export const webSearchTool: ClaudeCodeTool = {
  name: 'WebSearch',
  
  async description(): Promise<string> {
    return 'Intelligent web search using advanced research agent. Performs multi-strategy searches, content extraction, and comprehensive result analysis. Supports domain filtering and configurable search depth.';
  },

  userFacingName(input?: WebSearchInput): string {
    return input?.query ? `Intelligent Web Search: "${input.query}"` : 'Intelligent Web Search';
  },

  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to use'
      },
      allowed_domains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Only include search results from these domains',
        optional: true
      },
      blocked_domains: {
        type: 'array', 
        items: { type: 'string' },
        description: 'Never include search results from these domains',
        optional: true
      },
      max_searches: {
        type: 'number',
        description: 'Maximum number of searches to perform (default: 3)',
        optional: true
      },
      max_results: {
        type: 'number',
        description: 'Maximum results per search (default: 10)',
        optional: true
      },
      extract_content: {
        type: 'boolean',
        description: 'Enable content extraction from web pages (default: false)',
        optional: true
      }
    },
    required: ['query']
  },

  async execute(input: WebSearchInput): Promise<string> {
    try {
      const { query, allowed_domains, blocked_domains, max_searches, max_results, extract_content } = input;
      
      if (!query || query.trim().length === 0) {
        return '❌ Search query cannot be empty';
      }

      let output = `🔍 **Intelligent Web Search Results for "${query}"**\n\n`;
      
      // Show search configuration
      const searchConfig = {
        'Max Searches': max_searches || 3,
        'Max Results per Search': max_results || 10,
        'Content Extraction': extract_content ? 'Enabled' : 'Disabled',
        'Domain Filtering': (allowed_domains || blocked_domains) ? 'Active' : 'None'
      };
      
      output += `**🔧 Search Configuration:**\n`;
      Object.entries(searchConfig).forEach(([key, value]) => {
        output += `• ${key}: ${value}\n`;
      });
      
      if (allowed_domains && allowed_domains.length > 0) {
        output += `• Allowed domains: ${allowed_domains.join(', ')}\n`;
      }
      if (blocked_domains && blocked_domains.length > 0) {
        output += `• Blocked domains: ${blocked_domains.join(', ')}\n`;
      }
      output += '\n';

      try {
        // Configure research agent
        const agent = getResearchAgent();
        
        const researchConfig: Partial<ResearchConfig> = {
          maxSearches: max_searches || 3,
          maxResultsPerSearch: max_results || 10,
          maxContentExtractions: extract_content ? 3 : 0,
          enableContentExtraction: Boolean(extract_content),
          enableFollowUpSearches: true,
          timeoutMs: 60000, // 1 minute timeout
          relevanceThreshold: 15,
          minSearches: 1
        };
        
        output += `**🚀 Starting research session...**\n\n`;
        
        // Start research session
        const session = await agent.startResearch(query, researchConfig);
        
        // Wait for research to complete
        let isComplete = false;
        let attempts = 0;
        const maxAttempts = 120; // 2 minutes maximum wait
        
        while (!isComplete && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          attempts++;
          
          const currentSession = agent.getSession(session.id);
          if (!currentSession) {
            break;
          }
          
          const progress = agent.getProgress(session.id);
          if (progress && attempts % 5 === 0) { // Update every 5 seconds
            output += `**📊 Progress:** ${progress.currentStep} (${progress.progress}%)\n`;
            if (progress.currentQuery) {
              output += `**🔎 Current Query:** "${progress.currentQuery}"\n`;
            }
            output += `**📈 Results Found:** ${progress.resultsFound}\n\n`;
          }
          
          if (['completed', 'failed', 'insufficient_results'].includes(currentSession.status)) {
            isComplete = true;
          }
        }
        
        // Get final results
        const finalSession = agent.getSession(session.id);
        if (!finalSession) {
          return `❌ Research session lost. This is likely due to a system error.`;
        }
        
        output += `**✅ Research completed!**\n\n`;
        output += `**📊 Final Statistics:**\n`;
        output += `• Total searches performed: ${finalSession.searches.length}\n`;
        output += `• Total results found: ${finalSession.totalResults}\n`;
        output += `• Relevant results: ${finalSession.relevantResults}\n`;
        output += `• Content extracted: ${finalSession.extractedContent.length} pages\n`;
        output += `• Session status: ${finalSession.status}\n\n`;
        
        // Apply domain filtering to results
        const filteredSearches = finalSession.searches.map(search => ({
          ...search,
          results: search.results.filter(result => {
            try {
              const domain = new URL(result.link).hostname;
              
              // Apply blocked domains filter
              if (blocked_domains && blocked_domains.length > 0) {
                if (blocked_domains.some(blocked => domain.includes(blocked))) {
                  return false;
                }
              }
              
              // Apply allowed domains filter
              if (allowed_domains && allowed_domains.length > 0) {
                if (!allowed_domains.some(allowed => domain.includes(allowed))) {
                  return false;
                }
              }
              
              return true;
            } catch {
              return false; // Skip invalid URLs
            }
          })
        }));
        
        // Display search results
        let totalDisplayed = 0;
        
        for (let i = 0; i < filteredSearches.length; i++) {
          const search = filteredSearches[i];
          if (!search || search.results.length === 0) continue;
          
          output += `**🔍 Search ${i + 1}: "${search.query}" (Strategy: ${search.strategy.name})**\n`;
          
          const topResults = search.results
            .filter(result => result.relevanceScore && result.relevanceScore >= 15)
            .slice(0, 5);
          
          for (let j = 0; j < topResults.length; j++) {
            const result = topResults[j];
            if (!result) continue;
            
            totalDisplayed++;
            
            output += `\n${totalDisplayed}. **${result.title}**\n`;
            output += `   🔗 ${result.link}\n`;
            output += `   📄 ${result.snippet}\n`;
            output += `   📊 Relevance: ${Math.round(result.relevanceScore || 0)}% | Source: ${result.source}\n`;
          }
          
          output += '\n';
        }
        
        // Display extracted content if available
        if (finalSession.extractedContent.length > 0) {
          output += `**📑 Extracted Content Summary:**\n\n`;
          
          finalSession.extractedContent.forEach((content, index) => {
            if (content.success && content.wordCount > 50) {
              output += `${index + 1}. **${content.title}** (${content.wordCount} words)\n`;
              output += `   🔗 ${content.url}\n`;
              output += `   📝 ${content.content.substring(0, 200)}...\n\n`;
            }
          });
        }
        
        // Generate research context
        const context = agent.generateResearchContext(session.id);
        if (context) {
          output += `**🧠 Research Context Generated**\n`;
          output += `• Confidence: ${context.confidence}%\n`;
          output += `• Sources: ${context.sources.length}\n`;
          output += `• Last updated: ${context.lastUpdated.toISOString()}\n\n`;
        }
        
        if (totalDisplayed === 0) {
          output += `**⚠️ No results met the filtering criteria**\n`;
          output += `Try adjusting your domain filters or search query.\n\n`;
        }
        
        output += `**🔍 Powered by Intelligent Research Agent with Multi-Engine Search**\n`;
        output += `*Research session ID: ${session.id}*`;
        
        return output;
        
      } catch (searchError: any) {
        output += `**❌ Research failed:** ${searchError.message}\n\n`;
        output += `**🔧 Troubleshooting:**\n`;
        output += `• Check your internet connection\n`;
        output += `• Try a simpler search query\n`;
        output += `• Reduce the number of searches or results\n`;
        output += `• The search service might be temporarily unavailable\n\n`;
        
        return output;
      }
      
    } catch (error: any) {
      return `❌ Web search failed: ${error.message}`;
    }
  }
};

/**
 * Web Fetch Tool - Fetch content from a URL and process it
 */
export const webFetchTool: ClaudeCodeTool = {
  name: 'WebFetch',
  
  async description(): Promise<string> {
    return 'Fetch content from a web URL and process it with a custom prompt. Useful for analyzing web pages, extracting information, or summarizing web content.';
  },

  userFacingName(input?: WebFetchInput): string {
    return input?.url ? `Web Fetch: ${input.url}` : 'Web Fetch';
  },

  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch content from'
      },
      prompt: {
        type: 'string',
        description: 'The prompt to run on the fetched content'
      }
    },
    required: ['url', 'prompt']
  },

  async execute(input: WebFetchInput): Promise<string> {
    try {
      const { url, prompt } = input;
      
      if (!url || url.trim().length === 0) {
        return '❌ URL cannot be empty';
      }

      if (!prompt || prompt.trim().length === 0) {
        return '❌ Prompt cannot be empty';
      }

      // Basic URL validation
      let validUrl: URL;
      try {
        validUrl = new URL(url);
      } catch (urlError) {
        return `❌ Invalid URL format: ${url}`;
      }

      // Only allow HTTP/HTTPS protocols for security
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        return `❌ Only HTTP and HTTPS URLs are supported. Got: ${validUrl.protocol}`;
      }

      // Fetch actual web content
      let output = `🌐 Web Fetch Results for: ${url}\n\n`;
      output += `📋 Processing with prompt: "${prompt}"\n\n`;
      
      try {
        // Set up fetch with timeout and headers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return `❌ Failed to fetch URL: ${response.status} ${response.statusText}`;
        }
        
        const contentType = response.headers.get('content-type') || '';
        
        // Check if content is HTML or text
        if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xml')) {
          return `❌ Unsupported content type: ${contentType}. Only HTML and text content is supported.`;
        }
        
        const content = await response.text();
        
        if (!content || content.trim().length === 0) {
          return `❌ No content retrieved from URL: ${url}`;
        }
        
        // Limit content size for display (first 10000 characters)
        const truncatedContent = content.length > 10000 ? content.substring(0, 10000) + '\n\n... [Content truncated due to length]' : content;
        
        output += `✅ Successfully fetched content (${content.length} characters)\n`;
        output += `📄 Content-Type: ${contentType}\n\n`;
        output += `--- FETCHED CONTENT ---\n`;
        output += truncatedContent;
        output += `\n--- END FETCHED CONTENT ---\n\n`;
        
        // Process the content based on the prompt
        output += `🤖 Processing Result based on prompt: "${prompt}"\n`;
        
        if (prompt.toLowerCase().includes('summary') || prompt.toLowerCase().includes('summarize')) {
          // Extract title and key information for summary
          const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
          const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'No title found';
          
          // Extract meta description
          const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
          const description = descMatch && descMatch[1] ? descMatch[1].trim() : 'No description found';
          
          // Count elements
          const headingCount = (content.match(/<h[1-6][^>]*>/gi) || []).length;
          const paragraphCount = (content.match(/<p[^>]*>/gi) || []).length;
          const linkCount = (content.match(/<a[^>]*href=/gi) || []).length;
          
          output += `📊 **Summary of ${validUrl.hostname}:**\n`;
          output += `• **Title:** ${title}\n`;
          output += `• **Description:** ${description}\n`;
          output += `• **Content Stats:** ${headingCount} headings, ${paragraphCount} paragraphs, ${linkCount} links\n`;
          output += `• **Content Length:** ${content.length} characters\n`;
          
        } else if (prompt.toLowerCase().includes('extract') || prompt.toLowerCase().includes('find')) {
          // Extract specific information
          const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
          const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'No title found';
          
          const headings = content.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi) || [];
          const extractedHeadings = headings.slice(0, 5).map(h => h.replace(/<[^>]*>/g, '').trim());
          
          output += `🔍 **Extracted Information:**\n`;
          output += `• **Title:** ${title}\n`;
          output += `• **Main Headings:** ${extractedHeadings.length > 0 ? extractedHeadings.join(', ') : 'None found'}\n`;
          
        } else if (prompt.toLowerCase().includes('text') || prompt.toLowerCase().includes('content')) {
          // Extract plain text content
          const textContent = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                    .replace(/<[^>]*>/g, '')
                                    .replace(/\s+/g, ' ')
                                    .trim();
          
          const truncatedText = textContent.length > 2000 ? textContent.substring(0, 2000) + '...' : textContent;
          
          output += `📝 **Extracted Text Content:**\n${truncatedText}\n`;
          
        } else {
          // General analysis
          const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
          const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'No title found';
          
          output += `💡 **General Analysis:**\n`;
          output += `• **Page Title:** ${title}\n`;
          output += `• **Domain:** ${validUrl.hostname}\n`;
          output += `• **Content Type:** ${contentType}\n`;
          output += `• **Content Length:** ${content.length} characters\n`;
          output += `• **Analysis Note:** For more specific analysis, use prompts like 'summarize', 'extract headings', or 'get text content'\n`;
        }
        
        return output;
        
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          return `❌ Request timed out after 10 seconds: ${url}`;
        }
        return `❌ Failed to fetch content: ${fetchError.message}`;
      }
      
    } catch (error: any) {
      return `❌ Web fetch failed: ${error.message}`;
    }
  }
};
