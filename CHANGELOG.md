# Changelog

All notable changes to the Bibble project will be documented in this file.

## [1.9.0] - 2025-01-27

### 🎨 ENHANCED CAT IMAGES TOOL - PIXELPOP INTEGRATION & GIF SUPPORT

Major upgrade to the cat images tool with advanced terminal image rendering and animated GIF support!

#### 🐱 **Enhanced Cat Images Tool** (`random-cat-images`)

**🔄 Package Migration:**
- **Upgraded from `terminal-image`** to **`@pinkpixel/pixelpop`** for superior image rendering
- **Enhanced Terminal Compatibility**: Auto-detects terminal capabilities (Kitty/iTerm2 native, or ANSI fallback)
- **Better Performance**: Optimized rendering with improved memory management
- **Cross-Platform Support**: Enhanced compatibility across different terminal environments

**🎬 NEW: Animated GIF Support**
- **GIF Animation Playback**: Displays animated GIFs directly in the terminal with smooth frame transitions
- **Configurable Duration**: `gifSeconds` parameter (1-120 seconds) to control animation length
- **Smart Frame Rate**: Balanced 24fps default for broad terminal compatibility
- **Automatic Detection**: Intelligently detects GIF files and switches to animation mode
- **Graceful Fallback**: Shows static frame if animation isn't supported

**⚙️ Technical Improvements:**
- **Adaptive Width Sizing**: Terminal-aware width adjustment based on capabilities
  - Premium terminals (Kitty/iTerm2): 85%-100% width
  - ANSI fallback terminals: 60%-70% width
- **Enhanced Error Handling**: Better error messages and fallback strategies
- **Crypto-based Randomization**: Uses Node.js crypto module for better API rotation
- **Buffer Management**: Improved memory handling for large images and GIFs

**🎯 User Experience Enhancements:**
- **Visual Feedback**: Clear indication when GIF animation is playing
- **Progress Information**: Shows animation duration and playback status
- **Source Attribution**: Enhanced API source display with better formatting
- **Tip Integration**: Helpful tips about API key configuration for higher rate limits

**🔧 API Integration:**
- **Multi-API Support**: Random Cat, The Cat API, Cats as a Service with intelligent fallbacks
- **API Key Support**: Optional API key configuration for The Cat API (higher rate limits)
- **Timeout Handling**: 8-second timeout with proper error recovery
- **Smart Rotation**: Crypto-randomized API selection for variety

#### 📚 **Documentation Updates**

**Updated Tool Description:**
- Enhanced description highlighting Pixelpop integration and GIF support
- Clear parameter documentation for new `gifSeconds` option
- Usage examples for both static images and animated GIFs

**README.md Updates:**
- Updated cat images tool description to mention Pixelpop and GIF support
- Added information about enhanced terminal compatibility
- Updated dependency information to reflect @pinkpixel/pixelpop usage

#### 🏆 **Hackathon Excellence**

**Perfect for "Terminal Talent" Category:**
- **Advanced Terminal Graphics**: Real image and GIF rendering in pure terminal environment
- **Technical Innovation**: Custom Pixelpop package showcasing advanced terminal capabilities
- **Visual Spectacle**: Animated GIFs create memorable terminal experiences
- **Cross-Platform Excellence**: Works beautifully across all major terminals

**Benefits:**
- **Enhanced Visual Experience**: Superior image quality and GIF animation support
- **Better Performance**: Optimized rendering with reduced memory usage
- **Improved Reliability**: Better error handling and fallback strategies
- **Future-Ready**: Built on modern Pixelpop foundation for continued enhancements

---

## [1.8.9] - 2025-09-20

### 🎭 Personality-Driven Fun Responses

- Replaced the commit poetry and roast me built-in tools with native prompt guidance so the agent delivers poems and playful roasts without extra tool calls.
- Folded the Git commit poetry structure and roast tone directly into the system prompt using the original Pink Pixel examples for consistent voice.
- Cleaned up the tool registry, client display logic, and documentation to reflect the personality-driven implementation.
- Removed the generate-ascii-art fun tool so playful terminal flair now lives entirely in the splash/branding system.
- Reworked the enhanced research agent to orchestrate `web_search`, `quick_web_search`, and `extract_content` workflows instead of relying on the deprecated comprehensive research tool family.

---

## [1.8.8] - 2025-09-19

### 🎉 NEW HACKATHON FUN TOOLS - Git Commit Poetry & Roast Me

Added two delightful new entertainment tools perfect for the "For the Love of Code" hackathon, specifically designed for the **Terminal Talent** category!

#### 🎭 **Git Commit Poetry Tool** (deprecated in 1.8.9)

Transform boring Git commit messages into delightful poems with whimsical AI-powered poetry generation.

**Features:**
- **Poetic Transformation**: Converts any Git commit message into a short, fun poem (2-6 lines)
- **Meaning Preservation**: Always preserves the core technical meaning while adding playful poetic language
- **Mixed Metaphors**: Combines coding/tech metaphors with natural imagery ("bugs scuttling away," "branches blooming")
- **Self-Contained**: Poems are fun to read whether you understand Git or not
- **Examples**: 
  - `fix null pointer error in auth flow` → *"A phantom bug slipped through the gate, Null's dark hand met its fate..."*
  - `add dark mode toggle to settings` → *"A twilight switch now shines with grace, Night unfurls across the interface..."*

**Usage:**
```bash
# Transform any commit message into poetry
> Can you turn "fix memory leak in cache system" into a poem?
🎭 The commit poetry tool will create a delightful poem!
```

#### 🔥 **Roast Me Tool** (deprecated in 1.8.9)

Get witty, harmless roasts for entertainment with customizable spice levels!

**Features:**
- **Three Spice Levels**: `mild` (gentle teasing), `medium` (standard roast), `spicy` (extra snarky)
- **General Life Roasts**: Focuses on personality/life roasts, not tech-related ones
- **Clever & Memorable**: Short (1-3 sentences), witty, and quotable roasts
- **Harmless Fun**: All roasts designed to be humorous entertainment, not hurtful
- **Example Roasts**: 
  - *"You have a face that would make onions cry."*
  - *"If ignorance is bliss, you must be the happiest person on Earth."*
  - *"You're not simply a drama queen/king. You're the whole royal family."*

**Usage:**
```bash
# Get a roast with different intensity levels
> Roast me!
🔥 The roast me tool will deliver a clever, witty roast!

# Specify spice level and target
> Give me a spicy roast
> Roast my friend Alex with mild teasing
```

#### 🏆 **Perfect for Hackathon**

**Terminal Talent Category Excellence:**
- **Personality in CLI**: Adds character and humor to terminal interactions
- **Interactive Entertainment**: Makes the command-line feel more alive and engaging
- **Creative AI Integration**: Showcases creative use of AI for entertainment
- **Memorable Experience**: Creates shareable, quotable moments

**Technical Implementation:**
- **Built-in Tool Integration**: Seamlessly integrated with Bibble's existing tool system
- **Enhanced Tool Display**: Beautiful formatting with Pink Pixel themed output
- **Parameter Validation**: Full Zod schema validation with proper error handling
- **Professional Architecture**: Consistent with existing tool patterns and interfaces

**Developer Experience:**
- **Easy Discovery**: Both tools automatically available in fun tool category
- **Consistent Interface**: Uses standard BuiltInTool interface for reliability
- **Error Resilience**: Graceful error handling with helpful feedback messages
- **TypeScript Integration**: Full type safety and IntelliSense support

---

## [1.8.7] - 2025-09-18

### 🔧 BUG FIX - Built-in Tool Parameter Validation

**Fixed Missing Parameter Validation in Built-in Tools:**
- **Root Cause Identified**: Built-in `create_directory` tool was missing parameter validation step despite having correct Zod schema definitions
- **Parameter Validation Added**: Implemented proper parameter validation using `validateParams` utility function before tool execution
- **Validation Pattern Consistency**: Fixed inconsistent validation patterns across built-in tools (some used direct Zod parsing, others were missing validation entirely)
- **Error Handling Improved**: Invalid parameters now properly rejected with clear validation error messages instead of causing runtime errors

**Technical Details:**
- **Schema Definition**: Zod schemas were correctly defined with `z.string().min(1, 'Directory path is required')`
- **Missing Validation Step**: Tools used `withErrorHandling` wrapper but weren't validating parameters against schemas
- **Fix Applied**: Added `validateParams(CreateDirectorySchema, params)` before tool execution
- **Validation Results**: Empty paths and missing parameters now properly rejected with validation errors

**Tool Behavior Improvements:**
- ✅ **Parameter Validation**: Empty paths properly rejected with validation error messages
- ✅ **Recursive Directory Creation**: Confirmed working correctly with `recursive=true` (default)
- ✅ **Non-recursive Mode**: Properly fails when parent directories don't exist (`recursive=false`)
- ✅ **Existing Directory Detection**: Correctly identifies and handles existing directories
- ✅ **File Conflict Handling**: Properly errors when attempting to create directory where file exists
- ✅ **Error Messaging**: Clear, descriptive error messages for all failure scenarios

**Impact:**
- **Built-in Tools Reliability**: Built-in tools now have consistent parameter validation and error handling
- **User Experience**: Users get clear validation errors instead of confusing runtime failures
- **System Robustness**: Prevents invalid tool calls from reaching execution logic
- **Developer Confidence**: Systematic testing approach revealed and fixed the core validation issue

---

## [1.8.6] - 2025-09-18

### 🛠️ COMPREHENSIVE RESEARCH TOOL FIX

**Fixed Overly Restrictive Content Requirements:**
- **Reduced Minimum Content Threshold**: Changed from 50,000 characters to 1,000 characters for document creation
- **Pragmatic Research Standards**: Tool now creates documents with quality content found rather than rejecting based on arbitrary length requirements
- **Improved User Experience**: Eliminates confusing rejection messages when good research content is available
- **Better Tool Behavior**: Research tool now behaves as users expect - gathering information and creating documents

### 🔬 INTELLIGENT COMPREHENSIVE RESEARCH SYSTEM

Implemented a revolutionary smart research system that automatically distinguishes between deep research requiring detailed documentation versus quick information lookups, delivering the appropriate research depth based on user intent.

#### 🎯 **Smart Research Intent Detection**

**Automatic Intent Recognition:**
- **Deep Research Patterns**: Automatically detects requests for comprehensive analysis, detailed studies, or complete guides
- **Quick Lookup Patterns**: Recognizes requests for fast facts, brief explanations, or immediate answers
- **Fact-Checking Requests**: Identifies verification queries that need confidence ratings
- **Transparent Operation**: Users don't need to specify research type - the system intelligently determines intent

**Enhanced Research Tools:**
- **`comprehensive_research`**: Conducts thorough research and creates detailed documents from quality sources (pragmatic content thresholds)
- **`quick_information_lookup`**: Provides fast answers (max 60 seconds) without document generation
- **`fact_check`**: Specialized tool for verifying claims with confidence ratings
- **`research_document_manager`**: Manages, organizes, and tracks all research documents

#### 📚 **Comprehensive Research Features**

**Document Generation Standards:**
- **Minimum Content Requirement**: Enforces 50,000 character minimum for comprehensive research
- **Multi-Document Splitting**: Automatically splits extensive topics (>100k chars) into multiple organized documents
- **No Fabrication Policy**: Strict policy against generating content without verified sources
- **Auto-Save System**: All research automatically saved to `~/Bibble-Research/` directory with structured organization

**Enhanced Research Quality:**
- **8 Targeted Searches**: Uses up to 8 search queries for comprehensive coverage
- **15+ Content Extractions**: Deep analysis from multiple high-quality sources
- **Extended Research Time**: Up to 6 minutes for thorough investigation
- **Source Documentation**: Complete source tracking and citation

#### ⚡ **Quick Information Lookup**

**Optimized for Speed:**
- **45-Second Timeout**: Fast response for immediate answers
- **3 Search Limit**: Focused searches for efficiency
- **No Document Creation**: Direct answers without file generation
- **Confidence Ratings**: Clear confidence levels for reliability assessment

**Smart Response Formatting:**
- **Concise Answers**: Content limited to 3000 characters for quick consumption
- **Source Summary**: Top 5 sources with relevance indicators
- **Quick Facts Section**: Key statistics and confidence metrics

#### 🔍 **Specialized Fact-Checking**

**Verification-Focused Tool:**
- **Claim Verification**: Specialized for checking specific facts or statements
- **Confidence Scoring**: Numerical confidence ratings (0-100%)
- **Source Reliability**: Emphasis on authoritative and reliable sources
- **Contradiction Detection**: Identifies conflicting information across sources

#### 🗂️ **Research Document Management**

**Comprehensive Organization:**
- **Document Registry**: Tracks all research documents with metadata
- **Auto-Indexing**: Extracts tags, categories, and summaries automatically
- **Search & Filter**: Find research documents by topic, date, or content
- **Statistics Tracking**: Monitor research productivity and document analytics

**Document Features:**
- **Structured Templates**: Professional research report formatting
- **Source Documentation**: Complete bibliography with URLs and access dates
- **Research Methodology**: Detailed methodology section for transparency
- **Quality Assurance**: Built-in disclaimers and accuracy notes

#### 🤖 **Intelligent Routing System**

**Transparent Operation:**
- **Intent Analysis**: Analyzes query complexity, keywords, and user patterns
- **Automatic Tool Selection**: Routes to appropriate research tool without user intervention
- **Seamless Experience**: Users get the right research depth without manual specification
- **Context Awareness**: Considers conversation history and user preferences

