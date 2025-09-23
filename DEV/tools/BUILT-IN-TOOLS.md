# Bibble Built-in Tools Documentation

Bibble now includes a comprehensive set of built-in tools that provide essential functionality for file operations, process management, text searching, and file editing. These tools work alongside existing MCP server tools and are available immediately without any additional configuration.

## Overview

The built-in tools are organized into four categories:
- **Filesystem Tools** (9 tools): File and directory operations
- **Process Tools** (4 tools): Command execution and process management  
- **Search Tools** (3 tools): Text searching across files
- **Edit Tools** (3 tools): In-place text editing

All tools include comprehensive security checks, input validation, and error handling.

## Filesystem Tools

### 1. `read_file`
Read the contents of a file with support for encoding and line ranges.

**Parameters:**
- `path` (string, required): Path to the file to read
- `encoding` (string, optional): File encoding (default: 'utf8')
- `startLine` (number, optional): Start reading from this line number
- `endLine` (number, optional): Stop reading at this line number
- `maxSize` (number, optional): Maximum file size to read in bytes

**Example:**
```json
{
  "path": "./package.json",
  "encoding": "utf8",
  "startLine": 1,
  "endLine": 20
}
```

### 2. `write_file`
Write content to a file with support for encoding, backup, and directory creation.

**Parameters:**
- `path` (string, required): Path to the file to write
- `content` (string, required): Content to write to the file
- `encoding` (string, optional): File encoding (default: 'utf8')
- `createBackup` (boolean, optional): Create backup before writing (default: false)
- `createDirectories` (boolean, optional): Create parent directories if they don't exist (default: true)
- `overwrite` (boolean, optional): Allow overwriting existing files (default: true)

**Example:**
```json
{
  "path": "./output.txt",
  "content": "Hello, World!",
  "createBackup": true,
  "createDirectories": true
}
```

### 3. `list_directory`
List the contents of a directory with optional recursion, filtering, and hidden file inclusion.

**Parameters:**
- `path` (string, required): Path to the directory to list
- `recursive` (boolean, optional): Include subdirectories recursively (default: false)
- `includeHidden` (boolean, optional): Include hidden files and directories (default: false)
- `pattern` (string, optional): Glob pattern to filter files (e.g., "*.js")
- `sortBy` (string, optional): Sort by 'name', 'size', 'modified', or 'type'
- `maxDepth` (number, optional): Maximum recursion depth

**Example:**
```json
{
  "path": "./src",
  "recursive": true,
  "pattern": "*.ts",
  "sortBy": "modified",
  "maxDepth": 3
}
```

### 4. `find_files`
Find files matching a pattern in a directory with support for recursion and filtering.

**Parameters:**
- `directory` (string, required): Directory to search in
- `pattern` (string, required): Search pattern (glob or regex)
- `recursive` (boolean, optional): Search subdirectories (default: true)
- `caseSensitive` (boolean, optional): Case-sensitive matching (default: false)
- `includeDirectories` (boolean, optional): Include directories in results (default: false)
- `maxResults` (number, optional): Maximum number of results
- `exclude` (array, optional): Patterns to exclude from results

**Example:**
```json
{
  "directory": "./",
  "pattern": "*.json",
  "recursive": true,
  "exclude": ["node_modules", "dist"],
  "maxResults": 50
}
```

### 5. `get_file_info`
Get detailed information about a file or directory.

**Parameters:**
- `path` (string, required): Path to the file or directory

**Example:**
```json
{
  "path": "./package.json"
}
```

### 6. `create_directory`
Create a directory with optional recursive creation of parent directories.

**Parameters:**
- `path` (string, required): Path of the directory to create
- `recursive` (boolean, optional): Create parent directories if needed (default: true)
- `mode` (string, optional): Directory permissions in octal format (Unix only)

**Example:**
```json
{
  "path": "./new/nested/directory",
  "recursive": true
}
```

### 7. `copy_file`
Copy a file or directory to a new location with optional overwrite and timestamp preservation.

**Parameters:**
- `source` (string, required): Source file or directory path
- `destination` (string, required): Destination path
- `overwrite` (boolean, optional): Allow overwriting existing files (default: false)
- `preserveTimestamps` (boolean, optional): Preserve original timestamps (default: true)
- `recursive` (boolean, optional): Copy directories recursively (default: true)

