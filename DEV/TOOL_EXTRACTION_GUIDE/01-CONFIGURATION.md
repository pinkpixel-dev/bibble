# ⚙️ Configuration System

*Recreation of Desktop Commander's configuration management*

---

## 🎯 Configuration Overview

Desktop Commander uses a JSON-based configuration system that persists settings and provides runtime modification. Here's how to recreate it.

## 📋 Configuration Interface

### Core Configuration Type
```typescript
// src/desktop-commander/types/config.ts
export interface DesktopCommanderConfig {
  // Security settings
  blockedCommands?: string[];
  allowedDirectories?: string[];
  
  // Shell configuration  
  defaultShell?: string;
  
  // File operation limits
  fileReadLineLimit?: number;
  fileWriteLineLimit?: number;
  
  // Feature flags
  telemetryEnabled?: boolean;
  fuzzySearchEnabled?: boolean;
  
  // Analytics (optional)
  clientId?: string;
  currentClient?: ClientInfo;
  
  // Extensible for custom settings
  [key: string]: any;
}

export interface ClientInfo {
  name: string;
  version: string;
}

// Result types for configuration operations
export interface ConfigResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Default Configuration
```typescript
// src/desktop-commander/config/defaults.ts
import os from 'os';
import { DesktopCommanderConfig } from '../types/config.js';

export function getDefaultConfig(): DesktopCommanderConfig {
  return {
    // Security: Dangerous commands to block
    blockedCommands: [
      // Disk and partition management
      'mkfs', 'format', 'mount', 'umount', 'fdisk', 'dd', 'parted', 'diskpart',
      
      // System administration  
      'sudo', 'su', 'passwd', 'adduser', 'useradd', 'usermod', 'groupadd',
      'chsh', 'visudo',
      
      // System control
      'shutdown', 'reboot', 'halt', 'poweroff', 'init',
      
      // Network and security
      'iptables', 'firewall', 'netsh',
      
      // Windows system commands
      'sfc', 'bcdedit', 'reg', 'net', 'sc', 'runas', 'cipher', 'takeown'
    ],
    
    // Shell selection based on OS
    defaultShell: os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash',
    
    // File access (empty = allow all)
    allowedDirectories: [],
    
    // Performance limits
    fileReadLineLimit: 1000,   // Lines to read by default
    fileWriteLineLimit: 50,    // Lines to write before warning
    
    // Features
    telemetryEnabled: false,   // Respect privacy by default
    fuzzySearchEnabled: true,  // Enable fuzzy matching for edits
    
    // Generate unique client ID
    clientId: generateClientId(),
    currentClient: {
      name: 'standalone-app',
      version: '1.0.0'
    }
  };
}

function generateClientId(): string {
  return 'dc-' + Math.random().toString(36).substring(2, 15);
}
```
## 🏗️ Configuration Manager Implementation

### Main Configuration Manager Class
```typescript
// src/desktop-commander/config/config-manager.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { existsSync } from 'fs';
import { DesktopCommanderConfig, ConfigResult } from '../types/config.js';
import { getDefaultConfig } from './defaults.js';

export class ConfigManager {
  private configPath: string;
  private config: DesktopCommanderConfig = {};
  private initialized = false;

  constructor(configPath?: string) {
    // Allow custom config path, or use default
    this.configPath = configPath || this.getDefaultConfigPath();
  }

  /**
   * Get default config file location
   */
  private getDefaultConfigPath(): string {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.desktop-commander');
    return path.join(configDir, 'config.json');
  }

