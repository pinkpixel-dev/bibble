import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Config } from "../config/config.js";
import { ListToolsRequest, ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { BibbleConfig } from "../config/storage.js";
import { envResolver } from "../utils/env-resolver.js";
import { SecurityManager } from "../security/SecurityManager.js";
import { classifyToolRisk } from "../security/ToolClassifier.js";
import { createSecurityPrompt, showDenialMessage, showTimeoutMessage } from "../security/SecurityUI.js";
import { ToolDeniedError, ToolBlockedError, ToolTimeoutError } from "../security/SecurityError.js";
import { getBuiltInToolRegistry } from "../tools/built-in/index.js";

// Tool types
export type ServerName = string;
export type ToolName = string;
export type ToolDescription = string;
export type ToolParameter = Record<string, any>;

export interface ChatCompletionInputTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface ChatCompletionInputMessageTool {
  role: "tool";
  tool_call_id: string;
  name: string;
  content: string;
}

export interface McpClientOptions {
  servers?: BibbleConfig["mcpServers"];
}

/**
 * MCP Client for connecting to MCP servers
 */
export class McpClient {
  protected clients: Map<ToolName, Client> = new Map();
  public readonly availableTools: ChatCompletionInputTool[] = [];
  public readonly toolToServerMap: Map<string, string> = new Map();
  private config = Config.getInstance();
  private securityManager: SecurityManager;

  constructor(options: McpClientOptions = {}) {
    this.initializeServers(options.servers);
    
    // Initialize SecurityManager with centralized config accessor
    this.securityManager = new SecurityManager(
      () => this.config.getSecurityConfig(),
      classifyToolRisk,
      createSecurityPrompt
    );
  }

  /**
   * Initialize MCP servers from config or options
   */
  private initializeServers(servers?: BibbleConfig["mcpServers"]): void {
    // Use provided servers or get them from config
    const mcpServers = servers || this.config.getMcpServers();

    // Initialize servers
    // No logging needed
  }

  /**
   * Connect to an MCP server and add its tools
   * @param server Server configuration
   */
  async addMcpServer(server: BibbleConfig["mcpServers"][0]): Promise<void> {
    try {
      // Resolve the command path for cross-terminal compatibility
      let resolvedCommand = server.command;
      let resolvedArgs = server.args;
      
      // If using npx, resolve the full path to ensure terminal compatibility
      if (server.command === 'npx') {
        try {
          const executablePaths = await envResolver.getExecutablePaths();
          resolvedCommand = executablePaths.npx;
          
          // For Windows, if the path ends with .cmd, we need to handle it properly
          if (process.platform === 'win32' && resolvedCommand.endsWith('.cmd')) {
            // Use cmd.exe to run .cmd files reliably
            resolvedArgs = ['/c', resolvedCommand, ...server.args];
            resolvedCommand = 'cmd.exe';
          }
        } catch (error) {
          console.warn(`Failed to resolve npx path, falling back to 'npx': ${error}`);
          // Fallback to original command if resolution fails
        }
      }
      
      // Create enhanced environment with additional PATH entries
      const enhancedEnv = {
        ...process.env,
        ...server.env,
        PATH: process.env.PATH ?? ""
      };
      
      // Create transport with resolved command
      const transport = new StdioClientTransport({
        command: resolvedCommand,
        args: resolvedArgs,
        env: enhancedEnv,
      });

      // Create client
      const mcp = new Client({
        name: "bibble-mcp-client",
        version: "1.8.7",
      });

      // Connect to server
      await mcp.connect(transport);

      // Get available tools
      const toolsResult = await mcp.listTools();

      // Log successful connection so users know which servers started
      console.log(`${server.name} MCP server connected successfully`);

      // Register tools with client map
      for (const tool of toolsResult.tools) {
        this.clients.set(tool.name, mcp);
        // Map tool name to server name
        this.toolToServerMap.set(tool.name, server.name);
      }

      // Add tools to available tools list
      this.availableTools.push(
        ...toolsResult.tools.map((tool) => {
          return {
            type: "function",
            function: {
              name: tool.name,
              description: tool.description || "",
              parameters: tool.inputSchema,
            },
          } as ChatCompletionInputTool;
        })
      );
    } catch (error) {
      console.error(`Failed to connect to MCP server "${server.name}":`, error);
      throw error;
    }
  }

  /**
   * Load all tools from configured servers with graceful degradation
   */
  async loadTools(): Promise<void> {
    const mcpServers = this.config.getMcpServers();

    if (mcpServers.length === 0) {
      console.warn("No MCP servers configured.");
      return;
    }

    const enabledServers = mcpServers.filter(server => server.enabled);
    const results = await Promise.allSettled(
      enabledServers.map(server => this.addMcpServerWithFallbacks(server))
    );
    
    // Report connection summary
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (failed > 0 && successful === 0) {
      console.warn(`\n⚠️  Failed to connect to any MCP servers (${failed}/${enabledServers.length}). Some tools may not be available.`);
    } else if (failed > 0) {
      console.warn(`\n⚠️  Connected to ${successful}/${enabledServers.length} MCP servers. ${failed} server(s) failed to connect.`);
    }
  }
  
  /**
   * Connect to MCP server with multiple fallback strategies
   */
  private async addMcpServerWithFallbacks(server: BibbleConfig["mcpServers"][0]): Promise<void> {
    const strategies = [
      () => this.addMcpServer(server), // Primary strategy with path resolution
      () => this.addMcpServerWithDirectCommand(server), // Direct command fallback
      () => this.addMcpServerWithCorepack(server), // Corepack fallback
      () => this.addMcpServerWithBundledNpm(server), // Bundled npm fallback
    ];
    
    let lastError: Error | null = null;
    
    for (const [index, strategy] of strategies.entries()) {
      try {
        await strategy();
        if (index > 0) {
          console.log(`✓ Connected to MCP server "${server.name}" using fallback strategy ${index + 1}`);
        }
        return; // Success!
      } catch (error) {
        lastError = error as Error;
        // Continue to next strategy
      }
    }
    
    // All strategies failed - provide helpful error message but don't crash
    const errorMessage = this.createUserFriendlyErrorMessage(server, lastError);
    console.error(`Failed to connect to MCP server "${server.name}": ${errorMessage}`);
    throw lastError;
  }
  
  /**
   * Fallback strategy using direct command without path resolution
   */
  private async addMcpServerWithDirectCommand(server: BibbleConfig["mcpServers"][0]): Promise<void> {
    try {
      // Create transport with original command (no path resolution)
      const transport = new StdioClientTransport({
        command: server.command,
        args: server.args,
        env: {
          ...process.env,
          ...server.env,
          PATH: process.env.PATH ?? ""
        },
      });

      // Create client
      const mcp = new Client({
        name: "bibble-mcp-client",
        version: "1.8.7"
      });

      // Connect to server
      await mcp.connect(transport);

      // Get available tools
      const toolsResult = await mcp.listTools();

      // Register tools with client map
      for (const tool of toolsResult.tools) {
        this.clients.set(tool.name, mcp);
        this.toolToServerMap.set(tool.name, server.name);
      }

      // Add tools to available tools list
      this.availableTools.push(
        ...toolsResult.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.inputSchema,
          },
        } as ChatCompletionInputTool))
      );
    } catch (error) {
      throw error; // Re-throw for strategy handling
    }
  }
  
  /**
   * Fallback strategy using corepack for package execution
   */
  private async addMcpServerWithCorepack(server: BibbleConfig["mcpServers"][0]): Promise<void> {
    // Only try corepack for npm-related commands
    if (server.command !== 'npx') {
      throw new Error('Corepack fallback only applicable for npx commands');
    }
    
    try {
      const executablePaths = await envResolver.getExecutablePaths();
      const nodeExe = executablePaths.node;
      
      // Use node to run npx via corepack
      const transport = new StdioClientTransport({
        command: nodeExe,
        args: ['-p', 'require("child_process").spawn("npx", process.argv.slice(1), {stdio: "inherit"}).on("close", process.exit)', ...server.args],
        env: {
          ...process.env,
          ...server.env,
          PATH: process.env.PATH ?? ""
        },
      });

      // Create client
      const mcp = new Client({
        name: "bibble-mcp-client",
        version: "1.8.7"
      });

      // Connect to server
      await mcp.connect(transport);

      // Get available tools
      const toolsResult = await mcp.listTools();

      // Register tools with client map
      for (const tool of toolsResult.tools) {
        this.clients.set(tool.name, mcp);
        this.toolToServerMap.set(tool.name, server.name);
      }

      // Add tools to available tools list
      this.availableTools.push(
        ...toolsResult.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.inputSchema,
          },
        } as ChatCompletionInputTool))
      );
    } catch (error) {
      throw error; // Re-throw for strategy handling
    }
  }
  
  /**
   * Fallback strategy using bundled npm directly
   */
  private async addMcpServerWithBundledNpm(server: BibbleConfig["mcpServers"][0]): Promise<void> {
    // Only try bundled npm for npx commands
    if (server.command !== 'npx') {
      throw new Error('Bundled npm fallback only applicable for npx commands');
    }
    
    try {
      const executablePaths = await envResolver.getExecutablePaths();
      const nodeExe = executablePaths.node;
      
      // Use node directly to emulate npx functionality
      // This is a simplified approach - install package then run it
      const packageName = server.args[0] || '';
      if (!packageName) {
        throw new Error('No package name provided for bundled npm fallback');
      }
      
      // Try to run the package directly if it's globally available
      const transport = new StdioClientTransport({
        command: nodeExe,
        args: ['-e', `
          const { spawn } = require('child_process');
          const proc = spawn('${packageName}', ${JSON.stringify(server.args.slice(1))}, { stdio: 'inherit' });
          proc.on('close', code => process.exit(code));
        `],
        env: {
          ...process.env,
          ...server.env,
          PATH: process.env.PATH ?? ""
        },
      });

      // Create client
      const mcp = new Client({
        name: "bibble-mcp-client",
        version: "1.8.7"
      });

      // Connect to server
      await mcp.connect(transport);

      // Get available tools
      const toolsResult = await mcp.listTools();

      // Register tools with client map
      for (const tool of toolsResult.tools) {
        this.clients.set(tool.name, mcp);
        this.toolToServerMap.set(tool.name, server.name);
      }

      // Add tools to available tools list
      this.availableTools.push(
        ...toolsResult.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description || "",
            parameters: tool.inputSchema,
          },
        } as ChatCompletionInputTool))
      );
    } catch (error) {
      throw error; // Re-throw for strategy handling
    }
  }
  
  /**
   * Create user-friendly error messages with actionable suggestions
   */
  private createUserFriendlyErrorMessage(server: BibbleConfig["mcpServers"][0], error: Error | null): string {
    if (!error) return "Unknown error occurred";
    
    const message = error.message.toLowerCase();
    
    if (message.includes('enoent') || message.includes('not found')) {
      return `Command '${server.command}' not found. Please ensure Node.js and npm are installed and in your PATH. Try running 'bibble diagnose' for more information.`;
    }
    
    if (message.includes('eacces') || message.includes('permission denied')) {
      return `Permission denied when running '${server.command}'. Try running your terminal as administrator or check file permissions.`;
    }
    
    if (message.includes('connection closed') || message.includes('spawn')) {
      return `Failed to start MCP server process. The server may not be installed correctly. Try: npx -y ${server.args.join(' ')}`;
    }
    
    return error.message;
  }

   /**
   * List available tools from configured servers
   */
  async listTools(client: Client): Promise<void> {
    try {
        const toolsRequest: ListToolsRequest = {
            method: 'tools/list',
            params: {}
        };
        const toolsResult = await client.request(toolsRequest, ListToolsResultSchema);

        console.log('Available tools:');
        if (toolsResult.tools.length === 0) {
            console.log('  No tools available');
        } else {
            for (const tool of toolsResult.tools) {
                console.log(`  - ${tool.name}: ${tool.description}`);
            }
        }
    } catch (error) {
        console.log(`Tools not supported by this server: ${error}`);
    }
  }
    /**
     * Get the server name for a given tool
     * @param toolName Tool name
     * @returns Server name or undefined
     */

    /**
     * Call a tool with arguments
     * @param toolName Tool name
     * @param toolArgs Tool arguments
     */

    async callTool(toolName: string, toolArgs: any): Promise<{ content: string }> {
        const startTime = Date.now();
        const serverName = this.toolToServerMap.get(toolName) || 'unknown';
        
        try {
            // Check if this is a built-in tool
            const builtInRegistry = getBuiltInToolRegistry();
            const builtInTool = builtInRegistry.getTool(toolName);
            
            if (builtInTool) {
                // Execute built-in tool
                const result = await builtInRegistry.executeTool(toolName, toolArgs || {});
                
                // Convert built-in tool result to expected format
                let content = '';
                if (result.success) {
                    const segments: string[] = [];
                    if (result.message) {
                        segments.push(result.message);
                    }

                    if (result.data !== undefined) {
                        const formatted = this.formatBuiltInToolResult(result.data, toolName);
                        if (formatted && formatted.trim().length > 0) {
                            segments.push(formatted);
                        }
                    }

                    if (segments.length === 0) {
                        segments.push('Tool executed successfully');
                    }

                    content = segments.join('\n\n');
                } else {
                    content = result.error || 'Tool execution failed';
                }

                return {
                    content: content
                };
            }

            // Handle legacy built-in tools (skip security for these)
            if (toolName === "task_complete") {
                return this.handleTaskComplete();
            }

            if (toolName === "ask_question") {
                return this.handleAskQuestion();
            }

            // Security check for MCP server tools
            const decision = this.securityManager.evaluateToolCall(toolName, serverName, toolArgs);
            
            if (decision === 'deny') {
                const reason = 'Tool blocked by security policy';
                showDenialMessage(serverName, toolName, reason);
                this.securityManager.log(serverName, toolName, 'deny', toolArgs);
                throw new ToolBlockedError(toolName, serverName);
            }
            
            if (decision === 'prompt') {
                const approved = await this.securityManager.maybeConfirm(toolName, serverName, toolArgs);
                if (!approved) {
                    const reason = 'User denied execution';
                    showDenialMessage(serverName, toolName, reason);
                    this.securityManager.log(serverName, toolName, 'deny', toolArgs);
                    throw new ToolDeniedError(toolName, serverName);
                }
            }

            // Find the MCP client for this tool
            const client = this.clients.get(toolName);

            if (!client) {
                this.securityManager.log(serverName, toolName, 'deny', toolArgs, undefined, 'No MCP client found');
                return {
                    content: `Error: No MCP client found for tool: ${toolName}`
                };
            }

            // Process arguments
            let processedArgs = toolArgs;
            if (processedArgs === null || processedArgs === undefined) {
                processedArgs = {};
            }

            console.log(`Calling tool ${toolName} with arguments:`, JSON.stringify(processedArgs));

            // Execute with timeout
            const toolPromise = client.callTool({
                name: toolName,
                arguments: processedArgs
            });
            
            const result = await this.securityManager.withTimeout(toolPromise, serverName);
            const duration = Date.now() - startTime;
            
            // Log successful execution
            this.securityManager.log(serverName, toolName, 'allow', toolArgs, duration);

            // Return the complete MCP result content
            // MCP results can be text, images, or other content types
            // We need to preserve all the information for the LLM to see
            let fullContent = "No content returned from tool";
            
            if (result.content && Array.isArray(result.content) && result.content.length > 0) {
                // Combine all content items into a single string
                const contentParts = result.content.map((item: any) => {
                    if (typeof item === 'string') {
                        return item;
                    } else if (item && typeof item === 'object') {
                        if (item.type === 'text' && item.text) {
                            return item.text;
                        } else if (item.text) {
                            return item.text;
                        } else {
                            // For non-text content, include the full object as JSON
                            return JSON.stringify(item, null, 2);
                        }
                    }
                    return String(item);
                });
                
                fullContent = contentParts.join('\n\n');
            }
            
            return {
                content: fullContent
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Handle timeout specifically
            if (error instanceof Error && error.message.includes('timed out')) {
                const timeoutMs = this.config.getSecurityConfig().toolTimeout;
                showTimeoutMessage(serverName, toolName, timeoutMs);
                this.securityManager.log(serverName, toolName, 'deny', toolArgs, duration, error);
                throw new ToolTimeoutError(toolName, serverName, timeoutMs);
            }
            
            console.error(`Error calling tool ${toolName}:`, error);
            this.securityManager.log(serverName, toolName, 'deny', toolArgs, duration, error);
            return {
                content: `Error executing tool ${toolName}: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

  /**
   * Format built-in tool result for better display
   * @param data Tool result data
   * @param toolName Name of the tool
   * @returns Formatted string
   */
  private formatBuiltInToolResult(data: any, toolName: string): string {
    if (typeof data === 'string') {
      return data;
    }
    
    // Special formatting for specific tools
    if (toolName === 'list_directory') {
      return this.formatDirectoryListing(data);
    }
    
    if (toolName === 'write_file' || toolName === 'read_file') {
      return this.formatFileOperation(data);
    }
    
    // Default JSON formatting with better readability
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Format directory listing for better readability
   * @param data Directory listing data
   * @returns Formatted string
   */
  private formatDirectoryListing(data: any): string {
    let result = `📁 Directory: ${data.directory}\n\n`;
    
    if (data.files && Array.isArray(data.files)) {
      if (data.files.length === 0) {
        result += "🔍 No files found.\n";
      } else {
        result += "📋 Contents:\n";
        for (const file of data.files) {
          const icon = file.type === 'directory' ? '📁' : '📄';
          const size = file.size ? ` (${this.formatFileSize(file.size)})` : '';
          result += `${icon} ${file.name}${size}\n`;
        }
      }
    }
    
    if (data.summary) {
      result += `\n📊 Summary: ${data.summary.totalFiles} files, ${data.summary.totalDirectories} directories\n`;
    }
    
    return result;
  }
  
  /**
   * Format file operation result
   * @param data File operation data
   * @returns Formatted string
   */
  private formatFileOperation(data: any): string {
    let result = '';
    
    if (data.path) {
      result += `📄 File: ${data.path}\n`;
    }
    
    if (data.bytesWritten !== undefined) {
      result += `✅ Written: ${this.formatFileSize(data.bytesWritten)}\n`;
    }
    
    // Show full content for reasonably small files, otherwise a preview
    if (data.content && typeof data.content === 'string') {
      const MAX_FULL_DISPLAY = 10240; // 10 KB
      const isSmall = (data.size ?? data.content.length) <= MAX_FULL_DISPLAY;
      if (isSmall) {
        result += `📝 Content:\n${data.content}\n`;
      } else {
        const preview = data.content.substring(0, 200) + '...';
        result += `📝 Content preview (truncated):\n${preview}\n`;
      }
    }
    
    if (data.encoding) {
      result += `🔤 Encoding: ${data.encoding}\n`;
    }
    
    return result || JSON.stringify(data, null, 2);
  }
  
  /**
   * Format file size in human-readable format
   * @param bytes File size in bytes
   * @returns Formatted size string
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Handle the task_complete built-in tool
   * @returns Tool result
   */
  private handleTaskComplete(): Promise<{ content: string }> {
    return Promise.resolve({
      content: "Task completed successfully. The assistant has finished the requested task."
    });
  }

  /**
   * Handle the ask_question built-in tool
   * @returns Tool result
   */
  private handleAskQuestion(): Promise<{ content: string }> {
    return Promise.resolve({
      content: "Question acknowledged. Please provide the requested information."
    });
  }

  /**
   * Close all clients
   */
  async close(): Promise<void> {
    const closePromises = Array.from(this.clients.values()).map(client => {
      return client.close().catch(err => {
        console.error("Error closing MCP client:", err);
      });
    });

    await Promise.all(closePromises);
    this.clients.clear();
  }
}

// Singleton instance for convenience
const mcpClientInstance = new McpClient();

// Export a function to load and get tools
export async function getAllTools(): Promise<ChatCompletionInputTool[]> {
    await mcpClientInstance.loadTools();
    return mcpClientInstance.availableTools;
}
