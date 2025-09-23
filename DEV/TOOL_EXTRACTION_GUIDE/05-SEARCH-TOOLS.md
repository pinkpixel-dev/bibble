# 🔎 Search Tools

*Recreation of Desktop Commander's code and file search functionality with session-based pagination*

---

## 🎯 Overview

These tools provide fast, scalable search across codebases using ripgrep, plus convenient filename search. Searches can run in the background with session IDs, and results can be paginated/retrieved incrementally — mirroring Desktop Commander behavior without MCP.

## 📦 Dependencies
- @vscode/ripgrep (bundled rg binary)
- glob (for filename search)

Install:
```bash
npm install @vscode/ripgrep glob
```

## 🧱 Types
```typescript
// src/desktop-commander/types/search.ts
export type SearchType = 'code' | 'files';

export interface StartSearchOptions {
  rootPath: string;          // absolute path to start searching
  pattern: string;           // ERE regex for ripgrep or substring for filenames
  searchType?: SearchType;   // code (content) or files (by name)
  ignoreCase?: boolean;
  maxResults?: number;       // hard cap for total collected results
  fileGlobs?: string[];      // restrict files (e.g., ['**/*.ts', '!**/dist/**'])
}

export interface SearchResultItem {
  file: string;              // absolute path
  line?: number;             // for content matches
  preview?: string;          // line preview text for content matches
}

export interface SearchSessionInfo {
  sessionId: string;
  type: SearchType;
  pattern: string;
  rootPath: string;
  startedAt: number;
  status: 'running' | 'completed' | 'stopped' | 'error';
  totalCollected: number;
  errorMessage?: string;
}

export interface PagedResults {
  items: SearchResultItem[];
  hasMore: boolean;
  nextIndex: number;
}
```

