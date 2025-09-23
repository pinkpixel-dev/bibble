# 📁 Filesystem Tools

*Complete recreation of Desktop Commander's file operation tools*

---

## 🎯 Overview

Desktop Commander provides comprehensive file system operations including reading, writing, searching, and managing files. These tools support line-based pagination, URL fetching, binary file detection, and performance optimizations.

## 📋 Core Types and Interfaces

```typescript
// src/desktop-commander/types/filesystem.ts
export interface FileReadOptions {
  offset?: number;     // Line offset (negative for tail behavior)
  length?: number;     // Number of lines to read
  isUrl?: boolean;     // Whether path is a URL
}

export interface FileWriteOptions {
  mode?: 'rewrite' | 'append';
}

export interface FileResult {
  content: string;
  mimeType?: string;
  isImage?: boolean;
  lineCount?: number;
  truncated?: boolean;
}

export interface FileInfo {
  path: string;
  exists: boolean;
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  lineCount?: number;
  lastLine?: number;
  appendPosition?: number;
  mimeType?: string;
  created: Date | null;
  modified: Date | null;
  permissions?: string;
}

export interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}
```

## 🗂️ MIME Type Detection

```typescript
// src/desktop-commander/utilities/mime-types.ts
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  // Text files
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.jsx': 'text/jsx',
  '.tsx': 'text/tsx',
  '.html': 'text/html',
  '.css': 'text/css',
  '.xml': 'text/xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.csv': 'text/csv',
  '.log': 'text/plain',
  
  // Programming languages
  '.py': 'text/x-python',
  '.java': 'text/x-java',
  '.cpp': 'text/x-c++',
  '.c': 'text/x-c',
  '.h': 'text/x-c',
  '.php': 'text/x-php',
  '.rb': 'text/x-ruby',
  '.go': 'text/x-go',
  '.rs': 'text/x-rust',
  '.sh': 'text/x-shellscript',
  '.bash': 'text/x-shellscript',
  '.zsh': 'text/x-shellscript',
  '.ps1': 'text/x-powershell',
  
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  
  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.7z': 'application/x-7z-compressed',
  '.rar': 'application/vnd.rar'
};

const IMAGE_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'
]);

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export function isImageFile(mimeType: string): boolean {
  return IMAGE_TYPES.has(mimeType);
}

export function isTextFile(mimeType: string): boolean {
  return mimeType.startsWith('text/') || 
         mimeType === 'application/json' ||
         mimeType === 'application/xml';
}
```
## 📖 File Reading Implementation

