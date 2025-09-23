import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  research,
  type ResearchArtifact,
  type ResearchOptions,
  type ResearchProgressEvent
} from '../../../../research/research-pipeline.js';
import { llm } from '../../../../llm/adapter.js';
import { runMultiSearch } from './search-engine.js';
import {
  ResearchAgent,
  ResearchSession,
  ResearchConfig,
  ResearchProgress,
  ResearchContext,
  ExtractedContent
} from '../types/index.js';

interface SessionMeta {
  artifact?: ResearchArtifact;
  progressPercent: number;
  stepLabel: string;
  lastEvent?: ResearchProgressEvent;
  context?: ResearchContext;
  error?: string;
  lastUpdated: Date;
  options?: DeepResearchOptions;
}

interface SessionTracker {
  session: ResearchSession;
  onProgress: (event: ResearchProgressEvent) => void;
  complete: (artifact: ResearchArtifact) => void;
  fail: (error: Error) => void;
}

type DeepResearchOptions = Omit<ResearchOptions, 'onProgress'>;

const PROGRESS_MAP: Record<string, { step: string; percent: number }> = {
  'search:started': { step: 'Starting search', percent: 10 },
  'search:results': { step: 'Evaluating search results', percent: 25 },
  'crawl:started': { step: 'Extracting content', percent: 40 },
  'crawl:done': { step: 'Extracting content', percent: 55 },
  'summarize:started': { step: 'Summarizing sources', percent: 65 },
  'summarize:source': { step: 'Summarizing sources', percent: 70 },
  'summarize:done': { step: 'Summaries ready', percent: 75 },
  'compose:started': { step: 'Composing report', percent: 85 },
  'compose:chunk': { step: 'Composing report', percent: 88 },
  'compose:done': { step: 'Finalizing report', percent: 92 },
  done: { step: 'Completed', percent: 100 }
};

const DEFAULT_DEEP_OPTIONS: DeepResearchOptions = {
  depth: 6,
  mode: 'comprehensive',
  format: 'markdown',
  dedupeByHost: true,
  searchProvider: runMultiSearch
};

export class EnhancedResearchAgent extends EventEmitter implements ResearchAgent {
  private activeSessions: Map<string, ResearchSession> = new Map();
  private sessionMeta: Map<string, SessionMeta> = new Map();

  async startResearch(query: string, config: Partial<ResearchConfig> = {}): Promise<ResearchSession> {
    const deepOptions = this.convertConfigToDeepOptions(config);
    const tracker = this.beginSession(query, deepOptions);
    this.executePipeline(query, tracker, deepOptions).catch(error => tracker.fail(error instanceof Error ? error : new Error(String(error))));
    return tracker.session;
  }

  getProgress(sessionId: string): ResearchProgress | null {
    const session = this.activeSessions.get(sessionId);
    const meta = this.sessionMeta.get(sessionId);
    if (!session || !meta) {
      return null;
    }

    return {
      sessionId,
      currentStep: meta.stepLabel,
      progress: Math.round(meta.progressPercent),
      status: session.status,
      currentQuery: session.query,
      resultsFound: session.totalResults,
      contentExtracted: session.extractedContent.length,
      estimatedTimeRemaining: undefined
    };
  }

  async stopResearch(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    const meta = this.sessionMeta.get(sessionId);
    if (!session || !meta) {
      return;
    }

    session.status = 'failed';
    session.endTime = new Date();
    meta.error = 'Stopped by user request';
    meta.lastUpdated = new Date();

    this.emitStructuredEvent({
      type: 'error',
      percent: meta.progressPercent,
      data: { subType: 'stopped', message: meta.error },
      sessionId
    });
  }

  getSession(sessionId: string): ResearchSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  getAllSessions(): ResearchSession[] {
    return Array.from(this.activeSessions.values());
  }

  generateResearchContext(sessionId: string): ResearchContext | null {
    const meta = this.sessionMeta.get(sessionId);
    if (!meta?.context) {
      return null;
    }
    return meta.context;
  }

  getMostRecentContext(): ResearchContext | null {
    let mostRecent: ResearchContext | null = null;
    for (const meta of this.sessionMeta.values()) {
      if (!meta.context) continue;
      if (!mostRecent || meta.context.lastUpdated > mostRecent.lastUpdated) {
        mostRecent = meta.context;
      }
    }
    return mostRecent;
  }

  beginSession(query: string, options: DeepResearchOptions): SessionTracker {
    const sessionId = uuidv4();
    const session: ResearchSession = {
      id: sessionId,
      query,
      originalQuestion: query,
      startTime: new Date(),
      status: 'initializing',
      searches: [],
      extractedContent: [],
      totalResults: 0,
      relevantResults: 0
    };

    this.activeSessions.set(sessionId, session);
    this.sessionMeta.set(sessionId, {
      progressPercent: 0,
      stepLabel: 'Initializing',
      lastUpdated: new Date(),
      options
    });

    const onProgress = (event: ResearchProgressEvent) => this.handleProgress(sessionId, event);
    const complete = (artifact: ResearchArtifact) => this.handleCompletion(sessionId, artifact);
    const fail = (error: Error) => this.handleFailure(sessionId, error);

    return { session, onProgress, complete, fail };
  }

