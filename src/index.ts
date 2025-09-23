import { Command } from "commander";

// Command modules
import { setupChatCommand } from "./commands/chat.js";
import { setupConfigCommand } from "./commands/config.js";
import { setupHistoryCommand } from "./commands/history.js";
import { createHelpCommand } from "./commands/help.js";
import { createSecurityCommand } from "./commands/security.js";
import { createAnimationsCommand } from "./commands/animations.js";

// Config initialization
import { ensureConfigDirExists } from "./config/storage.js";
import { isSetupNeeded, runSetupWizard } from "./config/setup.js";
import { Config } from "./config/config.js";

// Import Agent for system prompt command
import { Agent } from "./mcp/agent.js";

// Import our gorgeous theme system
import { Color, terminal } from "./ui/colors.js";
import { splash } from "./ui/splash.js";

// Export built-in tools for external access
export { getBuiltInToolRegistry } from "./tools/built-in/index.js";

// Export Agent class for external access
export { Agent } from "./mcp/agent.js";

// Import environment resolver for diagnostics
import { envResolver } from "./utils/env-resolver.js";
// Import ChatUI for default action
import { ChatUI } from "./ui/chat.js";
import inquirer from "inquirer";

// Create CLI program
const program = new Command();

// Setup program metadata
program
  .name("bibble")
  .description("CLI chatbot with MCP support")
  .version("1.9.0");

// Initialize configuration
ensureConfigDirExists();

// Setup commands
setupChatCommand(program);
setupConfigCommand(program);
setupHistoryCommand(program);

// Add help command
program.addCommand(createHelpCommand());

// Add security command
program.addCommand(createSecurityCommand());

// Add animations command
program.addCommand(createAnimationsCommand());

// Setup command
program
  .command("setup")
  .description("Run the setup wizard")
  .action(async () => {
    await runSetupWizard();
    process.exit(0);
  });

