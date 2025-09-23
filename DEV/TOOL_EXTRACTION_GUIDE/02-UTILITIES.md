# 🔧 Shared Utilities

*Essential utility functions used across Desktop Commander tools*

---

## 🎯 Overview

Desktop Commander uses several shared utilities for logging, system detection, timeout handling, and validation. These are crucial for the tools to work correctly.

## 📝 Logging Utility

```typescript
// src/desktop-commander/utilities/logger.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export class Logger {
  private logPath?: string;
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private rotationCount = 5;

  constructor(logPath?: string) {
    if (logPath) {
      this.logPath = logPath;
    } else {
      const homeDir = os.homedir();
      const logDir = path.join(homeDir, '.desktop-commander-logs');
      this.logPath = path.join(logDir, 'desktop-commander.log');
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    return JSON.stringify(entry);
  }

  async log(level: LogLevel, message: string, data?: any): Promise<void> {
    const logMessage = this.formatMessage(level, message, data);
    
    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    }
    
    // File logging
    if (this.logPath) {
      try {
        await this.ensureLogDirectory();
        await this.rotateLogIfNeeded();
        await fs.appendFile(this.logPath, logMessage + '\n');
      } catch (error) {
        console.error('Failed to write log:', error);
      }
    }
  }

  async debug(message: string, data?: any): Promise<void> {
    await this.log('debug', message, data);
  }

  async info(message: string, data?: any): Promise<void> {
    await this.log('info', message, data);
  }

  async warn(message: string, data?: any): Promise<void> {
    await this.log('warn', message, data);
  }

  async error(message: string, data?: any): Promise<void> {
    await this.log('error', message, data);
  }

  private async ensureLogDirectory(): Promise<void> {
    if (!this.logPath) return;
    const logDir = path.dirname(this.logPath);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  private async rotateLogIfNeeded(): Promise<void> {
    if (!this.logPath) return;
    
    try {
      const stats = await fs.stat(this.logPath);
      if (stats.size > this.maxFileSize) {
        await this.rotateLog();
      }
    } catch {
      // File doesn't exist, no rotation needed
    }
  }

  private async rotateLog(): Promise<void> {
    if (!this.logPath) return;
    
    const baseLogPath = this.logPath.replace('.log', '');
    
    // Rotate existing logs
    for (let i = this.rotationCount - 1; i >= 1; i--) {
      const oldPath = `${baseLogPath}.${i}.log`;
      const newPath = `${baseLogPath}.${i + 1}.log`;
      try {
        await fs.rename(oldPath, newPath);
      } catch {
        // File doesn't exist, continue
      }
    }
    
    // Move current log to .1
    try {
      await fs.rename(this.logPath, `${baseLogPath}.1.log`);
    } catch {
      // Current log doesn't exist, continue
    }
  }
}

// Export singleton logger
export const logger = new Logger();
```
## 🖥️ System Information Utility

```typescript
// src/desktop-commander/utilities/system-info.ts
import os from 'os';
import path from 'path';

export interface SystemInfo {
  platform: NodeJS.Platform;
  arch: string;
  release: string;
  homedir: string;
  tmpdir: string;
  shell: string;
}

export function getSystemInfo(): SystemInfo {
  return {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    homedir: os.homedir(),
    tmpdir: os.tmpdir(),
    shell: getDefaultShell()
  };
}

function getDefaultShell(): string {
  const platform = os.platform();
  
  if (platform === 'win32') {
    return 'powershell.exe';
  }
  
  // Check environment variable first
  if (process.env.SHELL) {
    return process.env.SHELL;
  }
  
  // Default fallbacks by platform
  switch (platform) {
    case 'darwin':
      return '/bin/zsh'; // macOS default since Catalina
    case 'linux':
      return '/bin/bash';
    default:
      return '/bin/sh';
  }
}

export function getPathGuidance(systemInfo: SystemInfo): string {
  const platform = systemInfo.platform;
  
  if (platform === 'win32') {
    return 'Always use absolute paths (starting with drive letter like C:\\) for reliability.';
  } else {
    return 'Always use absolute paths (starting with /) for reliability.';
  }
}

export function getOSSpecificGuidance(systemInfo: SystemInfo): string {
  const platform = systemInfo.platform;
  
  switch (platform) {
    case 'win32':
      return 'Windows detected. Use PowerShell commands and Windows-style paths.';
    case 'darwin':
      return 'macOS detected. Unix commands available with Homebrew packages.';
    case 'linux':
      return 'Linux detected. Full Unix command suite available.';
    default:
      return 'Unix-like system detected. Standard Unix commands available.';
  }
}

export function isWindows(): boolean {
  return os.platform() === 'win32';
}

export function isMacOS(): boolean {
  return os.platform() === 'darwin';
}

export function isLinux(): boolean {
  return os.platform() === 'linux';
}

export function normalizePathForOS(filePath: string): string {
  return path.resolve(filePath);
}

export function getExecutableExtension(): string {
  return isWindows() ? '.exe' : '';
}
```

