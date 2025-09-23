/**
 * Web Search and Research Types for Built-in Tools
 * Enhanced for general-purpose research with Windows and technical expertise
 */

import { z } from 'zod';

// Core research types
export interface ResearchSession {
  id: string;
  query: string;
  originalQuestion: string;
  startTime: Date;
  endTime?: Date;
  status: 'initializing' | 'cleaning' | 'searching' | 'extracting' | 'analyzing' | 'completed' | 'failed' | 'insufficient_results';
  searches: SearchQuery[];
  extractedContent: ExtractedContent[];
  totalResults: number;
  relevantResults: number;
  contextSummary?: string;
}

export interface SearchQuery {
  id: string;
  query: string;
  searchType: SearchType;
  timestamp: Date;
  results: SearchResult[];
  resultCount: number;
  strategy: SearchStrategy;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  relevanceScore?: number;
  source: 'web-search' | 'duckduckgo' | 'bing' | 'google' | 'brave';
  timestamp: Date;
}

export interface ExtractedContent {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  extractedAt: Date;
  success: boolean;
  error?: string;
}

export interface ResearchContext {
  sessionId: string;
  query: string;
  relevantContent: string;
  sources: string[];
  confidence: number;
  lastUpdated: Date;
}

export interface ResearchProgress {
  sessionId: string;
  currentStep: string;
  progress: number; // 0-100
  status: string;
  currentQuery?: string;
  resultsFound: number;
  contentExtracted: number;
  estimatedTimeRemaining?: number;
}

export interface ResearchConfig {
  maxSearches: number;
  maxResultsPerSearch: number;
  maxContentExtractions: number;
  timeoutMs: number;
  enableContentExtraction: boolean;
  enableFollowUpSearches: boolean;
  relevanceThreshold: number;
  searchStrategies: SearchStrategy[];
  minSearches?: number;
  searchEngineOverrides?: {
    preferredEngine?: 'duckduckgo' | 'bing' | 'google' | 'brave';
    bingApiKey?: string;
    googleApiKey?: string;
    googleSearchEngineId?: string;
    braveApiKey?: string;
  };
}

export interface SearchStrategy {
  name: string;
  description: string;
  queryTemplates: string[];
  maxResults: number;
  contentExtraction: boolean;
  followUpQueries: string[];
}

export type SearchType = 'general' | 'technical' | 'error_lookup' | 'documentation' | 'forum_discussion' | 'people_profile' | 'windows_specific' | 'linux_specific';

// Enhanced error patterns for both Windows and general tech support
export interface TechnicalErrorPattern {
  errorType: string;
  patterns: RegExp[];
  searchQueries: string[];
  commonSources: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  platform?: 'windows' | 'linux' | 'macos' | 'cross-platform';
}

// Memory and performance monitoring
export interface MemoryStats {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  usagePercentage: number;
}

// Content extraction interfaces
export interface ContentExtractor {
  extractContent(url: string): Promise<ExtractedContent>;
  extractMultiple(urls: string[]): Promise<ExtractedContent[]>;
  getMemoryStats(): Promise<MemoryStats>;
  isRelevantUrl(url: string): boolean;
  prioritizeUrls(urls: string[]): string[];
}

export interface ResearchAgent {
  startResearch(query: string, config?: Partial<ResearchConfig>): Promise<ResearchSession>;
  getProgress(sessionId: string): ResearchProgress | null;
  stopResearch(sessionId: string): Promise<void>;
  getSession(sessionId: string): ResearchSession | null;
  getAllSessions(): ResearchSession[];
  generateResearchContext(sessionId: string): ResearchContext | null;
  getMostRecentContext(): ResearchContext | null;
}

// Parameter schemas for web search tools
export const WebSearchQuerySchema = z.string().min(1, 'Search query is required');

