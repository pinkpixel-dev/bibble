# 🛠️ Built-in Tools Implementation Roadmap

*Comprehensive plan for integrating Desktop Commander functionality as native Bibble tools*

**Author**: Pink Pixel  
**Created**: August 29, 2025  
**Project**: Bibble v1.4.3+  
**Objective**: Replace external MCP server dependency with built-in file operations, process management, search, and editing tools

---

## 🎯 Project Overview

### Goals
- **Self-Contained**: Eliminate dependency on external `desktop-commander` MCP server
- **Performance**: Direct integration for faster tool execution
- **Consistency**: Native error handling and response formatting
- **Limits**: Configurable limits (10,000 line reads/writes vs. current 1,000)
- **Comprehensive**: Full Desktop Commander feature parity

### Architecture Integration
- **Location**: `src/tools/` directory alongside existing `task_complete` and `ask_question` tools
- **Agent Integration**: Direct tool registration with Bibble's Agent class
- **Configuration**: Integration with existing Bibble configuration system
- **Error Handling**: Consistent with Bibble's error handling patterns

---

## 📋 Phase 1: Foundation & Dependencies

### 1.1 Dependencies Installation
```bash
npm install @vscode/ripgrep cross-fetch fastest-levenshtein glob isbinaryfile zod
npm install -D @types/node  # Already installed
```

### 1.2 Core Infrastructure Setup
**Directory Structure**:
```
src/tools/built-in/
├── config/
│   ├── manager.ts              # Tool configuration management
│   ├── types.ts                # Configuration interfaces
│   └── defaults.ts             # Default settings
├── utilities/
│   ├── logger.ts               # Logging utilities (integrate with Bibble's logger)
│   ├── system-info.ts          # OS detection and system utilities
│   ├── timeout.ts              # Timeout wrapper functions
│   ├── validation.ts           # Path validation and security
│   ├── mime-types.ts           # MIME type detection
│   ├── fuzzy-search.ts         # Fuzzy matching for edit operations
│   ├── process-manager.ts      # Process session management
│   ├── search-manager.ts       # Search session management
│   └── edit-engine.ts          # Text editing with fuzzy fallback
├── types/
│   ├── common.ts               # Shared interfaces
│   ├── filesystem.ts           # File operation types
│   ├── process.ts              # Process management types
│   ├── search.ts               # Search functionality types
│   └── edit.ts                 # Edit operation types
├── tools/
│   ├── filesystem.ts           # File operations
│   ├── process.ts              # Process management
│   ├── search.ts               # Code and file search
│   ├── edit.ts                 # Text editing
│   └── analytics.ts            # Usage tracking (optional)
└── index.ts                    # Main export and tool registration
```

### 1.3 Integration Points
- **Agent Class**: Extend tool registration to include built-in tools
- **Configuration**: Add built-in tools section to Bibble config
- **Error Handling**: Integrate with existing error handling patterns
- **Logging**: Use Bibble's existing logger infrastructure

---

## 📁 Phase 2: Filesystem Tools Implementation

### 2.1 Core File Operations
**Tools to Implement**:
- `read_file` - Read file content with line-based pagination
- `write_file` - Write content to files with chunking support  
- `read_multiple_files` - Batch file reading
- `create_directory` - Directory creation with recursive support
- `list_directory` - Directory content listing
- `move_file` - File/directory moving and renaming
- `get_file_info` - Detailed file information

**Key Features**:
- **Line Limits**: Configurable to 10,000 lines (vs 1,000 in MCP)
- **URL Support**: HTTP/HTTPS content fetching
- **Binary Detection**: Smart binary file handling
- **Image Support**: Base64 encoding for images
- **Performance**: Streaming for large files
- **Security**: Path validation and access control

### 2.2 Configuration Integration
```typescript
// Integration with existing Bibble config
interface BibbleConfig {
  // ... existing config
  builtInTools?: {
    filesystem?: {
      readLineLimit?: number;      // Default: 10000
      writeLineLimit?: number;     // Default: 10000
      allowedDirectories?: string[];
      urlFetchTimeout?: number;    // Default: 30000ms
    };
    // ... other tool configs
  };
}
```

### 2.3 Error Handling Pattern
```typescript
// Consistent with Bibble's existing patterns
export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}
```

---

## ⚡ Phase 3: Process Management Tools