## ⚙️ Core Search Manager
```typescript
// src/desktop-commander/utilities/search-manager.ts
import { spawn, ChildProcess } from 'child_process';
import { join, resolve, relative, sep } from 'path';
import { stat } from 'fs/promises';
import * as rg from '@vscode/ripgrep';
import { glob } from 'glob';
import { logger } from './logger.js';
import { 
  SearchType, 
  StartSearchOptions, 
  SearchResultItem, 
  SearchSessionInfo, 
  PagedResults 
} from '../types/search.js';
import { generateId } from './validation.js';

interface ActiveSearchSession {
  sessionId: string;
  type: SearchType;
  pattern: string;
  rootPath: string;
  startedAt: number;
  status: 'running' | 'completed' | 'stopped' | 'error';
  results: SearchResultItem[];
  process?: ChildProcess;
  errorMessage?: string;
}

class SearchManager {
  private sessions = new Map<string, ActiveSearchSession>();
  private readonly maxConcurrentSessions = 5;
  private readonly sessionTimeoutMs = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clean up old sessions periodically
    setInterval(() => this.cleanupOldSessions(), 60000);
  }

  /**
   * Start a background search session
   */
  async startSearch(options: StartSearchOptions): Promise<string> {
    const sessionId = generateId();
    
    // Clean up if we hit max concurrent sessions
    if (this.sessions.size >= this.maxConcurrentSessions) {
      await this.cleanupOldestSession();
    }

    // Validate root path exists
    try {
      const pathStat = await stat(options.rootPath);
      if (!pathStat.isDirectory()) {
        throw new Error('Root path must be a directory');
      }
    } catch (error) {
      throw new Error(`Root path does not exist: ${options.rootPath}`);
    }

    const session: ActiveSearchSession = {
      sessionId,
      type: options.searchType || 'code',
      pattern: options.pattern,
      rootPath: resolve(options.rootPath),
      startedAt: Date.now(),
      status: 'running',
      results: []
    };

    this.sessions.set(sessionId, session);

    try {
      if (session.type === 'code') {
        await this.startCodeSearch(session, options);
      } else {
        await this.startFileSearch(session, options);
      }
    } catch (error) {
      session.status = 'error';
      session.errorMessage = error instanceof Error ? error.message : String(error);
      await logger.error('Search failed to start', {
        sessionId,
        error: session.errorMessage
      });
    }

    return sessionId;
  }

  /**
   * Start ripgrep-based code search
   */
  private async startCodeSearch(session: ActiveSearchSession, options: StartSearchOptions): Promise<void> {
    const args = [
      '--line-number',
      '--with-filename',
      '--no-heading',
      '--color=never',
      '--json'
    ];

    if (options.ignoreCase) {
      args.push('--ignore-case');
    }

    if (options.maxResults) {
      args.push('--max-count', options.maxResults.toString());
    }

    // Add file type filters
    if (options.fileGlobs && options.fileGlobs.length > 0) {
      for (const glob of options.fileGlobs) {
        if (glob.startsWith('!')) {
          // Exclude pattern
          args.push('--glob', glob);
        } else {
          // Include pattern
          args.push('--glob', glob);
        }
      }
    }

    args.push(options.pattern, session.rootPath);

    const process = spawn(rg.rgPath, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    session.process = process;
    let buffer = '';

    process.stdout?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const match = JSON.parse(line);
            if (match.type === 'match') {
              const result: SearchResultItem = {
                file: resolve(match.data.path.text),
                line: match.data.line_number,
                preview: match.data.lines.text.trim()
              };
              session.results.push(result);
            }
          } catch (parseError) {
            // Ignore malformed JSON lines
          }
        }
      }
    });

    process.stderr?.on('data', (chunk: Buffer) => {
      const errorText = chunk.toString();
      if (!session.errorMessage) {
        session.errorMessage = errorText;
      }
    });

    process.on('close', (code) => {
      if (code === 0 || code === 1) { // 1 means no matches found, still success
        session.status = 'completed';
      } else {
        session.status = 'error';
        if (!session.errorMessage) {
          session.errorMessage = `ripgrep exited with code ${code}`;
        }
      }
      session.process = undefined;
    });

    process.on('error', (error) => {
      session.status = 'error';
      session.errorMessage = error.message;
      session.process = undefined;
    });
  }

  /**
   * Start glob-based filename search
   */
  private async startFileSearch(session: ActiveSearchSession, options: StartSearchOptions): Promise<void> {
    try {
      // Use glob patterns to find matching files
      const patterns = options.fileGlobs && options.fileGlobs.length > 0 
        ? options.fileGlobs
        : ['**/*'];

      const globOptions = {
        cwd: session.rootPath,
        absolute: true,
        nodir: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
      };

      const allFiles: string[] = [];
      
      for (const pattern of patterns) {
        if (!pattern.startsWith('!')) {
          const files = await glob(pattern, globOptions);
          allFiles.push(...files);
        }
      }

      // Filter by pattern (substring match on filename)
      const filteredFiles = allFiles.filter(file => {
        const fileName = file.split(sep).pop() || '';
        const matches = options.ignoreCase 
          ? fileName.toLowerCase().includes(options.pattern.toLowerCase())
          : fileName.includes(options.pattern);
        return matches;
      });

      // Apply max results limit
      const limitedFiles = options.maxResults 
        ? filteredFiles.slice(0, options.maxResults)
        : filteredFiles;

      session.results = limitedFiles.map(file => ({
        file: resolve(file)
      }));

      session.status = 'completed';

    } catch (error) {
      session.status = 'error';
      session.errorMessage = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Stop a running search session
   */
  async stopSearch(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    if (session.process) {
      session.process.kill('SIGTERM');
      session.process = undefined;
    }

    session.status = 'stopped';
    return true;
  }

  /**
   * Get search session status
   */
  getSessionInfo(sessionId: string): SearchSessionInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      type: session.type,
      pattern: session.pattern,
      rootPath: session.rootPath,
      startedAt: session.startedAt,
      status: session.status,
      totalCollected: session.results.length,
      errorMessage: session.errorMessage
    };
  }

  /**
   * Get paginated results from a session
   */
  getResults(sessionId: string, startIndex = 0, pageSize = 50): PagedResults | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const endIndex = startIndex + pageSize;
    const items = session.results.slice(startIndex, endIndex);
    const hasMore = endIndex < session.results.length;

    return {
      items,
      hasMore,
      nextIndex: endIndex
    };
  }

  /**
   * List all active search sessions
   */
  listSessions(): SearchSessionInfo[] {
    return Array.from(this.sessions.values()).map(session => ({
      sessionId: session.sessionId,
      type: session.type,
      pattern: session.pattern,
      rootPath: session.rootPath,
      startedAt: session.startedAt,
      status: session.status,
      totalCollected: session.results.length,
      errorMessage: session.errorMessage
    }));
  }

  /**
   * Clean up old/completed sessions
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const age = now - session.startedAt;
      const shouldCleanup = (
        age > this.sessionTimeoutMs ||
        (session.status === 'completed' && age > 60000) || // Keep completed for 1 minute
        session.status === 'error' ||
        session.status === 'stopped'
      );

      if (shouldCleanup) {
        toRemove.push(sessionId);
        if (session.process) {
          session.process.kill('SIGTERM');
        }
      }
    }

    toRemove.forEach(sessionId => this.sessions.delete(sessionId));
  }

  /**
   * Clean up oldest session to make room for new ones
   */
  private async cleanupOldestSession(): Promise<void> {
    let oldestSession: ActiveSearchSession | null = null;
    let oldestTime = Infinity;

    for (const session of this.sessions.values()) {
      if (session.startedAt < oldestTime) {
        oldestTime = session.startedAt;
        oldestSession = session;
      }
    }

    if (oldestSession) {
      await this.stopSearch(oldestSession.sessionId);
      this.sessions.delete(oldestSession.sessionId);
    }
  }
}

export const searchManager = new SearchManager();
```
## 🔧 Search Tool Functions

