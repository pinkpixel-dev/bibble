# Building a Multi-Provider LLM Agent with Model Context Protocol (MCP) in Node.js

## Introduction: Unified Tool Use with MCP

Modern AI agents often need to **use external tools** (APIs, databases, etc.) to fetch information or perform actions. The **Model Context Protocol (MCP)** is an open standard that provides a **unified way to define and call tools** across different Large Language Model (LLM) APIs. Instead of writing custom integrations for each LLM provider, MCP lets you define tools once in a standard format and use them with multiple models. This guide will show how to build a Node.js/TypeScript agent that can **sequentially call tools** using MCP across various LLM providers (Google Gemini, OpenRouter, Ollama, LM Studio). We assume you’re already familiar with basic OpenAI/Anthropic API usage and want to extend your agent to new providers.

**What is MCP?** In a nutshell, MCP standardizes how AI assistants connect to external functions and data. It replaces fragmented integrations with a single protocol. Using MCP, you expose tools on an MCP **server** (each tool is like an API function with a name and JSON schema), and your AI **agent** (MCP client) can invoke these tools as needed. The benefit is interoperability: the *same tool definitions* can be sent to OpenAI, Anthropic, Google, or local models, even though each has different API specifics. The LLM will reason about which tool to call, and your agent will execute the tool and feed results back, in a loop, until the task is complete.

## Defining MCP Tools in a Standard Format

MCP defines a **standard structure for tools** that all providers can understand. Each tool has a unique `name`, an optional `description`, and an `inputSchema` describing its parameters (using JSON Schema). For example:

```json
{
  "name": "searchDocuments",
  "description": "Searches corporate documents by keyword",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Keywords to search for" },
      "limit": { "type": "integer", "description": "Max results to return" }
    },
    "required": ["query"]
  }
}
```

All MCP tools follow this pattern. The **same JSON schema** is used for every model. Under the hood, an MCP server hosting this tool would expose it via a `tools/list` endpoint (for discovery) and a `tools/call` endpoint (for invocation). Our agent will use these endpoints to retrieve tool definitions and execute tools.

**How tools map to different APIs:** Although MCP tool definitions are uniform, each LLM provider expects them in a provider-specific format:

* **OpenAI-style APIs** (OpenAI, OpenRouter, Ollama, LM Studio): Use OpenAI Function Calling format – an array of `functions` with `name`, `description`, and `parameters` (JSON Schema). This corresponds directly to MCP’s structure (MCP’s `inputSchema` becomes OpenAI’s `parameters` field).
* **Google Gemini API**: Uses *function declarations* in its SDK/REST calls, also defined with name, description, and parameters (similar to OpenAPI schema).
* **Anthropic Claude** (for context, if using the new Claude v4 API): Can accept an MCP server URL and handle tools internally, but if doing it manually, one must instruct the model via the prompt (since Claude’s API doesn’t take a `functions` param). In this guide we focus on the four providers listed, all of which can be interfaced in an OpenAI-like or function-call manner.

The key point is that **we define our tools once** (as above) and then *adapt that definition to each API’s call format*. The actual tool functionality is implemented on the MCP server side (for example, a server might implement `searchDocuments` by querying an index). Next, we’ll see how an agent orchestrates tool use with these definitions.

## Agent Orchestration: Sequential Tool-Calling Loop

Using MCP tools with an LLM involves an **iterative loop** between the model and the tool server. The agent (your code) orchestrates this loop as follows:

1. **Prepare the conversation and tools:** Start with the user’s query and a list of available tools (the MCP definitions). Each LLM API call will include the conversation messages and the tool definitions (in the format the provider expects). You may also include a system prompt instructing the model to use tools when appropriate.
2. **Model decides on tool use:** The LLM sees the tools and may choose to invoke one. Depending on the API, the model’s response will indicate a **function/tool call** instead of a final answer. For example, OpenAI returns a `function_call` object in the response, and Google’s Gemini returns a `functionCall` in the `response.functionCalls` list.
3. **Agent executes the tool:** The agent detects the tool request, extracts the `name` and `arguments`, and calls the MCP server’s `tools/call` endpoint. This is a regular HTTP call (or using an MCP client SDK) that executes the tool and returns the result. For instance, using `fetch` in Node.js:

   ```ts
   async function callMCPTool(toolName: string, args: any): Promise<string> {
     const res = await fetch(`${MCP_SERVER_URL}/tools/call`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ name: toolName, arguments: args })
     });
     const result = await res.json();
     // Assuming tool returns { content: [ { type: 'text', text: "..." }, ... ] }
     const textOutput = result.content?.find((c: any) => c.type === 'text')?.text;
     return textOutput || '';
   }
   ```

   The MCP server will run the tool and typically return a result payload (text, JSON, or other content) that our agent captures.
4. **Inject tool result into model context:** Now we give the tool’s output back to the LLM so it can use it to continue the conversation. Each provider has a method for this:

   * OpenAI-style: Add a new message with role `"function"` containing the tool result, and (optionally) include the original function call as an assistant message with `function_call`. (The OpenAI SDK does this implicitly when you provide `function_call` in the response messages array.)
   * Google Gemini: Append a content part with the model’s function call and another with the function response before calling the model again.
   * Others: Generally, ensure the LLM receives the tool’s output as new context (often as if the user or system provided that info).
5. **Loop until done:** Call the LLM again with the updated conversation (which now includes the tool result). The model may decide to call another tool (repeat steps 3–4) or provide a final answer. The agent loops, handling one tool call per iteration, until the model’s response is a final answer.

**Error handling and fallbacks:** Real-world agents need robustness. If a tool call fails (e.g., MCP server error or invalid args), the agent can handle it by injecting an error message into the conversation or by trying an alternative strategy. For example, you might add a system message like “*(Tool Error: `<error message>`)*” and allow the model to react, or have a fallback model attempt the task. If one LLM provider fails (e.g. times out or doesn’t correctly use a tool), you could even route the query to another provider (OpenRouter supports automatic model fallbacks).

**Context injection:** Maintaining context between steps is crucial. Always carry forward the conversation history, including tool calls and results. This ensures the model’s state is preserved. Additionally, you can inject any global context the model might need (e.g., relevant documents or user profile data) as part of the system or tool outputs. MCP also supports **resources** (read-only context data) and **roots** (session state), but for tool use, the main “context” is the conversation itself. The agent should make sure each iteration includes all relevant information (initial question, any prior tool outputs, etc.) so the model can make informed decisions.

With the overall approach in mind, let’s dive into provider-specific integration details.

## Google Gemini: Enabling Tool Use via MCP

Google’s Gemini API (accessible via Google’s GenAI SDK or Vertex AI) supports function calling similar to OpenAI’s. MCP tools can be used by passing **function declarations** to the model. Here’s how to integrate it in TypeScript using the official `@google/genai` SDK:

```ts
import { GoogleGenAI } from '@google/genai';

// 1. Configure the Google GenAI client with your API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 2. Define function declarations for available tools (convert MCP tool schema to Google format)
const toolsConfig = {
  tools: [{
    functionDeclarations: [
      {
        name: "searchDocuments",
        description: "Searches corporate documents by keyword",
        parameters: {  // Note: uses OpenAPI JSON schema subset
          type: "object",
          properties: {
            query: { type: "string", description: "Keywords to search for" },
            limit: { type: "integer", description: "Max results to return" }
          },
          required: ["query"]
        }
      },
      // ... add other functionDeclarations as needed
    ]
  }]
};

// 3. Send user prompt along with the function declarations
const userMessage = { role: 'user', parts: [{ text: "Find any documents about project Apollo." }] };
let contents = [ userMessage ];

let response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',  // example model name
  contents,
  config: toolsConfig
});

// 4. Check if model returned a function call
if (response.functionCalls && response.functionCalls.length > 0) {
  const toolCall = response.functionCalls[0];
  console.log("Model wants to call tool:", toolCall.name, toolCall.args);
  // Execute the requested tool via MCP
  const toolResult = await callMCPTool(toolCall.name, toolCall.args);
  // 5. Append the function call and its result to the conversation
  contents.push({ role: 'model', parts: [{ functionCall: toolCall }] });  // model's function request:contentReference[oaicite:11]{index=11}
  contents.push({ role: 'user', parts: [{ functionResponse: { name: toolCall.name, response: { result: toolResult } } }] });

  // 6. Call the model again with the updated context (tool result included)
  const finalResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents,
    config: toolsConfig
  });
  const answer = finalResponse.text;
  console.log("Final answer:", answer);
}
```

