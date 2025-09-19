// Enhanced tool call display system for gorgeous, interactive tool output ✨
// Implements beautiful headers, progress indicators, boxed sections, and rich formatting

import boxen from 'boxen';
import { highlight } from 'cli-highlight';
import { PinkPixelSpinner, spinners } from './spinners.js';
import stringifyPretty from 'json-stringify-pretty-compact';
import terminalLink from 'terminal-link';
import cliTruncate from 'cli-truncate';
import { theme } from './theme.js';
import { chatSymbols, symbols, s } from './symbols.js';
import { BibbleTable } from './tables.js';
import { z } from 'zod';

// Base tool interface
export interface BuiltInTool {
  name: string;
  description: string;
  category: 'filesystem' | 'process' | 'search' | 'edit' | 'web' | 'time' | 'weather' | 'news' | 'workspace' | 'fun';
  parameters: z.ZodSchema; // Schema for parameters
  // Allow returning either an EnhancedToolDisplay instance result object or a simple tool result object
  execute: (params: any) => Promise<any>;
}

export class ZodSchema {
  static parse: any;
}

// Tool execution status and tracking

export type ToolStatus = 'running' | 'success' | 'error' | 'cancelled';

export interface ToolExecution {
  toolName: string;
  status: ToolStatus;
  startTime?: Date;
  endTime?: Date;
  spinner?: PinkPixelSpinner;
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

  EnhancedToolDisplay = z.object({
  success: z.boolean().describe('Indicates if the tool executed successfully'),
  data: z.string().optional().describe('The main output data from the tool'),
  message: z.string().optional().describe('A human-readable message or summary'),
  error: z.string().optional().describe('Error message if execution failed')
  }).describe('Enhanced tool execution result with rich output support');
  
  /**
   * Display a completed tool call (for backward compatibility)
   * @param toolMessage The tool message to display
   * @param options Display options
   */
  displayCall(
    toolMessage: { role: string; content: string; toolName?: string },
    options?: Partial<ToolDisplayOptions>
  ): void {
    const toolName = toolMessage.toolName || 'unknown-tool';
    const executionId = this.startToolExecution(toolName, undefined, options);
    this.completeToolExecution(executionId, toolMessage.content, 'success', options);
  }

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
      execution.spinner = spinners.tool(`Executing ${theme.cyan(toolName)}...`).start();
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

    const suppressResults = this.shouldSuppressResults(execution.toolName, result);
    if (!suppressResults) {
      console.log(this.createResultsSection(result, execution.toolName, opts));
    }

    // separator
    const width = Math.min(process.stdout.columns || 80, 80);
    const line = '─'.repeat(width);
    console.log('\n' + boxen(theme.pinkPixel(line), { padding: 0, borderStyle: 'single', borderColor: 'cyan' }) + '\n');

    // Tips disabled - they were annoying
    // if (opts.enableInteractive && process.stdin.isTTY) {
    //   console.log(this.createInteractiveHints());
    // }