## ⏱️ Timeout Utility

```typescript
// src/desktop-commander/utilities/timeout.ts

/**
 * Wraps a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string = 'Operation',
  fallbackValue: T | null = null
): Promise<T | null> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<T | null>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (fallbackValue !== null) {
      return fallbackValue;
    }
    throw error;
  }
}

/**
 * Creates a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Exponential backoff
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
}
```
## 🛡️ Path Validation Utility

```typescript
// src/desktop-commander/utilities/validation.ts
import path from 'path';
import fs from 'fs/promises';
import { configManager } from '../config/config-manager.js';
import { isWindows } from './system-info.js';

/**
 * Validates and normalizes a file path
 */
export async function validatePath(filePath: string): Promise<string> {
  if (!filePath || filePath.trim() === '') {
    throw new Error('Path cannot be empty');
  }
  
  // Normalize the path
  const normalizedPath = path.resolve(filePath);
  
  // Security check: Ensure path doesn't contain dangerous patterns
  if (containsDangerousPatterns(normalizedPath)) {
    throw new Error(`Dangerous path pattern detected: ${filePath}`);
  }
  
  // Check if directory is allowed (if restrictions are configured)
  const isAllowed = await configManager.isDirectoryAllowed(normalizedPath);
  if (!isAllowed) {
    throw new Error(`Access denied to path: ${filePath}`);
  }
  
  return normalizedPath;
}

/**
 * Check for dangerous path patterns
 */
function containsDangerousPatterns(filePath: string): boolean {
  const dangerous = [
    '..\\..\\', // Windows path traversal
    '../../../', // Unix path traversal
    '\0', // Null bytes
    '<', '>', '|', // Command injection
  ];
  
  return dangerous.some(pattern => filePath.includes(pattern));
}

/**
 * Checks if a path exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets file/directory info safely
 */
export async function getPathInfo(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime
    };
  } catch {
    return {
      exists: false,
      isFile: false,
      isDirectory: false,
      size: 0,
      modified: null,
      created: null
    };
  }
}

/**
 * Validates command for security
 */
export async function validateCommand(command: string): Promise<void> {
  const isBlocked = await configManager.isCommandBlocked(command);
  if (isBlocked) {
    throw new Error(`Command '${command}' is blocked by security policy`);
  }
  
  // Additional validation for dangerous patterns
  const dangerousPatterns = [
    '&&', '||', ';', '|', // Command chaining
    '$(', '`', // Command substitution
    'rm -rf /', // Dangerous deletions
    'format', 'fdisk' // Disk operations
  ];
  
  if (dangerousPatterns.some(pattern => command.includes(pattern))) {
    throw new Error(`Command contains potentially dangerous patterns: ${command}`);
  }
}

/**
 * Sanitize filename for safe creation
 */
