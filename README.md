<p align="center">
  <img src="https://res.cloudinary.com/di7ctlowx/image/upload/v1747791202/bibble-logo_ykiwbq.png" alt="Bibble Logo" width="350"/>
</p>

# Bibble - CLI Chatbot with MCP Integration

[![npm version](https://img.shields.io/npm/v/@pinkpixel/bibble.svg)](https://www.npmjs.com/package/@pinkpixel/bibble)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT-green.svg)](https://openai.com/)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude-orange.svg)](https://www.anthropic.com/)
[![Google](https://img.shields.io/badge/Google-Gemini-blue.svg)](https://ai.google.dev/)
[![CLI Tool](https://img.shields.io/badge/CLI-Tool-yellow.svg)](https://github.com/pinkpixel-dev/bibble)
[![Streaming](https://img.shields.io/badge/Real--time-Streaming-red.svg)](https://github.com/pinkpixel-dev/bibble)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-pink.svg)](https://pinkpixel.dev)
[![GitHub Stars](https://img.shields.io/github/stars/sizzlebop/bibble?style=social)](https://github.com/pinkpixel-dev/bibble/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/sizzlebop/bibble?style=social)](https://github.com/pinkpixel-dev/bibble/network/members)

Bibble is a command-line interface (CLI) chatbot application built in TypeScript that runs directly in your terminal. It supports OpenAI, Anthropic, Google Gemini, and OpenAI-compatible API endpoints, implements real-time response streaming, maintains chat memory, and functions as an MCP (Model Context Protocol) client.

## Features

- Launch as a chat instance via the CLI command `bibble`
- Support for OpenAI, Anthropic (Claude models), Google Gemini, and OpenAI-compatible API endpoints
- Real-time response streaming of model output
- Contextual multi-turn conversations with chat memory
- MCP client functionality for connecting to MCP-compatible servers
- **🌐 BUILT-IN WEB SEARCH & RESEARCH TOOLS** - Multi-engine search with intelligent fallbacks
- **🔍 Comprehensive Web Search** - DuckDuckGo, Bing, Google, and Brave integration with AI-powered query enhancement
- **🧠 Advanced Research Assistant** - Orchestrated workflows that combine built-in web search and content extraction for thorough answers
- **⚡ Quick Search Tools** - Fast information retrieval without external MCP server setup
- Settings and configuration options accessible from the CLI
- Detailed error handling and user feedback
- **🎨 Beautiful Pink Pixel themed terminal interface with gorgeous ASCII banners**
- **📊 Stunning table displays for configuration and data with smart color coding**
- **🌈 Gradient text effects and role-based chat styling**
- **🧰 Enhanced interactive tool display system with status badges and syntax highlighting**
- Colored text output and markdown rendering
- Chat history storage and retrieval
- Model switching capabilities
- Configurable system prompts and user guidelines

## Installation

### Prerequisites

- Node.js v16 or higher
- npm v7 or higher

### Install from npm

```bash
# Install the official package
npm install -g @pinkpixel/bibble
```

### Install from source

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Build the project
   ```bash
   npm run build
   ```
4. Install globally
   ```bash
   npm install -g .
   ```

## Usage

After installation, you can run Bibble using the command `bibble`. If you installed the package with the `@pinkpixel` scope, you can also use `npx @pinkpixel/bibble`.

### Start a chat

```bash
bibble
```

or

```bash
bibble chat
```

With npx:

```bash
npx @pinkpixel/bibble
```

### Configure settings

```bash
bibble config
```

### Manage chat history

```bash
bibble history
```

## Commands

### Chat commands

- `bibble chat` - Start a chat session
- `bibble chat --model gpt-4` - Start a chat with a specific model
- `bibble chat --continue` - Continue the most recent chat
- `bibble chat --history <id>` - Load a specific chat history

### Config commands

- `bibble config list` - List all configuration settings
- `bibble config set <key> <value>` - Set a configuration value
- `bibble config get <key>` - Get a configuration value
- `bibble config reset` - Reset configuration to defaults
- `bibble config api-key` - Set up API key for a provider
- `bibble config mcp-servers` - Manage MCP server configurations
- `bibble config web-search` - Configure preferred search engine and API keys
- `bibble config timezone` - Configure default timezone for datetime tools
- `bibble config user-guidelines` - Configure user guidelines

### History commands

- `bibble history list` - List chat history
- `bibble history show <id>` - Show a specific chat history
- `bibble history delete <id>` - Delete a chat history
- `bibble history clear` - Clear all chat history
- `bibble history export <id> <filename>` - Export chat history to a JSON file
- `bibble history import <filename>` - Import chat history from a JSON file

### System commands

- `bibble setup` - Run the setup wizard
- `bibble system-prompt` - View the system prompt with tools list
- `bibble diagnose` - Diagnose environment and terminal compatibility
- `bibble diagnose --verbose` - Show detailed diagnostic information

## In-chat commands

The following commands are available during a chat session:

- `/help` - Display help information
- `/exit` or `/quit` - Exit the chat
- `/clear` - Clear the screen
- `/save` - Save the current chat to history
- `/reset` - Reset the current conversation
- `/multiline` or `/paste` - Enter multi-line input mode for pasting documentation, code, etc.
- ``` - Start code block mode (type ``` and continue with your code)

## Enhanced Tool Display System

Bibble v1.4.0 introduces a completely overhauled tool display system featuring:

- **Dynamic Status Badges**: Visual indicators showing tool execution status (running, completed, error)
- **Boxed Parameter/Output Sections**: Clearly delineated tool input/output for better readability
- **Syntax Highlighted JSON**: Beautiful formatting for JSON parameters and results
- **Clickable URLs**: Terminal hyperlinks for any URLs found in tool outputs
- **Clipboard Support**: Copy tool results directly to clipboard with interactive buttons
- **Keyboard Shortcuts**: Intuitive keyboard navigation for tool output exploration

These enhancements make working with MCP tools more intuitive and visually appealing. The new display system can be toggled using environment variables if compatibility issues arise.

## 🌐 Built-In Web Search & Research Tools

**New in v1.7.0!** Bibble now includes comprehensive web search and research capabilities built directly into the application - no external MCP servers required!

### 🔍 Web Search Features

- **Multi-Engine Support**: Integrated DuckDuckGo (primary), Bing, Google, and Brave search with intelligent fallbacks
- **AI-Powered Query Enhancement**: Smart query optimization for better search results
- **Advanced Content Extraction**: Intelligent web scraping with rate limiting and content parsing
- **Research Session Management**: Event-driven research workflows with progress tracking
- **Cross-Platform Compatible**: Optimized for Windows environments with proper path handling

### Available Built-In Web Tools

1. **🔍 Web Search Tool** (`web_search`)
   - Multi-engine search with DuckDuckGo, Bing, Google, and Brave fallbacks
   - Configurable result counts and search depth
   - Real-time progress monitoring
   - Clean, formatted search results with metadata

2. **⚡ Quick Search Tool** (`quick_web_search`)
   - Fast single-query searches for immediate answers
   - Streamlined interface for rapid information retrieval
   - Minimal processing overhead for speed

3. **📊 Research Session Status** (`research_status`)
   - Monitor ongoing research operations
   - Progress visualization and session management
   - Result aggregation and consolidated findings

The prior comprehensive research tool family has been retired; Bibble now routes every deep-dive request through these core tools, letting the enhanced research agent sequence searches, follow-ups, and content extraction as a single workflow.

### Configure Web Search Engines

Configure your preferred search engine and API keys:

```bash
bibble config web-search
```

This wizard allows you to:
- **Choose preferred engine**: DuckDuckGo (no API key), Bing, Google Custom Search, or Brave
- **Set API keys**: Configure keys for Bing, Google, or Brave search APIs
- **Automatic fallbacks**: If your preferred engine fails, Bibble automatically tries other available engines

### How to Use Web Search

Once you start Bibble, the web search tools are automatically available. Simply ask questions that require web search, and Bibble will intelligently use the appropriate search tools:

```
> What are the latest developments in AI?
🔍 Bibble will automatically search the web using the built-in tools...
```

Or explicitly request web search:
```
> Can you search for information about TypeScript 5.0 features?
🌐 Bibble will use the `web_search` tool to find current information...
```

### Environment Variables

- `BIBBLE_DISABLE_ENHANCED_TOOLS`: Set to `true` to disable enhanced tool displays
- `BIBBLE_TOOL_DISPLAY_MODE`: Set to `basic`, `compact`, or `full` (default)

## Configuration

Bibble stores its configuration in a `.bibble` directory in your home directory. The configuration includes:

- API keys
- Default model settings
- UI preferences
- MCP server configurations
- User guidelines (additional instructions for the AI)

### 🎛️ Model Configuration Wizard

Bibble v1.6.1 introduces a user-friendly configuration wizard to easily set up your AI provider and model settings:

```bash
bibble config configure
```

The wizard guides you through:
- **Provider Selection**: Choose from OpenAI, Anthropic, Google, or OpenAI Compatible
- **Model Selection**: Pick from predefined models or enter custom model IDs
- **Parameter Configuration**: Set temperature, max tokens, reasoning effort, and more
  - **OpenAI Compatible**: Define custom parameters (name and value pairs) to ensure compatibility with your specific endpoint
- **Automatic Saving**: All settings are saved automatically with confirmation

### Other Configuration Commands

```bash
# Set up API keys
bibble config api-key

# Set default provider
bibble config default-provider

# View all settings
bibble config list

# Set specific values
bibble config set <key> <value>

# Reset to defaults
bibble config reset
```

## MCP Integration

Bibble functions as an MCP client, allowing it to connect to MCP-compatible servers and use their tools. MCP (Model Context Protocol) is a protocol for connecting language models to external tools and services.

To configure MCP servers, use:

```bash
bibble config mcp-servers
```

## Troubleshooting

### Environment Diagnostics

Bibble includes built-in diagnostic tools to help troubleshoot common issues:

```bash
# Basic diagnostic information
bibble diagnose

# Detailed system analysis
bibble diagnose --verbose
```

The diagnostic command will check:
- Platform and terminal information
- Node.js, npm, and npx executable paths and versions
- Environment variables and PATH configuration
- MCP server connectivity issues

### Common Issues

#### MCP Server Connection Failures

**Problem**: You see "Connection closed" errors when starting Bibble, especially in terminals other than Warp.

**Solution**:
1. Run `bibble diagnose` to check your environment
2. Ensure Node.js and npm are properly installed and accessible
3. Check that your PATH includes Node.js and npm directories
4. Try running from a different terminal (Command Prompt, PowerShell, or Git Bash on Windows)

**Symptoms**:
```
Failed to connect to MCP server "server-name": Connection closed
```

**Advanced Troubleshooting**:
- Run `bibble diagnose --verbose` for detailed information
- Try running `node --version` and `npx --version` in your terminal
- If using Windows, try running your terminal as Administrator
- Check if antivirus software is blocking Node.js processes

#### Terminal Compatibility

**Problem**: Bibble works in one terminal but not others.

**Solution**: Bibble v1.3.9+ includes multi-tier fallback systems for cross-terminal compatibility:
- **Primary Strategy**: Uses resolved executable paths
- **Fallback Strategies**: Direct commands, corepack, and bundled npm approaches
- **Graceful Degradation**: Continues working even if some servers fail

**Supported Terminals**:
- ✅ Warp Terminal
- ✅ Windows Terminal
- ✅ Hyper
- ✅ Command Prompt
- ✅ PowerShell
- ✅ Git Bash
- ✅ Most Unix terminals

#### System Prompt Visibility

**Problem**: Tools not appearing in the system prompt or model not recognizing available tools.

**Solution**:
1. Ensure you're using Bibble v1.4.0+ which fixes the tool visibility issue
2. Check that all MCP servers are properly connected with `bibble diagnose`
3. View the full system prompt with `bibble system-prompt` to confirm tools are listed
4. If tools are missing, try restarting Bibble or reconnecting to MCP servers

#### Node.js Installation Issues

**Problem**: Bibble can't find Node.js, npm, or npx.

**Solutions**:
1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/)
2. **Check Installation**:
   ```bash
   node --version
   npm --version
   npx --version
   ```
3. **Path Issues**: Add Node.js to your PATH environment variable
4. **NVM Users**: Make sure your Node.js version is activated
5. **Windows Users**: Try reinstalling Node.js with "Add to PATH" option checked

#### API Key Issues

**Problem**: API key errors or authentication failures.

**Solutions**:
1. Run the setup wizard: `bibble setup`
2. Manually set API keys: `bibble config api-key`
3. Check your API key is valid and has sufficient credits
4. Verify the correct API endpoint is configured

#### Performance Issues

**Problem**: Slow startup or response times.

**Solutions**:
1. Check your internet connection
2. Try a different model or provider
3. Reduce the number of enabled MCP servers
4. Clear chat history if it's very large: `bibble history clear`

### Getting Help

If you're still experiencing issues:

1. **Run Diagnostics**: `bibble diagnose --verbose`
2. **Check Logs**: Look for error messages in the terminal output
3. **Update Bibble**: `npm install -g @pinkpixel/bibble@latest`
4. **Check GitHub Issues**: Visit the [GitHub repository](https://github.com/pinkpixel-dev/bibble/issues)
5. **Report Bugs**: Create a new issue with:
   - Your operating system and terminal
   - Output from `bibble diagnose --verbose`
   - Steps to reproduce the issue
   - Error messages or unexpected behavior

### Version Compatibility
0
- **Node.js 16+**: Required for all Bibble versions

## Development

### Project structure

```
/
├── src/
│   ├── commands/         # CLI command handlers
│   ├── config/           # Configuration management
│   ├── mcp/              # MCP client implementation
│   ├── llm/              # LLM integration
│   ├── tools/            # Built-in tools system
│   │   └── built-in/
│   │       └── web/      # Web search & research tools
│   ├── ui/               # Terminal UI components
│   ├── utils/            # Utility functions
│   ├── index.ts          # Main entry point
│   └── types.ts          # TypeScript type definitions
├── bin/                  # Binary executable
├── scripts/              # Helper scripts
├── package.json          # NPM package definition
└── tsconfig.json         # TypeScript configuration
```

### Build the project

```bash
npm run build
```

### Development mode with watch

```bash
npm run dev
```

### Publishing to npm

The package is published to npm under the `@pinkpixel` scope:

```bash
# Login to npm
npm login

# Build the project
npm run build

# Publish the package
npm publish --access public
```

To install the latest version:

```bash
npm install -g @pinkpixel/bibble@latest
```

## License

ISC