### 3.1 Process Operations
**Tools to Implement**:
- `execute_command` - Simple command execution
- `start_process` - Interactive process startup
- `interact_with_process` - Send input to running processes
- `read_output` - Read process output
- `force_terminate` - Process termination
- `list_sessions` - Active session management
- `list_processes` - System process listing
- `kill_process` - System process termination

**Key Features**:
- **Cross-Platform**: Windows (PowerShell) and Unix (bash/zsh) support
- **Interactive Sessions**: REPL and shell interactions
- **Background Processes**: Long-running command support
- **Readiness Detection**: Smart prompt pattern recognition
- **Session Management**: Track and manage multiple sessions
- **Timeouts**: Configurable operation timeouts

### 3.2 Process Session Architecture
```typescript
interface ProcessSession {
  pid: number;
  process: ChildProcess;
  command: string;
  shell: string;
  startTime: Date;
  isBlocked: boolean;
  lastOutput: string;
}
```

---

## 🔎 Phase 4: Search Tools Implementation

### 4.1 Search Operations
**Tools to Implement**:
- `search_code` - Content-based code search using ripgrep
- `search_files` - Filename-based search using glob patterns
- `quick_search` - Simple immediate search
- Advanced session-based search with pagination

**Key Features**:
- **Ripgrep Integration**: Fast, powerful regex-based search
- **Session Management**: Background searches with pagination
- **File Type Filtering**: Glob pattern support
- **Performance**: Large codebase handling
- **Context**: Line previews for code matches

### 4.2 Search Architecture
```typescript
interface SearchSession {
  sessionId: string;
  type: 'code' | 'files';
  pattern: string;
  rootPath: string;
  status: 'running' | 'completed' | 'error';
  results: SearchResult[];
  process?: ChildProcess;
}
```

---

## ✏️ Phase 5: Edit Tools Implementation

### 5.1 Text Editing Operations
**Tools to Implement**:
- `edit_block` - Surgical text replacement with fuzzy fallback

**Key Features**:
- **Exact Matching**: Precise text replacement
- **Fuzzy Fallback**: Levenshtein distance-based matching
- **Multi-Replace**: Support for multiple occurrences
- **Line Ending Handling**: Cross-platform CRLF/LF support
- **Character Diffs**: Visual diff feedback for fuzzy matches
- **Performance**: Efficient large file handling

### 5.2 Edit Engine Architecture
```typescript
interface EditResult {
  replacements: number;
  exactMatchUsed: boolean;
  similarity?: number;
  executionMs: number;
  characterDiff?: string;
}
```

---

## 🔧 Phase 6: Integration & Registration

### 6.1 Tool Registration
```typescript
// src/tools/built-in/index.ts
import { Agent } from '../mcp/agent.js';
import * as filesystem from './tools/filesystem.js';
import * as process from './tools/process.js';
import * as search from './tools/search.js';
import * as edit from './tools/edit.js';

export function registerBuiltInTools(agent: Agent) {
  // Filesystem tools
  agent.registerTool('read_file', {
    description: 'Read file content with line-based pagination',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        offset: { type: 'number', default: 0 },
        length: { type: 'number', default: 10000 },
        isUrl: { type: 'boolean', default: false }
      },
      required: ['path']
    },
    handler: filesystem.readFile
  });
  
  // ... register all other tools
}
```

### 6.2 Agent Integration
```typescript
// src/mcp/agent.ts modifications
import { registerBuiltInTools } from '../tools/built-in/index.js';

export class Agent extends McpClient {
  constructor(config: AgentConfig) {
    super(config);
    
    // Register existing built-in tools
    this.registerBuiltInTools();
    
    // Register new built-in tools
    registerBuiltInTools(this);
  }
}
```

### 6.3 Configuration Updates
```typescript
// src/config/config.ts additions
interface Config {
  // ... existing config
  builtInTools: {
    enabled: boolean;
    filesystem: {
      readLineLimit: number;
      writeLineLimit: number;
      allowedDirectories: string[];
    };
    process: {
      timeoutMs: number;
      maxSessions: number;
    };
    search: {
      maxResults: number;
      sessionTimeoutMs: number;
    };
  };
}
```

---

## 🧪 Phase 7: Testing & Validation

### 7.1 Test Suite Implementation
**Test Categories**:
- **Unit Tests**: Individual tool function testing
- **Integration Tests**: Tool integration with Agent class
- **Performance Tests**: Large file/search operation testing
- **Cross-Platform Tests**: Windows and Unix compatibility
- **Error Handling Tests**: Edge case and error scenarios