// System prompt command
program
  .command("system-prompt")
  .description("View the system prompt with tools list")
  .action(async () => {
    try {
      // Check if we're in a TTY environment for spinner support
      let spinner: any = null;
      const isTTY = process.stdout.isTTY;
      
      if (isTTY) {
        // Show a nice loading spinner if in TTY
        spinner = splash.spinner("Loading MCP tools and generating system prompt...");
        spinner.start();
      } else {
        // Just show text in non-TTY environments
        console.log("Loading MCP tools and generating system prompt...");
      }
      
      // Create an agent instance and initialize it to load tools
      const agent = new Agent();
      await agent.initialize(); // This will load tools and update the system prompt
      
      // Get the conversation messages to access the system prompt
      const conversation = agent.getConversation();
      const systemMessage = conversation.find(msg => msg.role === 'system');
      
      if (spinner) {
        spinner.succeed("System prompt generated successfully!");
      } else {
        console.log("System prompt generated successfully!");
      }
      console.log();
      
      if (systemMessage) {
        // Display the complete system prompt with tools
        console.log(terminal.style.title("📋 Complete System Prompt with MCP Tools"));
        console.log();
        console.log(systemMessage.content);
        console.log();
        
        // Show summary statistics
        const toolMatches = systemMessage.content.match(/### \w+/g);
        const toolCount = toolMatches ? toolMatches.length : 0;
        console.log(terminal.info(`📊 Summary: ${systemMessage.content.length} characters, ${toolCount} tools loaded`));
      } else {
        console.log(terminal.error("No system message found in agent conversation"));
      }
    } catch (error) {
      console.error(terminal.error("Error generating system prompt:"), 
        error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    process.exit(0);
  });

// Environment diagnostic command
program
  .command("diagnose")
  .description("Diagnose environment and terminal compatibility")
  .option("--verbose", "Show detailed diagnostic information")
  .action(async (options) => {
    try {
      console.log(terminal.style.title("🔍 Environment Diagnostic Report"));
      console.log();
      
      const spinner = splash.spinner("Diagnosing environment...");
      spinner.start();
      
      const diagnostic = await envResolver.diagnoseEnvironment();
      
      spinner.succeed("Diagnostic complete!");
      console.log();
      
      // Platform info
      console.log(terminal.style.subtitle("🖥️  Platform Information"));
      console.log(`${terminal.format("Platform:", Color.Gray)} ${terminal.info(diagnostic.platform)}`);
      console.log(`${terminal.format("Shell:", Color.Gray)} ${terminal.info(diagnostic.shell)}`);
      console.log(`${terminal.format("Terminal:", Color.Gray)} ${terminal.info(diagnostic.terminal)}`);
      console.log();
      
      // Executable paths
      console.log(terminal.style.subtitle("⚡ Executable Resolution"));
      console.log(`${terminal.format("Node.js:", Color.Gray)} ${diagnostic.node.path ? terminal.ok(diagnostic.node.path) : terminal.error("Not found")}`);
      if (diagnostic.node.version) {
        console.log(`${terminal.format("         Version:", Color.Gray)} ${terminal.info(diagnostic.node.version)}`);
      }
      console.log(`${terminal.format("npm:", Color.Gray)} ${diagnostic.npm.path ? terminal.ok(diagnostic.npm.path) : terminal.error("Not found")}`);
      if (diagnostic.npm.version) {
        console.log(`${terminal.format("     Version:", Color.Gray)} ${terminal.info(diagnostic.npm.version)}`);
      }
      console.log(`${terminal.format("npx:", Color.Gray)} ${diagnostic.npx.path ? terminal.ok(diagnostic.npx.path) : terminal.error("Not found")}`);
      if (diagnostic.npx.version) {
        console.log(`${terminal.format("     Version:", Color.Gray)} ${terminal.info(diagnostic.npx.version)}`);
      }
      console.log();
      
      // Errors
      if (diagnostic.errors.length > 0) {
        console.log(terminal.style.subtitle("⚠️  Issues Detected"));
        diagnostic.errors.forEach(error => {
          console.log(`${terminal.error("●")} ${error}`);
        });
        console.log();
      } else {
        console.log(terminal.status.success("No issues detected!"));
        console.log();
      }
      
      // PATH entries (verbose mode)
      if (options.verbose) {
        console.log(terminal.style.subtitle("🛤️  PATH Entries"));
        diagnostic.pathEntries.slice(0, 10).forEach((entry, index) => {
          console.log(`${terminal.format(String(index + 1).padStart(2, ' ') + ":", Color.Gray)} ${entry}`);
        });
        if (diagnostic.pathEntries.length > 10) {
          console.log(`${terminal.format("   ...and", Color.Gray)} ${diagnostic.pathEntries.length - 10} ${terminal.format("more entries", Color.Gray)}`);
        }
        console.log();
      }
      
      // Recommendations
      if (diagnostic.errors.length > 0) {
        console.log(terminal.style.subtitle("💡 Recommendations"));
        console.log(`${terminal.info("●")} Ensure Node.js is installed and in your PATH`);
        console.log(`${terminal.info("●")} Try running Bibble from a terminal where ${terminal.style.code("node --version")} works`);
        console.log(`${terminal.info("●")} If using Windows, try running from Command Prompt or PowerShell as Administrator`);
        console.log(`${terminal.info("●")} Consider reinstalling Node.js if issues persist`);
        console.log();
      }
      
    } catch (error) {
      console.error(terminal.error("Error during diagnostic:"), 
        error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    process.exit(0);
  });

// Default command (chat with no subcommand)
program.action(async () => {
  // Check if setup is needed
  if (isSetupNeeded()) {
    console.log(terminal.status.info("First-time setup detected. Running setup wizard..."));
    await runSetupWizard();
    return;
  }

  // Default to starting chat when no arguments provided
  // This ensures we get the animated banner!
  try {
    const config = Config.getInstance();
    
    // Get the default provider
    const defaultProvider = config.getDefaultProvider();

    // Check if we need to prompt for API key based on the provider
    if (defaultProvider === "openai") {
      // Check API key for OpenAI
      const apiKey = config.getApiKey("openai");
      if (!apiKey) {
        // Prompt for API key
        const { apiKey: newApiKey } = await inquirer.prompt([
          {
            type: "password",
            name: "apiKey",
            message: "Please enter your OpenAI API key:",
            validate: (input) => input.trim().length > 0 || "API key is required",
          },
        ]);

        // Save API key
        config.setApiKey("openai", newApiKey);
        console.log(terminal.success("API key saved successfully."));
      }
    } else if (defaultProvider === "openaiCompatible") {
      // Check if the OpenAI-compatible endpoint requires an API key
      const requiresApiKey = config.get("apis.openaiCompatible.requiresApiKey", true);

      if (requiresApiKey) {
        // Check API key for OpenAI-compatible endpoint
        const apiKey = config.get("apis.openaiCompatible.apiKey");
        if (!apiKey) {
          // Prompt for API key
          const { apiKey: newApiKey } = await inquirer.prompt([
            {
              type: "password",
              name: "apiKey",
              message: "Please enter your API key for the OpenAI-compatible endpoint:",
              validate: (input) => input.trim().length > 0 || "API key is required",
            },
          ]);

          // Save API key
          config.set("apis.openaiCompatible.apiKey", newApiKey);
          console.log(terminal.success("API key saved successfully."));
        }
      }
    }

    // Start chat UI with animated banner
    const chatUI = new ChatUI({
      model: config.getDefaultModel(),
    });

    await chatUI.start();
  } catch (error) {
    console.error(terminal.error("Error starting chat:"), error);
    process.exit(1);
  }
});

// Parse arguments and execute
async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
    
    // If we reach here, the command completed successfully
    // For non-interactive commands, we should exit
    const args = process.argv.slice(2);
    if (args.length > 0) {
      const firstCommand = args.find((arg) => !arg.startsWith('-'))?.toLowerCase();
      const interactiveCommands = new Set(['chat', 'animations', 'anim']);

      if (!firstCommand || !interactiveCommands.has(firstCommand)) {
        // This is a non-interactive command (not chat/animations), so exit
        process.exit(0);
      }
    }
  } catch (error) {
    console.error(terminal.error("Error:"), 
      error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
