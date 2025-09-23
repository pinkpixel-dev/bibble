# MCP Context Diet – Implementation Manual (Step‑by‑Step)

**Goal:** Reduce prompt/context size by switching from “register every tool schema” to an **on‑demand tool discovery** flow, while preserving security and existing execution plumbing.

**Audience:** Devs familiar with the current agent + MCP client architecture.

**Constraints:** TypeScript (ESM), **no new dependencies**, minimal, localized changes, backward‑compatible escape hatch.

---

## 1) Objectives & Success Criteria
- **Objective:** Expose only three small wrapper tools to the LLM (`list_tools`, `describe_tool`, `call_mcp_tool`) + your usual exit tools, and let the model fetch full schemas **only when needed**.
- **Success:**
  - Prompt size per turn drops dramatically.
  - All security checks and UI affordances still fire.
  - Old behavior recoverable via a single flag (`compactToolsMode: false`).

---

## 2) High‑Level Plan
1) **Agent:**
   - Add three wrapper tools.
   - Update the **system prompt** with a short “Tool Discovery Flow” section.
   - Adjust the tool list sent to the LLM based on a new `compactToolsMode` flag (default: **true**).
   - Implement two helpers the wrappers use: `_listToolsSummary()` and `_describeTool()`.
   - Minor change in turn processing to intercept wrapper tool calls and delegate real calls to `callTool(name, args)`.

2) **Client (MCP):**
   - Keep public API stable: `availableTools`, `toolToServerMap`, `loadTools()`, `callTool(name,args)`.
   - Ensure connections are idempotent; load built‑ins and server tools; preserve **SecurityManager** path.

---

## 3) Step‑by‑Step: Agent Changes

### 3.1 Add a compact‑mode flag
In the `Agent` constructor options:
```ts
interface AgentOptions {
  model?: string;
  userGuidelines?: string;
  servers?: BibbleConfig["mcpServers"];
  compactToolsMode?: boolean; // default true
}
```
Store it on the instance (default **true**):
```ts
this.compactToolsMode = options.compactToolsMode ?? true;
```

### 3.2 Add three wrapper tools
Create three `ChatCompletionInputTool` objects:
```ts
const listToolsTool: ChatCompletionInputTool = {
  type: "function",
  function: {
    name: "list_tools",
    description: "List available tools; optional filters by server and name substring.",
    parameters: {
      type: "object",
      properties: {
        server: { type: "string", description: "Filter by server name." },
        match: { type: "string", description: "Case‑insensitive name substring." }
      }
    }
  }
};

const describeToolTool: ChatCompletionInputTool = {
  type: "function",
  function: {
    name: "describe_tool",
    description: "Describe one tool: human summary, required params, JSON schema.",
    parameters: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"]
    }
  }
};

const callMcpToolTool: ChatCompletionInputTool = {
  type: "function",
  function: {
    name: "call_mcp_tool",
    description: "Execute any tool by exact name with a single JSON args object.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        args: { type: "object" }
      },
      required: ["name", "args"]
    }
  }
};
```

### 3.3 Update the system prompt
Add a short section (keep it **brief**):
```text
# TOOL DISCOVERY FLOW (IMPORTANT):
1) Call `list_tools` (optionally with `server`/`match`).
2) Call `describe_tool(name)` to read the JSON schema and required params.
3) Call `call_mcp_tool({ name, args })` using exact parameter names.
```
Also reiterate **single JSON object** for tool args and **must provide required params**.

### 3.4 Choose which tools to expose per turn
Where you assemble `chatParams.tools`, expose **wrapper + exit tools** when compact mode is on, otherwise expose everything:
```ts
const toolsForLLM: ChatCompletionInputTool[] = this.compactToolsMode
  ? [listToolsTool, describeToolTool, callMcpToolTool, taskCompletionTool, askQuestionTool]
  : [...builtInToolsForLLM, ...this.availableTools, taskCompletionTool, askQuestionTool];

chatParams.tools = toolsForLLM;
```

> **Tip:** Keep `builtInToolsForLLM` precomputed if you need the legacy path.

