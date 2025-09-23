import { Config } from '../config/config.js';
import { MessageRole, type ChatMessage } from '../types.js';
import { LlmClient } from './client.js';

export interface LLM {
  generate(prompt: string, opts?: { temperature?: number; system?: string; maxTokens?: number }): Promise<string>;
}

class DefaultLLM implements LLM {
  private client: LlmClient;
  private readonly model: string;

  constructor() {
    const config = Config.getInstance();
    const provider = config.getDefaultProvider();
    this.client = new LlmClient({ provider });
    this.model = config.getDefaultModel(provider) || 'gpt-4o-mini';
  }

  async generate(prompt: string, opts: { temperature?: number; system?: string; maxTokens?: number } = {}): Promise<string> {
    const messages: ChatMessage[] = [];

    if (opts.system) {
      messages.push({ role: MessageRole.System, content: opts.system });
    }

    messages.push({ role: MessageRole.User, content: prompt });

    const stream = await this.client.chatCompletion({
      model: this.model,
      messages,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
    });

    let accumulated = '';
    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        accumulated += chunk.text;
      }
    }

    return accumulated.trim();
  }
}

export const llm: LLM = new DefaultLLM();