**Example:**
```json
{
  "source": "./src/config.js",
  "destination": "./backup/config.js",
  "overwrite": true,
  "preserveTimestamps": true
}
```

### 8. `move_file`
Move or rename a file or directory to a new location.

**Parameters:**
- `source` (string, required): Source file or directory path
- `destination` (string, required): Destination path
- `overwrite` (boolean, optional): Allow overwriting existing files (default: false)

**Example:**
```json
{
  "source": "./old-name.txt",
  "destination": "./new-name.txt",
  "overwrite": false
}
```

### 9. `delete_file`
Delete a file or directory with optional recursive deletion.

**Parameters:**
- `path` (string, required): Path to the file or directory to delete
- `recursive` (boolean, optional): Delete directories and their contents (default: false)
- `force` (boolean, optional): Force deletion of read-only files (default: false)

**Example:**
```json
{
  "path": "./temp-directory",
  "recursive": true,
  "force": false
}
```

## Process Tools

### 1. `execute_command`
Execute a system command with comprehensive security checks and monitoring.

**Parameters:**
- `command` (string, required): Command to execute
- `args` (array, optional): Command arguments
- `cwd` (string, optional): Working directory for the command
- `timeout` (number, optional): Timeout in milliseconds
- `captureOutput` (boolean, optional): Capture stdout/stderr (default: true)
- `shell` (boolean, optional): Execute in shell (default: false)
- `env` (object, optional): Environment variables

**Example:**
```json
{
  "command": "npm",
  "args": ["install", "express"],
  "cwd": "./my-project",
  "timeout": 30000,
  "captureOutput": true
}
```

### 2. `get_processes`
Get a list of running processes with filtering and sorting options.

**Parameters:**
- `nameFilter` (string, optional): Filter processes by name
- `sortBy` (string, optional): Sort by 'pid', 'name', 'cpu', or 'memory'
- `limit` (number, optional): Maximum number of processes to return

**Example:**
```json
{
  "nameFilter": "node",
  "sortBy": "memory",
  "limit": 10
}
```

### 3. `kill_process`
Terminate a process by PID with safety checks to prevent killing critical system processes.

**Parameters:**
- `pid` (number, required): Process ID to terminate
- `signal` (string, optional): Signal to send (default: 'SIGTERM')
- `force` (boolean, optional): Use SIGKILL if SIGTERM fails (default: false)

**Example:**
```json
{
  "pid": 12345,
  "signal": "SIGTERM",
  "force": false
}
```

### 4. `monitor_process`
Monitor a process by PID over a specified duration, collecting CPU and memory usage samples.

**Parameters:**
- `pid` (number, required): Process ID to monitor
- `interval` (number, optional): Sampling interval in milliseconds (default: 1000)
- `duration` (number, optional): Total monitoring duration in milliseconds (default: 10000)

**Example:**
```json
{
  "pid": 12345,
  "interval": 500,
  "duration": 30000
}
```

## Search Tools

### 1. `search_files`
Search for text patterns across multiple files in a directory with advanced filtering and context options.

**Parameters:**
- `query` (string, required): Text pattern to search for
- `directory` (string, required): Directory to search in
- `filePattern` (string, optional): File pattern to match (e.g., "*.js")
- `recursive` (boolean, optional): Search subdirectories (default: true)
- `caseSensitive` (boolean, optional): Case-sensitive search (default: false)
- `wholeWord` (boolean, optional): Match whole words only (default: false)
- `regex` (boolean, optional): Treat query as regex (default: false)
- `maxResults` (number, optional): Maximum number of results
- `contextLines` (number, optional): Lines of context around matches (default: 2)
- `exclude` (array, optional): Patterns to exclude from search

**Example:**
```json
{
  "query": "function.*async",
  "directory": "./src",
  "filePattern": "*.ts",
  "regex": true,
  "contextLines": 3,
  "exclude": ["*.test.ts", "dist"]
}
```

### 2. `grep_search`
Perform grep-like pattern searching across specified files with advanced options.

**Parameters:**
- `pattern` (string, required): Search pattern
- `files` (array, required): List of files to search
- `caseSensitive` (boolean, optional): Case-sensitive search (default: false)
- `wholeWord` (boolean, optional): Match whole words only (default: false)
- `regex` (boolean, optional): Treat pattern as regex (default: false)
- `invert` (boolean, optional): Invert match (show non-matching lines) (default: false)
- `lineNumbers` (boolean, optional): Show line numbers (default: true)
- `contextBefore` (number, optional): Lines of context before match
- `contextAfter` (number, optional): Lines of context after match
- `maxMatches` (number, optional): Maximum matches per file

