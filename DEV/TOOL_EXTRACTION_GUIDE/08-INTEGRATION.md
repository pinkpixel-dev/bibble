# 🔗 Integration Guide

*Wire Desktop Commander tools into your TypeScript application*

---

## 🚀 Quick Start
```bash
# 1. Install dependencies
npm install @vscode/ripgrep glob fuzzysearch
npm install -D @types/node

# 2. Copy the src/desktop-commander/ directory to your project

# 3. Use the tools
import { quickSearch } from './desktop-commander/tools/search.js';
import { readFileLines } from './desktop-commander/tools/filesystem.js';
import { editBlock } from './desktop-commander/tools/edit.js';

const results = await quickSearch('/my/project', 'TODO', { searchType: 'code' });
if (results.success) {
  console.log(`Found ${results.data.length} TODOs`);
}
```

## 🏗️ Application Architecture

### For LLM/AI Agents
```typescript
// src/agent/desktop-tools.ts
import { withUsageTracking } from '../desktop-commander/utilities/tool-wrapper.js';
import * as fs from '../desktop-commander/tools/filesystem.js';
import * as search from '../desktop-commander/tools/search.js';
import * as edit from '../desktop-commander/tools/edit.js';
import * as process from '../desktop-commander/tools/process.js';

interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}

class DesktopToolsAgent {
  /**
   * Read file content with line limits
   */
  async readFile(path: string, maxLines?: number): Promise<ToolResult<string>> {
    return withUsageTracking('read_file', () => 
      fs.readFileLines(path, { maxLines })
    ).then(result => ({
      success: result.success,
      data: result.data?.content,
      error: result.error,
      warning: result.warning
    }));
  }

  /**
   * Write content to file
   */
  async writeFile(path: string, content: string): Promise<ToolResult<boolean>> {
    return withUsageTracking('write_file', () => 
      fs.writeFileContent(path, content)
    ).then(result => ({
      success: result.success,
      data: result.data,
      error: result.error
    }));
  }

  /**
   * Search for code patterns
   */
  async searchCode(rootPath: string, pattern: string, maxResults = 100): Promise<ToolResult<any[]>> {
    return withUsageTracking('search_code', () => 
      search.quickSearch(rootPath, pattern, { 
        searchType: 'code', 
        maxResults 
      })
    ).then(result => ({
      success: result.success,
      data: result.data || [],
      error: result.error
    }));
  }

  /**
   * Edit file blocks
   */
  async editFileBlock(path: string, oldText: string, newText: string): Promise<ToolResult<any>> {
    return withUsageTracking('edit_block', () => 
      edit.editBlock({ 
        filePath: path, 
        oldString: oldText, 
        newString: newText 
      })
    ).then(result => ({
      success: result.success,
      data: result.data,
      error: result.error
    }));
  }

  /**
   * Execute shell commands
   */
  async runCommand(command: string): Promise<ToolResult<string>> {
    return withUsageTracking('run_command', () => 
      process.executeCommand(command)
    ).then(result => ({
      success: result.success,
      data: result.data,
      error: result.error,
      warning: result.warning
    }));
  }
}

export const desktopTools = new DesktopToolsAgent();
```

### For CLI Applications
```typescript
// src/cli/commands.ts
import { Command } from 'commander';
import * as search from '../desktop-commander/tools/search.js';
import * as fs from '../desktop-commander/tools/filesystem.js';

const program = new Command();

program
  .command('search <pattern>')
  .description('Search for code patterns')
  .option('-r, --root <path>', 'Root directory', process.cwd())
  .option('-t, --type <type>', 'Search type (code|files)', 'code')
  .option('-m, --max <number>', 'Max results', '100')
  .action(async (pattern, options) => {
    const result = await search.quickSearch(options.root, pattern, {
      searchType: options.type as 'code' | 'files',
      maxResults: parseInt(options.max)
    });
    
    if (result.success && result.data) {
      result.data.forEach(item => {
        if (item.line) {
          console.log(`${item.file}:${item.line} - ${item.preview}`);
        } else {
          console.log(item.file);
        }
      });
    } else {
      console.error('Search failed:', result.error);
      process.exit(1);
    }
  });

program
  .command('read <file>')
  .description('Read file content')
  .option('-l, --lines <number>', 'Max lines to read')
  .action(async (file, options) => {
    const result = await fs.readFileLines(file, {
      maxLines: options.lines ? parseInt(options.lines) : undefined
    });
    
    if (result.success && result.data) {
      console.log(result.data.content);
    } else {
      console.error('Read failed:', result.error);
      process.exit(1);
    }
  });

program.parse();
```