  /**
   * Initialize configuration system
   */
  async init(): Promise<ConfigResult> {
    if (this.initialized) {
      return { success: true, data: this.config };
    }

    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      if (!existsSync(configDir)) {
        await fs.mkdir(configDir, { recursive: true });
      }

      // Load existing config or create default
      try {
        await fs.access(this.configPath);
        const configData = await fs.readFile(this.configPath, 'utf8');
        this.config = { ...getDefaultConfig(), ...JSON.parse(configData) };
      } catch (error) {
        // Config doesn't exist, create with defaults
        this.config = getDefaultConfig();
        await this.saveConfig();
      }

      this.initialized = true;
      return { success: true, data: this.config };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Fall back to in-memory defaults
      this.config = getDefaultConfig();
      this.initialized = true;
      return { 
        success: false, 
        error: `Config init failed: ${errorMessage}`, 
        data: this.config 
      };
    }
  }

  /**
   * Get complete configuration
   */
  async getConfig(): Promise<ConfigResult<DesktopCommanderConfig>> {
    await this.init();
    return { success: true, data: { ...this.config } };
  }

  /**
   * Get specific configuration value
   */
  async getValue<T = any>(key: string): Promise<ConfigResult<T>> {
    await this.init();
    const value = this.config[key] as T;
    return { success: true, data: value };
  }

  /**
   * Set specific configuration value
   */
  async setValue(key: string, value: any): Promise<ConfigResult> {
    await this.init();
    
    try {
      this.config[key] = value;
      await this.saveConfig();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Failed to set ${key}: ${errorMessage}` };
    }
  }

  /**
   * Update multiple configuration values
   */
  async updateConfig(updates: Partial<DesktopCommanderConfig>): Promise<ConfigResult<DesktopCommanderConfig>> {
    await this.init();
    
    try {
      this.config = { ...this.config, ...updates };
      await this.saveConfig();
      return { success: true, data: { ...this.config } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Failed to update config: ${errorMessage}` };
    }
  }

  /**
   * Reset to default configuration
   */
  async resetConfig(): Promise<ConfigResult<DesktopCommanderConfig>> {
    try {
      this.config = getDefaultConfig();
      await this.saveConfig();
      return { success: true, data: { ...this.config } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Failed to reset config: ${errorMessage}` };
    }
  }

  /**
   * Save configuration to disk
   */
  private async saveConfig(): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
  }

  /**
   * Check if a command is blocked
   */
  async isCommandBlocked(command: string): Promise<boolean> {
    await this.init();
    const blockedCommands = this.config.blockedCommands || [];
    return blockedCommands.includes(command);
  }

  /**
   * Check if a directory is allowed
   */
  async isDirectoryAllowed(dirPath: string): Promise<boolean> {
    await this.init();
    const allowedDirectories = this.config.allowedDirectories || [];
    
    // Empty array means allow all
    if (allowedDirectories.length === 0) {
      return true;
    }
    
    // Check if path is within allowed directories
    const normalizedPath = path.resolve(dirPath);
    return allowedDirectories.some(allowedDir => {
      const normalizedAllowed = path.resolve(allowedDir);
      return normalizedPath.startsWith(normalizedAllowed);
    });
  }
}

// Export singleton instance
export const configManager = new ConfigManager();
```
## 🛠️ Configuration Tool Functions

### Standalone Configuration Functions
```typescript
// src/desktop-commander/tools/config.ts
import { configManager } from '../config/config-manager.js';
import { ConfigResult, DesktopCommanderConfig } from '../types/config.js';

/**
 * Get complete configuration
 * Equivalent to Desktop Commander's get_config tool
 */
export async function getConfig(): Promise<ConfigResult<DesktopCommanderConfig>> {
  try {
    const result = await configManager.getConfig();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to get config: ${errorMessage}` };
  }
}

/**
 * Set a specific configuration value
 * Equivalent to Desktop Commander's set_config_value tool
 */
export async function setConfigValue(key: string, value: any): Promise<ConfigResult> {
  try {
    const result = await configManager.setValue(key, value);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to set config value: ${errorMessage}` };
  }
}

/**
 * Get a specific configuration value
 */
export async function getConfigValue<T = any>(key: string): Promise<ConfigResult<T>> {
  try {
    const result = await configManager.getValue<T>(key);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to get config value: ${errorMessage}` };
  }
}

/**
 * Update multiple configuration values at once
 */
export async function updateConfig(updates: Partial<DesktopCommanderConfig>): Promise<ConfigResult<DesktopCommanderConfig>> {
  try {
    const result = await configManager.updateConfig(updates);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to update config: ${errorMessage}` };
  }
}

/**
 * Reset configuration to defaults
 */
export async function resetConfig(): Promise<ConfigResult<DesktopCommanderConfig>> {
  try {
    const result = await configManager.resetConfig();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to reset config: ${errorMessage}` };
  }
}
```

## 💻 Usage Examples

### Basic Configuration Usage
```typescript
import { getConfig, setConfigValue, updateConfig } from './desktop-commander/tools/config.js';

// Get all configuration
const config = await getConfig();
if (config.success) {
  console.log('Current config:', config.data);
}

// Set individual values
await setConfigValue('fileReadLineLimit', 2000);
await setConfigValue('defaultShell', '/bin/zsh');

// Update multiple values
await updateConfig({
  fileReadLineLimit: 5000,
  fileWriteLineLimit: 200,
  telemetryEnabled: false
});
```

### Integration with Your App
```typescript
// In your app initialization
import { configManager } from './desktop-commander/config/config-manager.js';

export class YourApp {
  async initialize() {
    // Initialize Desktop Commander config
    const result = await configManager.init();
    if (!result.success) {
      console.warn('Config init failed:', result.error);
    }
    
    // Your app initialization...
  }
  
  async configureDC(userPreferences: any) {
    // Allow users to configure DC behavior
    await configManager.updateConfig({
      fileReadLineLimit: userPreferences.readLimit || 1000,
      fileWriteLineLimit: userPreferences.writeLimit || 50,
      allowedDirectories: userPreferences.allowedPaths || []
    });
  }
}
```

### Environment-Based Configuration
```typescript
// Load config from environment variables
import { configManager } from './desktop-commander/config/config-manager.js';

export async function loadConfigFromEnv() {
  const envConfig: any = {};
  
  if (process.env.DC_FILE_READ_LIMIT) {
    envConfig.fileReadLineLimit = parseInt(process.env.DC_FILE_READ_LIMIT);
  }
  
  if (process.env.DC_FILE_WRITE_LIMIT) {
    envConfig.fileWriteLineLimit = parseInt(process.env.DC_FILE_WRITE_LIMIT);
  }
  
  if (process.env.DC_DEFAULT_SHELL) {
    envConfig.defaultShell = process.env.DC_DEFAULT_SHELL;
  }
  
  if (process.env.DC_ALLOWED_DIRS) {
    envConfig.allowedDirectories = process.env.DC_ALLOWED_DIRS.split(',');
  }
  
  if (Object.keys(envConfig).length > 0) {
    await configManager.updateConfig(envConfig);
  }
}
```

---

**Next Step**: Continue to `02-UTILITIES.md` to set up the shared utility functions.