**Example:**
```json
{
  "pattern": "TODO|FIXME",
  "files": ["./src/index.ts", "./src/utils.ts"],
  "regex": true,
  "lineNumbers": true,
  "contextBefore": 1,
  "contextAfter": 1
}
```

### 3. `search_in_file`
Search for text patterns within a single file with context and highlighting.

**Parameters:**
- `query` (string, required): Text pattern to search for
- `filePath` (string, required): Path to the file to search
- `caseSensitive` (boolean, optional): Case-sensitive search (default: false)
- `wholeWord` (boolean, optional): Match whole words only (default: false)
- `regex` (boolean, optional): Treat query as regex (default: false)
- `maxMatches` (number, optional): Maximum number of matches to return
- `contextLines` (number, optional): Lines of context around matches (default: 2)

**Example:**
```json
{
  "query": "export.*function",
  "filePath": "./src/utils.ts",
  "regex": true,
  "maxMatches": 10,
  "contextLines": 2
}
```

## Edit Tools

### 1. `find_replace_in_file`
Find and replace text patterns within a single file with backup and validation options.

**Parameters:**
- `filePath` (string, required): Path to the file to edit
- `findPattern` (string, required): Pattern to find
- `replaceText` (string, required): Text to replace with
- `regex` (boolean, optional): Treat findPattern as regex (default: false)
- `caseSensitive` (boolean, optional): Case-sensitive matching (default: false)
- `wholeWord` (boolean, optional): Match whole words only (default: false)
- `maxReplacements` (number, optional): Maximum number of replacements
- `createBackup` (boolean, optional): Create backup before editing (default: true)

**Example:**
```json
{
  "filePath": "./src/config.js",
  "findPattern": "const API_URL = .*",
  "replaceText": "const API_URL = 'https://api.example.com'",
  "regex": true,
  "createBackup": true
}
```

### 2. `insert_text`
Insert text at a specific line and column position in a file with backup options.

**Parameters:**
- `filePath` (string, required): Path to the file to edit
- `text` (string, required): Text to insert
- `line` (number, required): Line number to insert at (1-based)
- `column` (number, optional): Column position to insert at (0-based, default: 0)
- `createBackup` (boolean, optional): Create backup before editing (default: true)

**Example:**
```json
{
  "filePath": "./src/index.js",
  "text": "console.log('Debug: Function called');",
  "line": 10,
  "column": 0,
  "createBackup": true
}
```

### 3. `delete_lines`
Delete specific lines or line ranges from a file with backup options.

**Parameters:**
- `filePath` (string, required): Path to the file to edit
- `startLine` (number, required): Starting line number to delete (1-based)
- `endLine` (number, optional): Ending line number (inclusive, defaults to startLine)
- `createBackup` (boolean, optional): Create backup before editing (default: true)

**Example:**
```json
{
  "filePath": "./src/temp.js",
  "startLine": 5,
  "endLine": 10,
  "createBackup": true
}
```

## Configuration

The built-in tools can be configured through a JSON configuration file. The configuration is automatically loaded and includes sensible defaults.

### Configuration File Location

The configuration file can be placed at:
- `~/.bibble/built-in-tools.json` (user-specific)
- Or specify a custom path when initializing

### Configuration Schema

```json
{
  "filesystem": {
    "maxFileSize": 10485760,
    "allowedExtensions": [".txt", ".md", ".json", ".js", ".ts", ".py", ".html", ".css", ".xml", ".yaml", ".yml"],
    "blockedPaths": ["C:\\Windows\\System32", "/etc", "/usr", "/bin"],
    "defaultEncoding": "utf8"
  },
  "process": {
    "timeout": 30000,
    "maxConcurrent": 3,
    "allowedCommands": [],
    "blockedCommands": ["rm -rf", "del /f", "format", "mkfs"]
  },
  "search": {
    "maxResults": 1000,
    "maxFileSize": 5242880,
    "defaultExcludes": ["node_modules", ".git", "dist", "build", ".next"]
  },
  "edit": {
    "createBackups": true,
    "maxUndoHistory": 10,
    "validateSyntax": false
  }
}
```