```typescript
// src/desktop-commander/tools/search.ts
import { searchManager } from '../utilities/search-manager.js';
import { OperationResult } from '../types/filesystem.js';
import { 
  StartSearchOptions, 
  SearchSessionInfo, 
  PagedResults, 
  SearchResultItem 
} from '../types/search.js';
import { logger } from '../utilities/logger.js';

/**
 * Start a new search session (background)
 * Equivalent to Desktop Commander's start_search tool
 */
export async function startSearch(
  rootPath: string,
  pattern: string,
  options: Omit<StartSearchOptions, 'rootPath' | 'pattern'> = {}
): Promise<OperationResult<string>> {
  try {
    const sessionId = await searchManager.startSearch({
      rootPath,
      pattern,
      ...options
    });
    
    await logger.info('Search started', {
      sessionId,
      pattern,
      rootPath,
      type: options.searchType || 'code'
    });
    
    return { success: true, data: sessionId };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Start search failed', { pattern, rootPath, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Get search results with pagination
 * Equivalent to Desktop Commander's get_search_results tool
 */
export async function getSearchResults(
  sessionId: string,
  startIndex = 0,
  pageSize = 50
): Promise<OperationResult<PagedResults>> {
  try {
    const results = searchManager.getResults(sessionId, startIndex, pageSize);
    
    if (!results) {
      return { success: false, error: `Search session not found: ${sessionId}` };
    }
    
    return { success: true, data: results };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Get search results failed', { sessionId, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Get search session status and info
 * Equivalent to Desktop Commander's get_search_status tool
 */
export async function getSearchStatus(
  sessionId: string
): Promise<OperationResult<SearchSessionInfo>> {
  try {
    const info = searchManager.getSessionInfo(sessionId);
    
    if (!info) {
      return { success: false, error: `Search session not found: ${sessionId}` };
    }
    
    return { success: true, data: info };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Get search status failed', { sessionId, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Stop a running search session
 * Equivalent to Desktop Commander's stop_search tool
 */
export async function stopSearch(sessionId: string): Promise<OperationResult<boolean>> {
  try {
    const stopped = await searchManager.stopSearch(sessionId);
    
    if (stopped) {
      await logger.info('Search stopped', { sessionId });
    }
    
    return { 
      success: true, 
      data: stopped,
      warning: stopped ? undefined : 'Session not found or already stopped'
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Stop search failed', { sessionId, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * List all active search sessions
 * Equivalent to Desktop Commander's list_search_sessions tool
 */
export async function listSearchSessions(): Promise<OperationResult<SearchSessionInfo[]>> {
  try {
    const sessions = searchManager.listSessions();
    return { success: true, data: sessions };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('List search sessions failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Quick search with immediate results (no session)
 * Convenience function for simple searches that don't need pagination
 */
export async function quickSearch(
  rootPath: string,
  pattern: string,
  options: Omit<StartSearchOptions, 'rootPath' | 'pattern'> & { maxResults?: number } = {}
): Promise<OperationResult<SearchResultItem[]>> {
  try {
    // Start search
    const sessionResult = await startSearch(rootPath, pattern, {
      ...options,
      maxResults: options.maxResults ?? 100 // Reasonable default for quick searches
    });
    
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: sessionResult.error || 'Failed to start search' };
    }
    
    const sessionId = sessionResult.data;
    
    // Poll for completion (with timeout)
    const startTime = Date.now();
    const timeoutMs = 30000; // 30 seconds
    
    while (Date.now() - startTime < timeoutMs) {
      const statusResult = await getSearchStatus(sessionId);
      if (!statusResult.success || !statusResult.data) {
        break;
      }
      
      const status = statusResult.data;
      if (status.status === 'completed') {
        // Get all results
        const resultsResponse = await getSearchResults(sessionId, 0, options.maxResults || 100);
        if (resultsResponse.success && resultsResponse.data) {
          return { success: true, data: resultsResponse.data.items };
        }
        break;
      }
      
      if (status.status === 'error') {
        return { success: false, error: status.errorMessage || 'Search failed' };
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Timeout or other issue
    await stopSearch(sessionId);
    return { success: false, error: 'Search timed out or failed to complete' };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Quick search failed', { pattern, rootPath, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
```