### 3.5 Implement helper: `_listToolsSummary()`
This returns a **compact markdown directory** of tools grouped by server, with optional filters:
```ts
private _listToolsSummary(opts: { server?: string; match?: string }): string {
  const builtIn = getBuiltInToolRegistry().getAllTools().map(t => ({
    source: "Built-in Tools",
    name: t.name,
    description: t.description,
    parameters: zodToJsonSchema(t.parameters)
  }));
  const mcp = (this.availableTools || []).map(t => ({
    source: this.toolToServerMap?.get(t.function.name) || "MCP Server",
    name: t.function.name,
    description: t.function.description || "",
    parameters: t.function.parameters
  }));

  const all = [...builtIn, ...mcp];
  const s = opts.server?.toLowerCase();
  const m = opts.match?.toLowerCase();
  const filtered = all.filter(x => (!s || x.source.toLowerCase().includes(s)) && (!m || x.name.toLowerCase().includes(m)));

  const groups = new Map<string, typeof filtered>();
  for (const item of filtered) { if (!groups.has(item.source)) groups.set(item.source, []); groups.get(item.source)!.push(item); }

  let out = "# Tool Directory\n\n";
  if (opts.server || opts.match) out += `Filters: ${opts.server ?? ""} ${opts.match ?? ""}\n\n`;
  else out += "Use `describe_tool` for details and `call_mcp_tool` to execute.\n\n";

  for (const [src, items] of groups) {
    out += `## ${src}\n`;
    for (const it of items) out += `- ${it.name}${it.description ? ` — ${it.description.split(/\r|\n/)[0]}` : ""}\n`;
    out += "\n";
  }
  if (filtered.length === 0) out += "No tools found for the given filters.\n";
  return out;
}
```

### 3.6 Implement helper: `_describeTool(name)`
Returns markdown with description, **required params**, and full schema:
```ts
private _describeTool(name: string): string | null {
  const builtIn = getBuiltInToolRegistry().getAllTools().map(t => ({
    source: "Built-in Tools",
    name: t.name,
    description: t.description,
    parameters: zodToJsonSchema(t.parameters)
  }));
  const mcp = (this.availableTools || []).map(t => ({
    source: this.toolToServerMap?.get(t.function.name) || "MCP Server",
    name: t.function.name,
    description: t.function.description || "",
    parameters: t.function.parameters
  }));
  const found = [...builtIn, ...mcp].find(t => t.name === name);
  if (!found) return null;

  const req = Array.isArray((found.parameters as any)?.required) ? (found.parameters as any).required as string[] : [];
  let md = `# ${found.name}\n\nSource: ${found.source}\n\n`;
  if (found.description) md += `${found.description}\n\n`;
  md += req.length ? `**Required parameters:** ${req.map(r => `\`${r}\``).join(", ")}\n\n` : "**Required parameters:** None\n\n";
  md += "## JSON Schema\n```json\n" + JSON.stringify(found.parameters, null, 2) + "\n```\n";
  md += `\nUse \`call_mcp_tool\` with { "name": "${found.name}", "args": { ... } }.\n`;
  return md;
}
```

### 3.7 Intercept wrapper tool calls in the turn loop
Where you process streamed tool calls, handle the three wrappers explicitly and delegate everything else to `callTool`:
```ts
if (toolName === "list_tools") {
  return { content: this._listToolsSummary({ server: args.server, match: args.match }) };
}
if (toolName === "describe_tool") {
  if (!args?.name) return { content: "Error: 'name' is required for describe_tool." };
  const md = this._describeTool(String(args.name));
  return { content: md ?? `Tool '${args.name}' not found.` };
}
if (toolName === "call_mcp_tool") {
  const inner = String(args?.name ?? "");
  if (!inner) return { content: "Error: 'name' is required for call_mcp_tool." };
  if (["list_tools","describe_tool","call_mcp_tool"].includes(inner)) return { content: "Error: cannot invoke agent utility tools through call_mcp_tool." };
  return await this.callTool(inner, args?.args ?? {});
}
// Otherwise: real tool or legacy path
return await this.callTool(toolName, args);
```

> Keep feeding tool results back into the conversation exactly as before (respecting your provider‑specific formatting).

---

## 4) Step‑by‑Step: MCP Client Changes
*(If your client already matches this, you can skip)*

### 4.1 Public API (unchanged)
- `availableTools: ChatCompletionInputTool[]`
- `toolToServerMap: Map<string,string>`
- `loadTools()` populates both.
- `callTool(name,args)` executes with full **SecurityManager** gating.

### 4.2 Load tools in two stages
1) Convert **built‑ins** to the OpenAI/Anthropic tool shape and push to `availableTools`; map each to `"Built-in Tools"`.
2) **Connect** servers idempotently; for each connected client, do `tools/list` and push their tools; map each `name → serverName`.

### 4.3 Execute with security
`callTool` should:
- Classify risk, build a prompt, call `SecurityManager.ensureAllowed`.
- On denial/timeout, surface the Security UI.
- Execute built‑ins locally or MCP via `tools/call`.
- Normalize return value to a **string** content field.

---

## 5) Configuration & Rollback
- **Flag:** `compactToolsMode` on Agent constructor (default **true**).
- **Rollback:** set `compactToolsMode: false` to restore legacy “register all tools” behavior without code change.

---

## 6) Validation Checklist
- [ ] Agent exposes only 5 tools in compact mode (3 wrappers + 2 exit tools).
- [ ] `list_tools({ match: "file" })` shows `write_file` (or equivalent).
- [ ] `describe_tool({ name: "write_file" })` returns JSON schema with accurate `required`.
- [ ] `call_mcp_tool({ name: "write_file", args: { path, content } })` succeeds.
- [ ] Security denial/timeout UIs still appear when appropriate.
- [ ] With `compactToolsMode: false`, the old behavior returns (all tools registered).

---

## 7) Testing Plan
### Unit/Component ideas
- **Discovery:** wrapper tools format outputs; filters work.
- **Describe:** required param detection correct.
- **Execution:** wrapper delegates to `callTool`; built‑in vs MCP path chosen from `toolToServerMap`.
- **Security:** denial/timeouts bubble to UI.

### Manual flow (dev console)
1) Start with only built‑ins → `list_tools()` shows built‑ins.
2) Add one MCP server → `list_tools()` includes server tools; `describe_tool()` returns schema.
3) Execute end‑to‑end via `call_mcp_tool` and confirm file/system effects.

---

## 8) Troubleshooting
- **Nothing listed:** ensure `loadTools()` runs before first turn; verify server connect logs.
- **Unknown tool:** check `toolToServerMap` population order; watch for name collisions.
- **Model invents params:** re‑issue `describe_tool` and echo the schema’s exact names; update schema at the source if wrong.
- **Recursion/loop:** guard `call_mcp_tool` against calling the three wrappers.

---

## 9) Rationale Recap
- **Why wrappers?** Keeps the LLM’s tool surface tiny, moving verbose schemas to a just‑in‑time pull.
- **Why preserve client API?** Security + display logic stays centralized and battle‑tested.
- **Why the flag?** Safe rollback and A/B comparisons without code churn.

---

## 10) Example Snippets (Copy/Paste)

### Tools array selection
```ts
const tools: ChatCompletionInputTool[] = this.compactToolsMode
  ? [listToolsTool, describeToolTool, callMcpToolTool, taskCompletionTool, askQuestionTool]
  : [...builtInToolsForLLM, ...this.availableTools, taskCompletionTool, askQuestionTool];
