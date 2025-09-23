# Content Extractor Tool - Research Workflow Fix

## Issue Identified

The agent was only using web search results summaries instead of extracting full content from URLs to create comprehensive research documents. While content extraction was happening internally in the `web_search` tool, it wasn't being utilized properly, and the agent had no direct way to extract content from specific URLs.

## Solution Implemented

### 1. Added Standalone Content Extractor Tool

Created a new built-in tool: `extract_content`

**File:** `src/tools/built-in/web/content-extractor-tool.ts`

**Features:**
- Extract full text content from 1-10 web URLs
- Built on the existing `EnhancedWebContentExtractor` class
- Handles rate limiting and error management
- Returns formatted content suitable for research documents
- Word count and success/failure tracking

**Parameters:**
- `urls`: Array of URLs to extract content from (required, 1-10 URLs)
- `maxUrls`: Maximum number of URLs to process (optional, default: 5)

### 2. Updated Agent Research Workflow

Modified the agent's system prompt to include the content extraction step:

**Updated Research Process:**
1. **Search the web** - Use `web_search` or `quick_web_search` to find comprehensive information
2. **Extract detailed content** - Use `extract_content` tool with URLs from search results to get full article content
3. **Create research documents** - Use `write_file` to create well-structured documents
4. **Save in organized location** - Create documents in appropriate directories

### 3. Tool Registration

- Added tool to web tools index (`src/tools/built-in/web/index.ts`)
- Registered in built-in tools registry (`src/tools/built-in/registry.ts`)
- Tool is now available as a built-in tool alongside web search

## How It Works Now

### Expected Research Flow

When a user requests research, the agent should now:

1. **Search**: Use `web_search` to find relevant sources and get URLs
2. **Extract**: Use `extract_content` with the most relevant URLs from search results
3. **Synthesize**: Create comprehensive documents using the extracted content
4. **Save**: Write well-structured Markdown files in organized directories

### Example Usage

The agent can now call:

```typescript
// First, search for information
{
  "query": "terminal-based AI applications 2024",
  "extractContent": true,
  "maxSearches": 2
}

// Then, extract full content from the best URLs
{
  "urls": [
    "https://techcrunch.com/article1", 
    "https://medium.com/article2",
    "https://github.com/article3"
  ],
  "maxUrls": 3
}

// Finally, create comprehensive documents
{
  "path": "docs/research-report.md",
  "content": "# Comprehensive Research Report\n\n..."
}
```

### Benefits

- **Full Content Access**: Agent can now get complete article content, not just summaries
- **Targeted Extraction**: Can extract content from specific URLs of interest
- **Better Research Quality**: Research documents will contain detailed information from sources
- **Flexible Workflow**: Agent can choose which URLs to extract based on relevance

## Testing the Fix

After rebuilding (`npm run build`), test the research workflow by asking for comprehensive research on any topic. The agent should now:

1. Use web search to find sources
2. Extract content from the most relevant URLs
3. Create detailed research documents with the extracted content
4. Save documents in an organized structure

## Files Modified

- `src/tools/built-in/web/content-extractor-tool.ts` (new file)
- `src/tools/built-in/web/index.ts` (added export)
- `src/tools/built-in/registry.ts` (added import and registration)
- `src/mcp/agent.ts` (updated research workflow description)

The content extractor should now be available as a standard built-in tool that the agent can use to enhance its research capabilities!