### Configuration Options

#### Filesystem Configuration
- `maxFileSize`: Maximum file size in bytes that can be read/written (default: 10MB)
- `allowedExtensions`: Array of allowed file extensions for operations
- `blockedPaths`: Array of paths that are blocked from access for security
- `defaultEncoding`: Default text encoding for file operations

#### Process Configuration
- `timeout`: Default timeout for command execution in milliseconds
- `maxConcurrent`: Maximum number of concurrent process operations
- `allowedCommands`: Whitelist of allowed commands (empty = allow all except blocked)
- `blockedCommands`: Blacklist of dangerous commands that are always blocked

#### Search Configuration
- `maxResults`: Maximum number of search results to return
- `maxFileSize`: Maximum file size to search within
- `defaultExcludes`: Default patterns to exclude from searches

#### Edit Configuration
- `createBackups`: Whether to create backups by default when editing files
- `maxUndoHistory`: Maximum number of undo operations to track
- `validateSyntax`: Whether to validate syntax after edits (when possible)

## Security Features

All built-in tools include comprehensive security measures:

### Path Validation
- Prevents access to system directories
- Validates file extensions against allowed lists
- Blocks dangerous path patterns (e.g., `../../../etc/passwd`)

### Command Security
- Whitelist/blacklist filtering for process execution
- Argument validation to prevent injection attacks
- Timeout limits to prevent runaway processes

### Rate Limiting
- Built-in rate limiting for all operations
- Prevents abuse and resource exhaustion
- Configurable limits per operation type

### Input Validation
- Comprehensive parameter validation using Zod schemas
- Type checking and range validation
- Sanitization of user inputs

## Error Handling

All tools provide detailed error messages and handle common failure scenarios:

- **File not found**: Clear messages when files don't exist
- **Permission denied**: Informative messages about access issues
- **Invalid parameters**: Detailed validation error messages
- **Security violations**: Clear explanations when operations are blocked
- **System errors**: Graceful handling of underlying system failures

## Testing the Tools

### Basic File Operations Test
```json
// Create a test file
{
  "tool": "write_file",
  "args": {
    "path": "./test.txt",
    "content": "Hello, World!\nThis is a test file."
  }
}

// Read it back
{
  "tool": "read_file",
  "args": {
    "path": "./test.txt"
  }
}

// Get file info
{
  "tool": "get_file_info",
  "args": {
    "path": "./test.txt"
  }
}
```

### Search Operations Test
```json
// Search for patterns in files
{
  "tool": "search_files",
  "args": {
    "query": "function",
    "directory": "./src",
    "filePattern": "*.js",
    "contextLines": 1
  }
}
```

### Process Operations Test
```json
// List running processes
{
  "tool": "get_processes",
  "args": {
    "nameFilter": "node",
    "limit": 5
  }
}

// Execute a safe command
{
  "tool": "execute_command",
  "args": {
    "command": "echo",
    "args": ["Hello from built-in tools!"],
    "captureOutput": true
  }
}
```

### Edit Operations Test
```json
// Find and replace in a file
{
  "tool": "find_replace_in_file",
  "args": {
    "filePath": "./test.txt",
    "findPattern": "World",
    "replaceText": "Universe",
    "createBackup": true
  }
}
```

## Best Practices

1. **Always specify required parameters**: Each tool has specific required parameters
2. **Use appropriate file extensions**: Check `allowedExtensions` in config
3. **Be mindful of file sizes**: Large files may hit `maxFileSize` limits
4. **Test with backups enabled**: Use `createBackup: true` when editing important files
5. **Use appropriate timeouts**: Set reasonable timeouts for long-running commands
6. **Respect rate limits**: Don't make too many rapid requests
7. **Check security settings**: Understand what paths and commands are blocked

## Troubleshooting

### Common Issues

**"Path not allowed" errors**: Check if the path is in the `blockedPaths` configuration

**"File too large" errors**: Increase `maxFileSize` or work with smaller files

**"Command not allowed" errors**: Check `allowedCommands` and `blockedCommands` configuration

**Rate limit exceeded**: Wait a moment between rapid tool calls

**Permission denied**: Ensure you have appropriate file system permissions

### Debug Mode

To get more detailed error information, check the console output when running Bibble. The built-in tools provide comprehensive logging for debugging issues.
