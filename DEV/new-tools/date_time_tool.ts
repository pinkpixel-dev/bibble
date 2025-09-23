#!/usr/bin/env node

/**
 * This MCP server provides the current date and time with timezone support.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { formatInTimeZone } from "date-fns-tz";

/**
 * Configuration interface for server timezone settings
 */
interface ServerConfig {
  defaultTimezone?: string;
}

/**
 * Tool arguments interface for timezone parameter
 */
interface DateTimeToolArgs {
  timezone?: string;
}

/**
 * Validates if a timezone identifier is supported
 * @param timezone - The timezone identifier to validate
 * @returns true if valid, false otherwise
 */
function isValidTimezone(timezone: string): boolean {
  try {
    // Use Intl.supportedValuesOf to get all supported timezones
    // This is more robust than try/catch with toLocaleString
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      const supportedTimezones = Intl.supportedValuesOf('timeZone');
      return supportedTimezones.includes(timezone);
    }
    
    // Fallback: Try to create a date and format it in the timezone
    // If it throws, the timezone is invalid
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the default timezone from environment or configuration
 * @param config - Server configuration object
 * @returns The default timezone to use
 */
function getDefaultTimezone(config?: ServerConfig): string {
  // Priority: config.defaultTimezone > process.env.TZ > 'UTC'
  if (config?.defaultTimezone && isValidTimezone(config.defaultTimezone)) {
    return config.defaultTimezone;
  }
  
  if (process.env.TZ && isValidTimezone(process.env.TZ)) {
    return process.env.TZ;
  }
  
  return 'UTC';
}

/**
 * Server configuration - can be extended to read from config file or environment
 */
const serverConfig: ServerConfig = {
  // You can set a default timezone here, or it will use process.env.TZ or fallback to UTC
  // defaultTimezone: 'America/New_York', // Example: set default timezone
};

/**
 * Create an MCP server with capabilities for tools.
 */
const server = new Server(
  {
    name: "datetime-mcp",
    version: "0.2.0",
    description: "An MCP server that provides LLMs with current date and time context with timezone support.",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes a single "get_current_datetime" tool with timezone support.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_current_datetime",
        description: "Get the current server date and time. Optionally specify a timezone (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo'). Defaults to server's configured timezone or UTC.",
        inputSchema: {
          type: "object",
          properties: {
            timezone: {
              type: "string",
              description: "Optional timezone identifier (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo'). If not provided, uses the server's default timezone or UTC."
            }
          },
        }
      }
    ]
  };
});

/**
 * Handler for the get_current_datetime tool.
 * Returns the current date and time with timezone support.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_current_datetime": {
      try {
        const args = request.params.arguments as DateTimeToolArgs | undefined;
        const requestedTimezone = args?.timezone;
        
        // Determine which timezone to use
        let timezone: string;
        
        if (requestedTimezone) {
          // User provided a timezone parameter - validate it
          if (!isValidTimezone(requestedTimezone)) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid timezone: ${requestedTimezone}. Please use a valid IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo').`
            );
          }
          timezone = requestedTimezone;
        } else {
          // Use default timezone from server config or fallback
          timezone = getDefaultTimezone(serverConfig);
        }
        
        const now = new Date();
        
        // Format the datetime in the specified timezone
        let dateTimeString: string;
        let timezoneInfo: string;
        
        if (timezone === 'UTC') {
          // For UTC, use the standard ISO format
          dateTimeString = now.toISOString();
          timezoneInfo = 'UTC';
        } else {
          // For other timezones, use date-fns-tz to format in the timezone
          // Format as ISO-like string but with timezone offset
          const formatPattern = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";
          dateTimeString = formatInTimeZone(now, timezone, formatPattern);
          timezoneInfo = timezone;
        }
        
        // Create a user-friendly response
        const responseText = requestedTimezone 
          ? `The current date and time in ${timezoneInfo} is: ${dateTimeString}`
          : `The current date and time is: ${dateTimeString} (${timezoneInfo})`;
        
        return {
          content: [{
            type: "text",
            text: responseText
          }]
        };
      } catch (error) {
        // Re-throw McpErrors as-is
        if (error instanceof McpError) {
          throw error;
        }
        // Wrap other errors in an McpError
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to get current datetime: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    default:
      // Use McpError for standard MCP errors
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  // Add error handler
  server.onerror = (error) => console.error('[MCP Error]', error);
  await server.connect(transport);
  // Log that the server is running to stderr so it doesn't interfere with stdout JSON communication
  console.error('DateTime MCP server running on stdio');
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
