# ⚡ Process Management Tools

*Complete recreation of Desktop Commander's terminal and process management*

---

## 🎯 Overview

Desktop Commander provides comprehensive process management including starting processes, interactive communication, session management, and process monitoring. These tools support long-running commands, background execution, and intelligent process state detection.

## 📋 Core Types and Interfaces

```typescript
// src/desktop-commander/types/process.ts
export interface ProcessInfo {
  pid: number;
  command: string;
  cpu: string;
  memory: string;
  status?: string;
}

export interface TerminalSession {
  pid: number;
  process: ChildProcess;
  lastOutput: string;
  isBlocked: boolean;
  startTime: Date;
  command: string;
  shell: string;
}

export interface ProcessResult {
  pid: number;
  output: string;
  isBlocked: boolean;
  exitCode?: number;
  startTime: Date;
  runtime: number;
}

export interface ProcessOutput {
  output: string;
  isComplete: boolean;
  exitCode?: number;
  error?: string;
}

export interface StartProcessOptions {
  shell?: string;
  timeoutMs?: number;
  workingDirectory?: string;
  env?: Record<string, string>;
}

export interface InteractOptions {
  timeoutMs?: number;
  expectPrompt?: boolean;
}
```

## 🔧 Process Manager Implementation

```typescript
// src/desktop-commander/utilities/process-manager.ts
import { ChildProcess, spawn } from 'child_process';
import { TerminalSession, ProcessResult } from '../types/process.js';
import { configManager } from '../config/config-manager.js';
import { validateCommand } from './validation.js';
import { logger } from './logger.js';
import { getDefaultShell } from './system-info.js';

export class ProcessManager {
  private sessions = new Map<number, TerminalSession>();
  private nextPid = 1;

  /**
   * Start a new process with intelligent readiness detection
   */
  async startProcess(
    command: string, 
    options: StartProcessOptions = {}
  ): Promise<ProcessResult> {
    const { shell, timeoutMs = 30000, workingDirectory, env } = options;
    
    // Validate command for security
    await validateCommand(command);
    
    // Get shell to use
    const config = await configManager.getConfig();
    const actualShell = shell || config.data?.defaultShell || getDefaultShell();
    
    // Prepare spawn options
    const spawnOptions: any = {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: actualShell,
      cwd: workingDirectory || process.cwd(),
      env: { ...process.env, ...env || {}) }
    };
    
    // Start the process
    const childProcess = spawn(command, [], spawnOptions);
    const pid = this.nextPid++;
    
    // Create session
    const session: TerminalSession = {
      pid,
      process: childProcess,
      lastOutput: '',
      isBlocked: true, // Initially blocked until we determine readiness
      startTime: new Date(),
      command,
      shell: actualShell
    };
    
    this.sessions.set(pid, session);
    
    // Set up output collection
    let output = '';
    let errorOutput = '';
    
    childProcess.stdout?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      session.lastOutput += chunk;
      this.detectReadiness(session);
    });
    
    childProcess.stderr?.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      session.lastOutput += chunk;
    });
    
    // Handle process completion
    let exitCode: number | undefined;
    const processPromise = new Promise<void>((resolve) => {
      childProcess.on('close', (code) => {
        exitCode = code || 0;
        this.sessions.delete(pid);
        resolve();
      });
    });
    
    // Wait for initial output or timeout
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (output || errorOutput || exitCode !== undefined) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const runtime = Date.now() - startTime;
    const fullOutput = output + (errorOutput ? '\nSTDERR:\n' + errorOutput : '');
    
    await logger.info('Process started', {
      pid,
      command: command.substring(0, 100),
      shell: actualShell,
      runtime
    });
    
    return {
      pid,
      output: fullOutput,
      isBlocked: session.isBlocked,
      exitCode,
      startTime: session.startTime,
      runtime
    };
  }
  
  /**
   * Detect if a process is ready for input
   */
  private detectReadiness(session: TerminalSession): void {
    const output = session.lastOutput.toLowerCase();
    
    // Common prompt patterns
    const promptPatterns = [
      /[$>#] $/, // Shell prompts
      />>> /, // Python REPL
      /> $/, // Node.js REPL
      /\(.*\) /, // Virtual environment prompts
      /password:/i,
      /enter/i,
      /continue/i,
      /press.*key/i
    ];
    
    // Process completion indicators
    const completionPatterns = [
      /completed/i,
      /finished/i,
      /done/i,
      /error/i,
      /failed/i
    ];
    
    // Check for readiness indicators
    const isReady = promptPatterns.some(pattern => pattern.test(output)) ||
                    completionPatterns.some(pattern => pattern.test(output));
    
    if (isReady && session.isBlocked) {
      session.isBlocked = false;
    }
  }
  
  /**
   * Send input to a running process
   */
  async interactWithProcess(
    pid: number, 
    input: string, 
    options: InteractOptions = {}
  ): Promise<ProcessOutput> {
    const { timeoutMs = 30000, expectPrompt = true } = options;
    
    const session = this.sessions.get(pid);
    if (!session) {
      throw new Error(`No active session with PID ${pid}`);
    }
    
    if (!session.process.stdin) {
      throw new Error(`Process ${pid} does not accept input`);
    }
    
    // Clear previous output
    const previousOutput = session.lastOutput;
    session.lastOutput = '';
    
    // Send input
    session.process.stdin.write(input + '\n');
    
    // Wait for response
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (session.lastOutput || !session.process.pid) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Check if process completed
    const isComplete = !session.process.pid;
    const output = session.lastOutput || 'No output received';
    
    return {
      output,
      isComplete,
      exitCode: isComplete ? session.process.exitCode || undefined : undefined
    };
  }
  
  /**
   * Read new output from a process
   */
  async readProcessOutput(pid: number, timeoutMs: number = 5000): Promise<ProcessOutput> {
    const session = this.sessions.get(pid);
    if (!session) {
      throw new Error(`No active session with PID ${pid}`);
    }
    
    const previousOutput = session.lastOutput;
    session.lastOutput = '';
    
    // Wait for new output or timeout
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (session.lastOutput || !session.process.pid) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const output = session.lastOutput || 'No new output';
    const isComplete = !session.process.pid;
    
    return {
      output,
      isComplete,
      exitCode: isComplete ? session.process.exitCode || undefined : undefined
    };
  }
  
  /**
   * Force terminate a process
   */
  async forceTerminate(pid: number): Promise<boolean> {
    const session = this.sessions.get(pid);
    if (!session) {
      return false;
    }
    
    try {
      session.process.kill('SIGTERM');
      
      // Wait a moment, then force kill if needed
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (session.process.pid) {
        session.process.kill('SIGKILL');
      }
      
      this.sessions.delete(pid);
      await logger.info('Process terminated', { pid });
      return true;
    } catch (error) {
      await logger.error('Force terminate failed', { pid, error });
      return false;
    }
  }
  
  /**
   * List all active sessions
   */
  getActiveSessions(): Array<{
    pid: number;
    command: string;
    isBlocked: boolean;
    runtime: number;
    shell: string;
  }> {
    const result = [];
    const now = Date.now();
    
    for (const [pid, session] of this.sessions) {
      result.push({
        pid,
        command: session.command,
        isBlocked: session.isBlocked,
        runtime: now - session.startTime.getTime(),
        shell: session.shell
      });
    }
    
    return result;
  }
  
  /**
   * Get system process list
   */
  async getSystemProcesses(): Promise<ProcessInfo[]> {
    try {
      let command: string;
      let parseFunction: (output: string) => ProcessInfo[];
      
      if (process.platform === 'win32') {
        command = 'tasklist /fo csv';
        parseFunction = this.parseWindowsProcesses;
      } else {
        command = 'ps aux';
        parseFunction = this.parseUnixProcesses;
      }
      
      const { spawn } = await import('child_process');
      const child = spawn(command, [], { shell: true });
      
      let output = '';
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error(`Process list command failed with code ${code}`));
        });
      });
      
      return parseFunction(output);
      
    } catch (error) {
      await logger.error('Get system processes failed', { error });
      return [];
    }
  }
  
  private parseWindowsProcesses(output: string): ProcessInfo[] {
    const lines = output.trim().split('\n');
    const processes: ProcessInfo[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(part => part.replace(/"/g, ''));
      if (parts.length >= 5) {
        processes.push({
          pid: parseInt(parts[1]) || 0,
          command: parts[0] || 'Unknown',
          cpu: 'N/A',
          memory: parts[4] || 'N/A'
        });
      }
    }
    
    return processes;
  }
  
  private parseUnixProcesses(output: string): ProcessInfo[] {
    const lines = output.trim().split('\n');
    const processes: ProcessInfo[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 11) {
        processes.push({
          pid: parseInt(parts[1]) || 0,
          command: parts.slice(10).join(' '),
          cpu: parts[2] || 'N/A',
          memory: parts[3] || 'N/A'
        });
      }
    }
    
    return processes;
  }
  
  /**
   * Kill a system process by PID
   */
  async killProcess(pid: number): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        const { spawn } = await import('child_process');
        const child = spawn('taskkill', ['/PID', pid.toString(), '/F']);
        
        return new Promise((resolve) => {
          child.on('close', (code) => {
            resolve(code === 0);
          });
        });
      } else {
        process.kill(pid, 'SIGTERM');
        
        // Wait and force kill if needed
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          process.kill(pid, 'SIGKILL');
        } catch {
          // Process may have already died
        }
        
        return true;
      }
    } catch (error) {
      await logger.error('Kill process failed', { pid, error });
      return false;
    }
  }
}

// Export singleton instance
export const processManager = new ProcessManager();
```
## 🔧 Process Tool Functions

