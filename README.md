<p align="center">
  <img src="https://res.cloudinary.com/di7ctlowx/image/upload/v1747791202/bibble-logo_ykiwbq.png" alt="Bibble Logo" width="350"/>
</p>

# Bibble - AI-Powered Tool-Calling Agent & Terminal Assistant

> **🏆 GitHub "For the Love of Code" Hackathon Entry**

[![npm version](https://img.shields.io/npm/v/@pinkpixel/bibble.svg)](https://www.npmjs.com/package/@pinkpixel/bibble)
[![License: Apache 2.0](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/license/apache-2-0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT-green.svg)](https://openai.com/)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude-orange.svg)](https://www.anthropic.com/)
[![Google](https://img.shields.io/badge/Google-Gemini-blue.svg)](https://ai.google.dev/)
[![CLI Tool](https://img.shields.io/badge/CLI-Tool-yellow.svg)](https://github.com/pinkpixel-dev/bibble)
[![Streaming](https://img.shields.io/badge/Real--time-Streaming-red.svg)](https://github.com/pinkpixel-dev/bibble)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-pink.svg)](https://pinkpixel.dev)

Bibble is far more than a simple chatbot - it's a sophisticated AI-powered tool-calling agent that transforms your terminal into an intelligent workspace. Built in TypeScript, Bibble can execute multi-step workflows, call tools autonomously until tasks are complete, and seamlessly integrate with your development environment through intelligent workspace detection.

With support for OpenAI, Anthropic, Google Gemini, and OpenAI-compatible API endpoints, Bibble combines real-time response streaming, persistent chat memory, and extensive tool integration to create a truly powerful terminal assistant.

## 🚀 Core Capabilities

### 🤖 Intelligent Tool-Calling Agent
- **Multi-Step Workflow Execution** - Bibble autonomously chains tool calls until complex tasks are completed
- **Intelligent Task Planning** - Breaks down requests into actionable steps and executes them systematically
- **Contextual Decision Making** - Uses conversation history and workspace context to make smart tool choices
- **Persistent Task Memory** - Maintains context across tool calls for coherent multi-step operations

### 🛠️ Comprehensive Built-In Tool Suite

#### 📁 **File System & Development Tools**
- **File Operations** - Read, write, create, delete, and manage files and directories
- **Code Analysis** - Examine codebases, analyze structure, and understand project layouts
- **Workspace Intelligence** - Automatic detection of project types, languages, and configurations
- **Git Integration** - Repository analysis and commit message enhancement

#### 🌐 **Web Search & Research Tools**
- **Multi-Engine Web Search** - DuckDuckGo, Bing, Google, and Brave integration with intelligent fallbacks
- **AI-Powered Query Enhancement** - Smart query optimization for better search results
- **Advanced Research Assistant** - Orchestrated workflows combining search and content extraction
- **Content Extraction** - Intelligent web scraping with rate limiting and parsing

#### 🌤️ **Information & Data Tools**
- **Weather & Climate Data** - Real-time weather information by location
- **Date & Time Services** - Timezone-aware datetime operations and scheduling
- **Hacker News Integration** - Fetch and analyze trending tech stories
- **News & Current Events** - Stay updated with latest developments

#### 💻 **System & Command Line Tools**
- **Process Management** - Execute system commands and manage processes
- **Environment Analysis** - System diagnostics and environment detection
- **Terminal Operations** - Advanced terminal interactions and automation

#### 🎭 **Fun & Personality Features**
- **🐱 Cat Image Generator** - Fetch random cat images with terminal display using custom @pinkpixel/pixelpop package
- **🎪 Roast Generator** - Ask Bibble to playfully roast you for entertainment
- **📝 Git Poetry** - Transform boring commit messages into beautiful poetry
- **🎨 ASCII Art & Animations** - Beautiful terminal graphics and animations

### 🔌 **MCP Server Integration**
- **Universal Tool Extension** - Connect to any MCP-compatible server to add custom tools
- **User-Configurable** - Easy setup and management of external tool integrations
- **Seamless Integration** - External tools work alongside built-in capabilities
- **Community Ecosystem** - Leverage the growing MCP tool ecosystem

### 🎨 **Premium Terminal Experience**
- **Pink Pixel Theme** - Gorgeous branded interface with gradient effects
- **Interactive Tool Displays** - Status badges, syntax highlighting, and progress indicators
- **Image & GIF Rendering** - Display images and animated GIFs directly in terminal using custom @pinkpixel/pixelpop package
- **Smart Tables & Lists** - Beautiful data presentation with color coding
- **Real-time Streaming** - Live response streaming with visual feedback

### ⚙️ **Advanced Configuration**
- **Multi-Provider Support** - OpenAI, Anthropic, Google Gemini, and OpenAI-compatible endpoints
- **Flexible Model Selection** - Switch between models and providers seamlessly
- **Persistent Memory** - Chat history storage and retrieval
- **Custom System Prompts** - Personalize AI behavior and guidelines

## 🎬 Demo

See Bibble's tool-calling agent capabilities in action:

<p align="center">
  <a href="https://youtu.be/06RB3ytBRms">
    <img src="https://img.youtube.com/vi/06RB3ytBRms/maxresdefault.jpg" alt="Bibble Demo Video" width="600"/>
  </a>
</p>

### 🐱 Cat Images with Terminal Display
<p align="center">
  <img src="./demos/cat-image.gif" alt="Cat Images Tool Demo" width="500"/>
</p>

*Powered by @pinkpixel/pixelpop - a custom terminal image rendering package built with Bibble in mind*

## Installation

### Prerequisites

- Node.js v20 or higher
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

<p align="center">
  <img src="./demos/weather-datetime.gif" alt="Weather and DateTime Tools Demo" width="600"/>
</p>

## 🌐 Built-In Tool Ecosystem

**Bibble is a complete tool-calling agent** with an extensive suite of built-in capabilities that work together to handle complex, multi-step tasks autonomously.

### 🔍 Web Search Features

- **Multi-Engine Support**: Integrated DuckDuckGo (primary), Bing, Google, and Brave search with intelligent fallbacks
- **AI-Powered Query Enhancement**: Smart query optimization for better search results
- **Advanced Content Extraction**: Intelligent web scraping with rate limiting and content parsing
- **Research Session Management**: Event-driven research workflows with progress tracking
- **Cross-Platform Compatible**: Optimized for Windows environments with proper path handling

<p align="center">
  <img src="./demos/web-search.gif" alt="Web Search Demo" width="600"/>
</p>

### 🛠️ Complete Built-In Tool Catalog

#### 🌐 **Web & Research Tools**
- **`web_search`** - Multi-engine search with intelligent fallbacks (DuckDuckGo, Bing, Google, Brave)
- **`quick_web_search`** - Fast information retrieval for immediate answers
- **`research_status`** - Monitor and manage ongoing research operations
- **`web_scrape`** - Extract content from web pages with smart parsing

#### 📁 **File System Tools**
- **`read_file`** - Read and analyze file contents
- **`write_file`** - Create and modify files
- **`list_directory`** - Explore directory structures
- **`create_directory`** - Create new directories
- **`delete_file`** - Remove files safely
- **`file_search`** - Search for files by name or pattern

#### 💻 **System & Command Tools**
- **`execute_command`** - Run system commands and scripts
- **`get_environment`** - Analyze system environment
- **`process_management`** - Manage running processes
- **`system_info`** - Get detailed system information

#### 🌤️ **Information Services**
- **`get_weather`** - Real-time weather data by location
- **`get_datetime`** - Timezone-aware date and time operations
- **`hacker_news`** - Fetch trending tech stories
- **`news_search`** - Search current news and events

#### 🎭 **Fun & Personality Tools**
- **`cat_images`** - Fetch random cat images with terminal display
- **`roast_user`** - Generate playful roasts for entertainment
- **`git_poetry`** - Transform commit messages into poetry
- **`ascii_art`** - Generate ASCII art and banners

The prior comprehensive research tool family has been retired; Bibble now routes every deep-dive request through these core tools, letting the enhanced research agent sequence searches, follow-ups, and content extraction as a single workflow.

<p align="center">
  <img src="./demos/research.gif" alt="Research Assistant Demo" width="600"/>
</p>

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

### 🖼️ Terminal Image Rendering with @pinkpixel/pixelpop

Bibble features advanced terminal image and GIF rendering capabilities powered by **@pinkpixel/pixelpop**, a custom package built specifically for this project:

- **Direct Terminal Display** - Images and animated GIFs render directly in your terminal
- **Cross-Platform Support** - Works across different terminal emulators
- **Optimized Performance** - Efficient rendering with minimal resource usage
- **Custom Built** - Designed from the ground up for Bibble's needs
- **Open Source** - Available on npm and GitHub for the community

*@pinkpixel/pixelpop is also available as a standalone package for other developers to use in their terminal applications.*

### Environment Variables

- `BIBBLE_DISABLE_ENHANCED_TOOLS`: Set to `true` to disable enhanced tool displays
- `BIBBLE_TOOL_DISPLAY_MODE`: Set to `basic`, `compact`, or `full` (default)
- `BIBBLE_ENABLE_IMAGES`: Set to `false` to disable terminal image rendering

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
- **Node.js >=20**: Required for all Bibble versions

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
