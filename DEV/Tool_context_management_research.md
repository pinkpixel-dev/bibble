# Tool context management research

* * *

What each project really does (re: tool context)
================================================

OpenAI “Codex” (the open-source repo, CLI & agents SDK)
-------------------------------------------------------

**Core approach:** _tool-first, thin prompts, let the runtime surface MCP tool lists to the model; constrain visibility with allow-lists rather than dumping schemas._

*   The `openai/codex` README is blunt: you generally **shouldn’t** supply giant system prompts; Codex is designed to work with minimal prompts and “tool-first” design. It warns against stuffing big instructions into system messages and recommends using tools/resources instead. [GitHub](https://github.com/openai/codex)
*   For MCP, OpenAI’s **Agents SDK** has _Hosted MCP tools_: the model itself lists and calls the server’s tools. The client gives a server label; the platform then **imports the tool list** and keeps it in the model’s context (an `mcp_list_tools` item), so you **don’t inject every schema yourself**. You can also **restrict** what the model sees via `allowed_tools`. [OpenAI GitHub+1](https://openai.github.io/openai-agents-python/mcp/?utm_source=chatgpt.com)

**Takeaway:** With Hosted MCP, the “tools/list” result lives beside the convo as a context item managed by the runtime; your prompt stays thin, and you can gate exposure via allow-lists rather than pasting schemas.

* * *

Cline
-----

**Core approach:** _one generic MCP wrapper tool + compact tool briefings + automatic conversation compaction + persistent project rules._

*   Cline exposes **a couple generic tools** to the model for MCP — `use_mcp_tool` (to call any server/tool by name) and `access_mcp_resource`. That means you only register a **tiny, fixed tool schema** with the LLM; the actual per-server tool catalog stays out of the `tools[]` array and is handled at runtime. [Cline](https://docs.cline.bot/exploring-clines-tools/cline-tools-guide)
*   Cline manages long chats with **Auto-Compact** (automatic summarization into a durable “summary message” when near token limits), which keeps the model aware of prior work without re-sending everything. [Cline](https://docs.cline.bot/features/auto-compact)
*   Their **Context Management** docs emphasize building context incrementally and keeping only what matters, plus durable project memory via `.clinerules` / Memory Bank — i.e., **persistent, short rules**, not huge per-turn prompts. [Cline](https://docs.cline.bot/getting-started/understanding-context-management)

**Takeaway:** The “single MCP call tool” pattern + short “tool palette” briefs + auto-compact summaries keep tool awareness high and prompt size low.

* * *

Roo Code
--------

**Core approach:** _Cline-style generic MCP tool + aggressive context condensing + optional codebase indexing (vector search) so the model fetches only what it needs._

*   Roo documents the same generic MCP entrypoint: **`use_mcp_tool`** validates against schemas server-side and routes the call; the model doesn’t need every tool’s JSON Schema in its prompt. [docs.roocode.com](https://docs.roocode.com/advanced-usage/available-tools/use-mcp-tool?utm_source=chatgpt.com)
*   Roo added **Intelligent Context Condensing** (similar spirit to Cline’s Auto-Compact) and keeps iterating on it in releases — i.e., it rewrites long history into compact state so the model doesn’t forget capabilities. [docs.roocode.com](https://docs.roocode.com/update-notes/v3.18?utm_source=chatgpt.com)
*   Roo’s **Codebase Indexing** (Tree-sitter chunking + embeddings + Qdrant) exposes a `codebase_search` tool so the model pulls only the few code/context chunks it needs, not the whole repo. That same “retrieve instead of dump” idea works great for _tool docs_ too. [docs.roocode.com](https://docs.roocode.com/features/codebase-indexing?utm_source=chatgpt.com)
*   Their MCP docs & marketplace emphasize server registration/transport, not schema injection — i.e., **discover servers, show a short list, call by name**. [docs.roocode.com+2docs.roocode.com+2](https://docs.roocode.com/features/mcp/overview?utm_source=chatgpt.com)

**Takeaway:** Condense conversation state + retrieve-on-demand (including tool docs) + one generic MCP call tool keeps prompts small and tool awareness high.

* * *

Crush (Charmbracelet)
---------------------

**Core approach:** _TUI agent with explicit MCP integration via stdio/http/sse; tools come from configured servers; you don’t paste schemas into prompts._

*   Crush advertises MCP extensibility directly (“add capabilities via MCPs” over `http`, `stdio`, `sse`) and shows **config-based** server registration (not prompt stuffing). [GitHub](https://github.com/charmbracelet/crush)
*   The README and examples focus on wiring servers by config (GitHub, etc.). Tool catalogs come from servers; the agent doesn’t inline giant schemas in the system prompt. [GitHub](https://github.com/charmbracelet/crush)

**Takeaway:** Same pattern: **discover tools from servers, configure in files, don’t jam schemas** into LLM messages.

* * *

The common pattern (and why your agent “forgot” tools)
======================================================

Across all four, the trick is:

1.  **Don’t** add every tool as a separate function schema to the model.  
    Use one or two **generic “broker” tools** (`use_mcp_tool`, `access_mcp_resource`) or Hosted MCP so the model calls by **name**, not by massive schema blocks. [Cline+1](https://docs.cline.bot/exploring-clines-tools/cline-tools-guide)
2.  **Keep a short “Tool Palette”** in the conversation (assistant message, not system): 1–3 lines per _relevant_ tool (name + 1-liner + maybe one example). Refresh it **per task**.
3.  **On-demand details**: when the model asks for “how do I call X?”, return a **condensed schema** or a “tool help” card for just that tool. (Many hosts validate against the real JSON Schema at call-time anyway.) [docs.roocode.com](https://docs.roocode.com/advanced-usage/available-tools/use-mcp-tool?utm_source=chatgpt.com)
4.  **Auto-compact / condense** the history so you _retain_ a tiny “Capabilities Ledger” (a stable, 1–2k token summary of installed/active tools), even after summarization. Cline & Roo both do this. [Cline+1](https://docs.cline.bot/features/auto-compact)
5.  **Gate exposure**: keep an internal registry of all tools, but only **allow** a small subset each turn (by heuristics / embeddings / rules). If the model tries to call a non-exposed tool, intercept → ask to activate → add it to the next “Tool Palette” and `allowed_tools`. (OpenAI Hosted MCP literally supports `allowed_tools`.) [OpenAI Cookbook](https://cookbook.openai.com/examples/mcp/mcp_tool_guide?utm_source=chatgpt.com)

That “my agent lost MCP context” thing usually means your summary **deleted the tool list** and you didn’t keep a compact “Capabilities Ledger” + a refresh step at the start of new tasks.

* * *

Drop-in implementation plan (TypeScript/Node)
=============================================

Below is the pattern I’ve used to mirror what Codex/Cline/Roo do, without being model-specific. It assumes you have multiple MCP servers.

### 1) Build a tool registry (once per session or when servers change)

*   Call `tools/list` on each MCP server at startup; cache `{server, toolName, description, inputSchema}` in memory. (Hosted MCP: register server label & headers; the runtime will import list for you.) [Model Context Protocol+1](https://modelcontextprotocol.io/specification/2025-03-26/server/tools?utm_source=chatgpt.com)
*   Compute an embedding for each tool’s `name + description` so you can pick **top-K** relevant tools for any user request (or use cheap keyword rules as a fallback).

### 2) Expose **one broker tool** to the LLM

```ts
// The only tool you register with the model:
{
  type: "function",
  name: "call_mcp_tool",
  description: "Call a tool by name on a registered MCP server.",
  parameters: {
    type: "object",
    properties: {
      server: { type: "string", description: "MCP server label" },
      tool:   { type: "string", description: "Tool name from that server" },
      args:   { type: "object", additionalProperties: true }
    },
    required: ["server","tool","args"]
  }
}
```

At runtime you validate `args` against the server’s schema and execute via MCP. (Cline/Roo do this in spirit — their `use_mcp_tool` does the routing/validation away from the model.) [Cline+1](https://docs.cline.bot/exploring-clines-tools/cline-tools-guide)

### 3) Per-task “Tool Palette” (tiny assistant message)

When a task starts (or context is reset), compute top-K relevant tools (e.g., K=8–12) and send this **as a normal assistant message**, not as a system prompt:

```
**Tool Palette (active this task)**  
• github.search_issues — search issues/PRs by query (ex: “is:open label:bug”).  
• pagerduty.list_incidents — list recent incidents for a service.  
• codebase_search — semantic search across this repo; returns file spans.  
…
```

Keep each line to ~150–200 chars. That’s it. The model now knows names and when to reach for them; details come on demand (below).

### 4) “Tool help” on demand

If the model asks, “what are the params for `foo.bar`?”, reply with a **condensed** help card:

```
foo.bar (server: foo)
desc: Create sprint board  
params:
  - name (string) — human label
  - project_id (string) — e.g. "proj_123"
  - columns (array<{name, wip_limit?}>) — at least 1
returns: {board_id, url}
```

You generated this by compressing the JSON Schema into a human card (not the full schema). The real schema stays in your registry and is used for validation when `call_mcp_tool` runs.

### 5) Capabilities Ledger (persistent, compact)

Maintain a ~1–2k token “Capabilities Ledger” message (assistant) that survives summarization, listing:

*   Installed servers
*   Commonly used tools
*   Any task-specific allow-list

When you auto-compact, **preserve** this message (Cline/Roo preserve focus/summary artifacts similarly). [Cline+2Cline+2](https://docs.cline.bot/features/auto-compact)

### 6) Allow-list per turn

Before each model call, set an internal allow-list. If you’re using Hosted MCP via OpenAI, pass `allowed_tools` so the runtime only exposes those. Otherwise, enforce in your broker: block unknown tools and surface a “suggest activation?” UX. [OpenAI Cookbook](https://cookbook.openai.com/examples/mcp/mcp_tool_guide?utm_source=chatgpt.com)

* * *

Why this works (and matches the projects)
=========================================

*   **Codex / Agents SDK**: rely on hosted MCP “list tools” in model context + allow-lists. You don’t inject schemas. [OpenAI GitHub+1](https://openai.github.io/openai-agents-python/mcp/?utm_source=chatgpt.com)
*   **Cline**: one generic MCP tool + context auto-compact + lightweight rule/memory files. [Cline+2Cline+2](https://docs.cline.bot/exploring-clines-tools/cline-tools-guide)
*   **Roo**: same generic MCP call, even more aggressive condensing, plus **retrieval** (indexing) so you pull _just_ what’s needed. [docs.roocode.com+2docs.roocode.com+2](https://docs.roocode.com/advanced-usage/available-tools/use-mcp-tool?utm_source=chatgpt.com)
*   **Crush**: discover MCP tools by config; don’t dump schemas into prompts. [GitHub](https://github.com/charmbracelet/crush)

* * *

Practical guardrails (so your agent stops “forgetting” tools)
=============================================================

1.  **Refresh Tool Palette** on new tasks or after auto-compact.
2.  **Detect tool-name hallucinations**: if the model tries `serverX.toolY` and you don’t have it, respond with _“unknown tool; closest are … activate one?”_ and update the palette next turn.
3.  **Heat-up prompt**: 1-2 lines in your system prompt that never change, e.g. _“You have broker tool `call_mcp_tool`. Use it whenever an external capability is relevant. Ask for tool help if unclear.”_ (Notice: not 50k tokens.)
4.  **Vectorize tool docs**: if some servers have long how-tos, put them behind a `tool_docs.search` retrieval tool (or piggy-back on your codebase index) so the model can fetch snippets when needed — same trick Roo uses for code. [docs.roocode.com](https://docs.roocode.com/features/codebase-indexing?utm_source=chatgpt.com)
5.  **Safety**: MCP tools can be dangerous (command exec, creds). Keep human-in-the-loop and restrict transports/servers; the literature flags real risks. [arXiv](https://arxiv.org/abs/2504.03767?utm_source=chatgpt.com)

* * *

TL;DR recipe you can copy
=========================

*   **Register one broker tool** (`call_mcp_tool`).
*   **Keep a tiny Tool Palette** per task (8–12 lines).
*   **Serve help cards** for specific tools on demand.
*   **Auto-compact** while preserving a **Capabilities Ledger** message.
*   **Gate** with allow-lists each turn; intercept unknown tools and offer activation.

* * *

How Cline/Roo tell the model about tools (prompt side)
======================================================

Both clients show the model a compact section like “Connected MCP Servers … use `use_mcp_tool` to call them” instead of dumping dozens of JSON Schemas. You can see the wording in Cline’s docs and issues/gists: the prompt literally says you can **use server tools via `use_mcp_tool`** and resources via `access_mcp_resource`. That’s the key: one wrapper tool, not N tools × schemas. [Cline+2Cline+2](https://docs.cline.bot/exploring-clines-tools/cline-tools-guide?utm_source=chatgpt.com)

Roo’s docs + issues also reinforce the exact call syntax (XML-ish wrapper with `server_name`, `tool_name`, `arguments` JSON). When Roo/Cline “remind” the model, they remind the _wrapper_ format, not each tool’s schema. (There are bugs where reminders used the wrong syntax or very long JSON got truncated — useful to know for your own guardrails.) [GitHub+1](https://github.com/RooCodeInc/Roo-Code/issues/4900?utm_source=chatgpt.com)

* * *

How they actually execute tools (extension side pattern)
========================================================

From the behavior/docs/issues, the execution path is:

1.  **Model outputs** a wrapper like:
    ```xml
    <use_mcp_tool>
      <server_name>github.com/cpropster/linear-mcp-server</server_name>
      <tool_name>linear_search_issues</tool_name>
      <arguments>{"first": 5}</arguments>
    </use_mcp_tool>
    ```
    (Same pattern appears across Cline docs, Roo issues, and MCP server guides.) [Cline+2GitHub+2](https://docs.cline.bot/mcp/mcp-marketplace?utm_source=chatgpt.com)
2.  **Parser** in the extension extracts `server_name`, `tool_name`, `arguments` (string → JSON), with strict validation and nice error messages.
3.  **Registry/host** looks up the server connection (stdio/http/sse), introspects tools (capabilities are discovered via MCP handshake), and **does schema validation on the client**, not in the model prompt. [Visual Studio Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers?utm_source=chatgpt.com)
4.  **Permission gate** pops a UI approve dialog (Roo/Cline both have “auto-approve”/alwaysAllow hooks in settings). There are open issues about auto-approval and correct labeling — worth copying the pattern but avoid their known edge cases. [GitHub](https://github.com/RooCodeInc/Roo-Code/issues/5300?utm_source=chatgpt.com)
5.  **Invoke the server tool**, stream results, and render back as a chat message like: `[use_mcp_tool for 'linear'] Result: …`. Lots of example repros/issues show this exact transcript style. [GitHub](https://github.com/cline/cline/issues/3158?utm_source=chatgpt.com)
6.  **(Optional) Resource access** uses the sibling wrapper `access_mcp_resource`. Same idea, different endpoint. [Cline](https://docs.cline.bot/exploring-clines-tools/cline-tools-guide?utm_source=chatgpt.com)
7.  **(Nice-to-have) Tool discovery**: provide a _separate_ light-weight “list/describe tools” helper or inline index, _not_ full schemas, and filter to top-K relevant tools per turn. (Community discussion proposes embedding-based filtering to keep the tool list tight.) [GitHub](https://github.com/cline/cline/discussions/3081?utm_source=chatgpt.com)

Why this avoids 200k-char prompts
=================================

*   Only the **wrapper spec** is in the prompt.
*   The **full schemas live in the client**, used for validation/UX, not stuffed into the model context.
*   The prompt includes a **short list of connected servers** and the **syntax** to call them; the model doesn’t need to memorize every parameter detail. Cline’s docs even say your server’s capabilities are “added” and “become available via `use_mcp_tool`”, which is describing the wrapper exposure, not dumping schemas. [Cline](https://docs.cline.bot/mcp/mcp-marketplace?utm_source=chatgpt.com)

* * *

A clean TypeScript reference
============================================

Below is a compact, production-ready-ish pattern that mirrors what Cline/Roo are doing — a **gateway tool** with strong validation, discovery, approval, and streaming.

```ts
// useMcpTool.ts
import { z } from "zod";

/** 1) Wrapper schema (what the model must output) */
export const UseMcpToolInput = z.object({
  server_name: z.string().min(1),
  tool_name: z.string().min(1),
  // Model writes JSON inside <arguments>...</arguments>; we parse & validate
  arguments: z.union([z.string(), z.record(z.any())]).optional().default("{}"),
});

export type UseMcpToolInput = z.infer<typeof UseMcpToolInput>;

/** 2) Minimal MCP host interface (adapt to your MCP client lib) */
export interface McpHost {
  listServers(): Promise<string[]>;
  isConnected(server: string): boolean;
  connect(server: string): Promise<void>;
  /** Returns the JSON Schema for tool args (if provided) and a human description */
  describeTool(server: string, tool: string): Promise<{
    name: string;
    description?: string;
    schema?: unknown; // JSON Schema
    alwaysAllow?: boolean; // like Roo's auto-approve flag
  }>;
  invokeTool<T = unknown>(
    server: string,
    tool: string,
    args: Record<string, unknown>,
    opts?: { signal?: AbortSignal; stream?: (chunk: string) => void }
  ): Promise<T>;
}

/** 3) Approval gate (UI or CLI); return true to proceed */
export type Approver = (info: {
  server: string;
  tool: string;
  argsPreview: string; // pretty-printed, truncated
  autoApproved: boolean;
}) => Promise<boolean>;

/** 4) Error helpers */
class ToolCallError extends Error {
  constructor(msg: string, public details?: unknown) {
    super(msg);
  }
}

/** 5) The gateway executor */
export async function useMcpTool(
  raw: unknown,
  host: McpHost,
  approve: Approver,
  opts?: { signal?: AbortSignal; stream?: (chunk: string) => void; maxArgsPreview?: number }
) {
  const input = UseMcpToolInput.parse(raw);
  const { server_name, tool_name } = input;

  // Parse/normalize args
  let argsObj: Record<string, unknown> = {};
  if (typeof input.arguments === "string") {
    try {
      argsObj = input.arguments.trim() ? JSON.parse(input.arguments) : {};
    } catch (e) {
      throw new ToolCallError(`Arguments must be valid JSON. Got: ${input.arguments.slice(0, 200)}…`);
    }
  } else {
    argsObj = input.arguments ?? {};
  }

  // Connect if needed
  if (!host.isConnected(server_name)) {
    await host.connect(server_name);
  }

  // Introspect the tool (schema lives client-side; keep it out of the LLM prompt)
  const meta = await host.describeTool(server_name, tool_name);
  if (!meta) throw new ToolCallError(`Tool not found: ${server_name}/${tool_name}`);

  // Optional: validate args against JSON Schema if provided
  // (Use ajv or typia; on failure, build a terse, model-readable error)
  if (meta.schema) {
    const Ajv = (await import("ajv")).default;
    const ajv = new Ajv({ strict: false, allErrors: true });
    const validate = ajv.compile(meta.schema as any);
    const ok = validate(argsObj);
    if (!ok) {
      const msg = (validate.errors || [])
        .slice(0, 5)
        .map(e => `${e.instancePath || '/'} ${e.message}`)
        .join("; ");
      throw new ToolCallError(`Invalid arguments for ${tool_name}: ${msg}`, validate.errors);
    }
  }

  // Guardrail: big-JSON truncation (Roo had issues around ~4k chars)
  const previewLimit = opts?.maxArgsPreview ?? 2000;
  const preview = JSON.stringify(argsObj).slice(0, previewLimit);
  const autoApproved = !!meta.alwaysAllow;

  const allowed = autoApproved || (await approve({ server: server_name, tool: tool_name, argsPreview: preview, autoApproved }));
  if (!allowed) throw new ToolCallError("User denied tool invocation.");

  // Invoke with streaming
  const result = await host.invokeTool(server_name, tool_name, argsObj, { signal: opts?.signal, stream: opts?.stream });

  // Return a normalized envelope the chat layer can print as:
  // [use_mcp_tool for 'server'] Result: …
  return {
    server: server_name,
    tool: tool_name,
    ok: true,
    result,
  };
}
```

### Why this mirrors Cline/Roo

*   **Single wrapper tool**: your model only needs to remember _this_ shape. (Exactly how Cline/Roo document `use_mcp_tool`.) [Cline](https://docs.cline.bot/exploring-clines-tools/cline-tools-guide?utm_source=chatgpt.com)
*   **Schemas stay client-side**: validate with AJV; don’t shove schemas into the prompt. (This is what keeps their prompts small.) [Cline](https://docs.cline.bot/mcp/mcp-marketplace?utm_source=chatgpt.com)
*   **Approval UX + auto-approve**: Roo has an “alwaysAllow” style concept; also note an open bug about missing auto-approve for `access_mcp_resource`. Build both paths cleanly. [GitHub](https://github.com/RooCodeInc/Roo-Code/issues/5300?utm_source=chatgpt.com)
*   **Streaming + truncation guard**: Roo has a real-world truncation issue for long JSON args — set preview limits and surface good errors. [GitHub](https://github.com/RooCodeInc/Roo-Code/issues/6108?utm_source=chatgpt.com)

* * *

Extras that make it _feel_ smart (and reduce “I forgot my tools”)
=================================================================

1.  **Tool discovery helpers (lightweight):** Add two tiny tools the _model_ can call when unsure:
    *   `list_mcp_tools(server?: string) -> { server, tool, shortHelp }[]`
    *   `describe_mcp_tool(server, tool) -> { schemaSummary, examples }`  
        They return _summaries_, not full schemas. In your prompt, tell the model: “If you’re unsure what’s available, call `list_mcp_tools` first.” (This mirrors community advice and keeps you out of schema-spam land.) [GitHub](https://github.com/cline/cline/discussions/3081?utm_source=chatgpt.com)
2.  **Top-K tool filtering:** Before each LLM turn, run an **embedding/similarity** pass over `server/tool/description` texts and only inject a _short_ “Relevant Tools” block (max ~10). (There’s an open discussion suggesting exactly this approach for Cline.) [GitHub](https://github.com/cline/cline/discussions/3081?utm_source=chatgpt.com)
3.  **Robust parser:** Cline/Roo use XML-ish tags; users hit loops when the “reminder” text uses the wrong syntax. Make your parser tolerant: accept either XML wrapper or a JSON object with `{ server_name, tool_name, arguments }`. If you detect wrong syntax, reply with a terse, _correct_ example — don’t reinforce the wrong one. (This is a Roo pain point.) [GitHub](https://github.com/RooCodeInc/Roo-Code/issues/4900?utm_source=chatgpt.com)
4.  **Great errors back to the model:** On validation fail, echo the **exact missing/invalid fields**, capped at 3–5 messages. Don’t paste the whole schema.
5.  **Resource wrapper parity:** Implement the sibling `access_mcp_resource(server_name, uri)` with the same approval + streaming patterns so you don’t drift from Cline/Roo UX. [Cline](https://docs.cline.bot/exploring-clines-tools/cline-tools-guide?utm_source=chatgpt.com)
6.  **Transcript formatting:** Print results as:
    ```
    [use_mcp_tool for 'linear'] Result:
    <pretty JSON or markdown table>
    ```
    That’s the pattern both ecosystems show all over issues and server guides, and models learn it quickly. [GitHub](https://github.com/cline/cline/issues/3158?utm_source=chatgpt.com)

* * *

Where this shows up in the wild 
================================

*   **Cline Tools Guide** names the two gateway tools (`use_mcp_tool`, `access_mcp_resource`) and describes their roles — minimal prompt footprint, tools live behind the wrapper. [Cline](https://docs.cline.bot/exploring-clines-tools/cline-tools-guide?utm_source=chatgpt.com)
*   **Cline “MCP Made Easy” docs**: “Your server’s capabilities are added to Cline’s system prompt; tools become available via `use_mcp_tool` commands.” (Exactly the wrapper pattern above.) [Cline](https://docs.cline.bot/mcp/mcp-marketplace?utm_source=chatgpt.com)
*   **Roo issues** document the wrapper syntax, reminder loops, truncation when arguments get large, and auto-approve quirks — all things your gateway should handle gracefully. [GitHub+2GitHub+2](https://github.com/RooCodeInc/Roo-Code/issues/4900?utm_source=chatgpt.com)
*   **Lots of MCP server guides** show example invocations using Cline/Roo with `<use_mcp_tool>` wrappers (Linear, file-finder, multichat, etc.). Great for testing your parser. [Glama – MCP Hosting Platform+2Playbooks+2](https://glama.ai/mcp/servers/%40cpropster/linear-mcp-server?utm_source=chatgpt.com)

* * *

Plug-and-play improvements for agent
=========================================

*   **Mini “Toolcard” prompt injection (top-K)**: Before asking the model to plan, inject a tiny list like:
    ```
    Relevant MCP Tools:
    - linear_search_issues(server=linear): search issues by query, first:N
    - repo_list_open_prs(server=github): list PRs in repo
    (Use <use_mcp_tool> with JSON args; if unsure, call list_mcp_tools.)
    ```
    That’s usually <500 chars and works wonders.
*   **Retries on schema fail**: Catch `ToolCallError` with details and _immediately_ re-prompt the model with a one-liner “Argument errors: /title is required; /first must be integer ≤ 50. Try again.” No stack traces, no giant dumps.
*   **Chunked args**: If you ever need to pass huge payloads (e.g., embeddings, large prompts) — chunk and store via a resource or temp file and pass a handle/URI instead of a 50k JSON blob. This dodges the truncation class of bugs Roo users hit. [GitHub](https://github.com/RooCodeInc/Roo-Code/issues/6108?utm_source=chatgpt.com)

* * *
