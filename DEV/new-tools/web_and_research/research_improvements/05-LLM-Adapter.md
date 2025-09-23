# LLM Adapter — Minimal Integration

Provide a tiny adapter so the pipeline can call your model client uniformly.

```ts
// src/llm/adapter.ts
export interface LLM {
  generate(prompt: string, opts?: { temperature?: number; system?: string }): Promise<string>
}

// Example: wrap your Claude/OpenAI client
export const llm: LLM = {
  async generate(prompt, opts) {
    // Replace with your client call:
    // return myClient.complete({ prompt, temperature: opts?.temperature ?? 0.2 });
    throw new Error('llm.generate not wired yet');
  }
};
```

**Why:** decouples the pipeline from any specific vendor. You can swap providers without touching the research code.