```typescript
// src/desktop-commander/tools/process.ts
import { processManager } from '../utilities/process-manager.js';
import { OperationResult } from '../types/filesystem.js';
import { ProcessResult, ProcessOutput, ProcessInfo, StartProcessOptions, InteractOptions } from '../types/process.js';
import { logger } from '../utilities/logger.js';

/**
 * Start a new terminal process
 * Equivalent to Desktop Commander's start_process tool
 */
export async function startProcess(
  command: string,
  timeoutMs: number = 30000,
  options: Omit<StartProcessOptions, 'timeoutMs'> = {}
): Promise<OperationResult<ProcessResult>> {
  try {
    const result = await processManager.startProcess(command, {
      ...options,
      timeoutMs
    });
    
    return { success: true, data: result };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Start process failed', { command, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Send input to a running process
 * Equivalent to Desktop Commander's interact_with_process tool
 */
export async function interactWithProcess(
  pid: number,
  input: string,
  options: InteractOptions = {}
): Promise<OperationResult<ProcessOutput>> {
  try {
    const result = await processManager.interactWithProcess(pid, input, options);
    
    return { success: true, data: result };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Interact with process failed', { pid, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Read new output from a running process
 * Equivalent to Desktop Commander's read_process_output tool
 */
export async function readProcessOutput(
  pid: number,
  timeoutMs: number = 5000
): Promise<OperationResult<ProcessOutput>> {
  try {
    const result = await processManager.readProcessOutput(pid, timeoutMs);
    
    return { success: true, data: result };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Read process output failed', { pid, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Force terminate a running process
 * Equivalent to Desktop Commander's force_terminate tool
 */
export async function forceTerminate(pid: number): Promise<OperationResult<boolean>> {
  try {
    const result = await processManager.forceTerminate(pid);
    
    return { 
      success: true, 
      data: result,
      warning: result ? undefined : 'Process may not have been terminated'
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Force terminate failed', { pid, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * List all active terminal sessions
 * Equivalent to Desktop Commander's list_sessions tool
 */
export async function listSessions(): Promise<OperationResult<Array<{
  pid: number;
  command: string;
  isBlocked: boolean;
  runtime: number;
  shell: string;
}>>> {
  try {
    const sessions = processManager.getActiveSessions();
    
    return { success: true, data: sessions };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('List sessions failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * List all running system processes
 * Equivalent to Desktop Commander's list_processes tool
 */
export async function listProcesses(): Promise<OperationResult<ProcessInfo[]>> {
  try {
    const processes = await processManager.getSystemProcesses();
    
    return { success: true, data: processes };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('List processes failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Kill a system process by PID
 * Equivalent to Desktop Commander's kill_process tool
 */
export async function killProcess(pid: number): Promise<OperationResult<boolean>> {
  try {
    const result = await processManager.killProcess(pid);
    
    return { 
      success: true, 
      data: result,
      warning: result ? undefined : 'Process may not have been killed'
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Kill process failed', { pid, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Execute a simple command and return output (non-interactive)
 * This is a helper function for simple command execution
 */
export async function executeCommand(
  command: string,
  options: StartProcessOptions & { timeoutMs?: number } = {}
): Promise<OperationResult<string>> {
  try {
    const { timeoutMs = 30000, ...startOptions } = options;
    
    // Start the process
    const startResult = await startProcess(command, timeoutMs, startOptions);
    if (!startResult.success || !startResult.data) {
      return { success: false, error: startResult.error || 'Failed to start process' };
    }
    
    const { pid, output, isBlocked, exitCode } = startResult.data;
    
    // If process is blocked (still running), wait for completion
    if (isBlocked) {
      const readResult = await readProcessOutput(pid, timeoutMs);
      if (readResult.success && readResult.data) {
        const finalOutput = output + readResult.data.output;
        return { 
          success: true, 
          data: finalOutput,
          warning: readResult.data.exitCode !== 0 ? 'Command exited with non-zero code' : undefined
        };
      }
    }
    
    return { 
      success: true, 
      data: output,
      warning: exitCode !== 0 ? 'Command exited with non-zero code' : undefined
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Execute command failed', { command, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
```

