// Enhanced tool call display system for gorgeous, interactive tool output ✨
// Implements beautiful headers, progress indicators, boxed sections, and rich formatting

import boxen from 'boxen';
import ora, { Ora } from 'ora';
import { highlight } from 'cli-highlight';
import stringifyPretty from 'json-stringify-pretty-compact';
import terminalLink from 'terminal-link';
import cliTruncate from 'cli-truncate';

import { theme } from './theme.js';
import { chatSymbols, s } from './symbols.js';
import { BibbleTable } from './tables.js';

export type ToolStatus = 'running' | 'success' | 'error' | 'cancelled';

export interface ToolExecution {
  toolName: string;
  status: ToolStatus;
  startTime?: Date;
  endTime?: Date;
  spinner?: Ora;
}

export interface ToolDisplayOptions {
  showTimings?: boolean;
  showParameters?: boolean;
  showSpinner?: boolean;
  expandedByDefault?: boolean;
  maxJsonLines?: number;
  maxTableRows?: number;
  enableInteractive?: boolean;
}

export class EnhancedToolDisplay {
  private activeExecutions = new Map<string, ToolExecution>();
  private defaultOptions: ToolDisplayOptions = {
    showTimings: true,
    showParameters: true,
    showSpinner: true,
    expandedByDefault: false,
    maxJsonLines: 20,
    maxTableRows: 10,
    enableInteractive: true,
  };

  startToolExecution(
    toolName: string,
    parameters?: unknown,
    options?: Partial<ToolDisplayOptions>
  ): string {
    const executionId = `${toolName}-${Date.now()}`;
    const opts = { ...this.defaultOptions, ...options };

    const execution: ToolExecution = {
      toolName,
      status: 'running',
      startTime: new Date(),
    };

    if (opts.showSpinner) {
      execution.spinner = ora({
        text: `Executing ${theme.cyan(toolName)}...`,
        color: 'cyan',
        spinner: 'dots',
      }).start();
    }

    this.activeExecutions.set(executionId, execution);

    console.log('\n' + this.createToolHeader(toolName, 'running', execution.startTime));

    if (parameters && opts.showParameters) {
      console.log(this.createParametersSection(parameters));
    }

    return executionId;
  }

  completeToolExecution(
    executionId: string,
    result: unknown,
    status: ToolStatus = 'success',
    options?: Partial<ToolDisplayOptions>
  ): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    const opts = { ...this.defaultOptions, ...options };

    if (execution.spinner) execution.spinner.stop();

    execution.status = status;
    execution.endTime = new Date();

    console.log(this.createToolHeader(execution.toolName, status, execution.startTime, execution.endTime));
    console.log(this.createResultsSection(result, execution.toolName, opts));

    // separator
    const width = Math.min(process.stdout.columns || 80, 80);
    const line = '─'.repeat(width);
    console.log('\n' + boxen(theme.pinkPixel(line), { padding: 0, borderStyle: 'single', borderColor: 'cyan' }) + '\n');

    if (opts.enableInteractive && process.stdin.isTTY) {
      console.log(this.createInteractiveHints());
    }

