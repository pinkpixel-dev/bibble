# 🛡️ Bibble MCP Security Plan

“Made with ❤️ by Pink Pixel”

Last updated: 2025-08-28

## ✨ Purpose
This document defines how Bibble will meet the Model Context Protocol (MCP) client security guidelines with a configurable, user-friendly security layer. It covers goals, current state, architecture, configuration, UX, CLI, and the rollout plan.

## 🎯 Goals
- Provide configurable security that matches different workflows (trusted automation vs. human-in-the-loop).
- Comply with MCP guidance for clients: confirmation on sensitive ops, input previews, timeouts, result validation, and audit logging.
- Keep the experience beautiful and unobtrusive with Pink Pixel’s UI style.

## ✅ MCP Client Security Guidelines → Bibble Implementation

MCP guidance (clients SHOULD):
- Prompt for user confirmation on sensitive operations
- Show tool inputs to the user before calling the server
- Validate tool results before passing to LLM
- Implement timeouts for tool calls
- Log tool usage for audit purposes

How Bibble will meet these:
1. Confirmation Prompts: Configurable policies per server/tool with a secure default.
2. Input Preview: Display sanitized JSON inputs prior to execution when policy requires.
3. Result Validation: Basic structural checks and error surfacing before LLM sees outputs.
4. Timeouts: Per-call timeout with global and per-server overrides.
5. Audit Logging: Append-only audit log with filters (by time, server, tool).

## 🔍 Current State (as of v1.4.1)
- Tool execution flows through McpClient.callTool()
- Agent loop orchestrates provider-agnostic tool calls
- Configuration includes servers, but no security policies yet
- Error handling is robust; security confirmations/auditing not yet present

## 🧩 Architecture Overview

### New Component: SecurityManager
Central authority for all security decisions regarding MCP tool usage.

Responsibilities:
- Evaluate policies for a (server, tool) pair
- Determine if a call is allowed, denied, or requires prompting
- Render a preview (pretty JSON) and confirm with the user
- Enforce timeouts
- Log all executions (approved/denied) to audit store

Key methods:
- evaluateToolCall(toolName, serverName, args): "allow" | "deny" | "prompt"
- promptUserConfirmation(toolName, serverName, args): Promise<boolean>
- withTimeout<T>(promise, ms): Promise<T>
- logToolExecution(entry): void

### Integration Points
- McpClient.callTool(): gate all server tool calls via SecurityManager
- Agent.processTurn(): use existing stream intercepts; no structural change needed
- Config system: add security fields, defaults, and CLI to manage them
- UI layer: add beautiful confirmations and previews

## ⚙️ Configuration (BibbleConfig additions)

```json
{
  "security": {
    "defaultPolicy": "prompt", // "trusted" | "prompt" | "preview" | "strict"
    "requireConfirmationGlobally": false,
    "previewToolInputs": true,
    "auditLogging": true,
    "toolTimeout": 30000,
    "sensitiveOperations": [
      "execute_command", "write_file", "edit_block", "kill_process", "move_file"
    ]
  },
  "mcpServers": [
    {
      "name": "desktop-commander",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/allowed"],
      "enabled": true,
      "securityPolicy": "prompt",      // server default policy
      "allowedTools": ["read_file", "list_directory"],
      "blockedTools": ["kill_process"],
      "requireConfirmation": true,       // overrides global
      "maxExecutionTime": 20000          // overrides global timeout
    }
  ]
}
```

Notes:
- Policies cascade: tool-specific > server-specific > global default
- Users can start simple (global policy) and refine per server/tool later

## 🧭 Policy Levels
- trusted: run without prompts
- prompt: always prompt before execution
- preview: show inputs first, then prompt
- strict: preview + parameter-by-parameter review

## 🧪 Tool Risk Classification
- 🔴 Sensitive: execute_command, write_file, edit_block, kill_process, move_file, delete_* (high risk)
- 🟡 Moderate: create_directory, push_files, update_task, add_dependency (stateful changes)
- 🟢 Safe: read_file, list_directory, search_code, search_files, get_current_datetime (read-only)