    this.activeExecutions.delete(executionId);
  }

  private shouldSuppressResults(toolName: string, result: unknown): boolean {
    return false;
  }

  private createToolHeader(
    toolName: string,
    status: ToolStatus,
    startTime?: Date,
    endTime?: Date
  ): string {
    let statusIcon = theme.cyan(symbols.circle);
    let statusColor = theme.cyan;
    let statusText = 'Running';

    switch (status) {
      case 'success':
        statusIcon = theme.ok(symbols.tick);
        statusColor = theme.ok;
        statusText = 'Success';
        break;
      case 'error':
        statusIcon = theme.err(symbols.cross);
        statusColor = theme.err;
        statusText = 'Error';
        break;
      case 'cancelled':
        statusIcon = theme.warn(symbols.warning);
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

  private formatResultContent(data: unknown, toolName: string, options: ToolDisplayOptions): string {
    // Handle ToolResult objects from built-in tools
    if (data && typeof data === 'object' && 'success' in data) {
      const toolResult = data as any;
      
      if (toolResult.success === false) {
        return theme.err(`❌ ${toolResult.error || 'Tool execution failed'}`);
      }
      
      let output = '';
      
      // Show message if present (this is the summary)
      if (toolResult.message) {
        output += theme.info(`${toolResult.message}\n\n`);
      }
      
      // Format the actual data
      if (toolResult.data) {
        output += this.formatToolData(toolResult.data, toolName, options);
      }
      
      return output.trim();
    }
    
    // Handle raw objects/arrays (filesystem tools)
    if (Array.isArray(data)) return this.formatArrayContent(data, options);
    if (data && typeof data === 'object') return this.formatObjectContent(data as Record<string, unknown>, options);
    if (typeof data === 'string') return this.formatStringContent(data);
    return this.formatJsonContent(stringifyPretty(data as any));
  }
  
  private formatToolData(data: unknown, toolName: string, options: ToolDisplayOptions): string {
    // Special handling for certain tools
    if (toolName === 'get-weather' && data && typeof data === 'object') {
      return this.formatWeatherContent(data as Record<string, unknown>, options);
    }
    if (toolName === 'list_directory' && Array.isArray(data)) {
      return this.createArrayTable(data as any[], options);
    }
    if (toolName === 'read_file' && data && typeof data === 'object' && 'content' in data) {
      return this.formatStringContent((data as any).content);
    }
    if (toolName === 'search_files' && Array.isArray(data)) {
      return this.createArrayTable(data as any[], options);
    }
    if (toolName === 'list_processes' && Array.isArray(data)) {
      return this.createArrayTable(data as any[], options);
    }
    if (toolName === 'run_command' && data && typeof data === 'object' && 'stdout' in data) {
      return this.formatStringContent((data as any).stdout || '(no output)');
    }
    
    // Default formatting for other tool data
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

  private formatWeatherContent(rawData: Record<string, unknown>, options: ToolDisplayOptions): string {
    const sections: string[] = [];
    const current = (rawData.current ?? rawData) as Record<string, unknown> | undefined;
    const forecast = Array.isArray((rawData as any).forecast) ? (rawData as any).forecast as Array<Record<string, unknown>> : undefined;
    const units = (current?.units as string) || (rawData.units as string) || 'metric';

    if (current) {
      const currentTable = new BibbleTable({ head: ['Metric', 'Value'], style: 'clean' });
      currentTable
        .addRow(['Location', String(current.location ?? '—')])
        .addRow(['Condition', String(current.description ?? '—')])
        .addRow(['Temperature', this.formatWeatherTemperature(current.temperature as number | undefined, units)])
        .addRow(['Feels Like', this.formatWeatherTemperature(current.feelsLike as number | undefined, units)])
        .addRow(['Humidity', this.formatWeatherPercent(current.humidity as number | undefined)])
        .addRow(['Wind', this.formatWeatherWind(current.windSpeed as number | undefined, current.windDirection as number | undefined, units)])
        .addRow(['Pressure', this.formatWeatherPressure(current.pressure as number | undefined)])
        .addRow(['Visibility', this.formatWeatherVisibility(current.visibility as number | undefined, units)])
        .addRow(['Cloudiness', this.formatWeatherPercent(current.cloudiness as number | undefined)]);

      if (current.uvIndex !== undefined) {
        currentTable.addRow(['UV Index', String(current.uvIndex)]);
      }

      currentTable
        .addRow(['Sunrise', String(current.sunrise ?? '—')])
        .addRow(['Sunset', String(current.sunset ?? '—')])
        .addRow(['Timezone', String(current.timezone ?? '—')])
        .addRow(['Units', this.describeWeatherUnits(units)]);

      sections.push(currentTable.toString());
    }

    if (forecast && forecast.length > 0) {
      const forecastTable = new BibbleTable({ head: ['Day', 'High', 'Low', 'Conditions', 'Wind', 'Humidity'], style: 'fancy' });
      const truncatedForecast = options.maxTableRows ? forecast.slice(0, options.maxTableRows) : forecast;

      truncatedForecast.forEach((entry, index) => {
        const temp = entry.temperature as Record<string, number> | undefined;
        forecastTable.addRow([
          this.labelForecastDay(entry.date as string | undefined, index),
          this.formatWeatherTemperature(temp?.max, units),
          this.formatWeatherTemperature(temp?.min, units),
          String(entry.description ?? '—'),
          this.formatWeatherWind(entry.windSpeed as number | undefined, undefined, units),
          this.formatWeatherPercent(entry.humidity as number | undefined)
        ]);
      });

      if (options.maxTableRows && forecast.length > options.maxTableRows) {
        sections.push(forecastTable.toString() + `\n${theme.dim(`... and ${forecast.length - options.maxTableRows} more days`)}`);
      } else {
        sections.push(forecastTable.toString());
      }
    }

    if (sections.length === 0) {
      return this.formatObjectContent(rawData, options);
    }

    return sections.join('\n\n');
  }

  private formatWeatherTemperature(value: number | undefined, units: string): string {
    if (value === undefined || Number.isNaN(value)) return theme.dim('—');
    const rounded = Math.round(value);
    switch (units) {
      case 'imperial':
        return `${rounded}°F`;
      case 'kelvin':
        return `${rounded}K`;
      default:
        return `${rounded}°C`;
    }
  }

  private formatWeatherWind(speed: number | undefined, direction: number | undefined, units: string): string {
    if (speed === undefined || Number.isNaN(speed)) return theme.dim('—');
    const unit = this.getWindUnit(units);
    const formattedSpeed = speed < 10 ? speed.toFixed(1) : Math.round(speed).toString();
    const cardinal = direction !== undefined ? ` ${this.getWindDirection(direction)}` : '';
    return `${formattedSpeed} ${unit}${cardinal}`;
  }

  private formatWeatherPercent(value: number | undefined): string {
    if (value === undefined || Number.isNaN(value)) return theme.dim('—');
    return `${Math.round(value)}%`;
  }

  private formatWeatherPressure(value: number | undefined): string {
    if (value === undefined || Number.isNaN(value)) return theme.dim('—');
    return `${value} hPa`;
  }

  private formatWeatherVisibility(value: number | undefined, units: string): string {
    if (value === undefined || Number.isNaN(value)) return theme.dim('—');
    if (units === 'imperial') {
      const miles = value * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${value.toFixed(1)} km`;
  }

  private describeWeatherUnits(units: string): string {
    switch (units) {
      case 'imperial':
        return 'Imperial (°F, mph)';
      case 'kelvin':
        return 'Kelvin (K, m/s)';
      default:
        return 'Metric (°C, m/s)';
    }
  }

  private getWindUnit(units: string): string {
    return units === 'imperial' ? 'mph' : 'm/s';
  }

  private getWindDirection(degrees: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    if (!Number.isFinite(degrees)) return '';
    const index = Math.round(degrees / 22.5) % dirs.length;
    return dirs[index];
  }

  private labelForecastDay(date: string | undefined, index: number): string {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    return date || `Day ${index + 1}`;
  }

  private formatStringContent(content: string): string {
    if (/^https?:\/\//.test(content)) return terminalLink(content, content);
    if (/^(?:[\/~]|[A-Z]:\\)/.test(content)) return theme.ok(content);
    
    // For multi-line content, just return as-is without extra indentation
    // The boxen container will handle the formatting
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

// Create a singleton instance for use throughout the codebase
export const toolDisplay = new EnhancedToolDisplay();
export type toolDisplay = typeof EnhancedToolDisplay;

// Example usage:
// const execId = toolDisplay.startToolExecution('list_directory', { path: './' });
// ... run the tool ...
// toolDisplay.completeToolExecution(execId, toolResult, 'success');
//
// Or for simple one-off calls:
// toolDisplay.displayCall({ role: 'tool', content: 'File list here', toolName: 'list_directory' });
//
// The result object can be a ToolResult or any JSON-serializable data
//
// ToolResult example:
// {
//   success: true,
//   data: [...], // array of file info objects
//   message: 'Listed 10 files in ./',
//   error: null
// }

// Note: This file depends on 'boxen', 'cli-highlight', 'terminal-link', 'cli-truncate', and a custom BibbleTable class for table rendering.
// Make sure to install these packages in your project.
