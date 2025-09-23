OpenRouter Models Supporting Tool Use (May 24, 2025)

OpenAI (Native Function Calling)

openai/gpt-4.1 – Paid. OpenAI’s flagship model (1M-token context) supporting native function calling. Optimized for long-context reasoning and coding, ideal for agent use-cases
openrouter.ai
.
openai/gpt-4.1-mini – Paid. Mid-sized 1M-context version of GPT-4.1 with lower latency and cost, also supporting OpenAI’s function-call interface
openrouter.ai
.
openai/gpt-4.1-nano – Paid. Small, fast 1M-context variant of GPT-4.1 (cheapest in the series) with full function calling support
openrouter.ai
.
openai/gpt-4o and openai/gpt-4o-mini (Search Preview) – Paid. Multi-modal “GPT-4 Omni” models (128K context) that natively support function calls. The GPT-4o-mini is tuned specifically for tool use in web search scenarios
openrouter.ai
.
openai/gpt-4.5 (Preview) – Paid. Experimental successor to GPT-4 (128K context). Supports OpenAI function calling (via Chat Completions API) for advanced reasoning tasks
openrouter.ai
. Note: May require “BYOK” (bring-your-own-key) integration for access
openrouter.ai
.
openai/gpt-3.5-turbo (v0613+) and openai/gpt-3.5-turbo-16k – Paid. Older models that introduced OpenAI’s function-calling interface (e.g. 0613 and later) for tool use. The 16k version offers expanded context; both support calling functions defined in the API
openrouter.ai
openrouter.ai
.
OpenAI “o” Series (e.g. openai/o4-mini, openai/o3-mini, openai/o1) – Paid. OpenAI’s reasoning-optimized models (often requiring more thinking time). These models can chain tools and use function calls natively
openrouter.ai
openrouter.ai
. For example, o4-mini is tuned for agentic tool use (fast and cost-efficient)
openrouter.ai
. (Some O-series models are experimental or rate-limited. The strongest o1 models spend more time “thinking” for complex tasks.)

Google Gemini (Google’s Tool API)

google/gemini-2.5-pro (Experimental) – Free (limited-time). Google’s latest state-of-the-art 2025 model with native function calling via the Gemini API. Excels at advanced reasoning, coding, and tool use; offered on OpenRouter as a free preview
x.com
.
google/gemini-2.0-pro and google/gemini-2.0-flash – Paid. Gemini 2.0 models (1M context) supporting Google’s function-call interface. Flash is optimized for speed, while Pro provides higher accuracy, both with improved multimodal understanding and tool use capabilities
openrouter.ai
.
google/gemini-1.5-pro and google/gemini-1.5-flash – Paid. Earlier generation Gemini models that also support function/tool calls. They are compatible with Google’s function calling modes and were noted for being cheaper per call than GPT-4o models
reddit.com
.
Note: Gemini models use Google’s native function calling API (Vertex AI), allowing them to autonomously call tools by schema. OpenRouter passes tool specs to Gemini and the model returns a function call if needed
reddit.com
. Developers find Gemini’s tool use cost-effective compared to GPT-4 models
reddit.com
.
Anthropic Claude (Tool Use via Prompting)

anthropic/claude-3.7-sonnet – Paid. Claude 3.7 (200K context) with improved reasoning, coding, and agentic workflows. It can autonomously handle multi-step processes and is tuned for tool use in complex tasks
openrouter.ai
openrouter.ai
.
anthropic/claude-3.5-sonnet – Paid. Claude 3.5 model with strong support for function-call style tool use. Anthropic recommends Claude 3.5 “Sonnet” for complex or multi-tool scenarios, as it handles tool selection and clarification well
docs.anthropic.com
.
anthropic/claude-sonnet-4 – Paid. Latest Claude (v4, 200K context, released May 2025) with state-of-the-art performance. It improves on code execution and reliability in agent-driven tool workflows (fewer errors, better follow-through on using tools)
openrouter.ai
.
anthropic/claude-3.x-haiku – Paid. Claude “Haiku” models (e.g. Claude 3 Haiku) are compact, fast versions. They can still suggest tools but are less capable than Sonnet models in complex tool use. (Haiku is analogous to Claude Instant, focused on quick responses
openrouter.ai
.)
Note: Anthropic’s API has no explicit function-calling feature, so OpenRouter enables tool use by prompt engineering. Tools are passed via OpenRouter’s interface, and Claude is guided to output a tool request in a structured format (e.g. YAML) which OpenRouter then executes
openrouter.ai
. Anthropic’s “thinking” mode variants (Sonnet Thinking) use chain-of-thought to improve multi-tool planning, at the cost of some speed
github.com
.
Specialized Open-Source Models (Tool-Use Tuned)