### For Web Applications (Node.js Backend)
```typescript
// src/api/routes.ts
import express from 'express';
import * as fs from '../desktop-commander/tools/filesystem.js';
import * as search from '../desktop-commander/tools/search.js';
import { configManager } from '../desktop-commander/utilities/config-manager.js';

const router = express.Router();

// Configure for web environment
configManager.updateConfig({
  fileReadLineLimit: 500,  // Lower limits for web
  fileWriteLineLimit: 100
});

router.post('/api/search', async (req, res) => {
  try {
    const { pattern, rootPath, type = 'code', maxResults = 50 } = req.body;
    
    const result = await search.quickSearch(rootPath, pattern, {
      searchType: type,
      maxResults
    });
    
    if (result.success) {
      res.json({ success: true, results: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/api/file/:path(*)', async (req, res) => {
  try {
    const filePath = req.params.path;
    const maxLines = req.query.lines ? parseInt(req.query.lines as string) : undefined;
    
    const result = await fs.readFileLines(filePath, { maxLines });
    
    if (result.success && result.data) {
      res.json({ 
        success: true, 
        content: result.data.content,
        lineCount: result.data.lineCount,
        truncated: result.data.truncated
      });
    } else {
      res.status(404).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
```

## 🔧 Configuration
```typescript
// src/config/desktop-commander.ts
import { configManager } from '../desktop-commander/utilities/config-manager.js';

// Set up for your environment
configManager.updateConfig({
  fileReadLineLimit: 2000,   // Adjust based on your needs
  fileWriteLineLimit: 100,
  processTimeoutMs: 45000,   // 45 second timeout
  logLevel: 'info',          // 'debug' | 'info' | 'warn' | 'error'
  logToFile: true,
  maxConcurrentProcesses: 10
});

// Get current config
const config = configManager.getConfig();
console.log('Desktop Commander configured:', config);
```

## 🎛️ Error Handling Patterns
```typescript
// Consistent error handling across tools
async function safeToolCall<T>(operation: () => Promise<OperationResult<T>>): Promise<T | null> {
  try {
    const result = await operation();
    if (result.success && result.data !== undefined) {
      return result.data;
    } else {
      console.error('Tool operation failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Tool operation threw:', error);
    return null;
  }
}

// Usage
const content = await safeToolCall(() => fs.readFileLines('/path/file.txt'));
if (content) {
  console.log('File content:', content.content);
}
```

## 🧪 Testing Integration
```typescript
// tests/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/jest';
import * as fs from '../src/desktop-commander/tools/filesystem.js';
import * as search from '../src/desktop-commander/tools/search.js';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Desktop Commander Integration', () => {
  let testDir: string;
  
  beforeAll(async () => {
    testDir = join(tmpdir(), 'dc-test-' + Date.now());
    await fs.createDirectory(testDir);
  });
  
  it('should write and read files', async () => {
    const testFile = join(testDir, 'test.txt');
    const content = 'Hello, Desktop Commander!';
    
    const writeResult = await fs.writeFileContent(testFile, content);
    expect(writeResult.success).toBe(true);
    
    const readResult = await fs.readFileLines(testFile);
    expect(readResult.success).toBe(true);
    expect(readResult.data?.content.trim()).toBe(content);
  });
  
  it('should search files', async () => {
    const result = await search.quickSearch(testDir, 'Commander', {
      searchType: 'code',
      maxResults: 10
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].preview).toContain('Commander');
  });
  
  afterAll(async () => {
    await fs.deleteDirectory(testDir, { recursive: true });
  });
});
```

---

**Next Step**: Continue to `09-TESTING.md` for comprehensive test patterns, or start using the tools in your project!