## 💻 Usage Examples

### Basic Code Search
```typescript
import { startSearch, getSearchResults, getSearchStatus } from './desktop-commander/tools/search.js';

// Start a code search for function definitions
const searchResult = await startSearch('/path/to/project', 'function\\s+\\w+', {
  searchType: 'code',
  ignoreCase: false,
  fileGlobs: ['**/*.ts', '**/*.js', '!**/node_modules/**'],
  maxResults: 500
});

if (searchResult.success && searchResult.data) {
  const sessionId = searchResult.data;
  console.log(`Search started with session ID: ${sessionId}`);
  
  // Check status periodically
  const checkStatus = async () => {
    const status = await getSearchStatus(sessionId);
    if (status.success && status.data) {
      console.log(`Status: ${status.data.status}, Results: ${status.data.totalCollected}`);
      
      if (status.data.status === 'completed') {
        // Get first page of results
        const results = await getSearchResults(sessionId, 0, 20);
        if (results.success && results.data) {
          console.log('Search results:');
          results.data.items.forEach(item => {
            console.log(`${item.file}:${item.line} - ${item.preview}`);
          });
          
          if (results.data.hasMore) {
            console.log(`... and ${results.data.hasMore} more results`);
          }
        }
      } else if (status.data.status === 'running') {
        // Continue checking
        setTimeout(checkStatus, 1000);
      }
    }
  };
  
  checkStatus();
}
```

### File Name Search
```typescript
// Search for files by name pattern
const fileSearchResult = await startSearch('/path/to/project', 'component', {
  searchType: 'files',
  ignoreCase: true,
  fileGlobs: ['**/*.tsx', '**/*.ts'],
  maxResults: 100
});

if (fileSearchResult.success && fileSearchResult.data) {
  const sessionId = fileSearchResult.data;
  
  // Wait for completion and get results
  let completed = false;
  while (!completed) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const status = await getSearchStatus(sessionId);
    if (status.success && status.data) {
      if (status.data.status === 'completed') {
        const results = await getSearchResults(sessionId);
        if (results.success && results.data) {
          console.log('Component files found:');
          results.data.items.forEach(item => {
            console.log(item.file);
          });
        }
        completed = true;
      } else if (status.data.status === 'error') {
        console.error('Search failed:', status.data.errorMessage);
        completed = true;
      }
    }
  }
}
```

### Quick Search for Simple Cases
```typescript
import { quickSearch } from './desktop-commander/tools/search.js';

// Find all TODO comments quickly
const todoResults = await quickSearch('/path/to/project', 'TODO|FIXME|HACK', {
  searchType: 'code',
  ignoreCase: true,
  maxResults: 50
});

if (todoResults.success && todoResults.data) {
  console.log('TODO items found:');
  todoResults.data.forEach(item => {
    console.log(`${item.file}:${item.line} - ${item.preview}`);
  });
}

// Find test files
const testFiles = await quickSearch('/path/to/project', 'test', {
  searchType: 'files',
  ignoreCase: true,
  fileGlobs: ['**/*.test.*', '**/*.spec.*'],
  maxResults: 100
});

if (testFiles.success && testFiles.data) {
  console.log('Test files:');
  testFiles.data.forEach(item => {
    console.log(item.file);
  });
}
```

