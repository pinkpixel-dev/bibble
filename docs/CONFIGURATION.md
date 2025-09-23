# Bibble Configuration Reference

This document explains every configuration option, where the config lives, how to manage it with the CLI, environment variable support, and provides a full example `config.json` you can copy.

- Config file location: `~/.bibble/config.json`
- History directory: `~/.bibble/history/`
- Project-local overrides: a `config.json` in your current project only affects the web search tool’s settings (see Web Search section). All other options are read from `~/.bibble/config.json`.

## Managing Config via CLI

General
- `bibble config list` — Show all settings (API keys are hidden)
- `bibble config get <key>` — Read a value (dot notation)
- `bibble config set <key> <value>` — Set a value (plain or JSON)
- `bibble config reset` — Reset everything to defaults

Wizards and specialized commands
- `bibble config api-key` — Set provider API keys (OpenAI/Anthropic/Google/openaiCompatible)
- `bibble config default-provider` — Choose default provider
- `bibble config openai-compatible` — Configure a custom OpenAI‑compatible endpoint
- `bibble config configure` — Model configuration wizard (provider, model, and parameters)
- `bibble config mcp-servers` — Add/edit/remove MCP servers (name, command, args, env, enabled)
- `bibble config web-search` — Preferred search engine and keys
- `bibble config weather` — OpenWeatherMap key, default location, units, cache, rate limit
- `bibble config timezone` — Set `timezone.default` (auto, UTC, or specific IANA zone)
- `bibble config theme ...` — Manage UI theme: `list`, `preview <name>`, `set <name>`, `current`, `reset`

## Option Reference (dot keys)

Top-level
- `defaultProvider` (string) — `openai` | `anthropic` | `google` | `openaiCompatible`

APIs
- `apis.openai.apiKey` (string?)
- `apis.openai.baseUrl` (string)
- `apis.openai.defaultModel` (string)
- `apis.openaiCompatible.apiKey` (string?)
- `apis.openaiCompatible.baseUrl` (string)
- `apis.openaiCompatible.defaultModel` (string)
- `apis.openaiCompatible.requiresApiKey` (boolean)
- `apis.openaiCompatible.referrer` (string?)
- `apis.anthropic.apiKey` (string?)
- `apis.anthropic.baseUrl` (string)
- `apis.anthropic.defaultModel` (string)
- `apis.google.apiKey` (string?)
- `apis.google.baseUrl` (string)
- `apis.google.defaultModel` (string)

UI
- `ui.colorOutput` (boolean)
- `ui.useMarkdown` (boolean)
- `ui.theme` (string) — `pinkPixel` | `dark` | `light` | `neon` | `ocean` | `fire`

Chat
- `chat.saveHistory` (boolean)
- `chat.maxHistoryItems` (number)
- `chat.userGuidelines` (string)

MCP Servers (array)
Each item:
- `name` (string)
- `command` (string)
- `args` (string[])
- `env` (record<string,string>)
- `enabled` (boolean)
- Optional security per server:
  - `securityPolicy` (`trusted` | `prompt` | `preview` | `strict`)
  - `allowedTools` (string[])
  - `blockedTools` (string[])
  - `requireConfirmation` (boolean)
  - `maxExecutionTime` (number, ms)

Security
- `security.defaultPolicy` (`trusted` | `prompt` | `preview` | `strict`)
- `security.requireConfirmationGlobally` (boolean)
- `security.previewToolInputs` (boolean)
- `security.auditLogging` (boolean)
- `security.toolTimeout` (number, ms)
- `security.sensitiveOperations` (string[])
- `security.serverPolicies` (record<server, policy>)
- `security.allowedTools` (record<server, string[]>)
- `security.blockedTools` (record<server, string[]>)

Models (array)
Each item (used to override/augment built-in model presets):
- `id` (string)
- `provider` (string)
- `name` (string)
- Optional model parameters:
  - `maxTokens` (number)
  - `temperature` (number)
  - `maxCompletionTokens` (number)
  - `reasoningEffort` (`low` | `medium` | `high`)
  - `isReasoningModel` (boolean)
  - `topP` (number)
  - `topK` (number)
  - `supportsTemperature` (boolean)
  - `supportsThinking` (boolean)
  - `thinkingLevel` (`none` | `low` | `medium` | `high`)
  - `requiresMaxCompletionTokens` (boolean)
  - Some models (e.g., Claude 3.7) may also support a `thinking` object with `budget_tokens`.