export const WebSearchConfigSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  allowed_domains: z.array(z.string()).optional(),
  blocked_domains: z.array(z.string()).optional(),

  engine: z.enum(['auto', 'custom', 'google', 'bing', 'brave', 'ddg']).optional(),
  engine_order: z.array(z.enum(['google', 'bing', 'brave', 'ddg'])).optional(),
  depth: z.number().int().min(1).max(20).default(6),
  mode: z.enum(['snippet', 'summary', 'comprehensive']).default('comprehensive'),
  format: z.enum(['markdown', 'html', 'text']).default('markdown'),
  dedupe_by_host: z.boolean().default(true),
  max_concurrency: z.number().int().min(1).max(8).optional(),
  min_useful_chars: z.number().int().min(200).optional(),
  max_per_source_chars: z.number().int().min(1000).optional(),
  write_file: z.object({ path: z.string().min(1) }).optional(),
  language: z.string().optional(),

  // Legacy parameters kept for backwards compatibility with existing callers
  maxSearches: z.number().min(1).max(10).default(3),
  maxResultsPerSearch: z.number().min(5).max(50).default(10),
  extractContent: z.boolean().default(true),
  searchType: z.enum(['general', 'technical', 'windows', 'linux', 'documentation', 'people']).default('general'),
  preferredEngine: z.enum(['duckduckgo', 'bing', 'google', 'brave']).optional()
}).strict();

export type WebSearchConfig = z.infer<typeof WebSearchConfigSchema>;

// Enhanced technical patterns for cross-platform support
export const TECHNICAL_ERROR_PATTERNS: TechnicalErrorPattern[] = [
  // Windows-specific patterns
  {
    errorType: 'windows_bsod',
    patterns: [/blue screen/i, /bsod/i, /stop error/i, /0x[0-9a-f]{8}/i],
    searchQueries: ['windows blue screen fix', 'BSOD troubleshooting', 'windows stop error'],
    commonSources: ['support.microsoft.com', 'answers.microsoft.com', 'superuser.com'],
    urgency: 'critical',
    platform: 'windows'
  },
  {
    errorType: 'windows_service_failed',
    patterns: [/service failed/i, /windows service/i, /service not responding/i],
    searchQueries: ['windows service failed fix', 'restart windows service', 'service troubleshooting'],
    commonSources: ['support.microsoft.com', 'serverfault.com', 'superuser.com'],
    urgency: 'high',
    platform: 'windows'
  },
  {
    errorType: 'windows_registry_error',
    patterns: [/registry error/i, /regedit/i, /registry key/i],
    searchQueries: ['windows registry error fix', 'registry repair', 'regedit troubleshooting'],
    commonSources: ['support.microsoft.com', 'technet.microsoft.com', 'superuser.com'],
    urgency: 'high',
    platform: 'windows'
  },
  // Linux-specific patterns
  {
    errorType: 'linux_command_not_found',
    patterns: [/command not found/i, /No such file or directory/i],
    searchQueries: ['install {command} linux', '{command} package ubuntu debian'],
    commonSources: ['askubuntu.com', 'packages.ubuntu.com'],
    urgency: 'medium',
    platform: 'linux'
  },
  {
    errorType: 'linux_permission_denied',
    patterns: [/permission denied/i, /access denied/i],
    searchQueries: ['permission denied linux fix', 'chmod chown linux'],
    commonSources: ['unix.stackexchange.com', 'askubuntu.com'],
    urgency: 'high',
    platform: 'linux'
  },
  // Cross-platform patterns
  {
    errorType: 'network_connection_failed',
    patterns: [/connection failed/i, /network unreachable/i, /timeout/i, /connection refused/i],
    searchQueries: ['network connection failed fix', 'internet connectivity troubleshooting'],
    commonSources: ['stackoverflow.com', 'superuser.com', 'serverfault.com'],
    urgency: 'high',
    platform: 'cross-platform'
  },
  {
    errorType: 'application_crash',
    patterns: [/application crashed/i, /segmentation fault/i, /access violation/i],
    searchQueries: ['application crash troubleshooting', 'program stopped working fix'],
    commonSources: ['stackoverflow.com', 'github.com', 'superuser.com'],
    urgency: 'medium',
    platform: 'cross-platform'
  },
  {
    errorType: 'memory_error',
    patterns: [/out of memory/i, /memory leak/i, /heap corruption/i],
    searchQueries: ['memory error troubleshooting', 'out of memory fix'],
    commonSources: ['stackoverflow.com', 'serverfault.com'],
    urgency: 'high',
    platform: 'cross-platform'
  }
];

// Export all types
export * from './web.js';