### Advanced Search with Pagination
```typescript
// Large codebase search with pagination
async function searchLargeCodebase(rootPath: string, pattern: string) {
  const searchResult = await startSearch(rootPath, pattern, {
    searchType: 'code',
    ignoreCase: true,
    maxResults: 10000 // Allow large result set
  });
  
  if (!searchResult.success || !searchResult.data) {
    console.error('Failed to start search:', searchResult.error);
    return;
  }
  
  const sessionId = searchResult.data;
  console.log(`Search session started: ${sessionId}`);
  
  // Wait for completion
  let status;
  do {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusResult = await getSearchStatus(sessionId);
    if (!statusResult.success) break;
    status = statusResult.data;
    console.log(`Progress: ${status?.totalCollected} results collected...`);
  } while (status?.status === 'running');
  
  if (status?.status !== 'completed') {
    console.error('Search failed:', status?.errorMessage);
    return;
  }
  
  console.log(`Search completed. Total results: ${status.totalCollected}`);
  
  // Page through results
  let startIndex = 0;
  const pageSize = 50;
  let hasMore = true;
  
  while (hasMore) {
    const results = await getSearchResults(sessionId, startIndex, pageSize);
    if (!results.success || !results.data) break;
    
    console.log(`\nResults ${startIndex + 1}-${startIndex + results.data.items.length}:`);
    results.data.items.forEach((item, idx) => {
      console.log(`${startIndex + idx + 1}. ${item.file}:${item.line}`);
      console.log(`   ${item.preview}`);
    });
    
    hasMore = results.data.hasMore;
    startIndex += pageSize;
    
    if (hasMore) {
      // Ask user if they want to continue
      console.log('\nPress Enter to see more results, or Ctrl+C to stop...');
      // In real usage, you'd wait for user input here
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Usage
// await searchLargeCodebase('/path/to/large/project', 'async function');
```

### Session Management
```typescript
import { listSearchSessions, stopSearch } from './desktop-commander/tools/search.js';

// Monitor and manage search sessions
async function manageSearchSessions() {
  const sessionsResult = await listSearchSessions();
  if (!sessionsResult.success || !sessionsResult.data) {
    console.error('Failed to list sessions');
    return;
  }
  
  const sessions = sessionsResult.data;
  console.log(`Active search sessions: ${sessions.length}`);
  
  sessions.forEach(session => {
    const runtime = Date.now() - session.startedAt;
    console.log(`Session ${session.sessionId}:`);
    console.log(`  Pattern: "${session.pattern}"`);
    console.log(`  Type: ${session.type}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Results: ${session.totalCollected}`);
    console.log(`  Runtime: ${Math.round(runtime / 1000)}s`);
    
    if (session.errorMessage) {
      console.log(`  Error: ${session.errorMessage}`);
    }
  });
  
  // Stop long-running searches
  const longRunning = sessions.filter(s => {
    const runtime = Date.now() - s.startedAt;
    return runtime > 60000 && s.status === 'running'; // Over 1 minute
  });
  
  for (const session of longRunning) {
    console.log(`Stopping long-running search: ${session.sessionId}`);
    await stopSearch(session.sessionId);
  }
}

// Usage
// await manageSearchSessions();
```

### Complex Search Patterns
```typescript
// Search for React hooks usage
const hooksSearch = await quickSearch('/path/to/react/project', 'use[A-Z]\\w+', {
  searchType: 'code',
  ignoreCase: false,
  fileGlobs: ['**/*.tsx', '**/*.ts', '!**/*.test.*'],
  maxResults: 200
});

// Search for SQL injection vulnerabilities
const sqlSearch = await quickSearch('/path/to/project', '(query|execute).*\\$\\{|\\+.*["\'].*SELECT', {
  searchType: 'code',
  ignoreCase: true,
  fileGlobs: ['**/*.js', '**/*.ts', '!**/node_modules/**'],
  maxResults: 100
});

// Find configuration files
const configFiles = await quickSearch('/path/to/project', 'config|settings', {
  searchType: 'files',
  ignoreCase: true,
  fileGlobs: ['**/*.json', '**/*.yaml', '**/*.yml', '**/*.toml', '**/*.ini'],
  maxResults: 50
});

// Search for unused imports (simplified)
const unusedImports = await quickSearch('/path/to/project', 'import.*from.*["\'].*["\']', {
  searchType: 'code',
  ignoreCase: false,
  fileGlobs: ['**/*.ts', '**/*.tsx', '!**/*.d.ts'],
  maxResults: 1000
});
```

---

**Next Step**: Continue to `06-EDIT-TOOLS.md` for advanced file editing capabilities with fuzzy matching.