Web Search (`webSearch`)
- `webSearch.preferredEngine` (`duckduckgo` | `bing` | `google` | `brave`)
- `webSearch.bingApiKey` (string?)
- `webSearch.googleApiKey` (string?)
- `webSearch.googleSearchEngineId` (string?)
- `webSearch.braveApiKey` (string?)
Note: The built-in research tool also reads these from a project-local `config.json` if present.

Workspace Intelligence (`workspace`)
- `workspace.enabled` (boolean)
- `workspace.showWelcomeMessage` (boolean)
- `workspace.showContextInChat` (boolean)
- `workspace.autoDetectOnStartup` (boolean)
- `workspace.cacheDuration` (number, ms)
- `workspace.contextIndicators` (boolean)
- `workspace.customProjectTypes` (record<string, { patterns: string[]; description: string; icon: string }>)

Timezone
- `timezone.default` (string) — `auto` | `UTC` | any valid IANA timezone (e.g., `Europe/Paris`)

Weather (`weather`)
- `weather.apiKey` (string?) — falls back to `process.env.OPENWEATHER_API_KEY`
- `weather.defaultLocation` (string)
- `weather.units` (`metric` | `imperial` | `kelvin`)
- `weather.cacheMinutes` (number, minutes)
- `weather.rateLimitPerHour` (number)
- `weather.requestTimeoutMs` (number, ms)

## Full Example config.json

Place this file at `~/.bibble/config.json`. Adjust placeholders as needed.

```json
{
  "defaultProvider": "openai",
  "apis": {
    "openai": {
      "apiKey": "YOUR_OPENAI_KEY_HERE",
      "baseUrl": "https://api.openai.com/v1",
      "defaultModel": "gpt-5"
    },
    "openaiCompatible": {
      "apiKey": "YOUR_CUSTOM_ENDPOINT_KEY_IF_REQUIRED",
      "baseUrl": "https://api.your-openai-compatible.com/v1",
      "defaultModel": "gpt-5",
      "requiresApiKey": true,
      "referrer": "bibble"
    },
    "anthropic": {
      "apiKey": "YOUR_ANTHROPIC_KEY_HERE",
      "baseUrl": "https://api.anthropic.com",
      "defaultModel": "claude-sonnet-4-20250514"
    },
    "google": {
      "apiKey": "YOUR_GOOGLE_AI_KEY_HERE",
      "baseUrl": "https://generativelanguage.googleapis.com",
      "defaultModel": "gemini-2.0-flash"
    }
  },
  "ui": {
    "colorOutput": true,
    "useMarkdown": true,
    "theme": "pinkPixel"
  },
  "mcpServers": [
    {
      "name": "example-server",
      "command": "node",
      "args": ["./path/to/server.js"],
      "env": { "EXAMPLE_TOKEN": "..." },
      "enabled": true,
      "securityPolicy": "trusted",
      "allowedTools": ["search", "fs_read"],
      "blockedTools": ["rm", "shutdown"],
      "requireConfirmation": false,
      "maxExecutionTime": 30000
    }
  ],
  "chat": {
    "saveHistory": true,
    "maxHistoryItems": 50,
    "userGuidelines": ""
  },
  "security": {
    "defaultPolicy": "trusted",
    "requireConfirmationGlobally": false,
    "previewToolInputs": true,
    "auditLogging": false,
    "toolTimeout": 30000,
    "sensitiveOperations": [
      "execute_command",
      "force_terminate",
      "kill_process",
      "move_file",
      "delete_memory",
      "delete_task",
      "delete_subtask",
      "delete_note",
      "remove_todos",
      "set_config_value"
    ],
    "serverPolicies": {},
    "allowedTools": {},
    "blockedTools": {}
  },
  "models": [
    {
      "id": "gpt-5",
      "provider": "openai",
      "name": "GPT-5",
      "maxCompletionTokens": 4096,
      "temperature": 0.7,
      "supportsTemperature": true,
      "supportsThinking": true,
      "thinkingLevel": "none",
      "requiresMaxCompletionTokens": true
    },
    {
      "id": "o3-pro",
      "provider": "openai",
      "name": "o3-pro",
      "maxCompletionTokens": 4096,
      "reasoningEffort": "medium",
      "isReasoningModel": true,
      "supportsTemperature": false,
      "requiresMaxCompletionTokens": true
    },
    {
      "id": "claude-3-7-sonnet-20250219",
      "provider": "anthropic",
      "name": "Claude 3.7 Sonnet",
      "maxTokens": 20000,
      "temperature": 0.7,
      "topP": 0.9,
      "topK": 40,
      "supportsThinking": true,
      "thinkingLevel": "medium"
    }
  ],
  "webSearch": {
    "preferredEngine": "duckduckgo",
    "bingApiKey": "",
    "googleApiKey": "",
    "googleSearchEngineId": "",
    "braveApiKey": ""
  },
  "workspace": {
    "enabled": true,
    "showWelcomeMessage": true,
    "showContextInChat": true,
    "autoDetectOnStartup": true,
    "cacheDuration": 300000,
    "contextIndicators": true,
    "customProjectTypes": {}
  },
  "timezone": {
    "default": "auto"
  },
  "weather": {
    "apiKey": "",
    "defaultLocation": "",
    "units": "metric",
    "cacheMinutes": 10,
    "rateLimitPerHour": 1000,
    "requestTimeoutMs": 10000
  }
}
```

