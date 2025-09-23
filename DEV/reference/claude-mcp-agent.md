# Working Examples of an MCP Agent Loop with Claude (Anthropic API)

## Node.js Agent Loop Example with MCP Tools

A Node.js implementation of an **MCP-enabled agent loop** for Anthropic’s Claude can be structured as follows:

* **Send the user query with tool definitions:** Append the user’s message to the conversation history and call the Claude API (`anthropic.messages.create`) including the list of available tools (each with name, description, and input schema). Claude will evaluate the query and decide if any tool is needed.
* **Iterate over Claude’s response content:** The API returns a response whose content may include special blocks (e.g. `tool_use` requests) alongside any assistant text. You loop through each content item in the response. If an item has `content.type === "tool_use"`, it indicates Claude wants to invoke a tool. For example, Claude might output a block like `{ type: "mcp_tool_use", name: "getCurrentWeather", input: { location: "Paris" } }`.
* **Invoke the requested tool:** Using your MCP client (connected to the user’s MCP server), execute the tool with the given `name` and `input` parameters. In Node, this could be done via a call like `await mcpClient.callTool({ name: content.name, arguments: content.input })`. This runs the tool (e.g. a weather API call) on your server and returns the result.
* **Send tool results back to Claude:** Take the tool’s output and send it to Claude as a new message, allowing Claude to incorporate it into its reasoning. According to Anthropic’s guidelines, the client should package the result in a user message containing a `tool_result` content block (associating it with the original tool use). In practice, a simple approach is to push a user message with the JSON result. For example, the Node code below uses `chatHistory.push({ role: "user", content: JSON.stringify(toolResult.content) })` to feed the result back. This tells Claude the outcome of the tool call.
* **Continue the loop until completion:** After providing the tool result, you typically call Claude again (or continue streaming) so it can proceed. Claude may either produce the final answer or request another tool. The loop continues, executing each `tool_use` in sequence and appending its `tool_result`, until Claude returns a final assistant message with no more tool calls. At that point, the turn is complete and the assistant’s answer can be returned to the user. (Anthropic’s quickstart confirms this flow: send query with tools, execute tool calls, send results back, then get Claude’s final response.)

Below is a **simplified Node.js code snippet** demonstrating this agent loop with multiple tool calls in sequence:

```javascript
// Assume chatHistory is an array of message objects, and mcpClient is set up.
chatHistory.push({ role: 'user', content: userQuery });  // Add user query to history

// 1. Send the query to Claude with available tool definitions
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1000,
  messages: chatHistory,
  tools: availableTools,  // array of tool definitions (name, description, schema)
});

// 2. Loop through each content block in Claude's response
for (const content of response.content) {
  if (content.type === 'tool_use') {
    // Claude requested a tool call
    const toolResult = await mcpClient.callTool({
      name: content.name,
      arguments: content.input
    });
    // 3. Append the tool result as a user message (so Claude can see the output)
    chatHistory.push({ role: 'user', content: JSON.stringify(toolResult.content) });
    // 4. (Optionally) call Claude again here with updated history to continue the loop
    // const nextResponse = await anthropic.messages.create({ ...messages: chatHistory, tools: availableTools });
    // ...and handle nextResponse similar to above until no more tool_use
  }
  if (content.type === 'text') {
    // This is part of Claude's assistant answer; collect it if needed
    finalAnswerParts.push(content.text);
  }
}
const finalAnswer = finalAnswerParts.join('');
```

In this snippet (adapted from a [community Node project](https://github.com/RajeshRenato/mcp-node)), the client adds the user query to history, sends it to Claude with a `tools` list, then iterates over `response.content` to handle any tool calls. For each `tool_use`, it invokes the tool via the MCP client and immediately appends the result as a new user message. You would then call Claude again with the updated history (as shown in the commented section) to get the next part of the response. This process repeats until Claude’s response contains only text with no further `tool_use` blocks, indicating the agent has finished using tools and produced the final answer.

## Python Example and Official Guidance

The same agent-loop pattern is reflected in official examples using Python. For instance, in a reference implementation by Anthropic, the client checks each item in `response.content` from Claude and if a `tool_use` appears, it runs the tool and injects a corresponding `tool_result` message before calling `anthropic.messages.create` again for Claude’s continuation. This ensures Claude sees the tool’s output and can use it in formulating the answer. The Anthropic documentation emphasizes that when Claude requests a tool, the client should execute the tool and *return the result to Claude in a new user message* (with a `tool_result` block), after which Claude will incorporate that result and continue answering.

In summary, a **complete working loop** involves the Claude model requesting multiple MCP tools in sequence, the client invoking each tool with the specified parameters, and sending back results, until Claude produces a final answer. Both the Node.js example above and the Python reference implementation follow this officially recommended pattern, and they have been proven to work with Anthropic’s API for MCP-enabled Claude models. The result is an agent that can interact with several tools step-by-step within a single conversation turn, ending the turn only after Claude has all the tool outputs it needs to answer the user’s query.

**Sources:** Actual code examples and documentation for MCP tool usage with Claude, which demonstrate the looping pattern, tool invocation, and turn completion in Node.js and Python.