**Smart Routing Logic:**
- **Comprehensive Triggers**: "detailed analysis", "research report", "complete guide", "comprehensive study"
- **Quick Lookup Triggers**: "what is", "how to", "quick question", "briefly explain"
- **Fact-Check Triggers**: "is it true", "verify that", "fact check", "confirm whether"

#### 🏗️ **Technical Architecture**

**Enhanced Research Agent:**
- **Multi-Engine Support**: DuckDuckGo, Bing, Google, Brave with intelligent fallbacks
- **Content Extraction**: Advanced web scraping with relevance scoring
- **Research Sessions**: Persistent session management with progress tracking
- **Error Recovery**: Robust error handling with graceful degradation

**Document Management:**
- **File System Integration**: Automatic directory creation and organization
- **Metadata Extraction**: Auto-generated tags, summaries, and categories
- **Search Indexing**: Full-text search across all research documents
- **Export Capabilities**: Multiple format support for research sharing

#### ✨ **User Experience Improvements**

**Effortless Research:**
- **🎯 Intent-Aware**: System automatically provides the right research depth
- **⚡ Fast When Needed**: Quick answers in under a minute for simple questions
- **📖 Thorough When Required**: Comprehensive research with detailed documentation
- **🔍 Fact Verification**: Specialized verification with confidence ratings

**Professional Documentation:**
- **📋 Structured Reports**: Professional formatting with executive summaries
- **📚 Source Management**: Complete bibliography and citation tracking
- **🗂️ Organized Storage**: Automatic filing and categorization of research
- **📊 Research Analytics**: Track research productivity and document metrics

---

### 🧠 ENHANCED TOOL CONTEXT MANAGEMENT - INTELLIGENT TOOL SELECTION SYSTEM

Implemented a comprehensive Enhanced Tool Context Management system to address tool selection issues and eliminate "tool forgetting" problems, particularly the issue of the agent defaulting to ASCII art generation instead of using available MCP image generation tools.

#### 🎯 **Core Problem Resolution**

- **Tool Forgetting Issue**: Fixed agent tendency to default to built-in ASCII art tool instead of discovering and using appropriate MCP image generation tools
- **Inappropriate Tool Defaults**: Agent now properly evaluates and selects the most appropriate tool for each task rather than defaulting to convenient but incorrect options
- **Hard-coded Tool Assumptions**: Removed hard-coded references to specific MCP tools, making the system generic and adaptable to any user-configured MCP servers

#### 🚀 **Enhanced Tool Context Management Features**

**1. Smart Tool Usage Validation**
- **Simplified Validation**: Only blocks calls that cause technical errors (e.g., calling built-in tools via MCP wrapper)
- **Freedom of Choice**: Allows agent freedom in tool selection, removing overly restrictive validation that could block legitimate tools
- **Error Prevention**: Prevents validation loops that could frustrate users and interrupt workflows

**2. Removed ASCII Art Tool Competition**
- **Strategic Tool Removal**: Completely removed ASCII art tool from built-in registry to eliminate competition with MCP image generation tools
- **Clear Tool Hierarchy**: Ensures MCP image generation tools are the primary option for image-related tasks
- **Reduced Confusion**: Agent no longer has conflicting options for image generation tasks

**3. Dynamic Tool Discovery System**
- **MCP Tools Summary**: Generates compact summary of available MCP tools with names and descriptions
- **System Prompt Integration**: Injects MCP capabilities overview into system prompt without overloading it
- **Adaptive Context**: System adjusts to whatever MCP servers the user has configured
- **Generic Approach**: No hard-coded assumptions about specific MCP tools or servers

**4. Intelligent Tool Selection Guidance**
- **User-Specified Priority**: When user specifies a tool or service, that takes absolute priority
- **Discovery Before Action**: Agent uses `list_tools` to discover available options when no specific tool mentioned
- **Best Tool Selection**: Chooses based on capability and task requirements, not convenience
- **Multi-Tool Workflows**: Uses multiple tools when needed for complete task fulfillment

#### 🔧 **Technical Architecture Improvements**

**Enhanced Agent System (`src/mcp/agent.ts`):**
- **Simplified Tool Validation**: Streamlined `validateToolUsage()` to focus on technical errors only
- **Contextual Tool Allowlist Disabled**: Removed restrictive gating that could block legitimate tools
- **Capabilities Ledger**: Persistent summary system that survives conversation compaction
- **Compact MCP Summary**: Efficient method to provide MCP tool overview without prompt bloat
- **Generic Tool Selection Principles**: Removed hard-coded tool preferences and assumptions

**Optimized System Prompt:**
- **Intelligent Tool Selection Principles**: Clear guidance on tool selection process and priorities
- **Discovery Workflow**: Step-by-step process for tool discovery and selection
- **Multiple Tools Support**: Explicit support for using multiple tools to complete complex tasks
- **User Intent Recognition**: Enhanced ability to understand and execute user's specific tool preferences

#### 📈 **User Experience Enhancements**

**Better Tool Selection:**
- **🎯 Task-Appropriate Tools**: Agent now consistently chooses the most suitable tool for each task
- **🔍 Tool Discovery**: Uses `list_tools` to discover available options before making choices
- **⚡ Multi-Tool Execution**: Can use multiple tools in sequence to complete complex tasks
- **💡 User Confirmation**: Lists relevant tools for user confirmation when intent is unclear

**Eliminated Tool Conflicts:**
- **🚫 No More ASCII Art Defaults**: Removed ASCII art tool to prevent conflict with MCP image generation
- **✅ MCP Tool Priority**: MCP tools now get proper consideration for appropriate tasks
- **🎨 Image Generation Fixed**: Users requesting image generation will get MCP tools, not ASCII art
- **🔧 Flexible Integration**: System adapts to whatever MCP servers are configured

#### 🛡️ **Preserved Functionality**

**Security & Performance:**
- **Full Security Preservation**: All existing security policies and MCP protections maintained
- **Backward Compatibility**: All existing MCP integrations continue working unchanged
- **Performance Optimization**: Compact tool summaries keep system prompt size manageable
- **Error Handling**: Robust error handling with graceful degradation

**Integration Compatibility:**
- **All LLM Providers**: Works seamlessly with OpenAI, Anthropic, Google Gemini, and compatible endpoints
- **All MCP Servers**: Compatible with any user-configured MCP servers without hard-coded dependencies
- **Existing Workflows**: No breaking changes to existing user workflows or configurations
- **Tool Discovery**: Enhanced tool discovery works with any MCP server combination

#### 🎉 **Expected Behavior Changes**

**Before v1.8.6:**
- Agent would default to ASCII art generation when asked to create images
- Tool validation could block legitimate tool usage, causing frustrating loops
- Hard-coded assumptions about specific MCP tools limited flexibility
- Tool selection was sometimes based on convenience rather than appropriateness

**After v1.8.6:**
- Agent properly discovers and uses MCP image generation tools for image tasks
- Tool validation focuses on technical errors only, allowing more freedom in tool selection
- Generic system adapts to any MCP server configuration without hard-coded assumptions
- Tool selection prioritizes user intent and task requirements over convenience

#### 🔧 **Technical Implementation Details**

**Agent Architecture Updates:**
- Simplified `validateToolUsage()` method to focus on preventing technical errors only
- Enhanced `generateCompactMCPToolsSummary()` for efficient MCP tool overview
- Disabled contextual tool allowlist gating to prevent blocking legitimate tools
- Removed ASCII art tool from built-in tool registry to eliminate competition

**System Prompt Optimization:**
- Updated "INTELLIGENT TOOL SELECTION" section with clear selection principles
- Added structured selection process (check user specs → discover → evaluate → choose → execute)
- Emphasized user-specified tools taking priority over agent preferences
- Removed hard-coded tool assumptions while maintaining clear guidance

#### 🚀 **Future-Proofing**

**Extensible Design:**
- Generic tool selection system works with any future MCP servers
- No hard-coded dependencies on specific tool names or servers
- Adaptable to new MCP tool types and capabilities as they emerge
- Scalable architecture supports growing MCP ecosystem

This release transforms Bibble's tool selection from a rigid, assumption-based system into an intelligent, adaptive, and user-focused tool management experience that properly leverages whatever MCP tools users have configured!

---

## [1.8.5] - 2025-09-18

### 🤖 OPENAI MODEL UPDATES - LATEST AI POWERHOUSE SUPPORT

Updated Bibble with comprehensive support for the latest OpenAI models, including the groundbreaking GPT-5 series and advanced reasoning models!

#### 🚀 **New GPT-5 Series Models**

- **🌟 Core GPT-5 Models**:
  - `gpt-5` - The flagship GPT-5 model with optional reasoning
  - `gpt-5-mini` - Efficient GPT-5 variant for faster responses
  - `gpt-5-nano` - Ultra-lightweight GPT-5 for resource-conscious usage
  - `gpt-5-chat-latest` - Latest ChatGPT-powered GPT-5 variant
  - `chatgpt-4o-latest` - Updated ChatGPT-4o with latest improvements

#### 🧠 **Advanced Reasoning Models**

- **🎯 o3/o4 Series**: Next-generation reasoning models
  - `o3-pro` - Professional-grade reasoning with enhanced capabilities
  - `o3` - Core o3 reasoning model with advanced problem-solving
  - `o4-mini` - Efficient o4 reasoning for complex tasks
  - `o3-mini` - Compact o3 variant for quick reasoning tasks
  - `codex-mini-latest` - Latest coding-focused reasoning model

#### 🔄 **Updated GPT-4 Series**

- **⚡ Enhanced GPT-4 Models**:
  - `gpt-4.1` - Updated GPT-4 with improved performance
  - `gpt-4.1-mini` - Efficient GPT-4.1 variant
  - `gpt-4.1-nano` - Ultra-lightweight GPT-4.1
  - `gpt-4o` - Maintained with latest optimizations
  - `gpt-4o-mini` - Continued support with improvements

#### 🌐 **Open-Weight OSS Models**

- **🔓 Open Source Variants**:
  - `gpt-oss-120b` - Large-scale open-weight model (120B parameters)
  - `gpt-oss-20b` - Efficient open-weight model (20B parameters)

#### 🔧 **Model Configuration Updates**

- **Parameter Support**: Enhanced parameter handling for reasoning models
  - `max_completion_tokens` - Proper token limit handling for new models
  - `reasoning_effort` - Configurable reasoning intensity (low/medium/high)
  - Temperature support where appropriate (disabled for pure reasoning models)
  - Optional thinking parameters for supported models

- **Default Model Updates**:
  - OpenAI: `gpt-5` (was `gpt-4o`)
  - Anthropic: `claude-sonnet-4-20250514` (maintained)
  - Google: `gemini-2.0-flash` (maintained)

#### ⚙️ **Configuration Wizard Enhancement**

- **Updated CLI**: `bibble config configure` now includes all new models
- **Smart Categorization**: Models properly grouped by capabilities and type
- **Reasoning Detection**: Automatic detection and parameter adjustment for reasoning models
- **Legacy Cleanup**: Removed deprecated GPT-3.5 series and outdated models

#### 📚 **Documentation & Help Updates**

- **Help System**: Updated model lists in help documentation
- **Examples**: Refreshed usage examples with latest model IDs
- **Configuration**: Updated setup wizard with new default recommendations

#### 🎯 **Breaking Changes**

- **Deprecated Models Removed**: GPT-3.5 series and old o1-series models removed from defaults
- **Config Migration**: Existing users will need to reset config or update manually to see new models
- **Parameter Updates**: Some models now use `max_completion_tokens` instead of `max_tokens`

#### ✨ **Enhanced User Experience**

- **Latest AI**: Access to cutting-edge GPT-5 and o3/o4 reasoning capabilities
- **Future-Ready**: Configuration system prepared for upcoming model releases
- **Backward Compatible**: Existing configurations continue to work
- **Smart Defaults**: New installations use the most capable models by default

---

## [1.8.4] - 2025-09-18

### 🐛 BUG FIXES - ANIMATED WELCOME BANNER

Fixed a critical issue where the animated rainbow welcome banner was being cleared away before users could see it.

#### **🎯 Issue Resolved**

- **Missing Animated Banner**: The `console.clear()` in the animated splash screen was clearing workspace context that was printed before the banner
- **Execution Order**: Workspace detection and printing was happening before the animated banner display
- **User Experience**: Users couldn't see the beautiful rainbow "BIBBLE" animation on startup

#### **✅ Solution Applied**

- **Reordered Display Logic**: In `displayWelcome()` method, moved workspace detection to occur AFTER the animated banner
- **Removed Duplicate Code**: Eliminated redundant workspace detection in `start()` method
- **Clean Flow**: Now the animated banner shows first, then workspace context, then MCP loading messages

#### **🌈 Enhanced Startup Sequence**

1. **Rainbow Animated Banner** - Beautiful "BIBBLE" text animation (2.5s duration)
2. **Workspace Context** - Project detection and information display
3. **MCP Tool Loading** - Server connections and tool initialization
4. **Chat Interface** - Ready for user interaction

#### **🔧 Technical Details**

- **Files Modified**: `src/ui/chat.ts` - `displayWelcome()` and `start()` methods
- **Animation Preserved**: Full chalk-animation rainbow effect with proper timing
- **Context Maintained**: Workspace information still displays, just after the banner
- **Performance**: No impact on startup performance, just better visual sequencing

#### **✨ Result**

Users running `bibble` or `bibble chat` will now properly see the stunning animated rainbow splash screen as intended, followed by clean workspace context and tool loading messages!