This list is configurable; defaults provided.

## 🔄 Execution Flow (end-to-end)
1. LLM requests tool call (name + args)
2. SecurityManager evaluates policies (global/server/tool)
3. If policy ⇒ prompt/preview:
   - Render preview (server, tool, args, risk level, effects)
   - Ask user to Approve / Deny / Trust Always / Block
4. If approved, run tool with timeout; otherwise, return denial result to Agent
5. Validate result shape (content array, isError)
6. Log audit entry (timestamp, user, server, tool, args hash, decision, duration)
7. Return sanitized/validated result to LLM

## 🖥️ User Experience (Prompts)

Header:
- Gradient “Tool Execution Request” banner
- Server name, Tool name, Risk badge (🟢/🟡/🔴)

Body:
- Summary of intent (best-effort from args)
- Pretty-printed JSON args (syntax highlighted)
- Warning footnotes for risky ops (e.g., file deletion, command execution)

Actions:
- [A]pprove  [D]eny  [P]review JSON (toggle)  [T]rust always  [B]lock  [?] Help

Accessibility:
- Works in all terminals, no complex emojis if unsupported

## 🛠️ CLI Commands

- Set server policy:
  - `bibble security policy <server> <trusted|prompt|preview|strict>`
- Trust/block per tool:
  - `bibble security trust <server> <tool>`
  - `bibble security block <server> <tool>`
- Global policy:
  - `bibble security global-policy <trusted|prompt|preview|strict>`
- Timeouts:
  - `bibble security timeout --global 30000`
  - `bibble security timeout --server <server> 20000`
- Audit log:
  - `bibble security audit --last 24h`
  - `bibble security audit --server <server>`
  - `bibble security audit --tool <tool>`
- Reset:
  - `bibble security reset` (with confirmation)

## 🧱 Validation & Sanitization
- Validate presence of required args before execution
- Basic type checks (string/number/boolean/object/array)
- Sanitize log records (hash or redact secrets/paths when configured)
- For results: ensure `content` is an array and not excessively large; truncate with indicator and preserve full copy in audit if enabled

## ⏱️ Timeouts
- Global default: 30s (configurable)
- Per-server override
- Per-tool override (coming later)
- Clear error message on timeout; always logged

## 📝 Audit Logging
- Location: `~/.bibble/audit/mcp-YYYY-MM.log` (rotating by month)
- Fields: timestamp, server, tool, decision, duration, argsHash, error?, user
- Filters: by time window, server, tool
- Export: `--json` flag for machine parsing

## 🗺️ Rollout Plan

Phase 1 – Foundation (Week 1)
- Add SecurityManager and config schema
- Gate McpClient.callTool() with evaluate→prompt→execute flow
- Global policy + per-server policy
- Timeouts + basic audit logging

Phase 2 – UX & CLI (Week 2)
- Beautiful confirmation UI with previews
- Full CLI for policy management and audit viewing
- Risk labels and default classification table

Phase 3 – Advanced (Week 3)
- Per-tool overrides and remember choices
- Batch approvals for repeated calls
- Security audit report generator
- Export/import security policies

## ✅ Acceptance Criteria
- Policies work at global and server level (Phase 1)
- Sensitive tool calls require confirmation by default
- Inputs preview displayed when configured
- Timeouts enforced with clear errors
- Audit entries created for every attempted tool execution
- No breaking changes for users who opt into `trusted` mode

## 📌 Open Questions / Future Work
- Per-tool timeouts and rate limiting per server
- Heuristics to auto-detect potential exfiltration (URLs, large outputs)
- Workspace-aware safety (e.g., safe directories for file ops)
- Optional CAPTCHAs or stronger confirmations for destructive actions

## 🧪 Testing Strategy
- Unit tests for SecurityManager decision matrix
- Integration tests for callTool() gating and timeout
- Snapshot tests for preview UI rendering
- CLI e2e tests for policy configuration and audit filters

---

If you’re happy with this plan, the next step is Phase 1 implementation (SecurityManager + config + gating + timeouts + audit). ✨