export function sanitizeFilename(filename: string): string {
  // Remove/replace dangerous characters
  const dangerous = isWindows() 
    ? /[<>:"\|\?\*]/g  // Windows forbidden chars
    : /[\0]/g;          // Unix null bytes
  
  return filename.replace(dangerous, '_').trim();
}

/**
 * Convert relative path to absolute
 */
export function toAbsolutePath(filePath: string, basePath?: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  
  const base = basePath || process.cwd();
  return path.resolve(base, filePath);
}
```

## 🔍 Fuzzy Search Utility

```typescript
// src/desktop-commander/utilities/fuzzy-search.ts
import { distance } from 'fastest-levenshtein';

export interface FuzzyMatch {
  text: string;
  similarity: number; // 0-100 percentage
  distance: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Find fuzzy matches in text
 */
export function findFuzzyMatch(
  searchText: string,
  targetText: string,
  threshold: number = 0.7
): FuzzyMatch | null {
  const searchLines = searchText.split('\n');
  const targetLines = targetText.split('\n');
  
  let bestMatch: FuzzyMatch | null = null;
  let bestSimilarity = 0;
  
  // Try different window sizes around the search text length
  const searchLength = searchLines.length;
  const windowSizes = [searchLength, searchLength + 1, searchLength - 1]
    .filter(size => size > 0);
  
  for (const windowSize of windowSizes) {
    for (let i = 0; i <= targetLines.length - windowSize; i++) {
      const window = targetLines.slice(i, i + windowSize);
      const windowText = window.join('\n');
      
      const editDistance = distance(searchText, windowText);
      const maxLength = Math.max(searchText.length, windowText.length);
      const similarity = maxLength === 0 ? 100 : ((maxLength - editDistance) / maxLength) * 100;
      
      if (similarity > bestSimilarity && similarity >= threshold * 100) {
        bestMatch = {
          text: windowText,
          similarity,
          distance: editDistance,
          startIndex: i,
          endIndex: i + windowSize
        };
        bestSimilarity = similarity;
      }
    }
  }
  
  return bestMatch;
}

/**
 * Create character-level diff
 */
export function createCharacterDiff(expected: string, actual: string): string {
  const maxLength = Math.max(expected.length, actual.length);
  let diff = '';
  let commonPrefix = '';
  let commonSuffix = '';
  
  // Find common prefix
  let prefixLength = 0;
  while (prefixLength < maxLength && 
         expected[prefixLength] === actual[prefixLength]) {
    commonPrefix += expected[prefixLength];
    prefixLength++;
  }
  
  // Find common suffix
  let suffixLength = 0;
  while (suffixLength < maxLength - prefixLength &&
         expected[expected.length - 1 - suffixLength] === actual[actual.length - 1 - suffixLength]) {
    commonSuffix = expected[expected.length - 1 - suffixLength] + commonSuffix;
    suffixLength++;
  }
  
  // Extract different parts
  const expectedDiff = expected.substring(prefixLength, expected.length - suffixLength);
  const actualDiff = actual.substring(prefixLength, actual.length - suffixLength);
  
  // Build diff string
  diff = commonPrefix;
  if (expectedDiff || actualDiff) {
    diff += `{-${expectedDiff}-}{+${actualDiff}+}`;
  }
  diff += commonSuffix;
  
  return diff;
}

/**
 * Log fuzzy search attempt for debugging
 */
export interface FuzzySearchLog {
  timestamp: string;
  searchText: string;
  foundText?: string;
  similarity?: number;
  executionTime: number;
  success: boolean;
}

export function logFuzzySearch(
  searchText: string,
  foundMatch: FuzzyMatch | null,
  executionTime: number
): FuzzySearchLog {
  return {
    timestamp: new Date().toISOString(),
    searchText: searchText.substring(0, 200), // Truncate for logging
    foundText: foundMatch?.text?.substring(0, 200),
    similarity: foundMatch?.similarity,
    executionTime,
    success: foundMatch !== null
  };
}
```

---

**Next Step**: Continue to `03-FILESYSTEM-TOOLS.md` to implement the file operation tools.