---

## [1.8.3] - 2025-09-08

### 🎭 TERMINAL ANIMATIONS - HACKATHON VISUAL SPECTACLE

Added stunning terminal animation system using `chalk-animation` library! Perfect showcase for the GitHub hackathon's "Terminal Talent" category with mesmerizing visual effects.

#### 🌈 **New Animation Features**

- **🎨 Animated Splash System** (`src/ui/animated-splash.ts`)
  - Multiple animation types: Rainbow, Pulse, Glitch, Radar, Neon, Karaoke
  - Animated BIBBLE banners with customizable duration and speed
  - Multi-stage welcome sequences with coordinated effects
  - Animated loading indicators with progress messages
  - Pink Pixel signature animations with brand theming

- **⚡ Animation Demo Command** (`bibble animations` or `bibble anim`)
  - `--demo`: Full animation showcase with all effects
  - `--banner [type]`: Animated BIBBLE banner with specified effect
  - `--welcome`: Multi-stage animated welcome sequence
  - `--signature`: Pink Pixel signature animation
  - `--loading [msg]`: Loading animation with custom messages
  - `--quick [text]`: Quick rainbow animation test

#### 🎭 **Animation Types**

1. **Rainbow**: Smooth color cycling effect
2. **Pulse**: Pulsating brightness animation
3. **Glitch**: Digital glitch/corruption effect
4. **Radar**: Scanning radar-like animation
5. **Neon**: Electric neon glow effect
6. **Karaoke**: Letter-by-letter highlight animation

#### 🏆 **Hackathon Excellence**

- **Terminal Talent**: Mesmerizing visual effects that transform the terminal experience
- **Professional Polish**: Smooth, synchronized animations with proper timing control
- **Pink Pixel Branding**: All animations integrate seamlessly with signature theming
- **Interactive Demo**: Complete command suite for showcasing animation capabilities
- **Cross-Platform**: Optimized for all terminal environments and color support levels

#### 🔧 **Technical Implementation**

- **New Dependency**: Added `chalk-animation@2.0.3` for terminal animation effects
- **Modular Design**: `AnimatedSplash` class with static methods for easy integration
- **Theme Integration**: Full compatibility with existing Pink Pixel theme system
- **Performance Optimized**: Lightweight animations with configurable duration and speed
- **Error Handling**: Graceful fallbacks when animation features aren't supported
- **CLI Integration**: New command registered in main CLI with comprehensive help system

#### 📱 **Usage Examples**

```bash
# Full animation showcase
bibble animations --demo

# Glitch effect banner
bibble anim --banner glitch

# Custom loading animation
bibble anim --loading "Preparing for hackathon demo..."

# Quick test with custom text
bibble anim --quick "Hello GitHub Hackathon!"
```

#### 🚀 **Core UI Animation Integration**

- **Rainbow Welcome Banner**: Main BIBBLE startup uses animated rainbow effect (2.5s duration)
- **Pulse Role Labels**: "You" and "Bibble" chat labels now pulse with animation effects
- **Radar Tool Execution**: Tool calls display radar animation during execution with "🛠️ Running {tool}..." 
- **Assistant → Bibble**: Changed "Assistant" to "Bibble" throughout chat interface for better branding
- **Seamless Integration**: All animations integrate into existing UI without disrupting functionality

#### ✨ **Enhanced User Experience**

- **Visual Spectacle**: Eye-catching animations that make terminal interactions memorable
- **Brand Recognition**: Consistent Pink Pixel signature animations across all effects
- **Professional Demo**: Perfect showcase piece for hackathon judges and users
- **Extensible System**: Easy to add new animation types and effects in the future
- **Interactive Chat**: Animated role labels make conversations more engaging

---

## [1.8.2] - 2025-09-08

### 🎉 HACKATHON FUN TOOLS - FOR THE LOVE OF CODE

Added exciting new **fun tools** category for the "For the Love of Code" hackathon! Perfect for the "Terminal Talent" and "Agents of Change" categories.

#### 🎭 **New Fun Tools**

- **🎨 ASCII Art Generator** (`generate-ascii-art`)
  - Create beautiful ASCII art from text with 20+ fonts (Standard, Slant, Shadow, Big, Block, Bubble, etc.)
  - Multiple color themes: Pink, Cyan, Rainbow, Fire, Neon, Ocean, None
  - Customizable width (40-120 characters)
  - Decorative border frames with Pink Pixel branding
  - Perfect for headers, banners, and terminal decorations

- **🐱 Random Cat Images** (`random-cat-images`)
  - Fetch 1-5 random cat images from the internet
  - ASCII art fallback for maximum terminal compatibility
  - Multiple sizes: small, medium, large
  - Cute ASCII cat representations when images can't be displayed
  - Network-resilient with graceful error handling

#### 🏆 **Hackathon Highlights**

- **Terminal Talent**: Stunning visual effects and ASCII art in pure terminal environment
- **Agents of Change**: Fun, interactive tools that bring joy to command-line workflows
- **Pink Pixel Branding**: All tools feature signature Pink Pixel theming and gradients
- **Cross-Platform**: Works on Linux, macOS, and Windows terminals
- **Zero Dependencies**: Uses lightweight, reliable libraries (figlet, node-fetch)

#### 🔧 **Technical Implementation**

- **New Category**: Added `'fun'` to built-in tools category system
- **Type Safety**: Full TypeScript integration with Zod schema validation
- **Error Handling**: Robust error handling with user-friendly messages
- **Performance**: Optimized for terminal display with minimal resource usage
- **Theme Integration**: Full support for all 6 Bibble themes

---

## [1.8.1] - 2025-09-08

### 🔧 WORKSPACE TOOLS FORMATTING FIXES

Fixed critical formatting issues with the new workspace tools that were causing messy, poorly formatted output compared to other built-in tools.

#### **🐛 Bug Fixes**

- **Fixed Workspace Tool Display**: Resolved messy output formatting in workspace tools
  - `list_current_directory`: Now displays beautifully formatted directory listings with proper categorization
  - `analyze_project_structure`: Clean, structured project analysis with themed colors and icons
  - `find_project_files`: Elegant file search results with proper grouping and formatting
  - `suggest_project_improvements`: Well-organized improvement suggestions with priority grouping

#### **🎨 Technical Improvements**

- **Category System**: Added `'workspace'` as valid tool category in type definitions
- **UI Integration**: Added proper imports for UI components (BibbleTable, theme, symbols)
- **Consistent Formatting**: Rewrote output logic to use Pink Pixel theming system
  - Beautiful headers with `theme.title()` and `theme.subtitle()`
  - Consistent color coding with `theme.accent()`, `theme.cyan()`, `theme.dim()`
  - Proper icon usage with `brandSymbols.folder`, `brandSymbols.bullet`, etc.
  - Structured text output replacing raw data dumps

#### **✨ Enhanced User Experience**

- **Visual Consistency**: Workspace tools now match the enhanced tool display system
- **Professional Output**: Clean, readable formatting consistent with all other built-in tools
- **Pink Pixel Branding**: Full integration with the signature Pink Pixel theming
- **Cross-Platform**: Maintains beautiful formatting across all terminal environments

#### **🔧 Version Updates**

- Updated version references across codebase: `package.json`, `src/index.ts`, `src/mcp/client.ts`, `src/ui/splash.ts`
- Successful build verification with no compilation errors
- Maintained backward compatibility with existing functionality

---

## [1.8.0] - 2025-09-07

### 🧠 PHASE 6: CONTEXT-AWARE DIRECTORY INTELLIGENCE - REVOLUTIONARY WORKSPACE FEATURES

Introduced comprehensive workspace intelligence that transforms Bibble into a context-aware AI assistant capable of understanding and adapting to different project environments!

### 🚀 Major New Features

#### 🔍 **Automatic Project Detection**
- **Multi-Language Support**: Detects Node.js, Python, Rust, web, and documentation projects
- **Package Manager Detection**: Identifies npm, yarn, pnpm, pip, cargo, and other tools
- **Git Integration**: Analyzes repository status, branches, and commit information
- **File Analysis**: Scans configuration files, dependencies, and project structure
- **Intelligent Categorization**: Provides detailed project metadata and feature detection

#### 🎨 **Enhanced UI Experience**
- **Beautiful Welcome Messages**: Stunning startup display with detected project information
- **Context Indicators**: Project type and name prominently displayed in chat interface
- **New Chat Commands**: `/workspace` (or `/ws`), `/ws-refresh`, `/ws-toggle` for workspace management
- **Theme Integration**: All new elements adapt to all 6 available themes (Pink Pixel, Dark, Light, Neon, Ocean, Fire)
- **Smart Branding**: Consistent Pink Pixel styling throughout workspace features

#### 🔧 **Context-Aware Built-in Tools**
- **`list_current_directory`**: Intelligent directory listing with project-aware categorization
- **`analyze_project_structure`**: Comprehensive project analysis with dependencies and build system detection
- **`suggest_project_improvements`**: AI-powered suggestions for testing, CI/CD, documentation, and best practices
- **`find_project_files`**: Smart file discovery with project-type specific filtering and search

#### ⚙️ **Advanced Configuration System**
- **Workspace Settings**: Complete control over workspace detection and display features
- **Cache Management**: Configurable cache duration for optimal performance (default: 5 minutes)
- **Custom Project Types**: Support for user-defined project detection patterns
- **Feature Toggle System**: Enable/disable individual workspace features as needed

### 🛠️ **Technical Architecture**

#### New Workspace Context System
- **`WorkspaceContext`**: Comprehensive TypeScript interfaces for project metadata
- **Project Detection Engine**: Advanced algorithms for analyzing project structure
- **Feature Detection**: Identifies build tools, testing frameworks, CI/CD, and documentation systems
- **Performance Optimized**: Lightweight caching with minimal startup impact

#### Agent Integration
- **Enhanced System Prompts**: Context-aware prompts include detected project information
- **Intelligent Tool Suggestions**: AI recommends relevant tools based on project type
- **Relative Path Support**: Tools can work with relative paths when workspace context is available
- **Smart Assistance**: Provides project-specific guidance and suggestions

#### Built-in Tools Registry
- **New Tool Category**: 'workspace' category with intelligent project tools
- **Context Injection**: All workspace tools receive current project context automatically
- **Type Safety**: Comprehensive TypeScript integration with Zod schema validation
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### 📊 **Project Detection Capabilities**

#### Supported Project Types
- **Node.js**: `package.json`, `node_modules/`, npm/yarn/pnpm, TypeScript configuration
- **Python**: `requirements.txt`, `setup.py`, `pyproject.toml`, virtual environments, pip
- **Rust**: `Cargo.toml`, `target/`, `src/main.rs`, crate dependencies
- **Web**: `index.html`, build tools (webpack, vite, parcel), CSS/JS frameworks
- **Documentation**: Multiple `.md` files, `docs/` folders, GitBook, VuePress, Docusaurus
- **Git**: Repository status, branch information, commit history, remote tracking

#### Advanced Metadata Detection
- **Dependencies Analysis**: Production, development, peer dependencies with version tracking
- **Build Systems**: Webpack, Vite, Rollup, Parcel, Cargo, setuptools, and more
- **Testing Frameworks**: Jest, Pytest, Cargo test, Vitest, and others
- **CI/CD Systems**: GitHub Actions, GitLab CI, CircleCI, Travis CI detection
- **Documentation Tools**: README quality, API docs, changelog presence

### 🎯 **User Experience Enhancements**

#### Smart Welcome Experience
```bash
╭─────────────────────────────────────────╮
│  🚀 Welcome to Bibble! 🚀              │
│                                         │
│  ⚡ Node.js Project Detected           │
│  📝 Project: my-awesome-app             │
│  🏷️  Version: 1.2.3                    │
│  📦 Package Manager: npm                │
│  🔧 Stack: TypeScript, React, Tailwind  │
│  📂 Source: src/                        │
│  ✅ Git Repository: Clean               │
│                                         │
│  💡 Try: analyze_project_structure      │
╰─────────────────────────────────────────╯
```

#### Chat Interface Integration
- **Context Header**: Shows current project type and name in chat
- **Smart Suggestions**: Project-aware tool recommendations
- **Workspace Commands**: Quick access to workspace information and controls
- **Dynamic Updates**: Real-time workspace detection updates

#### Configuration Management
```json
{
  "workspace": {
    "enabled": true,
    "showWelcome": true,
    "contextIndicators": true,
    "cacheDuration": 300000,
    "customProjectTypes": {}
  }
}
```

### 🔧 **Development Tools Integration**

#### Built-in Tool Examples
```bash
# Smart directory listing with project categorization
🧠 list_current_directory

# Comprehensive project analysis
🧠 analyze_project_structure

# AI-powered improvement suggestions
🧠 suggest_project_improvements

# Intelligent file discovery
🧠 find_project_files --pattern "*.ts" --category "source"
```

#### Chat Command Integration
```bash
/workspace          # Display current project information
/ws                 # Alias for /workspace
/ws-refresh         # Re-detect project type and refresh context
/ws-toggle          # Toggle context indicators on/off
```

### 📈 **Performance & Optimization**

#### Intelligent Caching
- **5-minute default cache**: Balances performance with accuracy
- **Smart invalidation**: Automatically refreshes when project files change
- **Memory efficient**: Lightweight context storage with minimal overhead
- **Fast startup**: Negligible impact on Bibble's startup time (<100ms)