  private async executePipeline(query: string, tracker: SessionTracker, options: DeepResearchOptions): Promise<void> {
    try {
      const artifact = await research(query, llm, {
        ...DEFAULT_DEEP_OPTIONS,
        ...options,
        onProgress: tracker.onProgress
      });
      tracker.complete(artifact);
    } catch (error) {
      tracker.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private handleProgress(sessionId: string, event: ResearchProgressEvent): void {
    const session = this.activeSessions.get(sessionId);
    const meta = this.sessionMeta.get(sessionId);
    if (!session || !meta) {
      return;
    }

    const mapping = PROGRESS_MAP[event.event] ?? { step: meta.stepLabel, percent: meta.progressPercent };
    const nextPercent = Math.max(meta.progressPercent, mapping.percent);

    switch (event.event) {
      case 'search:started':
        session.status = 'searching';
        break;
      case 'search:results': {
        session.status = 'searching';
        const filtered = typeof event.data?.filtered === 'number' ? event.data.filtered : Number(event.data?.filtered ?? session.totalResults);
        const selected = typeof event.data?.selected === 'number' ? event.data.selected : Number(event.data?.selected ?? session.relevantResults);
        if (!Number.isNaN(filtered)) session.totalResults = filtered;
        if (!Number.isNaN(selected)) session.relevantResults = selected;
        break;
      }
      case 'crawl:started':
      case 'crawl:done':
        session.status = 'extracting';
        break;
      case 'summarize:started':
      case 'summarize:source':
      case 'summarize:done':
      case 'compose:started':
      case 'compose:chunk':
      case 'compose:done':
        session.status = 'analyzing';
        break;
      case 'done':
        session.status = 'completed';
        break;
      default:
        break;
    }

    meta.progressPercent = nextPercent;
    meta.stepLabel = mapping.step;
    meta.lastEvent = event;
    meta.lastUpdated = new Date();

    this.emitStructuredEvent({
      type: 'progress',
      percent: meta.progressPercent,
      data: { subType: event.event, ...(event.data ?? {}) },
      sessionId
    });
  }

  private handleCompletion(sessionId: string, artifact: ResearchArtifact): void {
    const session = this.activeSessions.get(sessionId);
    const meta = this.sessionMeta.get(sessionId);
    if (!session || !meta) {
      return;
    }

    session.status = 'completed';
    session.endTime = new Date();
    session.relevantResults = artifact.sourcesAnalyzed;
    session.extractedContent = this.mapSummariesToExtractions(artifact);

    meta.progressPercent = 100;
    meta.stepLabel = 'Completed';
    meta.artifact = artifact;
    meta.context = this.buildContext(session, artifact);
    meta.lastUpdated = new Date();

    this.emitStructuredEvent({
      type: 'done',
      percent: 100,
      data: {
        subType: 'done',
        sourcesAnalyzed: artifact.sourcesAnalyzed,
        references: artifact.references
      },
      sessionId
    });
  }

  private handleFailure(sessionId: string, error: Error): void {
    const session = this.activeSessions.get(sessionId);
    const meta = this.sessionMeta.get(sessionId);
    if (!session || !meta) {
      return;
    }

    session.status = 'failed';
    session.endTime = new Date();
    meta.error = error.message;
    meta.lastUpdated = new Date();

    this.emitStructuredEvent({
      type: 'error',
      percent: meta.progressPercent,
      data: { subType: 'error', message: error.message },
      sessionId
    });
  }

  private emitStructuredEvent(event: { type: 'progress' | 'done' | 'error'; percent: number; data: any; sessionId: string }): void {
    this.emit(event.type, event);
  }

  private mapSummariesToExtractions(artifact: ResearchArtifact): ExtractedContent[] {
    return artifact.summaries.map(summary => ({
      url: summary.url,
      title: summary.title,
      content: summary.content,
      wordCount: summary.wordCount,
      extractedAt: new Date(),
      success: true
    }));
  }

  private buildContext(session: ResearchSession, artifact: ResearchArtifact): ResearchContext {
    return {
      sessionId: session.id,
      query: session.query,
      relevantContent: artifact.content,
      sources: artifact.references.map(ref => `${ref.id}. ${ref.title} — ${ref.url}`),
      confidence: Math.min(95, 70 + artifact.sourcesAnalyzed * 3),
      lastUpdated: new Date()
    };
  }

  private convertConfigToDeepOptions(config: Partial<ResearchConfig>): DeepResearchOptions {
    const overrides = config.searchEngineOverrides;
    const engine = overrides?.preferredEngine === 'duckduckgo' ? 'ddg' : overrides?.preferredEngine;

    return {
      ...DEFAULT_DEEP_OPTIONS,
      engine: engine as DeepResearchOptions['engine'],
      engineOrder: (overrides as any)?.engineOrder,
      searchProvider: DEFAULT_DEEP_OPTIONS.searchProvider,
      depth: config.maxContentExtractions ?? DEFAULT_DEEP_OPTIONS.depth,
      maxConcurrency: config.maxContentExtractions ? Math.min(4, Math.max(1, Math.floor(config.maxContentExtractions / 2))) : undefined
    };
  }
}