Notes
- Leave API keys empty if you prefer to provide them via environment variables (see next section) or through `bibble config` wizards.
- The `models` array is optional; Bibble ships with a model catalog. Add entries here only to override or define custom models.

## Environment Variables and .env

Bibble reads a few environment variables at runtime. It does not automatically load a `.env` file. If you want to use a `.env` file, load it before launching Bibble (e.g., with your shell, `direnv`, or a wrapper like `dotenv-cli`).

Supported environment variables
- `OPENWEATHER_API_KEY` — Used by the weather tool if `weather.apiKey` is not set
- `BING_SEARCH_API_KEY` — Web search (Bing)
- `GOOGLE_SEARCH_API_KEY` — Web search (Google Custom Search)
- `GOOGLE_SEARCH_ENGINE_ID` — Web search (Google Custom Search Engine ID)
- `BRAVE_SEARCH_API_KEY` — Web search (Brave)
- `PREFERRED_SEARCH_ENGINE` — One of `duckduckgo`, `bing`, `google`, `brave`
- `THE_CAT_API_KEY` or `CAT_API_KEY` — Used by the cat images tool for higher rate limits (now with @pinkpixel/pixelpop integration and GIF support)
- `BIBBLE_ENHANCED_TOOLS` — Set to `false` to disable enhanced tool display (default is enabled)
- `BIBBLE_USE_EMOJIS` — Set to `false` to disable emojis in tool lists

Example `.env`
```
# Provider keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...

# Web search
BING_SEARCH_API_KEY=...
GOOGLE_SEARCH_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...
BRAVE_SEARCH_API_KEY=...
PREFERRED_SEARCH_ENGINE=duckduckgo

# Tools
OPENWEATHER_API_KEY=...
THE_CAT_API_KEY=...

# UI flags
BIBBLE_ENHANCED_TOOLS=true
BIBBLE_USE_EMOJIS=true
```

How to load `.env` for Bibble
- Bash/Zsh: `export $(grep -v '^#' .env | xargs) && bibble`
- With `dotenv-cli`: `npx dotenv -e .env -- bibble`
- Or add the exports to your shell profile (e.g., `~/.bashrc` or `~/.zshrc`)

## File Location Recap
- Main config: `~/.bibble/config.json`
- Weather/search env vars: provided via your shell environment (not read from config.json)
- Optional project-local web search overrides: `./config.json` (current working directory)

## Quick Examples
- Set a value: `bibble config set ui.theme "dark"`
- Read a value: `bibble config get webSearch.preferredEngine`
- Start weather setup: `bibble config weather`
- Change default provider: `bibble config default-provider`
- Add an MCP server: `bibble config mcp-servers`

That’s it — you’re fully configured. Happy bibbling! ✨