#### Cross-Platform Compatibility
- **Windows Optimized**: Full support for Windows development environments
- **macOS & Linux**: Complete compatibility across all Unix-like systems
- **Path Handling**: Proper cross-platform path resolution and file operations
- **Terminal Support**: Works with all major terminal applications

### 🧪 **Comprehensive Testing & Documentation**

#### Test Coverage
- **Unit Tests**: Individual component testing for workspace detection
- **Integration Tests**: End-to-end testing of workspace intelligence features
- **Performance Tests**: Startup time and memory usage validation
- **Cross-Platform Tests**: Verification across different operating systems

#### Documentation
- **`WORKSPACE_INTELLIGENCE.md`**: Complete feature documentation with examples
- **Configuration Guide**: Detailed setup and customization instructions
- **Troubleshooting**: Common issues and solutions
- **API Reference**: Developer documentation for workspace context integration

### 🚀 **Future-Ready Architecture**

#### Extensibility
- **Plugin System**: Foundation for custom project type detection
- **Tool Integration**: Easy addition of new workspace-aware tools
- **Theme Compatibility**: Automatic theme adaptation for new UI elements
- **Configuration Expansion**: Flexible settings system for future features

#### Planned Enhancements
- **IDE Integration**: VS Code extension for seamless workspace sync
- **Team Workspaces**: Shared project configurations and templates
- **Advanced Analytics**: Detailed project health and metrics reporting
- **Custom Templates**: Project scaffolding and boilerplate generation

### 📊 **Migration & Compatibility**

#### Seamless Upgrade
- **Zero Breaking Changes**: All existing functionality preserved
- **Automatic Configuration**: Workspace features enabled by default with sensible defaults
- **Backward Compatibility**: Works with all existing MCP servers and configurations
- **Optional Features**: All workspace intelligence can be disabled if needed

#### Version Management
- **Updated across codebase**: `package.json`, `src/index.ts`, `src/mcp/client.ts`, `src/ui/splash.ts`
- **Consistent versioning**: All version references updated to 1.8.0
- **Build verification**: Successful compilation and testing completed

This release represents a **major architectural leap forward** that transforms Bibble from a simple chat interface into an intelligent, context-aware development assistant that understands and adapts to your project environment!

---

## [1.7.5] - 2025-01-15

### 🔧 VERSION BUMP & SYSTEM MESSAGE FILTERING IMPROVEMENTS

#### 🆕 **Version Update**
- **Package Version**: Updated from 1.7.4 to 1.7.5 across all version references
- **MCP Client Version**: Updated MCP client version string to maintain consistency
- **Build System**: All TypeScript compilation verified successfully

#### 🛡️ **Enhanced System Message Filtering**
- **Improved System Message Detection**: Enhanced filtering of system messages in conversation context
- **Auto-Save Reliability**: Improved auto-save functionality for conversation state management
- **Context Management**: Better handling of system-generated messages vs user messages

#### 🔧 **Technical Enhancements**
- **Consistent Versioning**: All version references updated across:
  - `package.json` - Main package version
  - `src/index.ts` - CLI version display
  - `src/mcp/client.ts` - MCP client version (3 instances)
- **Build Verification**: TypeScript compilation successful with no errors
- **Backward Compatibility**: All existing functionality preserved

#### 📈 **Quality Improvements**
- **Code Consistency**: Unified version management across the codebase
- **Reliability**: Enhanced message filtering for better conversation flow
- **Documentation**: Version update properly documented in changelog

This release provides a stable version increment with improved system message handling and enhanced auto-save capabilities for better user experience!

---

## [1.7.4] - 2025-09-07

### 🔧 HYBRID TOOLS ARCHITECTURE - CRITICAL TOOL ROUTING FIX

Resolved critical issue where built-in tools (like Hacker News) were being incorrectly routed through MCP wrapper system, causing "No MCP client found" errors.

#### 🛠️ **Root Cause Resolution**
- **Problem**: Compact tools mode was forcing ALL tool calls through MCP wrapper (`call_mcp_tool`)
- **Impact**: Built-in tools like `get-hackernews-stories` failing with MCP routing errors
- **Solution**: Implemented hybrid architecture separating built-in and MCP tool handling

#### 🎯 **Hybrid Architecture Implementation**
- **Built-In Tools**: Now exposed directly to LLM without MCP wrapper
  - Direct tool calls: `get-hackernews-stories`, `get-weather`, `datetime`, etc.
  - No routing through MCP system prevents "No MCP client found" errors
  - Maintains native performance and reliability
- **MCP Tools**: Continue using wrapper system for optimal performance
  - Wrapped calls: `call_mcp_tool` with tool name and arguments
  - Keeps system prompt manageable by avoiding massive tool schema bloat
  - Preserves MCP server functionality and integration

#### ⚙️ **Technical Enhancements**
- **Smart Tool Registry**: Enhanced `agent.ts` with hybrid tool exposure logic
- **System Prompt Optimization**: Clear distinction between built-in and MCP tool usage patterns
- **Backward Compatibility**: All existing MCP integrations continue working unchanged
- **Error Prevention**: Eliminates MCP routing errors for built-in tools

#### 🧪 **Comprehensive Testing**
- ✅ **Built-In Tool Verification**: Hacker News tool working correctly without wrapper
- ✅ **MCP Tool Verification**: All MCP servers connecting and functioning properly
- ✅ **Integration Testing**: Hybrid approach tested with real conversation flows
- ✅ **Error Resolution**: "No MCP client found" errors completely eliminated

#### 📈 **User Experience Impact**
- **🚀 Reliability**: Built-in tools now work consistently without MCP-related failures
- **⚡ Performance**: Native tool calls for built-in tools provide optimal speed
- **🔧 Maintainability**: Clear separation makes tool system easier to understand and debug
- **🎯 Compatibility**: Seamless experience across all tool types

#### 🛡️ **Security & Compatibility**
- **Preserved Security**: All existing security policies and MCP protections maintained
- **Full Integration**: Works with all LLM providers (OpenAI, Anthropic, Google Gemini)
- **Configuration**: No user configuration changes required - works out of the box
- **Rollback Safety**: Architecture allows for easy modifications if needed

#### 🔍 **Validation Results**
- ✅ Built-in Hacker News tool executes directly without MCP wrapper
- ✅ All 4 MCP servers (Sequential Thinking, Context7, TaskFlow, MCPollinations) connect successfully
- ✅ Hybrid tool exposure working correctly with LLM tool selection
- ✅ No conflicts between built-in and MCP tool namespaces
- ✅ System prompts properly instruct on tool usage patterns

This critical fix ensures reliable tool execution across Bibble's entire ecosystem, eliminating the frustrating MCP routing errors while maintaining all existing functionality and performance optimizations!

---

## [1.7.3] - 2025-09-07

### 🌤️📰 WEATHER AND NEWS NATIVE TOOLS - INFORMATION AT YOUR FINGERTIPS

Added comprehensive weather forecasting and Hacker News integration as native built-in tools, expanding Bibble's information capabilities!

#### 🌤️ New Built-In Tool: Weather (`weather`) + Configuration
- **OpenWeatherMap Integration**: Professional weather API with global coverage
- **Configuration Wizard**: `bibble config weather` - Beautiful setup wizard for API key, default location, and units
- **Smart Default Location**: Optional location parameter - uses configured default or prompts for specification
- **Intelligent Unit Handling**: Uses configured units preference (metric/imperial/kelvin) or parameter override
- **Current Weather**: Temperature, humidity, wind, visibility, cloudiness, sunrise/sunset
- **Weather Forecasts**: Optional 1-5 day forecasts with detailed daily predictions
- **Multiple Unit Systems**: Metric (°C), Imperial (°F), and Kelvin support with user preferences
- **Smart Location Support**: Cities, zip codes, and geographic coordinates
- **Beautiful Output**: Emoji-rich formatted weather reports with intuitive icons
- **Configurable Caching**: User-configurable cache duration (default: 10 minutes)
- **Configurable Rate Limiting**: User-configurable API quota protection (default: 1000/hour)
- **Enhanced UX**: "What's the weather?" works with default location, "What's the weather in Tokyo?" overrides

#### 📰 New Built-In Tools: Hacker News (`news`)
- **get-hackernews-stories**: Latest stories from Hacker News with multiple categories
  - Story Types: top, new, best, ask HN, show HN, jobs
  - Optional Comments: Top comments for each story
  - Flexible Limits: 1-50 stories, 1-20 comments per story
- **get-hackernews-story**: Detailed view of specific stories by ID
  - Full Story Details: Title, URL, author, score, comment count
  - Rich Comments: Top-level comments with author and timestamp
  - Content Extraction: Clean text from HTML with intelligent formatting
- **No API Key Required**: Direct integration with Hacker News Firebase API
- **Smart Caching**: 5-minute result caching for optimal performance

#### 🎨 Enhanced Visual Integration
- **Weather Icon**: 🌤️ with cyan theme integration and status indicators
- **News Icon**: 📰 with orange theme integration and contextual styling
- **Tool Categories**: New "weather" and "news" categories in tool icon system
- **Rich Formatting**: Beautiful output with emojis, colors, and structured information
- **Status Badges**: Animated loading and completion states for enhanced UX

#### ⚙️ Technical Excellence
- **Built-In Architecture**: No external MCP server dependencies required
- **Type Safety**: Complete TypeScript integration with Zod schema validation
- **Error Handling**: Comprehensive error recovery with user-friendly messages
- **Cross-Platform**: Full Windows, macOS, and Linux compatibility
- **Provider Agnostic**: Works seamlessly with OpenAI, Anthropic, Google Gemini, and compatible endpoints
- **Security Features**: Input validation, API key protection, rate limiting, safe HTML processing

#### 🚀 Usage Examples
```bash
# Weather Examples
get-weather: {"location": "London", "units": "metric"}
get-weather: {"location": "New York", "includeforecast": true, "forecastDays": 5}

# News Examples  
get-hackernews-stories: {"storyType": "top", "maxStories": 10}
get-hackernews-story: {"storyId": 40123456, "includeComments": true}
```

#### 🔧 Setup Requirements  
- **Weather**: Get free OpenWeatherMap API key, then run `bibble config weather` for guided setup
  - Environment variable `OPENWEATHER_API_KEY` still supported as fallback
  - Configuration wizard handles API key, default location, and unit preferences
  - Smart defaults: location optional if configured, units from preferences
- **News**: Ready to use immediately (no setup required)

These additions transform Bibble into a comprehensive information assistant, perfect for developers who want weather updates and tech news without leaving their terminal! 🚀✨

---

## [1.7.2] - 2025-09-07

### ⏰ NATIVE DATETIME TOOL INTEGRATION - ENHANCED TIME AWARENESS

Added a comprehensive native datetime tool that brings time and timezone awareness directly into Bibble's built-in tools ecosystem!