```typescript
// src/desktop-commander/tools/filesystem.ts (Part 1 - Reading)
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { isBinaryFile } from 'isbinaryfile';
import fetch from 'cross-fetch';
import { validatePath } from '../utilities/validation.js';
import { withTimeout } from '../utilities/timeout.js';
import { getMimeType, isImageFile } from '../utilities/mime-types.js';
import { configManager } from '../config/config-manager.js';
import { logger } from '../utilities/logger.js';
import { FileReadOptions, FileResult, OperationResult } from '../types/filesystem.js';

const FILE_OPERATION_TIMEOUTS = {
  PATH_VALIDATION: 10000,    // 10 seconds
  URL_FETCH: 30000,          // 30 seconds  
  FILE_READ: 30000,          // 30 seconds
} as const;

const FILE_SIZE_LIMITS = {
  LARGE_FILE_THRESHOLD: 10 * 1024 * 1024,  // 10MB
  LINE_COUNT_LIMIT: 10 * 1024 * 1024,      // 10MB for line counting
} as const;

/**
 * Read file content with line-based pagination
 * Equivalent to Desktop Commander's read_file tool
 */
export async function readFile(
  filePath: string, 
  options: FileReadOptions = {}
): Promise<OperationResult<FileResult>> {
  const { offset = 0, length, isUrl = false } = options;
  
  try {
    // Handle URL reading
    if (isUrl) {
      return await readFromUrl(filePath);
    }
    
    // Validate and normalize path
    const validPath = await validatePath(filePath);
    const mimeType = getMimeType(validPath);
    const isImage = isImageFile(mimeType);
    
    // Check if file exists and get stats
    const stats = await fs.stat(validPath);
    const fileSize = stats.size;
    
    // Check if binary (but allow images)
    if (!isImage && await isBinaryFile(validPath)) {
      return {
        success: false,
        error: `Cannot read binary file as text: ${filePath} (${mimeType})`
      };
    }
    
    // Get default read length from config
    const config = await configManager.getConfig();
    const defaultLength = config.data?.fileReadLineLimit || 1000;
    const actualLength = length || defaultLength;
    
    // Handle different reading strategies based on offset and file size
    let content: string;
    let lineCount: number | undefined;
    let truncated = false;
    
    if (offset < 0) {
      // Negative offset = tail behavior
      const result = await readLastNLines(validPath, Math.abs(offset));
      content = result.content;
      lineCount = result.lineCount;
    } else if (fileSize < FILE_SIZE_LIMITS.LARGE_FILE_THRESHOLD) {
      // Small files: read all then slice
      const result = await readSmallFile(validPath, offset, actualLength);
      content = result.content;
      lineCount = result.lineCount;
      truncated = result.truncated;
    } else {
      // Large files: use streaming approach
      const result = await readLargeFile(validPath, offset, actualLength);
      content = result.content;
      lineCount = result.lineCount;
      truncated = result.truncated;
    }
    
    // Handle image files
    if (isImage) {
      const bytes = await fs.readFile(validPath); // raw bytes
      const base64 = bytes.toString('base64');
      const ext = path.extname(validPath).toLowerCase().slice(1).replace('jpg','jpeg');
      const mime = `image/${ext || 'png'}`;
      return {
    	success: true,
    	data: {
      	  type: 'image',
          mimeType: mime,
          base64,
          isTruncated: false
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Read file failed', { filePath, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Read from URL with timeout
 */
async function readFromUrl(url: string): Promise<OperationResult<FileResult>> {
  try {
    const response = await withTimeout(
      fetch(url),
      FILE_OPERATION_TIMEOUTS.URL_FETCH,
      'URL fetch',
      null
    );
    
    if (!response || !response.ok) {
      throw new Error(`HTTP ${response?.status}: ${response?.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || 'text/plain';
    const isImage = isImageFile(contentType);
    
    if (isImage) {
      const buffer = await response.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      
      return {
        success: true,
        data: {
          content: base64Data,
          mimeType: contentType,
          isImage: true
        }
      };
    } else {
      const content = await response.text();
      return {
        success: true,
        data: {
          content,
          mimeType: contentType,
          isImage: false,
          lineCount: content.split('\n').length
        }
      };
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to fetch URL: ${errorMessage}` };
  }
}

/**
 * Read last N lines efficiently (tail behavior)
 */
async function readLastNLines(filePath: string, lineCount: number): Promise<{ content: string; lineCount: number }> {
  const lines: string[] = [];
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const allLines: string[] = [];
  for await (const line of rl) {
    allLines.push(line);
  }
  
  const startIndex = Math.max(0, allLines.length - lineCount);
  const selectedLines = allLines.slice(startIndex);
  
  return {
    content: selectedLines.join('\n'),
    lineCount: selectedLines.length
  };
}

/**
 * Read small file with line slicing
 */
async function readSmallFile(
  filePath: string, 
  offset: number, 
  length: number
): Promise<{ content: string; lineCount: number; truncated: boolean }> {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  
  const startIndex = Math.max(0, offset);
  const endIndex = Math.min(lines.length, offset + length);
  const selectedLines = lines.slice(startIndex, endIndex);
  
  return {
    content: selectedLines.join('\n'),
    lineCount: selectedLines.length,
    truncated: endIndex < lines.length
  };
}

/**
 * Read large file with streaming
 */
async function readLargeFile(
  filePath: string, 
  offset: number, 
  length: number
): Promise<{ content: string; lineCount: number; truncated: boolean }> {
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const lines: string[] = [];
  let currentLine = 0;
  let truncated = false;
  
  for await (const line of rl) {
    if (currentLine >= offset && lines.length < length) {
      lines.push(line);
    } else if (lines.length >= length) {
      truncated = true;
      break;
    }
    currentLine++;
  }
  
  return {
    content: lines.join('\n'),
    lineCount: lines.length,
    truncated
  };
}
```
## ✏️ File Writing Implementation

```typescript
// src/desktop-commander/tools/filesystem.ts (Part 2 - Writing)

/**
 * Write content to file with line limit checking
 * Equivalent to Desktop Commander's write_file tool
 */
export async function writeFile(
  filePath: string,
  content: string,
  options: FileWriteOptions = {}
): Promise<OperationResult<{ lineCount: number; warning?: string }>> {
  const { mode = 'rewrite' } = options;
  
  try {
    const validPath = await validatePath(filePath);
    
    // Get line limit from config
    const config = await configManager.getConfig();
    const maxLines = config.data?.fileWriteLineLimit || 50;
    
    // Count lines in content
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    // Generate warning if over limit (but don't block)
    let warning: string | undefined;
    if (lineCount > maxLines) {
      warning = `File written successfully! (${lineCount} lines). ` +
               `Performance tip: For optimal speed, consider chunking files into ≤${Math.max(25, Math.floor(maxLines * 0.6))} line pieces in future operations.`;
    }
    
    // Write file based on mode
    if (mode === 'append') {
      await fs.appendFile(validPath, content);
    } else {
      await fs.writeFile(validPath, content);
    }
    
    await logger.info('File written', { 
      path: filePath, 
      mode, 
      lineCount, 
      exceeded: lineCount > maxLines 
    });
    
    return {
      success: true,
      data: { lineCount, warning }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Write file failed', { filePath, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Read multiple files simultaneously
 * Equivalent to Desktop Commander's read_multiple_files tool
 */
export async function readMultipleFiles(
  filePaths: string[],
  options: FileReadOptions = {}
): Promise<OperationResult<Array<{ path: string; result: OperationResult<FileResult> }>>> {
  try {
    const results = await Promise.all(
      filePaths.map(async (path) => ({
        path,
        result: await readFile(path, options)
      }))
    );
    
    return { success: true, data: results };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create directory recursively
 * Equivalent to Desktop Commander's create_directory tool
 */
export async function createDirectory(dirPath: string): Promise<OperationResult> {
  try {
    const validPath = await validatePath(dirPath);
    await fs.mkdir(validPath, { recursive: true });
    
    await logger.info('Directory created', { path: dirPath });
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Create directory failed', { dirPath, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * List directory contents
 * Equivalent to Desktop Commander's list_directory tool
 */
export async function listDirectory(dirPath: string): Promise<OperationResult<DirectoryEntry[]>> {
  try {
    const validPath = await validatePath(dirPath);
    const entries = await fs.readdir(validPath, { withFileTypes: true });
    
    const result: DirectoryEntry[] = [];
    for (const entry of entries) {
      const entryPath = path.join(validPath, entry.name);
      let size: number | undefined;
      let modified: Date | undefined;
      
      try {
        const stats = await fs.stat(entryPath);
        size = stats.size;
        modified = stats.mtime;
      } catch {
        // If we can't stat, just continue without size/date
      }
      
      result.push({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size,
        modified
      });
    }
    
    return { success: true, data: result };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('List directory failed', { dirPath, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Move/rename file or directory
 * Equivalent to Desktop Commander's move_file tool
 */
export async function moveFile(sourcePath: string, destinationPath: string): Promise<OperationResult> {
  try {
    const validSourcePath = await validatePath(sourcePath);
    const validDestPath = await validatePath(destinationPath);
    
    await fs.rename(validSourcePath, validDestPath);
    
    await logger.info('File moved', { 
      source: sourcePath, 
      destination: destinationPath 
    });
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Move file failed', { 
      sourcePath, 
      destinationPath, 
      error: errorMessage 
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Get detailed file information
 * Equivalent to Desktop Commander's get_file_info tool
 */
export async function getFileInfo(filePath: string): Promise<OperationResult<FileInfo>> {
  try {
    const validPath = await validatePath(filePath);
    
    let stats: fs.Stats;
    try {
      stats = await fs.stat(validPath);
    } catch {
      return {
        success: true,
        data: {
          path: filePath,
          exists: false,
          isFile: false,
          isDirectory: false,
          size: 0,
          created: null,
          modified: null
        }
      };
    }
    
    const mimeType = getMimeType(validPath);
    let lineCount: number | undefined;
    let lastLine: number | undefined;
    let appendPosition: number | undefined;
    
    // For text files, count lines
    if (stats.isFile() && stats.size < FILE_SIZE_LIMITS.LINE_COUNT_LIMIT) {
      try {
        const content = await fs.readFile(validPath, 'utf8');
        const lines = content.split('\n');
        lineCount = lines.length;
        lastLine = lineCount - 1; // Zero-indexed
        appendPosition = lineCount; // Next line position
      } catch {
        // If we can't read as text, skip line counting
      }
    }
    
    const result: FileInfo = {
      path: filePath,
      exists: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      lineCount,
      lastLine,
      appendPosition,
      mimeType,
      created: stats.birthtime,
      modified: stats.mtime,
      permissions: stats.mode.toString(8)
    };
    
    return { success: true, data: result };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Get file info failed', { filePath, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
```
## 💡 Usage Examples

### Basic File Operations
```typescript
import { 
  readFile, 
  writeFile, 
  createDirectory, 
  listDirectory, 
  getFileInfo 
} from './desktop-commander/tools/filesystem.js';

// Read a file with default settings
const result = await readFile('/path/to/file.txt');
if (result.success) {
  console.log('File content:', result.data?.content);
  console.log('Line count:', result.data?.lineCount);
} else {
  console.error('Read failed:', result.error);
}

// Read with custom options
const tailResult = await readFile('/var/log/app.log', {
  offset: -50,  // Last 50 lines
});

// Read a URL
const urlResult = await readFile('https://example.com/data.json', {
  isUrl: true
});

// Write file in chunks (recommended approach)
await writeFile('/path/to/output.txt', 'First chunk...', { mode: 'rewrite' });
await writeFile('/path/to/output.txt', 'Second chunk...', { mode: 'append' });

// Create directory structure
const dirResult = await createDirectory('/path/to/new/nested/directory');

// List directory contents
const listResult = await listDirectory('/path/to/directory');
if (listResult.success) {
  listResult.data?.forEach(entry => {
    console.log(`${entry.type}: ${entry.name} (${entry.size} bytes)`);
  });
}

// Get detailed file information
const infoResult = await getFileInfo('/path/to/file.txt');
if (infoResult.success && infoResult.data?.exists) {
  console.log('File size:', infoResult.data.size);
  console.log('Line count:', infoResult.data.lineCount);
  console.log('Last modified:', infoResult.data.modified);
}
```

### Advanced File Reading Patterns
```typescript
// Paginated file reading
async function readFileInPages(filePath: string, pageSize: number = 1000) {
  let offset = 0;
  const pages: string[] = [];
  
  while (true) {
    const result = await readFile(filePath, {
      offset,
      length: pageSize
    });
    
    if (!result.success || !result.data?.content) {
      break;
    }
    
    pages.push(result.data.content);
    
    // Check if we got less than requested (end of file)
    if (result.data.truncated === false || result.data.lineCount < pageSize) {
      break;
    }
    
    offset += pageSize;
  }
  
  return pages;
}

// Safe binary file handling
async function readFileWithBinaryCheck(filePath: string) {
  const infoResult = await getFileInfo(filePath);
  
  if (!infoResult.success || !infoResult.data?.exists) {
    throw new Error('File does not exist');
  }
  
  const mimeType = infoResult.data.mimeType || '';
  
  if (mimeType.startsWith('image/')) {
    // Handle image files
    const result = await readFile(filePath);
    if (result.success && result.data?.isImage) {
      return {
        type: 'image',
        data: result.data.content, // Base64 encoded
        mimeType: result.data.mimeType
      };
    }
  } else if (mimeType.startsWith('text/')) {
    // Handle text files
    const result = await readFile(filePath);
    if (result.success) {
      return {
        type: 'text',
        data: result.data?.content,
        lineCount: result.data?.lineCount
      };
    }
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
```

### Configuration-Aware Usage
```typescript
import { getConfigValue } from './desktop-commander/tools/config.js';

// Respect user's configured limits
async function readFileWithConfigLimits(filePath: string, customLength?: number) {
  let length = customLength;
  
  if (!length) {
    const limitResult = await getConfigValue<number>('fileReadLineLimit');
    length = limitResult.data || 1000;
  }
  
  return await readFile(filePath, { length });
}

// Write file with limit awareness
async function writeFileWithWarnings(filePath: string, content: string) {
  const result = await writeFile(filePath, content);
  
  if (result.success && result.data?.warning) {
    console.warn('Performance warning:', result.data.warning);
    
    // Optionally suggest chunking
    const lines = content.split('\n');
    if (lines.length > 100) {
      console.log('Consider breaking this into chunks for better performance.');
    }
  }
  
  return result;
}
```

### Error Handling Best Practices
```typescript
// Comprehensive error handling
async function safeFileOperation(filePath: string, operation: 'read' | 'write', content?: string) {
  try {
    let result;
    
    switch (operation) {
      case 'read':
        result = await readFile(filePath);
        break;
      case 'write':
        if (!content) throw new Error('Content required for write operation');
        result = await writeFile(filePath, content);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    if (!result.success) {
      // Handle specific error types
      if (result.error?.includes('ENOENT')) {
        throw new Error(`File not found: ${filePath}`);
      } else if (result.error?.includes('EACCES')) {
        throw new Error(`Permission denied: ${filePath}`);
      } else if (result.error?.includes('ENOSPC')) {
        throw new Error(`No space left on device: ${filePath}`);
      } else {
        throw new Error(`Operation failed: ${result.error}`);
      }
    }
    
    return result.data;
    
  } catch (error) {
    // Log error for debugging
    await logger.error('Safe file operation failed', {
      filePath,
      operation,
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}
```

## 🔧 Integration Notes

### Performance Considerations
1. **Large files**: Use streaming approach automatically handled
2. **Binary files**: Detected and handled appropriately
3. **Images**: Converted to base64 for display
4. **URLs**: Cached responses where appropriate
5. **Line limits**: Configurable and enforceable

### Security Features
1. **Path validation**: All paths validated and normalized
2. **Directory restrictions**: Configurable allowed directories
3. **Binary detection**: Prevents reading binary files as text
4. **URL safety**: Timeout protection and validation

### Configuration Integration
1. **File read limits**: Respects `fileReadLineLimit` setting
2. **File write limits**: Respects `fileWriteLineLimit` setting
3. **Allowed directories**: Enforces `allowedDirectories` restrictions
4. **Runtime changes**: Configuration can be modified during operation

---

**Next Step**: Continue to `04-PROCESS-TOOLS.md` for process management and terminal functionality.