In this example, we configure the Gemini API call with a `tools` array containing our function declarations. The model’s response (in `response.functionCalls`) will include the function name and arguments if it decided to use a tool. We then **execute the tool** via the MCP server and package the result back into the `contents` as a special `functionResponse` part, as shown above. The next call to `generateContent` includes these new parts, allowing the model to incorporate the result in its final answer.

**Notes on Google’s API:** Google’s format is conceptually similar to OpenAI’s, but the mechanics differ slightly (e.g., using `role: 'model'` and `'user'` to represent the tool call and response, rather than `'assistant'` and `'function'`). The GenAI SDK also offers utilities; for instance, it can **automatically handle function calling loops** if you enable it. (The SDK’s `mcpToTool` wrapper can execute MCP tools and feed results back for you.) In our example, we implemented the loop manually for clarity.

## OpenRouter: Tools via an OpenAI-Compatible API

[OpenRouter](https://openrouter.ai) is a service that provides a unified API to many models from different providers. Importantly, OpenRouter’s API is **OpenAI-compatible** – meaning we can use the same OpenAI SDK calls but point them to OpenRouter’s endpoint. This makes tool integration straightforward, since OpenRouter will accept OpenAI-style function definitions.

First, install OpenAI’s official Node.js SDK (`npm install openai`). Then you can set up the OpenAI client to use OpenRouter:

```ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});
```

Here we configured the OpenAI client to use OpenRouter’s base URL and our OpenRouter API key (as a Bearer token). OpenRouter normalizes requests for many model providers but the interface is the same as OpenAI’s.

Now, suppose we want to use OpenRouter with a GPT-4 model for tool usage:

```ts
// 1. Prepare messages and functions (tool definitions) for OpenAI format
const messages = [
  { role: "system", content: "You are a helpful assistant. You have tools available to you." },
  { role: "user", content: "Summarize the latest sales report and email it to the team." }
];
const functions = [
  {
    name: "getLatestSalesReport",
    description: "Retrieve the latest sales report from the database",
    parameters: {
      type: "object",
      properties: {},
      // ... (no params in this example)
      required: []
    }
  },
  {
    name: "sendEmail",
    description: "Send an email to a list of recipients",
    parameters: {
      type: "object",
      properties: {
        recipients: { type: "array", items: { type: "string" } },
        subject:   { type: "string" },
        body:      { type: "string" }
      },
      required: ["recipients", "subject", "body"]
    }
  }
];
// (These function definitions could come from an MCP /tools/list call, translated to OpenAI format.)

// 2. Call the model via OpenRouter (OpenAI-compatible endpoint)
const initialResponse = await openai.chat.completions.create({
  model: "openrouter/gpt-4",  // specify the model; OpenRouter may require provider prefix (e.g., openai/gpt-4 or anthropic/claude-2)
  messages,
  functions,
  function_call: "auto"   // let the model decide if/when to call a function
});

// 3. Check for function call in the response
const choice = initialResponse.choices[0];
if (choice.finish_reason === "function_call" || choice.message.function_call) {
  const fnCall = choice.message.function_call;
  const toolName = fnCall.name;
  // arguments might be a JSON string in OpenAI response:
  const args = typeof fnCall.arguments === "string" ? JSON.parse(fnCall.arguments) : fnCall.arguments;
  console.log(`Model requested function: ${toolName}`, args);

  // Execute the MCP tool
  const result = await callMCPTool(toolName, args);

  // 4. Append the function call and result to messages
  messages.push({ role: "assistant", content: "", function_call: { name: toolName, arguments: JSON.stringify(args) } });
  messages.push({ role: "function", name: toolName, content: result });

  // 5. Call the model again with tool result in context
  const finalResponse = await openai.chat.completions.create({
    model: "openrouter/gpt-4",
    messages
  });
  const answer = finalResponse.choices[0].message.content;
  console.log("Final answer:", answer);
}
```

In this code, we treat OpenRouter just like OpenAI. The `functions` array contains our MCP tools (here defined inline for illustration). We request a completion with `function_call: "auto"`, which hints to the model it can use any function if needed. If the model decides to call a tool, the response’s `choices[0].message.function_call` will have the `name` and `arguments`. We parse the arguments JSON, call `callMCPTool(toolName, args)` to get the real result, then **add two messages** to the conversation: one representing the assistant’s function call (OpenAI expects an assistant message with a `function_call` field) and one as the **function’s response** (role `"function"`, containing the tool’s output). Finally, we send the updated message list to get the model’s final answer with the tool data in context.

**OpenRouter specifics:** Note that the `model` name may include a provider prefix (e.g., `"openai/gpt-4"` or `"anthropic/claude-2"`). OpenRouter supports many models; you choose one or even let it auto-select. The rest of the integration is identical to OpenAI’s API. In fact, OpenRouter explicitly supports using the OpenAI SDK and normalizes the requests/responses for you. This means our tool-calling loop logic will behave the same on OpenRouter as it does on OpenAI’s own endpoint.

## Ollama: Local LLMs with OpenAI-Compatible API

[Ollama](https://ollama.com) is a local LLM runtime that can serve models (like LLaMA 2, Mistral, etc.) on your machine. As of early 2024, Ollama introduced an **OpenAI Chat Completions API compatibility mode**. This allows you to use the same OpenAI client or HTTP format to query your local model. In practice, integrating tools with Ollama is very similar to OpenRouter or OpenAI, with just a different base URL.

**Setup:** Start Ollama’s server (it usually listens at `http://localhost:11434`). Pull a model that supports function calling (for example, some newer Llama 2 or Mistral variants fine-tuned for tools). You can then use the OpenAI Node SDK pointed to Ollama’s URL:

```ts
const localOpenAI = new OpenAI({
  apiKey: "ignore",  // Ollama doesn’t require a real key, but the OpenAI SDK needs a string
  baseURL: "http://localhost:11434/v1"
});
```

Here we set the baseURL to Ollama’s local endpoint (it exposes the same `/v1/chat/completions` path as OpenAI). Model names will correspond to the models you have installed in Ollama (e.g., `"llama2"` if you ran `ollama pull llama2`). Now we can call it similarly:

```ts
const response = await localOpenAI.chat.completions.create({
  model: "llama2",  // or another model ID you pulled into Ollama
  messages,
  functions,
  function_call: "auto"
});
```

The handling of the response is exactly the same as the OpenAI example above – check for `response.choices[0].message.function_call`, then execute the tool and continue the loop. The only difference is that a local model’s **ability to follow the tool-use format** depends on the model. Some open-source models may not call functions as cleanly as GPT-4. To improve reliability, Ollama’s team or the community fine-tune certain models for tool usage. In practice, if the model doesn’t automatically produce a `function_call` when it should, you might need to engineer the prompt (e.g., adding a system message like *“You have the following tools available... Use them in JSON when needed”*). However, many popular open-source models now have tool-use training. For example, LM Studio notes that **Qwen, Mistral, and Llama 3.x models work well for tool use**.

**Summary for Ollama:** It leverages the same code path as OpenAI, just change the endpoint. This is a great example of MCP’s promise – you don’t change your tool definitions or loop logic at all when moving to a local model. Your agent calls `functions` in the request, and if the model was trained to understand them, it will respond with a function call which your agent then fulfills.

## LM Studio: Local LLMs via OpenAI API or SDK

[LM Studio](https://lmstudio.ai) is another local LLM framework (with a desktop UI and server) that also supports an OpenAI-compatible API. As of version 0.3.6, LM Studio introduced **function calling / tool use support in its OpenAI mode**. This means you can run a local LM Studio server and use any OpenAI-based tooling with it – effectively treating it like a drop-in replacement for OpenAI’s API.

To integrate LM Studio in your Node.js agent, you have two main options:

* Use the OpenAI SDK with LM Studio’s base URL (similar to Ollama).
* Use LM Studio’s own JavaScript client (`lmstudio-js`). We’ll illustrate the OpenAI-compatible approach for consistency.

**Setup LM Studio server:** Ensure LM Studio is running in server (headless) mode with OpenAI compatibility enabled (there’s usually a toggle for “Developer API” or you can launch with a flag). By default it listens on port 1234. We configure the OpenAI client:

```ts
const openaiLocal = new OpenAI({
  apiKey: "any-string",  // LM Studio doesn't require a strict API key check
  baseURL: "http://localhost:1234/v1"
});
```

*(The port might differ if configured; 1234 is the default as per LM Studio docs.)* This setup is confirmed by LM Studio’s docs: *“You can reuse existing OpenAI clients by switching the base URL to point to your LM Studio instead of OpenAI’s servers.”*

Now, using `openaiLocal` is identical to the earlier OpenAI/OpenRouter usage. For example:

```ts
const result = await openaiLocal.chat.completions.create({
  model: "gpt-4o-mini",  // use the model identifier as shown in LM Studio for the loaded model
  messages,
  functions,
  function_call: "auto"
});
```

LM Studio will return a response in the same format. If the model triggers a tool, you’ll get `choices[0].message.function_call` back. You then call `callMCPTool` and provide the result as a `"function"` role message, etc., just like before.

One advantage of LM Studio is that it explicitly advertises support for tool use. In fact, LM Studio 0.3.6 states: *“This means you can use LM Studio with any framework that knows OpenAI tools, and utilize local models for tool use instead.”*. It even labels models that were fine-tuned for tool usage (you might see a “tool use” badge in their UI). If you select such a model (e.g., a version of Mistral or Qwen with tool-use training), the model will more reliably produce proper function call outputs. This greatly helps the MCP agent loop, as the model will follow the protocol (outputting the function name and JSON arguments when appropriate).

**Caveat:** If a local model (Ollama or LM Studio) is not responding with tool calls when expected, you may need to guide it via the prompt. For instance, add to the system message: *“You can use tools by responding with a JSON formatted function call when needed. The tools available are: \[list tool names].”* This prompt engineering acts as a hint for models that weren’t explicitly trained on function calling. In contrast, OpenAI/Gemini models have this behavior baked in and require less prodding.

## Bridging MCP Tool Format to Provider APIs

Let’s summarize how we “bridge the gap” between MCP’s standard and each provider’s expectations:

* **Tool Definition Format:** MCP uses `name/description/inputSchema`. OpenAI and compatible APIs expect `name/description/parameters`. In practice, these are the same JSON schema, just keyed differently. For example, our MCP `inputSchema` for **searchDocuments** becomes the `parameters` field in the OpenAI functions list. Google’s SDK also accepts the same schema under `functionDeclarations`.
* **LLM Request Construction:** OpenAI-like providers accept a `functions` array and optionally `function_call: "auto"`. Google accepts a `tools` list with `functionDeclarations` in the request config. In both cases, we send *all available tools* with each request (or ensure they’ve been provided once and cached in context). The LLM then knows what tools are at its disposal.
* **Model’s Tool Call Response:** OpenAI returns a structured `function_call` object in the response message. Google’s response includes a `functionCalls` array with one or more calls. OpenRouter and LM Studio mirror OpenAI’s format (they pass it through or emulate it), so you’ll get a `function_call` the same way. Our agent code abstracts this by checking for the presence of a function call in the response, regardless of source.
* **Feeding Tool Results Back:** This step has the most provider variation in terms of API syntax:

  * **OpenAI/OpenRouter/Ollama/LM Studio:** Use the message roles. Provide the tool output as a message with role `"function"` (and ensure the assistant’s prior message indicates it called that function). The OpenAI API will then continue the conversation incorporating that function result.
  * **Google Gemini:** Instead of explicit `"function"` role, we append the result as a `functionResponse` part with role `'user'` in the content list. This is effectively telling the model “the user provided this data (from the tool)”. Meanwhile, we also include the model’s own `functionCall` as a content part with role `'model'` (so the model remembers it already tried that tool). This approach is unique to Google’s SDK, but logically it parallels the OpenAI method (keeping track of what function was called and what was returned).
  * **Anthropic Claude (FYI):** If using Claude’s new beta features, you could simply supply the MCP server URL in the API call and **Claude will handle the entire loop for you**. It will automatically retrieve tools, decide calls, execute them, and give a final answer. This is beyond our manual approach, but it underscores that MCP’s format is universal – even Claude’s native integration uses the same tool definitions and schemas under the hood.

By standardizing tools through MCP, our agent code for handling function calls stays largely the same across providers. The main differences lie in **request setup** (e.g., using the correct client library and parameter names) and **response parsing**. We can often use a common interface with minor tweaks, as demonstrated by using the OpenAI SDK for OpenRouter, Ollama, and LM Studio simply by changing `baseURL` and keys.

Below is a quick comparison of tool-calling integration points:

| Provider                           | How Tools Are Provided                                                                | How Tool Call Appears                                                                         | Tool Result Integration                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **OpenAI API** (e.g. GPT-4)        | `functions: [...]` in `createChatCompletion` request (JSON schema under `parameters`) | `choices[0].message.function_call` with `name` and JSON `arguments` (stringified)             | Add messages: `assistant` with `function_call`, then `function` with result content.                                                     |
| **Google Gemini** (Vertex/GenAI)   | `tools: [{ functionDeclarations: [...] }]` in request config                          | `response.functionCalls[0]` with `name` and `args` object                                     | Append to `contents`: one part with `functionCall` (role model) and one part with `functionResponse` (role user), then call model again. |
| **OpenRouter** (OpenAI-compatible) | Same as OpenAI (use OpenAI SDK, just change `baseURL`)                                | Same as OpenAI (pass-through)                                                                 | Same as OpenAI (message-based).                                                                                                          |
| **Ollama** (local)                 | Same as OpenAI (OpenAI API compatibility on localhost)                                | If model supports functions, same format; if not, might just return text (no function\_call). | Same as OpenAI; if no native support, agent must parse tool requests from plain text.                                                    |
| **LM Studio** (local)              | Same as OpenAI (OpenAI API compatibility on localhost:1234)                           | Same as OpenAI (for models with tool-use support)                                             | Same as OpenAI. (LM Studio also has direct tool API, but OpenAI mode is easiest.)                                                        |

As shown, OpenAI’s function calling paradigm has become a de-facto standard that many providers adopt. MCP leverages this by using a compatible JSON schema and call/response pattern. This is why we can seamlessly route the same tool definitions to all these endpoints.

## Configuring MCP Tool Routing in Your Agent

Finally, let’s address how your agent knows *where* to call tools. In a real system, you might have **multiple MCP servers** (e.g., one for a database, one for a web search API, etc.). Each tool might belong to a different server. The agent needs to route `tools/call` requests to the correct endpoint. Here are some strategies:

* **Single MCP Server:** Simplest case – all tools are hosted on one MCP server (it could aggregate many functions). In this case, you can set a single `MCP_SERVER_URL` and use `callMCPTool` as we defined, pointing to that server.

* **Multiple Servers:** If tools are spread across servers (say `db-tools.mycompany.com` vs `gdrive-tools.mycompany.com`), you should maintain a mapping of tool name to the server URL or an identifier for the server. For example, when you fetch the tool list from each server (via `GET /tools/list`), you can prepend or namespace the tool names, or keep a dictionary:

  ```ts
  const toolServerMap: Record<string, string> = {
    "searchDocuments": "https://db-tools.mycompany.com",
    "sendEmail": "https://email-tools.mycompany.com"
  };
  // Then in callMCPTool, use toolServerMap[name] to direct the request.
  ```

  Another approach is to run a **unified MCP gateway** that merges tool listings from multiple backends and routes calls internally. For our guide, we assume one server for simplicity.

* **Shared Schema & Context:** All MCP servers adhere to the same schema format for requests and responses. A `tools/call` POST expects `{ name: string, arguments: object }` and returns a `{ content: [...] }` payload. This means your `callMCPTool` function can be generic – it doesn’t need to know tool-specific details aside from the name and args. Also, consider any auth or context needed by the MCP server. Some servers might require an auth token or user context (e.g., to access a user’s Google Drive). You can handle this by configuring the HTTP headers or the `arguments` to include a token. MCP doesn’t standardize auth, but you can include credentials in a secure manner (or the server might be on a protected network).

* **Tool Registration:** In your agent initialization, you’ll likely **retrieve the tool definitions** from the MCP server rather than hard-coding them. For example:

  ```ts
  const res = await fetch(`${MCP_SERVER_URL}/tools/list`);
  const toolList = await res.json();
  // toolList.tools is an array of {name, description, inputSchema,...}
  ```

  You would then convert this `toolList.tools` into the format needed for each provider’s API. For OpenAI-like, map each tool’s `inputSchema` to a `parameters` JSON. This can be done dynamically so that whenever you add a new tool on the server, all models automatically get the updated definition. During development, it’s fine to define tools in code, but calling `tools/list` ensures the agent and MCP server stay in sync.

* **Maintaining Conversation State:** Because our agent loops through multiple model calls, it should preserve the `messages` or `contents` array between calls. It’s useful to encapsulate this logic in a higher-order function or class (e.g., an `Agent` class with a method like `agent.handleUserRequest(query)` that internally manages the loop and state). This makes it easier to plug in different model providers without duplicating code. For instance, you might abstract a `ModelProvider` interface with a `generateReply(messages, functions)` method implemented by GoogleProvider, OpenAIProvider, etc., each handling the API differences. The agent orchestration code can then be provider-agnostic, simply calling `provider.generateReply()` and checking for tool usage.

## Conclusion

By leveraging Model Context Protocol, we achieve a **consistent tool-calling pattern** across heterogeneous LLMs. We defined tools once (using JSON schemas) and showed how to register these with Google’s Gemini API, a hosted service like OpenRouter, and local servers like Ollama and LM Studio. Each provider has slight nuances in how they handle function calls, but our agent loop – **present tools → detect tool request → execute tool → inject result → continue** – remains the same. This uniform approach simplifies adding new models to your agent: as long as the model (or the API) supports function-style calls (or you can coax it via prompt engineering), it can participate in the MCP-based tool ecosystem.

With the included TypeScript examples, you can now extend your agent’s capabilities:

* **Google Gemini**: via official SDK or REST, using function declarations to augment the model.
* **OpenRouter**: as a unified cloud endpoint, simply by configuring the OpenAI SDK base URL.
* **Ollama** and **LM Studio**: running locally but speaking the same “language” as OpenAI’s API, making integration trivial.

Using MCP encourages an *“define once, use anywhere”* philosophy for tool integrations. It lets your AI agent maintain a shared set of abilities, no matter which model is answering at the moment. As you build out your agent system, you can focus on creating useful tools and robust orchestration logic, confident that the MCP standard will allow those tools to be used by any current or future LLM provider with minimal glue code. Happy coding, and may your AI agents always find the right tool for the job!

**Sources:**

* Anthropic, *Introducing the Model Context Protocol*
* MCP Documentation – Tool structure and usage
* Google AI Developers – *Function Calling with the Gemini API*
* OpenRouter Documentation – OpenAI-compatible API details
* LM Studio Blog – Function Calling API in local LLMs