## 💻 Usage Examples

### Basic Process Operations
```typescript
import { 
  startProcess, 
  interactWithProcess, 
  readProcessOutput,
  forceTerminate,
  executeCommand 
} from './desktop-commander/tools/process.js';

// Execute a simple command
const result = await executeCommand('ls -la');
if (result.success) {
  console.log('Directory listing:', result.data);
}

// Start an interactive process
const processResult = await startProcess('python3', 10000, {
  workingDirectory: '/path/to/project'
});

if (processResult.success && processResult.data) {
  const { pid } = processResult.data;
  
  // Send commands to Python REPL
  await interactWithProcess(pid, 'print("Hello World")');
  await interactWithProcess(pid, 'import os');
  await interactWithProcess(pid, 'print(os.getcwd())');
  
  // Read output
  const output = await readProcessOutput(pid);
  console.log('Python output:', output.data?.output);
  
  // Terminate when done
  await forceTerminate(pid);
}
```

### Advanced Process Management
```typescript
// Start a long-running development server
const serverResult = await startProcess('npm run dev', 60000, {
  workingDirectory: '/path/to/project',
  env: {
    NODE_ENV: 'development',
    PORT: '3000'
  }
});

if (serverResult.success && serverResult.data) {
  console.log('Server started with PID:', serverResult.data.pid);
  
  // Monitor server output periodically
  const monitorServer = async (pid: number) => {
    const output = await readProcessOutput(pid, 5000);
    if (output.success && output.data?.output) {
      console.log('Server log:', output.data.output);
      
      // Check for error patterns
      if (output.data.output.toLowerCase().includes('error')) {
        console.warn('Server error detected!');
      }
    }
    
    // Continue monitoring if process is still running
    if (output.success && !output.data?.isComplete) {
      setTimeout(() => monitorServer(pid), 10000); // Check every 10 seconds
    }
  };
  
  monitorServer(serverResult.data.pid);
}
```