    this.activeExecutions.delete(executionId);
  }

  private createToolHeader(
    toolName: string,
    status: ToolStatus,
    startTime?: Date,
    endTime?: Date
  ): string {
    let statusIcon = chatSymbols.status.loading;
    let statusColor = theme.cyan;
    let statusText = 'Running';

    switch (status) {
      case 'success':
        statusIcon = chatSymbols.status.success;
        statusColor = theme.ok;
        statusText = 'Success';
        break;
      case 'error':
        statusIcon = chatSymbols.status.error;
        statusColor = theme.err;
        statusText = 'Error';
        break;
      case 'cancelled':
        statusIcon = chatSymbols.status.warning;
        statusColor = theme.warn;
        statusText = 'Cancelled';
        break;
    }

    let timingInfo = '';
    if (startTime) {
      const startStr = startTime.toLocaleTimeString();
      if (endTime) {
        const duration = endTime.getTime() - startTime.getTime();
        const durationStr = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
        timingInfo = ` ${theme.dim('•')} ${theme.dim(`Started ${startStr}, took ${durationStr}`)}`;
      } else {
        timingInfo = ` ${theme.dim('•')} ${theme.dim(`Started ${startStr}`)}`;
      }
    }

    const statusBadge = statusColor(`[${statusText}]`);
    const headerText = `${statusIcon} ${theme.cyan(toolName)} ${statusBadge}${timingInfo}`;

    return boxen(headerText, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: 'round',
      borderColor: 'cyan',
      width: Math.min(process.stdout.columns || 80, 100),
    });
  }

  private createParametersSection(parameters: unknown): string {
    const title = theme.pinkPixel('Parameters');
    let content = '';

    if (typeof parameters === 'object' && parameters !== null) {
      const jsonStr = stringifyPretty(parameters as any, { maxLength: 60 });
      content = this.formatJsonContent(jsonStr);
    } else {
      content = String(parameters);
    }

    return boxen(content, {
      padding: 1,
      borderStyle: 'single',
      borderColor: 'magenta',
      title,
      titleAlignment: 'left',
    });
  }

  private createResultsSection(result: unknown, toolName: string, options: ToolDisplayOptions): string {
    const title = theme.ocean('Results');
    let content: string;

    try {
      let data: unknown = result;
      if (typeof result === 'string' && (result.trim().startsWith('{') || result.trim().startsWith('['))) {
        try {
          data = JSON.parse(result);
        } catch {
          // keep as string
        }
      }
      content = this.formatResultContent(data, toolName, options);
    } catch (e: any) {
      content = theme.err(`Error formatting results: ${e?.message ?? e}`);
    }

    return boxen(content, {
      padding: 1,
      borderStyle: 'single',
      borderColor: 'cyan',
      title,
      titleAlignment: 'left',
    });
  }

  private formatResultContent(data: unknown, _toolName: string, options: ToolDisplayOptions): string {
    if (Array.isArray(data)) return this.formatArrayContent(data, options);
    if (data && typeof data === 'object') return this.formatObjectContent(data as Record<string, unknown>, options);
    if (typeof data === 'string') return this.formatStringContent(data);
    return this.formatJsonContent(stringifyPretty(data as any));
  }

  private formatArrayContent(data: any[], options: ToolDisplayOptions): string {
    if (data.length === 0) return theme.dim('(empty array)');

    if (data[0] && typeof data[0] === 'object') {
      return this.createArrayTable(data, options);
    }

    const rows = options.maxTableRows ? data.slice(0, options.maxTableRows) : data;
    let out = rows.map((item, i) => `${theme.dim(`${i + 1}.`)} ${this.formatStringContent(String(item))}`).join('\n');
    if (options.maxTableRows && data.length > options.maxTableRows) {
      out += `\n${theme.dim(`... and ${data.length - options.maxTableRows} more items`)}`;
    }
    return out;
    }

  private formatObjectContent(obj: Record<string, unknown>, options: ToolDisplayOptions): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) return theme.dim('(empty object)');

    return entries.map(([key, value]) => {
      const k = theme.cyan(`${key}:`);
      let v: string;
      if (Array.isArray(value)) v = this.formatArrayContent(value as any[], options);
      else if (value && typeof value === 'object') v = this.formatObjectContent(value as Record<string, unknown>, options);
      else if (typeof value === 'string') v = this.formatStringContent(value);
      else v = this.formatJsonContent(stringifyPretty(value as any));
      return `${s.bullet} ${k} ${v}`;
    }).join('\n');
  }

  private formatStringContent(content: string): string {
    if (/^https?:\/\//.test(content)) return terminalLink(content, content);
    if (/^(?:[\/~]|[A-Z]:\\)/.test(content)) return theme.ok(content);
    if (content.includes('\n')) {
      return content.split('\n').map(line => line.trim() ? `  ${line}` : '').join('\n');
    }
    return content;
  }

  private formatJsonContent(jsonStr: string): string {
    try {
      return highlight(jsonStr, { language: 'json', theme: 'github' });
    } catch {
      return jsonStr;
    }
  }

  private createArrayTable(rows: Array<Record<string, unknown>>, options: ToolDisplayOptions): string {
    const truncated = options.maxTableRows ? rows.slice(0, options.maxTableRows) : rows;
    if (truncated.length === 0) return theme.dim('(no data)');

    const keys = [...new Set(truncated.flatMap(r => Object.keys(r)))];

    const table = new BibbleTable({ head: keys.map(k => theme.cyan(k)) });
    truncated.forEach(row => {
      const cells = keys.map(k => {
        const v = row[k];
        if (v == null) return theme.dim('—');
        const str = typeof v === 'string' ? v : stringifyPretty(v as any);
        return str.length > 30 ? cliTruncate(str, 27) + '...' : str;
      });
      table.addRow(cells);
    });

    let out = table.toString();
    if (options.maxTableRows && rows.length > options.maxTableRows) {
      out += `\n${theme.dim(`... and ${rows.length - options.maxTableRows} more rows`)}`;
    }
    return out;
  }

  private createInteractiveHints(): string {
    const hints = [
      `${s.pointer} Use ${theme.code('↑/↓')} to scroll your terminal history.`,
      `${s.pointer} Copy from terminal or pipe output to ${theme.code('pbcopy/clip')}.`,
      `${s.pointer} JSON too long? Re-run with ${theme.code('--max-json-lines')} or ${theme.code('--max-table-rows')}.`,
    ].join('\n');

    return boxen(hints, {
      padding: 1,
      borderStyle: 'single',
      borderColor: 'gray',
      title: theme.dim('Tips'),
    });
  }
}