```

### System prompt insert
```text
# TOOL DISCOVERY FLOW (IMPORTANT):
1) Call `list_tools` (optionally with `server`/`match`).
2) Call `describe_tool(name)` to read the JSON schema and required params.
3) Call `call_mcp_tool({ name, args })` using exact parameter names.
```

### call_mcp_tool guard
```ts
if (["list_tools","describe_tool","call_mcp_tool"].includes(innerName)) {
  return { content: "Error: cannot invoke agent utility tools through call_mcp_tool." };
}
```

---

## 11) Deployment Notes
- No new env vars required.
- Works with current model providers; if a provider lacks native tools, your existing abstraction should keep behavior consistent.
- Keep an eye on token usage telemetry to quantify savings.

---

## 12) Appendix: Minimal Interface Contracts
```ts
// Agent needs from client
this.availableTools: ChatCompletionInputTool[];
this.toolToServerMap: Map<string,string>;
this.callTool(name: string, args: unknown): Promise<{ content: string }>
```

```ts
// Wrapper tool shapes
interface ChatCompletionInputTool {
  type: "function";
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
}
```

---

## 13) Rollout Plan (Suggested)
1) Ship behind config defaulted to **compact on** in staging.
2) Compare token usage vs legacy in a small canary cohort.
3) Flip on in production; leave rollback flag in place for one release.