### Interactive Shell Sessions
```typescript
// Create a persistent bash session
const bashResult = await startProcess('bash', 30000);

if (bashResult.success && bashResult.data) {
  const { pid } = bashResult.data;
  
  // Execute multiple commands in sequence
  const commands = [
    'cd /tmp',
    'mkdir test_directory',
    'cd test_directory',
    'echo "Hello" > test.txt',
    'cat test.txt',
    'pwd'
  ];
  
  for (const command of commands) {
    console.log(`Executing: ${command}`);
    
    const interaction = await interactWithProcess(pid, command, {
      timeoutMs: 10000,
      expectPrompt: true
    });
    
    if (interaction.success && interaction.data) {
      console.log('Output:', interaction.data.output);
      
      if (interaction.data.isComplete) {
        console.log('Session ended unexpectedly');
        break;
      }
    }
  }
  
  // Clean up
  await forceTerminate(pid);
}
```

### Process Monitoring and Management
```typescript
import { listSessions, listProcesses, killProcess } from './desktop-commander/tools/process.js';

// Monitor active sessions
const sessions = await listSessions();
if (sessions.success && sessions.data) {
  console.log('Active sessions:');
  sessions.data.forEach(session => {
    console.log(`PID ${session.pid}: ${session.command} (${session.runtime}ms)`);
    console.log(`  Status: ${session.isBlocked ? 'blocked' : 'ready'}`);
    console.log(`  Shell: ${session.shell}`);
  });
}

// Get system process information
const processes = await listProcesses();
if (processes.success && processes.data) {
  // Find processes using high CPU
  const highCpuProcesses = processes.data
    .filter(proc => {
      const cpu = parseFloat(proc.cpu);
      return !isNaN(cpu) && cpu > 80;
    })
    .sort((a, b) => parseFloat(b.cpu) - parseFloat(a.cpu));
    
  console.log('High CPU processes:');
  highCpuProcesses.forEach(proc => {
    console.log(`PID ${proc.pid}: ${proc.command} (CPU: ${proc.cpu}%)`);
  });
}

// Kill processes by name pattern
async function killProcessesByName(namePattern: string) {
  const processes = await listProcesses();
  if (!processes.success || !processes.data) {
    return;
  }
  
  const matchingProcesses = processes.data.filter(proc => 
    proc.command.toLowerCase().includes(namePattern.toLowerCase())
  );
  
  for (const proc of matchingProcesses) {
    console.log(`Killing process: ${proc.command} (PID: ${proc.pid})`);
    const killResult = await killProcess(proc.pid);
    if (killResult.success) {
      console.log('Process killed successfully');
    } else {
      console.error('Failed to kill process:', killResult.error);
    }
  }
}

// Usage: Kill all node processes
// await killProcessesByName('node');
```