arcee-ai/caller-large – Paid. A 32k-context function-calling specialist model
openrouter.ai
. Designed to produce structured JSON function outputs and orchestrate multi-step tool chains
openrouter.ai
. Caller Large decides when to call a tool vs. answer directly, minimizing hallucinated tool calls
openrouter.ai
. (This model provides an OpenAI-style function calling experience without using a giant model like GPT-4.)
thudm/glm-4-32b:free – Free. 32B-param open model (Chinese–English bilingual) optimized for code-gen, function calling, and agent-style tasks
openrouter.ai
. It was trained on large reasoning-heavy data and aligned to produce function-call outputs (e.g. JSON) comparable to GPT-4o on benchmarks
openrouter.ai
.
thudm/glm-4-9b:free – Free. 9B-param version of GLM-4, offering similar tool-use capabilities with lower resource requirements. Like its 32B counterpart, it supports function-call formats for integrating tools (trained with the same alignment methods)
openrouter.ai
.
scb10x/typhoon2-8b-instruct – Paid. 8B Thai–English model (based on Llama 3.1) tuned for instructions and function-calling tasks
openrouter.ai
. It handles bilingual queries and even code-switching, performing well on tool-use benchmarks in both Thai and English
openrouter.ai
.
scb10x/typhoon2-70b-instruct – Paid. 70B high-accuracy Thai–English model excelling at general reasoning, math/coding, and tool-use scenarios
openrouter.ai
. It achieves state-of-the-art results on Thai-specific benchmarks and function-call tasks, rivaling larger models in accuracy
openrouter.ai
.
Note: These open models are specially fine-tuned to follow function call formats. Many will output a JSON or structured snippet to invoke a tool. For example, Caller Large and GLM-4 are trained to produce clean function signatures/JSON outputs for tool calls
openrouter.ai
. This means developers must parse the model’s response to execute the tool and then feed results back, but it enables robust tool integration at low or no cost. All listed models accept the OpenRouter tools parameter for a unified tool-calling experience.

You can use the **same OpenRouter‐based tool‐calling pattern** for all of the models listed—no per‐model branching in your agent code—because OpenRouter handles the provider specifics under the hood. Just always send:

```ts
{
  model: "<provider>/<model-id>",
  messages: [...],
  tools: [ /* your MCP‐derived tool specs */ ],
  tool_choice: "auto"
}
```

Here’s what actually happens for each family:

| Model Family                        | Handling in Code                                                                | Notes                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **OpenAI GPT (4.1, o-series, 3.5)** | Exactly as above via OpenAI SDK pointed at openrouter.ai<br>(OpenAI-compatible) | Native function‐calling; OpenRouter maps your `tools`→`functions` for you .                                                     |
| **Google Gemini (Pro, Flash)**      | Same OpenRouter call (use `tools`, not `functions`)                             | Gemini’s API only recognizes `tools`; OpenRouter passes them through to Vertex AI .                                             |
| **Anthropic Claude (3.5, 3.7, 4)**  | Same OpenRouter call                                                            | Under the hood it uses prompt-based tool injection (YAML/JSON); you don’t need custom code .                                    |
| **Ollama / LM Studio**              | Same OpenRouter call                                                            | They speak OpenAI’s chat+functions API locally—no change needed.                                                                |
| **Specialist Function-Tuned**       | Same OpenRouter call                                                            | Models like `arcee-ai/caller-large` or `thudm/glm-4-32b` are fine-tuned for JSON tool calls; just parse their output as usual . |

---

### Key Takeaways

1. **One integration pattern**—always use `tools` + `tool_choice: "auto"` against `https://openrouter.ai/api/v1`.
2. **No extra branching**—OpenRouter routes to the right provider and adapts function calls under the covers.
3. **Model quirks** live in OpenRouter’s router logic, not your code. Once you pick a supported model ID, your agent loop stays identical.

That means your existing `OpenRouterClient.chatCompletion(...)` wrapper works unchanged across every tool-enabled model—just swap the `model` string.