#### 🔧 New Built-In Tool: Datetime (`datetime`)
- **Current Date & Time**: Get precise current date and time information
- **Timezone Support**: Full IANA timezone database support (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo')
- **Flexible Defaults**: Uses user-configured timezone, system timezone, or UTC fallback
- **Multiple Formats**: Provides ISO 8601, Unix timestamp, and human-readable formats
- **Smart Validation**: Graceful handling of invalid timezones with helpful error messages

#### 🛠️ Configuration Integration
- **Timezone Configuration**: New `bibble config timezone` command with interactive wizard
- **Auto-Detection**: Automatic system timezone detection option
- **Custom Selection**: Choose from common global timezones with flag emojis 🌍🇺🇸🇬🇧🇯🇵
- **Manual Input**: Direct IANA timezone specification with validation
- **Persistent Storage**: User timezone preferences stored in configuration

#### ⚙️ Technical Implementation
- **Built-In Tool Registry**: Integrated into the "time" category with proper icon support ⏰
- **TypeScript Types**: Comprehensive type definitions and parameter validation
- **Error Handling**: Robust error handling with user-friendly messages
- **Testing Coverage**: Extensive programmatic tests for all functionality
- **Cross-Platform**: Full Windows, macOS, and Linux compatibility

#### 🎯 Usage Examples
```bash
# Configure default timezone
bibble config timezone

# In chat - get current time
"What time is it?"
# Uses configured timezone or UTC

# In chat - get time in specific timezone
"What time is it in Tokyo?"
# AI will use datetime tool with Asia/Tokyo parameter
```

#### 📈 Benefits
- **Time-Aware Conversations**: AI can now provide accurate date/time information
- **Timezone Intelligence**: Proper timezone handling for global users
- **Configuration Consistency**: Integrates with existing Bibble configuration system
- **Enhanced Utility**: Makes Bibble more useful for scheduling and time-sensitive tasks
- **Native Performance**: No external MCP server dependencies required

This addition enhances Bibble's utility as a comprehensive AI assistant by providing native time awareness capabilities with sophisticated timezone support! ⏰✨

---

## [1.7.1] - 2025-09-07

### 🚀 CRITICAL OPTIMIZATION: MCP Context Diet Implementation

Implemented a **game-changing optimization** that dramatically reduces prompt/context size and resolves performance bottlenecks caused by massive tool schema registration.

#### 🎯 **The Problem Solved**
- **Context Bloat**: Every LLM request was registering ALL tool schemas (built-in + MCP server tools)
- **Performance Impact**: Massive prompts causing token limit issues, slower responses, higher API costs
- **Escalating Issue**: v1.7.0 web search tools made the problem significantly worse

#### 🛠️ **The Solution: On-Demand Tool Discovery**

Replaced the "register everything" approach with a smart wrapper system:

**New Wrapper Tools Added:**
- 🔍 **`list_tools`** - Get compact directory of available tools with optional server/name filters
- 📖 **`describe_tool`** - Fetch detailed JSON schema and required parameters for specific tools only when needed  
- ⚡ **`call_mcp_tool`** - Execute any tool by exact name with arguments

**Smart Mode System:**
- 📦 **Compact Mode (Default)**: Exposes only 5 tools (3 wrappers + 2 exit tools) 
- 🔄 **Legacy Mode**: `compactToolsMode: false` preserves old behavior for safe rollback
- 🎛️ **Configurable**: New `AgentOptions.compactToolsMode` flag for easy control

#### 🔧 **Technical Implementation**

**Agent Class Enhancements:**
- Added `_listToolsSummary()` helper method for organized tool directories
- Added `_describeTool()` helper method for detailed tool information
- Implemented wrapper tool call interception with security preservation
- Updated system prompt with clear tool discovery flow instructions

**Security & Compatibility:**
- ✅ **All Security Preserved**: `call_mcp_tool` delegates to existing `callTool()` method
- ✅ **SecurityManager Integration**: Tool evaluation, prompts, denials, and logging fully maintained  
- ✅ **Backward Compatible**: Rollback flag ensures zero-risk deployment
- ✅ **UI Affordances**: All existing tool display and user interactions preserved

#### 📈 **Performance Impact**

**Before (v1.7.0):**
```
Context per request:
- ~10+ Built-in tools (filesystem, process, search, web, config, edit)
- All MCP server tools with full schemas
- Detailed parameter docs and examples
- JSON schema definitions for every tool
= MASSIVE prompt bloat (thousands of tokens)
```

**After (v1.7.1):**
```
Context per request:
- 5 lightweight tools total (3 wrappers + 2 exit)
- Tool schemas loaded on-demand only when needed
- Intelligent caching and reuse
= DRAMATIC context reduction (90%+ smaller)
```

#### 🎉 **Expected Benefits**
- **🚀 Faster Response Times**: Reduced context processing overhead
- **💰 Lower API Costs**: Significantly fewer tokens per request
- **🎯 Better Model Performance**: Less overwhelming tool lists, more focused responses
- **⚡ Improved Reliability**: Fewer token limit errors and context window issues
- **🔄 Scalable Architecture**: Easy to add more tools without context explosion

#### 🔍 **Validation Results**
- ✅ Build successful with no TypeScript errors
- ✅ All 6 validation checklist items verified  
- ✅ Security checks fully preserved and tested
- ✅ Backward compatibility confirmed with rollback option
- ✅ Tool discovery flow working correctly

#### 📝 **Usage**

**Default Behavior (Recommended):**
```typescript
// Compact mode enabled by default
const agent = new Agent();
// Uses only 5 tools, discovers others on-demand
```

**Legacy Mode (If Needed):**
```typescript
// Rollback to old behavior if needed
const agent = new Agent({ compactToolsMode: false });
// Uses old "register everything" approach
```

**Manual Tool Discovery:**
```
User: "What tools are available for file operations?"
Agent: calls list_tools({ match: "file" })
Agent: calls describe_tool({ name: "write_file" })
Agent: calls call_mcp_tool({ name: "write_file", args: { path: "...", content: "..." } })
```

This optimization represents a **major architectural improvement** that future-proofs Bibble's scalability while dramatically improving performance and user experience!

---

## [1.7.0] - 2025-09-06

### 🌐 PHASE 4: WEB SEARCH & RESEARCH INTEGRATION - MASSIVE CAPABILITY EXPANSION ✨

Introduced a comprehensive web search and research system that transforms Bibble into a powerful research assistant with multi-engine search capabilities and AI-powered content analysis!

### 🚀 Major New Built-In Tools

#### 🔍 Web Search Engine Integration
- **Multi-Engine Support**: Integrated DuckDuckGo, Bing, and Google search engines with intelligent fallbacks
- **Smart Query Enhancement**: AI-powered query optimization for better search results
- **Rate Limiting & Timeouts**: Professional-grade request management with configurable limits
- **Cross-Platform Windows Support**: Optimized for Windows environments with proper path handling

#### 🧠 Advanced Research Assistant
- **Event-Driven Research Sessions**: Sophisticated research workflow management
- **Content Extraction & Analysis**: Advanced web scraping with intelligent content parsing
- **Multi-Step Research Process**: Automated research workflows with progress tracking
- **Session State Management**: Persistent research sessions with status monitoring

### 🛠️ New Built-In Tools Added

#### 1. 🔍 Web Search Tool (`web-search`)
- **Multi-Engine Search**: Primary DuckDuckGo with Bing/Google fallbacks
- **Configurable Parameters**: Custom result counts, search depth, content extraction
- **Progress Monitoring**: Real-time feedback during search operations
- **Error Recovery**: Graceful handling of API failures and network issues
- **Results Processing**: Clean, formatted search results with metadata

#### 2. ⚡ Quick Search Tool (`quick-search`)
- **Fast Single Queries**: Optimized for rapid information retrieval
- **Streamlined Interface**: Simplified search for quick fact-checking
- **Instant Results**: Minimal processing overhead for speed
- **Smart Formatting**: Clean, readable search result display

#### 3. 📊 Research Session Status (`research-status`)
- **Active Session Monitoring**: Track ongoing research operations
- **Progress Visualization**: Clear status indicators and completion metrics
- **Session Management**: Start, monitor, and control research workflows
- **Result Aggregation**: Consolidated view of research findings

### 🔧 Technical Architecture Enhancements

#### Enhanced Type System
- **New Tool Category**: Added 'web' category to built-in tool types
- **Comprehensive Interfaces**: Type-safe definitions for all web search components
- **Provider Abstractions**: Flexible architecture for future search engine additions

#### Modular Component System
- **`ContentExtractor`**: Advanced web scraping with rate limiting and error handling
- **`ResearchAgent`**: AI-powered research orchestration and session management  
- **`SearchEngine`**: Unified interface for multiple search providers
- **`QueryEnhancer`**: AI-driven query optimization for better results

#### Cross-Platform Compatibility
- **Windows-First Design**: Optimized for Windows development environments
- **Path Handling**: Proper Windows path resolution and file management
- **Process Management**: Windows-compatible subprocess handling
- **Error Recovery**: Platform-specific error handling and fallbacks

### 🎯 Integration Features

#### Built-In Tool Registry Integration
- **Automatic Registration**: Seamless integration with existing tool ecosystem
- **Category Organization**: Proper categorization within web tools section
- **Discovery System**: Tools automatically appear in help and tool lists
- **Configuration Support**: Integrated with Bibble's configuration system

#### Search Engine Implementations
- **DuckDuckGo Integration**: Privacy-focused primary search engine
- **Bing Search API**: Microsoft Bing integration with API key support
- **Google Custom Search**: Google search with custom search engine support
- **Intelligent Fallbacks**: Automatic failover between search engines

#### Content Processing Pipeline
- **Web Scraping**: Intelligent content extraction from search results
- **Rate Limiting**: Configurable request throttling to respect API limits
- **Content Cleaning**: HTML parsing and text extraction with formatting
- **Metadata Extraction**: Rich result metadata including titles, descriptions, URLs

### 📚 Dependencies & Infrastructure

#### New Dependencies Added
- **`axios ^1.6.0`**: HTTP client for web requests and API interactions
- **Enhanced Error Handling**: Comprehensive error management across all components
- **Configuration Integration**: Web tools work with existing Bibble configuration system

### 🌟 User Experience Impact

#### Research Workflow Enhancement
- **🔍 Comprehensive Search**: Access to multiple search engines from within Bibble
- **⚡ Fast Information Retrieval**: Quick searches for immediate answers
- **📊 Research Management**: Organized research sessions with progress tracking
- **🎯 AI-Enhanced Queries**: Smarter searches with query optimization

#### Developer Experience Improvements
- **🛠️ Modular Architecture**: Clean, extensible codebase for future enhancements
- **📝 Type Safety**: Full TypeScript support with comprehensive type definitions
- **🔧 Configurable System**: Easy customization of search parameters and providers
- **📚 Documentation**: Comprehensive inline documentation for all components

### 📈 Technical Metrics
- **3 New Built-In Tools** 🛠️ Fully Integrated and Tested
- **4 Major Components** 🔧 Content Extractor, Research Agent, Search Engine, Query Enhancer
- **3 Search Engines** 🌐 DuckDuckGo, Bing, Google with Fallbacks
- **1 New Tool Category** 📂 Web Tools Classification
- **Cross-Platform Support** 💻 Windows-Optimized Architecture

### 🚀 Future Roadmap Integration
This release sets the foundation for:
- **Additional Search Engines**: Easy integration of new search providers
- **Enhanced AI Features**: More sophisticated research assistance capabilities
- **API Integrations**: Ready for additional web service integrations
- **Research Analytics**: Future research result analysis and insights

This major update transforms Bibble from a chatbot into a **comprehensive research and development assistant** that can search the web, extract content, and provide intelligent research capabilities directly within your terminal environment! 🌐✨

---

## [1.6.1] - 2025-09-06

### 🔧 Bug Fixes & UX Improvements

#### CLI Command Exit Behavior
- **Fixed hanging CLI commands**: All configuration commands now exit properly after completion
  - ✅ Theme commands (`list`, `set`, `current`, `reset`) exit cleanly
  - ✅ Config commands (`api-key`, `default-provider`, `get`, `set`, `reset`) exit cleanly
  - ✅ System commands (`diagnose`, `system-prompt`, `setup`) exit cleanly
- **Enhanced main program logic**: Non-interactive commands now exit after completion instead of remaining in memory

#### Theme System Fixes
- **Fixed theme list command error**: Resolved "Cannot read properties of undefined (reading '0')" error
- **Improved BibbleTable style handling**: Added defensive style configuration with proper fallbacks
- **Enhanced error recovery**: Theme list now displays simple formatted list if table rendering fails

#### Configuration Provider Support
- **Expanded provider choices**: Added missing providers in config commands
  - ✅ OpenAI (GPT models)
  - ✅ Anthropic (Claude models)  
  - ✅ Google (Gemini models)
  - ✅ OpenAI Compatible (Custom endpoints)
- **Fixed provider display names**: More descriptive names for better user experience

### 🎛️ Major New Feature: Model Configuration Wizard

#### New Command: `bibble config configure`
A comprehensive wizard that guides users through configuring their AI provider and model settings, similar to the MCP servers setup experience.

#### Key Features:
- **📊 Current Settings Display**: Shows current provider and model at startup
- **🔌 Provider Selection**: Choose from OpenAI, Anthropic, Google, or OpenAI Compatible
- **🎯 Flexible Model Selection**: 
  - Pre-defined model list for each provider
  - **Custom model input for all providers** (perfect for new releases)
  - Smart defaults based on provider
- **⚙️ Provider-Specific Parameters**:
  - **Standard Models**: Temperature, Max Tokens, Top P/K
  - **OpenAI Reasoning Models**: Max Completion Tokens, Reasoning Effort
  - **Claude 3.7 Models**: Thinking mode, Thinking budget tokens
  - **🔧 OpenAI Compatible**: Custom parameter input system - users define their own parameters (name and value) to avoid compatibility issues with different endpoints
- **💾 Smart Configuration Management**: Updates provider defaults and model configurations
- **📋 Configuration Summary**: Clear confirmation of all saved settings
- **🎨 Beautiful UI**: Themed interface with emojis and proper visual hierarchy

#### OpenAI Compatible Enhancement:
- **Custom Parameter System**: Instead of hardcoded parameters, users can define their own parameter names and values
- **Flexible Input**: Like the MCP server wizard - enter parameter name, then value, repeat as needed
- **Endpoint Compatibility**: Prevents bad request errors by letting users specify only compatible parameters
- **Type Detection**: Automatically converts numeric strings to numbers, booleans to booleans
- **Examples Provided**: Shows common parameter names (temperature, max_tokens, top_p, etc.)

#### Benefits:
- **User-Friendly**: No more manual config file editing
- **Future-Proof**: Support for custom model IDs as new models are released
- **Comprehensive**: Handles all provider-specific parameters intelligently
- **Safe**: Validates all inputs and provides helpful defaults

### 📚 Documentation Updates
- Updated help text for new configuration wizard
- Enhanced command descriptions for better clarity
- Improved error messages with contextual guidance

---

## [1.6.0] - 2025-09-06

### 🎨 PHASE 3: ENHANCED ICON USAGE - MASSIVE VISUAL OVERHAUL ✨

Transformed Bibble into a visually sophisticated terminal experience with comprehensive icon enhancements throughout the entire interface!

### 🔧 Major New Features
- **Comprehensive Icon System**: Created centralized `tool-icons.ts` module with 11 themed tool categories
  - 🗂️ **Contextual Tool Icons**: Filesystem (📁), System (⚡), Web (🌐), Memory (🧠), Task (📋), GitHub (🐙), Docs (📚), AI (🎨), Time (⏰), Config (⚙️), Notification (🔔)
  - 🎯 **Smart Category Detection**: Automatic tool categorization with appropriate icons and themed coloring
  - 🌈 **Theme Integration**: All icons respect dynamic theme system with proper fallbacks

- **Advanced Status Badge System**: Created comprehensive `status-badges.ts` with full state management
  - 🎭 **9 Application States**: initializing, ready, thinking, processing, streaming, waiting, error, offline, connecting
  - 📊 **Priority-Based Rendering**: Low, medium, high, critical priorities with appropriate visual feedback
  - ⚡ **Animated Status Indicators**: Sparkle animations for active states with themed colors
  - 🔄 **State History Tracking**: Status manager maintains state transitions for better UX

### 🎨 Enhanced Chat Experience
- **Dynamic Role Headers**: Enhanced user (👤) and assistant (✨) icons with theme-aware coloring
- **Content Type Detection**: Automatic icons for code blocks (💻), JSON data (📊), URLs (🔗), files (📁)
- **Smart Message Enhancement**: Contextual icon prefixes for specific content types
- **Beautiful Separators**: Themed gradient separators with sparkles (✨) between messages
- **Enhanced Input Prompts**: 
  - 📝 **Multiline Mode**: Beautiful input flow with completion feedback
  - 💻 **Code Block Mode**: Programming context with syntax awareness
  - 👤 **User Prompts**: Enhanced identity icons with theme integration

### 🔧 Command System Overhaul
- **Categorized Help Display**: Organized commands with contextual category icons
  - 🔧 **Basic Commands**: help (❓), exit (🚪), clear (🧹), save (💾), reset (🔄)
  - 📝 **Advanced Input**: multiline (📝), paste (📝), code blocks (💻)
- **Enhanced Config Commands**: 
  - ✅ **Success Indicators**: Clear visual confirmation for all operations
  - ❌ **Error Handling**: Prominent error states with contextual messaging
  - 🔑 **API Key Security**: Secure display with lock icons (🔐) for hidden values
  - 📋 **Data Operations**: Smart icons for get/set/reset operations
- **Status-Aware Feedback**: All commands provide rich visual confirmation with appropriate icons

### 📊 Revolutionary Tool Result Display
- **Smart Content Detection**: Automatic categorization with beautiful headers
  - 📊 **JSON Data**: Syntax highlighting with color-coded keys, values, booleans, numbers
  - 💻 **Code Content**: Line numbering with enhanced syntax detection
  - 🔗 **URL Content**: Link icons with cyan coloring for all URLs
  - 📁 **File Content**: Folder icons for directory paths
  - ❌ **Error Content**: Prominent error highlighting with themed colors
  - 📄 **Text Content**: Clean text display with improved typography

- **Advanced Table Formatting**: 
  - 🎯 **Contextual Headers**: Property-based icons (🔗 links, 📅 dates, 🔢 numbers, 👤 users, 📧 emails)
  - 📈 **Data Count Indicators**: Clear item counts with themed styling
  - 🔍 **Object Details**: Enhanced key-value displays with property icons
  - ⋯ **Pagination**: Beautiful "and X more items" indicators with themed icons

- **Enhanced List Display**:
  - 🔢 **Sequential Numbering**: Beautiful emoji numbering (1️⃣-🔟, then ▶️)
  - 🌐 **URL Detection**: Web icons for HTTP links
  - 📄 **File Detection**: Document icons for file paths
  - ✅ **Success/Error States**: Contextual feedback icons
  - 🎯 **Pattern Recognition**: Smart content-based icon selection

### ⚡ Status & Progress Indicators
- **Enhanced Loading States**: 
  - 🤔 **Thinking Indicators**: Animated thinking icons with sparkles
  - ⚙️ **Processing States**: Gear icons for active operations
  - 📡 **Streaming Indicators**: Satellite icons for data streams
  - ⏳ **Waiting States**: Hourglass icons for user input

- **Progress Visualization**:
  - 📊 **Progress Bars**: 20-character progress bars with percentage and fraction display
  - 🎯 **Completion Tracking**: Current/total indicators with themed coloring
  - 🏷️ **Labeled Progress**: Optional progress labels with context
  - 🌈 **Themed Coloring**: All progress uses dynamic theme colors

- **Comprehensive Status Management**:
  - 🎭 **State Transitions**: Smooth transitions between application states
  - 🔄 **Context Awareness**: Different status displays for chat, tool, system, network contexts
  - ⏰ **Timestamped Messages**: Optional timestamps with status indicators
  - ✨ **Branded Messaging**: Pink Pixel styled status messages with gradients

### 🛠️ Technical Enhancements
- **Cross-Platform Compatibility**: Emoji + Unicode fallbacks ensure icons work everywhere
- **Performance Optimized**: Efficient icon rendering with intelligent caching
- **Memory Efficient**: Smart content detection with minimal processing overhead
- **Theme Responsive**: All enhancements respect user theme preferences
- **Error Resilient**: Graceful degradation when icons aren't available

### 🎯 Developer Experience
- **Modular Architecture**: Clean separation of icon systems for easy maintenance
- **Type-Safe**: Full TypeScript support with proper type definitions
- **Extensible Design**: Easy to add new tool categories and status types
- **Documentation**: Comprehensive inline documentation for all icon utilities
- **Testing Ready**: All components designed for easy unit testing

### 📈 Impact Metrics
- **4 Major Tasks** ✅ All Successfully Completed
- **12 Subtasks** ✅ Fully Implemented 
- **11 Tool Categories** 🔧 With Contextual Icons
- **9 Application States** 🎭 With Status Management
- **6 Content Types** 📊 Auto-detected and Styled
- **50+ Icon Mappings** 🎯 For Different Data Types

### 🌟 User Experience Impact
- **📈 Dramatically Improved Visual Hierarchy**: Information is now much easier to scan and understand
- **🎨 Consistent Pink Pixel Branding**: Beautiful, cohesive visual identity throughout
- **⚡ Intuitive Status Feedback**: Users always know what's happening
- **🔍 Enhanced Data Comprehension**: Tool results are now incredibly easy to interpret
- **✨ Delightful Interactions**: Every action provides satisfying visual confirmation

This massive update transforms Bibble from a functional CLI tool into a **visually sophisticated, intuitive, and delightful terminal experience** that maintains excellent performance while providing rich visual context for every interaction! 🚀

## [1.5.1] - 2025-09-06

### 🔧 CRITICAL AGENT LOOP & TOOL DISPLAY FIXES

### Fixed
- **🎯 CRITICAL: Agent Response Cutoff**: Fixed issue where agent responses were being cut off mid-sentence
  - Root cause: Conversation loop was terminating before streaming completed
  - Solution: Changed from `yield*` delegation to explicit `for await` loop to ensure all stream chunks are yielded
  - Agent now completes full responses before checking termination conditions
  - Proper turn-taking: Agent responds → User responds → Agent responds
- **🔧 Tool Display Function Error**: Fixed `TypeError: toolDisplay.displayCall is not a function`
  - Added backward-compatible `displayCall` method to `EnhancedToolDisplay` class
  - Method wraps existing `startToolExecution` and `completeToolExecution` for seamless integration
  - Beautiful Pink Pixel themed tool display now works flawlessly with MCP tools
- **🎨 Conversation Termination Logic**: Simplified and improved agent conversation loop
  - Removed complex string-matching termination logic that was causing duplicate responses
  - Implemented simple rule: "If assistant responds without tool calls, end turn"
  - Eliminated unreliable "preparation message" vs "completion message" detection
  - Agent now follows natural conversation flow patterns

### Enhanced
- **💬 Streaming Reliability**: Improved streaming response handling
  - Ensures complete response streaming before conversation loop termination
  - Eliminates race conditions between streaming and turn management
  - Maintains real-time response display while ensuring completion
- **🎯 Agent Behavior**: Clean, predictable conversation turns
  - No more duplicate responses or mid-sentence cutoffs
  - Proper use of `task_complete` and `ask_question` control flow tools
  - Consistent turn-taking behavior across all LLM providers

### Technical Details
- **Conversation Loop**: Fixed `conversationLoop` method in `src/mcp/agent.ts`
- **Tool Display**: Enhanced `src/ui/tool-display.ts` with missing `displayCall` method
- **Streaming**: Improved chunk processing and completion detection
- **Build System**: All changes verified with successful TypeScript compilation

### Impact
- **Before**: Cut-off responses, tool display errors, duplicate agent outputs, unreliable conversation flow
- **After**: Complete responses, beautiful tool displays, single clean responses, perfect conversation turns

This release ensures rock-solid agent loop behavior and beautiful tool display functionality! ✨

## [1.5.0] - 2025-09-06

### 🎯 CRITICAL AGENT ARCHITECTURE IMPROVEMENTS

### Fixed
- **🔧 CRITICAL: Agent Control Flow Tools Missing**: Fixed missing control flow tools in agent system prompt
  - Resolved issue where `task_complete` and `ask_question` tools were defined internally but not visible to the agent
  - Added prominent "🛑 CONTROL FLOW TOOLS (CRITICAL - Use these to end conversations!)" category to tools list
  - Enhanced system prompt with explicit instructions on when and how to use control flow tools
  - Fixed infinite loop issues where agent would continue generating responses instead of ending turn
  - Ensured proper conversation termination allowing users to respond appropriately
- **🔧 Code Quality Enhancement**: Improved agent architecture with cleaner tool management
  - Enhanced `generateToolsList()` method to properly include exit loop tools in system prompt
  - Added clear usage instructions for `task_complete` and `ask_question` tools
  - Implemented proper tool categorization with visual emphasis on critical control flow tools
  - Enhanced conversation flow control with explicit "DO NOT continue generating text" instructions

### Changed
- **🧠 Agent Behavior**: Improved conversation turn management and user interaction flow
  - Agent now properly recognizes when to end conversation turns using control flow tools
  - Enhanced agent's ability to signal task completion or request more information
  - Improved conversation state management preventing endless response generation
- **🔄 System Prompt Enhancement**: Better tool visibility and usage guidance
  - Control flow tools now prominently featured in agent's available tools list
  - Clear categorization distinguishes critical control tools from regular functionality tools
  - Enhanced instructions ensure agent understands proper conversation ending protocol

### Technical Details
- **Tool Management**: Fixed tool registration and system prompt generation order
- **Agent Logic**: Improved conversation loop termination with proper tool-based control
- **System Integration**: Enhanced agent initialization to include all necessary control flow tools
- **UX Flow**: Restored proper conversational back-and-forth between user and agent

### Impact
- **Before**: Agent missing control flow tools, infinite response loops, poor conversation management
- **After**: Proper conversation turns, clean task completion, responsive user interaction

This release fixes critical agent behavior issues, ensuring proper conversation flow and eliminating frustrating infinite response loops! 🎯

## [1.4.5] - 2025-08-29

### 🧹 CLEANUP & JSON PARSING FIXES

### Fixed
- **🔧 CRITICAL: JSON Parsing Errors**: Fixed tool call argument parsing errors caused by concatenated JSON objects
- **🔧 Marked Compatibility**: Downgraded marked from v15.0.12 to v14.1.4 to maintain compatibility with marked-terminal v7.3.0 (fixes "Cannot read properties of undefined (reading 'brand')" error)
  - Fixed issue where multiple tool calls resulted in malformed JSON like `{"path": "..."}{".content": "..."}`
  - Implemented proper multi-tool call handling using Map-based tracking by tool call index
  - Improved `processStreamResponse` to handle OpenAI streaming with multiple concurrent tool calls
  - JSON parsing now gracefully falls back to empty object `{}` on parse errors instead of crashing
- **🔧 Debug Output Removal**: Cleaned up all debug output from chat interface
  - Removed all `[CHAT DEBUG]` messages cluttering the terminal output
  - Removed `[DEBUG]` tool argument parsing messages
  - Removed tool call logging that was showing in every tool execution
  - Chat interface now shows clean, professional output without debug noise

### Changed
- **🛠️ Build Configuration**: Updated build script to include missing `zod-to-json-schema` external dependency
- **⚡ Performance**: Improved tool call processing efficiency with better error handling
- **🔌 MCP Server Startup**: Improved server connection logging with more accurate status messages
  - Changed from "running on stdio" to "connected successfully" for better accuracy across transport types
  - All MCP servers now consistently show their startup status in the terminal

### Technical Details
- **JSON Processing**: Enhanced `processStreamResponse` method to track multiple tool calls by index
- **Error Recovery**: Improved graceful fallback when tool arguments fail to parse
- **Clean Interfaces**: Removed development debug output for production-ready experience

### Impact
- **Before**: JSON parsing errors, cluttered debug output, concatenated tool arguments
- **After**: Clean chat interface, reliable tool call parsing, professional user experience

This release eliminates the frustrating JSON parsing errors and provides a much cleaner, more professional chat experience! 🎯

## [1.4.4] - 2025-08-29

### 🚀 Built-in Tools Integration & Reliability Improvements

### Added
- Built-in tools are now passed to the LLM as callable tools (not just documented in the prompt), ensuring the model can actually invoke them.
- Clear usage examples for common tools (write_file, read_file, list_directory) in the system prompt.
- Strong JSON argument formatting guidance in the system prompt to prevent concatenated JSON objects.

### Fixed
- Tool call argument parsing errors caused by concatenated JSON strings (e.g., `{...}{...}`) now log diagnostic info and safely fall back to `{}` while guidance reduces occurrence.
- Improved tool result formatting for built-in tools so arrays and objects display as readable content rather than `[Array]`/`[Object]`.
- Debug logs now accurately report counts of built-in vs MCP vs control tools at each turn.

### Changed
- Enhanced system prompt with explicit rules: "Tool arguments MUST be a single valid JSON object" and examples of correct vs incorrect usage.
- Directory listing and file operation results show friendly, human-readable summaries.

### Impact
- The LLM consistently sees and uses built-in tools.
- Fewer malformed JSON tool calls; clearer errors when they occur.
- Better, more helpful tool output in the terminal.

## [1.4.3] - 2025-08-29

### 🎯 AGENT INTELLIGENCE & TOOL SYSTEM IMPROVEMENTS

### Fixed
- **🔧 CRITICAL: MCP Tool Result Processing**: Fixed LLM missing complete tool output data
  - Resolved issue where LLM was only seeing truncated/simplified tool results while users saw full formatted output
  - Enhanced `McpClient.callTool` method to preserve complete MCP result content by combining all content items
  - Fixed agent making incorrect tool calls due to incomplete data in conversation context
  - Ensures agent sees same comprehensive information as users (e.g., correct library IDs like `/tailwindlabs/tailwindcss.com`)
- **🔧 CRITICAL: Conversation Termination Logic**: Fixed premature conversation ending
  - Resolved issue where agent would stop mid-task when saying "I will now..." instead of continuing
  - Implemented smart termination detection to distinguish preparation messages from completion signals
  - Added contextual awareness to prevent ending on "about to do" messages
  - Enhanced conversation flow to continue working when tasks are clearly incomplete
- **🔧 CRITICAL: Exit Loop Tools Availability**: Fixed missing task completion functionality
  - Restored `task_complete` and `ask_question` tools to LLM's available tools list
  - Fixed agent inability to properly signal task completion and end conversations
  - Added explicit task completion instructions to system prompt
  - Ensured proper conversation ending mechanism through tool calls rather than content parsing
- **🔧 System Prompt Enhancement**: Improved tool selection guidance and task completion
  - Added generic tool selection principles without referencing specific tool names
  - Enhanced "Tool Priority Guidelines" to favor direct action over workflow management
  - Added "TASK COMPLETION" section instructing use of 'task_complete' tool
  - Removed specific tool name references to maintain compatibility with user-configured MCP servers

### Changed
- **🧠 Agent Decision Making**: Enhanced tool selection logic and workflow efficiency
  - Implemented smarter tool selection principles favoring direct actions over complex workflows
  - Added guidance to avoid over-engineering simple tasks with elaborate planning
  - Enhanced focus on efficient execution over elaborate planning
  - Improved workflow to act decisively once information is gathered
- **🔄 Conversation Flow Control**: Intelligent conversation state management
  - Enhanced termination logic with preparation message detection ("I will now", "I am going to")
  - Improved completion signal recognition ("task complete", "successfully created")
  - Added fallback termination for very short messages after multiple turns
  - Maintained proper tool-based conversation ending as primary mechanism

### Technical Details
- **MCP Integration**: Complete MCP result content preservation with proper multi-item handling
- **Agent Logic**: Smart conversation state detection with contextual message analysis
- **Tool Management**: Proper exit loop tools integration with LLM tool availability
- **System Prompt**: Generic, user-agnostic tool selection guidance for maximum compatibility

### Impact
- **Before**: Agent missing tool data, stopping mid-task, unable to complete conversations properly
- **After**: Agent sees complete tool results, continues working as intended, properly signals completion

This release significantly improves agent intelligence and task completion reliability, ensuring smoother workflows and proper conversation management! 🎯

## [1.4.2] - 2025-08-29

### 🔒 SECURITY & CONVERSATION FIXES

### Fixed
- **🔧 CRITICAL: Security Policy Display**: Fixed messy blocked tool output
  - Cleaned up security error handling in `McpClient.callTool` method
  - Tool blocked errors now display clean message: "Tool blocked by security policy"
  - Eliminated cluttered error stack traces in terminal output
  - Enhanced security error detection with `isSecurityError` utility
- **🔧 CRITICAL: Trusted Tool Prompting**: Fixed security policy bypass for trusted tools
  - Resolved issue where trusted tools were still prompting for confirmation
  - Fixed security evaluation logic to properly respect 'trusted' server settings
  - Ensured `SecurityManager.evaluateToolCall` properly returns 'allow' for trusted tools
  - Eliminated unnecessary confirmation prompts for explicitly trusted MCP servers
- **🔧 CRITICAL: Duplicate LLM Responses**: Fixed agent generating duplicate responses
  - Simplified conversation loop termination logic in `Agent.conversationLoop`
  - Eliminated complex and flawed `nextTurnShouldCallTools` logic
  - Conversation now properly ends after assistant response, preventing infinite loops
  - Removed redundant system prompt instructions that caused repetitive LLM behavior
  - Fixed duplicate response generation where LLM would repeat entire responses
- **🔧 System Prompt Optimization**: Cleaned up repetitive system prompt instructions
  - Removed redundant "Stop when done" and "Focus on completing" instructions
  - Simplified workflow instructions to single clear directive
  - Eliminated prompt redundancy that was causing LLM response duplication

### Changed
- **🛡️ Security Error Handling**: Enhanced clean error display system
  - Security errors now show user-friendly messages without technical details
  - Preserved detailed logging for debugging while showing clean UI messages
  - Improved terminal output readability for security policy violations
- **🔄 Conversation Flow**: Simplified and more reliable conversation termination
  - Streamlined turn-ending logic for consistent single responses
  - Removed complex state management that caused conversation loop issues
  - Enhanced conversation stability and predictability

### Technical Details
- **Security**: Improved `ToolBlockedError` and `ToolDeniedError` handling in agent processing
- **Conversation Logic**: Fixed conversation loop conditions in `src/mcp/agent.ts`
- **System Prompt**: Optimized prompt clarity and removed redundant instructions
- **Error Display**: Enhanced security error presentation in tool display system

### Impact
- **Before**: Messy security errors, duplicate responses, trusted tools still prompting
- **After**: Clean security messages, single responses, proper trusted tool behavior

This release resolves critical security policy UX issues and eliminates the frustrating duplicate response problem, providing a much cleaner and more reliable user experience! 🎯

## [1.4.1] - 2025-08-28

### Fixed
- **🔧 Markdown Rendering**: Fixed bugs in markdown rendering for assistant responses
  - Improved markdown-to-terminal conversion for better readability
  - Enhanced text formatting consistency across different response types
  - Fixed rendering issues with special characters and formatting in AI responses

## [1.4.0] - 2025-08-28

### 🎨 MAJOR UI ENHANCEMENT - ENHANCED TOOL CALLING DISPLAY

### Added
- **✨ Enhanced Tool Display System**: Revolutionary tool calling interface with Pink Pixel branding
  - Created `src/ui/tool-display.ts` - Comprehensive tool execution display system
  - Beautiful gradient headers with status badges (Running, Success, Error, Cancelled)
  - Boxed parameter sections with magenta borders and JSON syntax highlighting
  - Boxed result sections with cyan borders and intelligent content formatting
  - Dynamic status updates with timing information (start time, duration)
  - Support for progress indicators using Ora spinners during tool execution
- **🎯 Smart Content Formatting**: Intelligent detection and display of different data types
  - **Arrays of objects** → Beautiful tables with proper column headers and data truncation
  - **Simple arrays** → Clean numbered lists with item formatting
  - **JSON objects** → Syntax-highlighted key-value displays with colored brackets
  - **URLs** → Clickable links with terminal-link integration where supported
  - **File paths** → Green highlighting for easy identification
  - **Text content** → Smart line wrapping and proper indentation
- **🖼️ Interactive Features**: Clipboard integration and keyboard shortcuts
  - Copy tool results to clipboard with `c` key using clipboardy
  - Expand/collapse JSON sections with `space` key
  - Quit detailed view with `q` key
  - Interactive hints footer with keyboard shortcut guidance
- **🎨 Pink Pixel Brand Integration**: Consistent theming throughout tool displays
  - Gradient "Tool Call" banners with fire gradient effect
  - Color-coded status badges (cyan for running, green for success, red for errors)
  - Pink pixel branded icons and symbols throughout the interface
  - Beautiful gradient separators between tool calls
- **📊 Enhanced JSON Handling**: Professional JSON display with syntax highlighting
  - Integration with `cli-highlight` for beautiful JSON syntax coloring
  - `json-stringify-pretty-compact` for optimal JSON formatting
  - Type-based coloring: strings in green, numbers in cyan, booleans in orange
  - Proper bracket and indentation highlighting
- **🔧 Backward Compatibility**: Feature flag system for smooth adoption
  - `BIBBLE_ENHANCED_TOOLS` environment variable for easy toggle
  - Legacy display system preserved as `displayToolCallLegacy`
  - Graceful fallback on any errors to maintain stability

### Fixed
- **🔧 CRITICAL: Duplicate Tool Display**: Eliminated double tool call rendering
  - Fixed Agent stream processing to prevent tool marker emission when enhanced display is active
  - Resolved duplicate display issue where both enhanced and legacy systems were triggering
  - Ensured single, beautiful tool display per execution
- **🔧 CRITICAL: Object Serialization**: Fixed "[object Object]" display issues
  - Ensured tool result content is properly stringified before display processing
  - Fixed JSON parsing and formatting pipeline for consistent data handling
  - Resolved object-to-string conversion issues in tool result rendering
- **🔧 CRITICAL: MCP Tools System Prompt**: Fixed empty tools list in system prompt
  - Resolved critical bug where tools list was generated before MCP servers were loaded
  - Fixed Agent constructor to defer system prompt generation until after tool loading
  - Updated Agent.initialize() to properly update system prompt with complete tools list
  - Enhanced `system-prompt` command to show actual loaded tools and descriptions
- **🔧 Tool Discovery**: Models now properly recognize available MCP tools
  - Fixed Context7 documentation tools visibility in system prompt
  - Ensured all 51 MCP tools are properly described and accessible to the model
  - Restored proper tool selection behavior for documentation searches and other tasks

### Changed
- **🎨 Tool Display Architecture**: Complete overhaul of tool result rendering
  - Replaced basic console.log output with sophisticated boxed display system
  - Enhanced visual hierarchy with clear input/output separation
  - Improved readability with proper spacing, borders, and color coding
- **📈 Dependencies**: Added essential UI enhancement packages
  - `cli-highlight` for JSON syntax highlighting
  - `clipboardy` for clipboard integration
  - `json-stringify-pretty-compact` for optimal JSON formatting

### Technical Details
- **Architecture**: New modular tool display system with extensible formatting options
- **Performance**: Optimized rendering with efficient content detection and formatting
- **Reliability**: Comprehensive error handling with graceful degradation
- **Compatibility**: Works across all terminal environments with proper feature detection

### Visual Impact
- **Before**: Basic text output with minimal formatting and duplicate displays
- **After**: Professional, branded tool interface with boxed sections, syntax highlighting, status badges, and interactive features

### New Environment Variables
- `BIBBLE_ENHANCED_TOOLS=true` (default) - Enable enhanced tool display
- `BIBBLE_ENHANCED_TOOLS=false` - Use legacy tool display for compatibility

This release transforms Bibble's tool calling interface from basic text output into a **professional, interactive, and beautifully designed system** that showcases tool execution results with Pink Pixel's signature style! ✨

## [1.3.10] - 2025-08-28

### 🚀 MAJOR RELIABILITY UPDATE - CROSS-TERMINAL COMPATIBILITY

### Added
- **🔧 Environment Resolver System**: Comprehensive cross-platform executable detection
  - Created `src/utils/env-resolver.ts` - Universal Node.js, npm, and npx path resolver
  - Cross-platform executable detection via `which`, `where`, and `Get-Command`
  - Fallback to common installation paths (Program Files, Homebrew, NVM, Volta, asdf, etc.)
  - Cached resolution for performance optimization
- **🛡️ Multi-Tier Fallback System**: Robust MCP server connection strategies
  - **Primary Strategy**: Resolved executable paths with environment enhancement
  - **Direct Command Fallback**: Original command execution without path resolution
  - **Corepack Fallback**: Node.js-based package execution for npm compatibility
  - **Bundled npm Fallback**: Direct Node.js execution for simplified npx functionality
- **🩺 Enhanced Diagnostic Command**: Comprehensive environment troubleshooting
  - Added `--verbose` flag to `bibble diagnose` for detailed system information
  - Platform detection (OS, shell, terminal identification)
  - Executable resolution with version checking
  - PATH entries analysis and environment variable inspection
  - Real-time npx execution testing in verbose mode
- **🔄 Graceful Degradation**: Non-blocking MCP server failures
  - Connection summaries showing successful vs failed server connections
  - Fallback strategy notifications when primary connection fails
  - Continued operation even if some MCP servers fail to connect

### Fixed
- **🎯 CRITICAL: Terminal Compatibility Issues**: Fixed MCP server failures across different terminals
  - Resolved "Connection closed" errors in Windows Terminal, Hyper, and other non-Warp terminals
  - Fixed environment variable and PATH discrepancies between terminal environments
  - Ensured consistent Node.js/npm/npx executable resolution across all terminals
- **🔧 Environment Path Resolution**: Robust executable detection system
  - Fixed Windows-specific .cmd file execution issues
  - Enhanced PATH environment variable handling
  - Improved error messages with actionable troubleshooting suggestions
- **⚡ MCP Server Reliability**: Enhanced connection stability
  - Multi-strategy connection attempts prevent single-point failures
  - Better error handling with user-friendly messages
  - Reference to diagnostic command for troubleshooting guidance

### Changed
- **🔍 Diagnostic System**: Enhanced environment analysis capabilities
  - More detailed platform and executable information
  - Better error reporting with specific remediation suggestions
  - Verbose mode for comprehensive system analysis
- **🛠️ Error Handling**: Improved user experience with actionable messages
  - Clear, descriptive error messages instead of technical stack traces
  - Specific suggestions for common issues (missing executables, permission errors)
  - Reference to diagnostic tools for self-service troubleshooting

### Technical Details
- **Architecture**: New modular environment resolution system with comprehensive fallback strategies
- **Cross-Platform**: Tested and verified compatibility across Windows, macOS, and Linux
- **Performance**: Cached executable resolution for optimal startup performance
- **Reliability**: Multi-tier fallback ensures maximum MCP server connectivity

### Impact
- **Before**: Bibble only worked reliably in Warp terminal, failed with "Connection closed" errors in other terminals
- **After**: Universal terminal compatibility - works consistently across Windows Terminal, Hyper, Command Prompt, PowerShell, and all major terminals

This update ensures Bibble works reliably across all terminal environments, eliminating the frustrating terminal-specific compatibility issues! 🎉

## [1.3.8] - 2025-08-23

### 🎉 MAJOR VISUAL TRANSFORMATION - BIBBLE GLAMOUR UPDATE

### Added
- **✨ Beautiful Theme System**: Complete Pink Pixel brand color palette integration
  - Created `src/ui/theme.ts` - Centralized theme system with brand colors
  - Added brand colors: Pink `#FF5FD1`, Cyan `#7AE7FF`, Green `#00FF9C`, Orange `#FFD166`, Red `#FF4D4D`, Purple `#C792EA`
  - Implemented theme utilities for consistent styling across the application
- **🌈 Gradient Text System**: Gorgeous gradient text effects throughout the interface
  - Created `src/ui/gradient.ts` - Comprehensive gradient utilities using `gradient-string`
  - Pink Pixel signature gradients: pinkCyan, rainbow, fire, sunset, neon, and more
  - Integration with brand color palette for consistent theming
- **🎨 Enhanced Color System**: Professional color management with cross-platform support
  - Enhanced `src/ui/colors.ts` Terminal class with hex color support
  - Added brand color methods and gradient text integration
  - Implemented `supports-color` detection for optimal terminal compatibility
- **✨ Cross-Platform Symbol System**: Beautiful unicode symbols that work everywhere
  - Created `src/ui/symbols.ts` with `figures` and `log-symbols` integration
  - Organized symbol categories: user, AI, status, tech, decorative
  - Emoji fallbacks for terminals that don't support complex emojis
- **🚀 Stunning Startup Experience**: Gorgeous ASCII art banner system
  - Created `src/ui/splash.ts` with `figlet` integration for ASCII art banners
  - Beautiful BIBBLE banner with Pink Pixel gradient coloring
  - System information display with model, MCP servers, and version info
  - Professional startup sequence replacing the boring gray box
- **💬 Enhanced Chat Interface**: Beautiful conversation styling with role-based colors
  - Redesigned chat prompts with colorful user/assistant/tool identification
  - User prompts: Pink gradient with person symbol (◉ You)
  - Assistant prompts: Cyan gradient with star symbol (✶ Assistant)
  - Tool messages: Orange gradient with triangle symbol (► Tool)
  - Gradient separator lines between messages for better visual hierarchy
- **📊 Beautiful Data Display & Tables (Phase 4)**: Gorgeous table system with Pink Pixel styling
  - Created `src/ui/tables.ts` - Comprehensive table system using `cli-table3`
  - Three table styles: `default` (bold borders), `clean` (minimal), `fancy` (rounded corners)
  - Enhanced `config list` command with beautiful structured table display
  - Enhanced `config mcp-servers` list with gorgeous server information tables
  - Smart color coding: URLs in cyan, models in pink, providers in orange, booleans with ✓/✗ icons
  - Nested configuration flattening for readable display of complex settings
  - Auto-styling based on content patterns (enabled/disabled, numbers, arrays)
  - Security-conscious display with hidden API keys and sensitive data
  - Tool call result enhancement with beautiful headers and structured formatting

### Changed
- **🎯 Complete Visual Overhaul**: Transformed from boring CLI to stunning terminal experience
- **Color Detection**: Improved color support detection using `supports-color` library
- **Symbol Compatibility**: Replaced problematic emojis with cross-platform unicode symbols
- **Chat Interface**: Enhanced message formatting with beautiful role-based styling

### Fixed
- **🔧 CRITICAL: Chalk Colors Working**: Fixed chalk v5 compatibility and color detection
  - Resolved color support detection issues with proper environment variable handling
  - Fixed chalk instance creation for consistent color output
  - Enhanced Terminal class with proper color level detection
- **🔧 CRITICAL: Readline Interface**: Fixed multiple conversation support
  - Resolved spinner interference with readline interface
  - Fixed stdin/stdout stream handling for continuous chat sessions
  - Ensured proper cleanup of interface components
- **🔧 Cross-Platform Compatibility**: Fixed emoji rendering issues on Windows
  - Replaced complex emojis with `figures` library symbols for universal compatibility
  - Implemented proper fallbacks for terminals with limited unicode support
  - Tested and verified on Windows terminal with full functionality

### Technical Details
- **Performance**: All styling operations optimized to under 15ms
- **Dependencies Added**: `gradient-string`, `figlet`, `supports-color`, `figures`, `log-symbols`
- **Architecture**: New modular UI system with organized theme management
- **Cross-Platform**: Tested and verified on Windows with universal symbol compatibility

### Visual Impact
- **Before**: Plain gray text with boring "You:" and "Assistant:" prompts
- **After**: Gorgeous Pink Pixel themed interface with gradient ASCII banner, colorful role-based chat prompts, and professional visual hierarchy

This update transforms Bibble from a basic CLI tool into a **stunning, professional, and engaging terminal experience** that showcases the Pink Pixel brand beautifully! ✨

## [1.3.7] - 2025-05-24

### Improved
- **OpenAI Integration Optimization**: Simplified OpenAI tool handling to match Google's efficient MCP-unified approach
  - Added `convertMcpToolsToOpenAIFormat()` method for clean, direct MCP → OpenAI functions conversion
  - Removed overcomplicated tool conversion and manual JSON parsing that could cause tool calling issues
  - OpenAI integration now follows the same clean, efficient pattern as Google Gemini integration
- **Enhanced Agent Loop Capability**: Increased maximum conversation turns for complex tasks
  - Increased `MAX_NUM_TURNS` from 10 to 25 in both main agent and Anthropic agent loop
  - Allows for more complex multi-step workflows with extensive tool usage
  - Better support for research tasks, code projects, and comprehensive information gathering

### Fixed
- **Tool Reliability**: Improved OpenAI tool calling reliability by simplifying conversion logic
- **Task Completion**: Complex tasks no longer prematurely terminated due to turn limits

## [1.3.6] - 2025-05-24

### Added
- **Google Gemini Integration**: Complete support for Google Gemini models with MCP tool integration
  - Added 6 Google Gemini models: gemini-2.5-flash-preview-05-20, gemini-2.5-pro-preview-05-06, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-flash, gemini-1.5-pro
  - Implemented GoogleClient class following MCP-unified approach with proper tool calling and streaming support
  - Added Google provider configuration to setup wizard and configuration system
  - Integrated Google client with LlmClient for seamless multi-provider support
- **Enhanced Tool Schema Handling**: Added JSON Schema cleaning for Google API compatibility
  - Implemented recursive schema cleaning to remove metadata fields ($schema, additionalProperties, etc.)
  - Maintains MCP tool compatibility while adapting to provider-specific requirements
- **Modular Provider Architecture**: Google integration follows the same modular pattern as AnthropicClient
  - Separate GoogleClient maintains code organization and avoids disrupting existing functionality
  - Consistent error handling and parameter validation across all providers

### Fixed
- **Google API Compatibility**: Resolved JSON Schema validation errors by properly cleaning tool schemas
  - Removed unsupported JSON Schema metadata fields that Google API rejects
  - Ensured proper tool calling functionality with Google's functionDeclarations format

## [1.3.5] - 2025-05-24

### Fixed
- **MAJOR FIX**: Fixed Anthropic tool calling by implementing direct MCP approach following Anthropic's official example
- **CRITICAL**: Fixed streaming tool input handling - tool arguments now properly accumulate from `input_json_delta` chunks
- Fixed tool result format to match Anthropic's expected structure
- Removed unnecessary tool argument processing that was causing empty parameters
- Simplified tool conversion to use MCP tools directly as Anthropic expects them
- Fixed tool input handling to pass Claude's arguments directly to MCP tools without conversion
- Updated both streaming and non-streaming tool call handling to follow Anthropic's recommended pattern
- Removed complex tool schema conversions in favor of direct MCP format usage
- Fixed tool result message format in agent loop to properly send results back to Claude

### Changed
- Updated AnthropicClient to follow Anthropic's official MCP integration example exactly
- Simplified tool calling logic throughout the Anthropic integration
- Improved tool argument logging for better debugging
- Enhanced streaming implementation to properly handle `content_block_start`, `input_json_delta`, and `content_block_stop` events

## [1.3.4] - 2025-05-23

### Added
- Added support for new Claude models: Claude Opus 4 and Claude Sonnet 4
- Updated default Anthropic model to Claude Opus 4

### Removed
- Removed deprecated Claude 3 Opus model

### Fixed
- Fixed Anthropic API tool handling to properly process tool calls
- Fixed tool name formatting in Anthropic client to match the expected format (serverName_toolName)
- Fixed tool parameter handling to ensure proper schema formatting for Anthropic API
- Added proper handling of empty tool parameters
- Added safety limits to prevent infinite loops in agent conversations
- Improved error handling for Anthropic tool calls
- Enhanced streaming implementation for Anthropic responses
- Removed hardcoded model in Anthropic client, now using user-configured model from config.json

## [1.3.3] - 2025-05-23

### Fixed
- Fixed Anthropic API streaming response handling to properly stream text in real-time
- Removed excessive logging messages for cleaner terminal output
- Removed debug message "Using Anthropic model..." that was appearing in chat responses
- Improved error handling in Anthropic client

## [1.3.2] - 2025-05-23

### Fixed
- Fixed Anthropic API error with custom tools by properly handling tool definitions
- Updated AnthropicClient to use "custom" type for MCP tools
- Modified Agent class to handle Anthropic's tool limitations
- Added proper error handling for tool conversion in Anthropic client
- Improved stream response handling in Anthropic client

## [1.3.1] - 2025-05-24

### Fixed
- Fixed Anthropic API error with tool_result blocks by ensuring they're only included in user messages
- Improved tool name handling to prevent duplicate tool names in Anthropic API calls
- Enhanced system prompt with clearer instructions on tool usage format
- Added explicit examples of proper tool calling format in system prompt
- Reduced debug logging for cleaner output and better readability
- Fixed tool name normalization to properly extract tool names from server_tool format
- Improved error handling for tool calls with incorrect formats

### Added
- Dynamic tool list generation in system prompt with detailed usage instructions
- Added example usage for each tool in the system prompt
- Enhanced tool name formatting with server name prefixes

## [1.3.0] - 2025-05-23

### Added
- Reimplemented Anthropic integration with support for Claude models
- Created new `AnthropicClient` class in `src/llm/anthropic.ts` with proper tool handling
- Added support for Anthropic-specific features:
  - Chain-of-thought prompting with `<thinking>...</thinking>` blocks
  - Parameter validation for tool call arguments
  - Support for both serial and parallel tool invocations
  - Comprehensive error handling
- Updated LlmClient to support Anthropic as a provider
- Restored Anthropic configuration from backup files
- Added test script for Anthropic integration
- Added `@anthropic-ai/sdk` dependency

## [1.2.2] - 2025-05-22

### Removed
- All Anthropic integration code and configuration (removed `src/llm/anthropic.ts`, CLI and config references).
- Removed `@anthropic-ai/sdk` from dependencies.

### Added
- Created `ANTHROPIC-REIMPLEMENTATION-PLAN.md` outlining a fresh integration plan for the Anthropic SDK and Claude models.

## [1.2.1] - 2025-05-21

### Changed
- Removed configurable system prompt in favor of a hardcoded non-configurable system prompt
- Retained user guidelines as a configurable option for adding custom instructions on top of the system prompt

### Fixed
- Implemented Anthropic provider integration with support for Claude models
- Fixed type errors in Anthropic client implementation
- Added support for Anthropic-specific parameters (thinking, topP, topK)
- Fixed tool calling in Anthropic models by improving stream chunk processing
- Added better handling of tool calls in complete messages
- Enhanced Anthropic stream chunk processing to properly detect and handle tool calls
- Improved handling of message_delta with stop_reason "tool_use"
- Fixed error with tool_result blocks in Anthropic messages
- Reduced debug logging for cleaner output
- Improved message conversion for Anthropic API
- Fixed missing tool_use.id field in Anthropic messages
- Removed excessive logging from Anthropic client
- Simplified tool call handling for better performance
- Removed fallback mechanisms to prevent unnecessary tool calls

## [1.2.0] - 2025-05-21

### Added
- Initial project setup
- CLI interface with Commander.js
- Chat command for interactive sessions
- Config command for managing settings
- History command for managing chat history
- MCP client implementation
- LLM provider integrations:
  - OpenAI API with support for traditional and o-series models
  - Anthropic API with Claude models
  - OpenAI-compatible endpoints for third-party services
- Setup wizard for first-time configuration
- Terminal UI with colored text and markdown rendering
- Chat history management
- Configuration management with dot-notation access
- Support for model-specific parameters

## [1.0.0] - 2025-05-21

### Added
- Initial release
- Support for OpenAI models (GPT-3.5 Turbo, GPT-4)
- MCP client for connecting to external tools
- Configuration management
- Chat history tracking
- Markdown rendering in terminal
- Colored text output
- Real-time response streaming
