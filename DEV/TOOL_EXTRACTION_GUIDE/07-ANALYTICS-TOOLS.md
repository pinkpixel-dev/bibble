# 📊 Analytics & Feedback Tools

*Local-only usage tracking, lightweight telemetry toggles, and feedback prompting logic*

---

## 🎯 Goals
- Track tool usage locally for UX insights (no PII, no file paths/contents)
- Enable/disable external telemetry (default off in this standalone kit)
- Provide a simple, configurable feedback prompting mechanism

## 🧱 Types
```typescript
// src/desktop-commander/types/analytics.ts
export interface UsageStats {
  firstUsed: number;            // epoch ms
  lastUsed: number;             // epoch ms
  totalToolCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalSessions: number;        // long-running proc/search sessions
  byTool: Record<string, { calls: number; success: number; failure: number }>;
}

export interface FeedbackPrompt {
  message: string;              // Text to show the user
  variant: 'short' | 'detailed';
}
```

## 🗂️ Storage Locations
- macOS/Linux: `~/.desktop-commander/usage.json`
- Windows: `%USERPROFILE%\.desktop-commander\usage.json`

## 🛠️ Usage Tracker
```typescript
// src/desktop-commander/utilities/usage-tracker.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { UsageStats, FeedbackPrompt } from '../types/analytics.js';
import { logger } from './logger.js';

class UsageTracker {
  private usagePath: string;
  private stats: UsageStats | null = null;

  constructor(customPath?: string) {
    const home = os.homedir();
    const dir = path.join(home, '.desktop-commander');
    this.usagePath = customPath || path.join(dir, 'usage.json');
  }

  private async ensureDir(): Promise<void> {
    const dir = path.dirname(this.usagePath);
    try { await fs.access(dir); } catch { await fs.mkdir(dir, { recursive: true }); }
  }

  async load(): Promise<UsageStats> {
    if (this.stats) return this.stats;
    await this.ensureDir();
    try {
      const raw = await fs.readFile(this.usagePath, 'utf8');
      this.stats = JSON.parse(raw) as UsageStats;
    } catch {
      this.stats = {
        firstUsed: Date.now(),
        lastUsed: Date.now(),
        totalToolCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalSessions: 0,
        byTool: {}
      };
      await this.save();
    }
    return this.stats!
  }

  private async save(): Promise<void> {
    if (!this.stats) return;
    await this.ensureDir();
    await fs.writeFile(this.usagePath, JSON.stringify(this.stats, null, 2), 'utf8');
  }

  async trackCall(toolName: string): Promise<void> {
    const s = await this.load();
    s.totalToolCalls += 1;
    s.lastUsed = Date.now();
    s.byTool[toolName] ||= { calls: 0, success: 0, failure: 0 } as any;
    s.byTool[toolName].calls += 1;
    await this.save();
  }

  async trackSuccess(toolName: string): Promise<void> {
    const s = await this.load();
    s.successfulCalls += 1;
    s.byTool[toolName] ||= { calls: 0, success: 0, failure: 0 } as any;
    s.byTool[toolName].success += 1;
    await this.save();
  }

  async trackFailure(toolName: string): Promise<void> {
    const s = await this.load();
    s.failedCalls += 1;
    s.byTool[toolName] ||= { calls: 0, success: 0, failure: 0 } as any;
    s.byTool[toolName].failure += 1;
    await this.save();
  }

  async trackSessionStarted(): Promise<void> {
    const s = await this.load();
    s.totalSessions += 1;
    await this.save();
  }

  async getStats(): Promise<UsageStats> {
    return await this.load();
  }

  /**
   * Heuristic: prompt after N successful calls, with ratio threshold
   */
  async shouldPromptForFeedback(): Promise<boolean> {
    const s = await this.load();
    if (s.totalToolCalls < 10) return false; // avoid prompting too early
    const successRate = s.successfulCalls / Math.max(1, s.totalToolCalls);
    // Prompt if enough usage and good success rate
    return successRate >= 0.7 && (Date.now() - s.firstUsed) > 24 * 60 * 60 * 1000;
  }

  async getFeedbackPromptMessage(): Promise<FeedbackPrompt> {
    const s = await this.load();
    const days = Math.max(1, Math.floor((Date.now() - s.firstUsed) / 86400000));

    // Two variants
    const detailed: FeedbackPrompt = {
      variant: 'detailed',
      message: `

—
If this toolkit has been helpful (${s.totalToolCalls} calls over ${days} day(s)), would you share feedback? It helps prioritize improvements. Thank you!`
    };
    const short: FeedbackPrompt = {
      variant: 'short',
      message: `

—
Would you mind sharing quick feedback about these tools? 🙏`
    };

    // Alternate to avoid repetition
    return (s.totalToolCalls % 2 === 0) ? detailed : short;
  }
}

export const usageTracker = new UsageTracker();
```

## 🔌 Tool Call Wrapper
To automatically track usage, wrap your tool dispatch:
```typescript
// src/desktop-commander/utilities/tool-wrapper.ts
import { usageTracker } from './usage-tracker.js';

export async function withUsageTracking<T>(toolName: string, fn: () => Promise<T>): Promise<T> {
  await usageTracker.trackCall(toolName);
  try {
    const result = await fn();
    await usageTracker.trackSuccess(toolName);
    return result;
  } catch (err) {
    await usageTracker.trackFailure(toolName);
    throw err;
  }
}
```

## 🧭 Feedback Flow (Optional)
- After a successful tool execution, check `shouldPromptForFeedback()`
- If true, append the `message` from `getFeedbackPromptMessage()` to your app’s response (or show UI)

Example:
```typescript
import { usageTracker } from '../utilities/usage-tracker.js';

async function maybeAppendFeedback(text: string): Promise<string> {
  if (await usageTracker.shouldPromptForFeedback()) {
    const prompt = await usageTracker.getFeedbackPromptMessage();
    return text + prompt.message;
  }
  return text;
}
```

## 🔐 Privacy Notes
- This kit stores stats **locally only**
- No file paths, contents, or command arguments are persisted
- You can disable tracking entirely by skipping the wrapper or purging `usage.json`