### Database and REPL Interactions
```typescript
// Connect to a database via command line
async function connectToDatabase() {
  const dbResult = await startProcess('mysql -u root -p', 30000);
  
  if (dbResult.success && dbResult.data) {
    const { pid } = dbResult.data;
    
    // Enter password (in real usage, get from secure source)
    await interactWithProcess(pid, 'your_password');
    
    // Execute SQL commands
    const commands = [
      'USE mydb;',
      'SHOW TABLES;',
      'SELECT COUNT(*) FROM users;',
      'SELECT * FROM users LIMIT 5;'
    ];
    
    for (const sql of commands) {
      const result = await interactWithProcess(pid, sql);
      if (result.success && result.data) {
        console.log(`SQL: ${sql}`);
        console.log('Result:', result.data.output);
      }
    }
    
    // Exit database
    await interactWithProcess(pid, 'exit;');
  }
}

// Python data analysis session
async function pythonAnalysis(scriptPath: string) {
  const pythonResult = await startProcess('python3', 30000);
  
  if (pythonResult.success && pythonResult.data) {
    const { pid } = pythonResult.data;
    
    const analysisCommands = [
      'import pandas as pd',
      'import numpy as np',
      `data = pd.read_csv("${scriptPath}")`,
      'print(data.head())',
      'print(data.describe())',
      'print(data.info())'
    ];
    
    for (const command of analysisCommands) {
      const result = await interactWithProcess(pid, command, {
        timeoutMs: 15000 // Longer timeout for data operations
      });
      
      if (result.success && result.data) {
        console.log(`Python: ${command}`);
        console.log('Output:', result.data.output);
      }
    }
    
    await forceTerminate(pid);
  }
}
```

---

**Next Step**: Continue to `05-SEARCH-TOOLS.md` for code and file search functionality.