### 7.2 Manual Testing Scripts
```bash
# Create smoke tests for quick validation
node tests/manual/filesystem-smoke.mjs
node tests/manual/process-smoke.mjs
node tests/manual/search-smoke.mjs
node tests/manual/edit-smoke.mjs
```

### 7.3 Validation Checklist
- [ ] All tools function correctly in isolation
- [ ] Tools integrate properly with Agent class
- [ ] Error handling is consistent
- [ ] Performance meets expectations
- [ ] Configuration system works
- [ ] Cross-platform compatibility
- [ ] Security validation and path checking

---

## 📚 Phase 8: Documentation & Migration

### 8.1 Documentation Updates
**Files to Update**:
- `OVERVIEW.md` - Update architecture section
- `README.md` - Update installation and usage
- `CHANGELOG.md` - Document the new built-in tools
- Create `docs/BUILT_IN_TOOLS.md` - Comprehensive tool documentation

### 8.2 Migration Strategy
**Backward Compatibility**:
- Keep MCP server support for external tools
- Built-in tools take precedence over MCP tools with same names
- Configuration flag to disable built-in tools if needed

### 8.3 User Communication
**Benefits to Highlight**:
- ✅ **No External Dependencies**: No need to configure `desktop-commander` MCP server
- ✅ **Better Performance**: Direct integration eliminates MCP overhead
- ✅ **Higher Limits**: 10,000 line read/write vs 1,000
- ✅ **Improved Reliability**: Native error handling and recovery
- ✅ **Easier Setup**: Works out of the box

---

## 🚀 Implementation Timeline

### Sprint 1 (Week 1): Foundation
- [ ] Install dependencies
- [ ] Create directory structure
- [ ] Implement core utilities (logger, validation, system-info)
- [ ] Set up configuration integration
- [ ] Basic error handling patterns

### Sprint 2 (Week 2): Filesystem Tools
- [ ] Implement all filesystem operations
- [ ] URL fetching support
- [ ] Binary file detection
- [ ] Image handling (base64)
- [ ] Write chunking and limits
- [ ] Basic testing

### Sprint 3 (Week 3): Process Management
- [ ] Process spawning and management
- [ ] Interactive session handling
- [ ] Cross-platform shell support
- [ ] Background process management
- [ ] System process listing
- [ ] Process termination

### Sprint 4 (Week 4): Search Implementation
- [ ] Ripgrep integration
- [ ] Session-based search
- [ ] File pattern matching
- [ ] Pagination support
- [ ] Performance optimization

### Sprint 5 (Week 5): Edit Tools & Integration
- [ ] Edit engine implementation
- [ ] Fuzzy matching with Levenshtein
- [ ] Character diff generation
- [ ] Agent class integration
- [ ] Tool registration system

### Sprint 6 (Week 6): Testing & Polish
- [ ] Comprehensive test suite
- [ ] Performance validation
- [ ] Cross-platform testing
- [ ] Documentation updates
- [ ] Migration planning

---

## 🎉 Success Metrics

### Performance Targets
- **File Operations**: Handle 10,000+ line files efficiently
- **Search Operations**: < 5 seconds for medium codebases
- **Process Management**: < 1 second startup time
- **Edit Operations**: < 500ms for typical edits

### Quality Targets
- **Test Coverage**: > 90% for all tool functions
- **Error Handling**: Graceful degradation for all failure modes
- **Cross-Platform**: 100% compatibility Windows/macOS/Linux
- **Memory Usage**: < 100MB additional overhead

### User Experience Targets
- **Setup Time**: 0 seconds (no configuration needed)
- **Reliability**: > 99.9% tool success rate
- **Documentation**: Complete API documentation
- **Migration**: Seamless upgrade from MCP-based tools

---

## 💭 Technical Considerations

### Security
- Path validation and sanitization
- Command injection prevention
- Directory access controls
- URL validation for fetch operations

### Performance
- Streaming for large files
- Background processing for searches
- Memory-efficient file handling
- Process session cleanup

### Maintainability
- Clean separation of concerns
- Consistent error handling patterns
- Comprehensive logging
- Modular architecture

### Extensibility
- Plugin architecture for additional tools
- Configuration-driven behavior
- Analytics and usage tracking
- Tool versioning support

---

**🎯 End Goal**: A self-contained, high-performance, user-friendly Bibble with comprehensive built-in file operations, process management, search, and editing capabilities that eliminates the need for external MCP server dependencies while providing superior performance and reliability.

**Made with ❤️ by Pink Pixel**