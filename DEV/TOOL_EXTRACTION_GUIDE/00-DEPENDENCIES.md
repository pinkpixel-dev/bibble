# 📦 Dependencies and Setup

*Required packages and initial setup for Desktop Commander tools*

---

## 🎯 Required npm Packages

These are the core dependencies extracted from Desktop Commander's package.json:

### Essential Dependencies
```json
{
  "dependencies": {
    "@vscode/ripgrep": "^1.15.9",           // Fast code search
    "cross-fetch": "^4.1.0",                // HTTP requests for URL reading
    "fastest-levenshtein": "^1.0.16",       // Fuzzy text matching for edit_block
    "glob": "^10.3.10",                     // File pattern matching
    "isbinaryfile": "^5.0.4",              // Binary file detection
    "zod": "^3.24.1",                      // Runtime validation
    "zod-to-json-schema": "^3.23.5"        // Schema conversion (optional)
  },
  "devDependencies": {
    "@types/node": "^20.17.24",            // Node.js types
    "typescript": "^5.3.3"                 // TypeScript compiler
  }
}
```

### Installation Command
```bash
npm install @vscode/ripgrep cross-fetch fastest-levenshtein glob isbinaryfile zod
npm install -D @types/node typescript
```

### Optional Dependencies (by feature)
```json
{
  // If you want schema validation UI
  "zod-to-json-schema": "^3.23.5",
  
  // If you want better shell detection
  "which": "^4.0.0",
  
  // If you want enhanced logging
  "winston": "^3.11.0"
}
```

## 🛠️ TypeScript Configuration

Your `tsconfig.json` should include these settings for compatibility:

```json
{
  "compilerOptions": {
    "target": "ES2020",                    // Modern JavaScript features
    "module": "Node16",                   // Node.js ES modules
    "moduleResolution": "node16",         // Module resolution strategy
    "esModuleInterop": true,              // CommonJS/ES module interop
    "strict": true,                       // Strict type checking
    "skipLibCheck": true,                 // Skip .d.ts file checking
    "types": ["node"],                   // Include Node.js types
    "resolveJsonModule": true,            // Import JSON files
    "allowSyntheticDefaultImports": true  // Better import handling
  },
  "include": [
    "src/**/*.ts"
  ]
}
```
## 📁 Project Structure Recommendation

Create this structure in your project for the Desktop Commander tools:

```
your-project/
├── src/
│   ├── desktop-commander/
│   │   ├── config/
│   │   │   ├── config-manager.ts        # Configuration management
│   │   │   ├── types.ts                 # Configuration interfaces
│   │   │   └── defaults.ts              # Default configuration
│   │   ├── tools/
│   │   │   ├── filesystem.ts            # File operations
│   │   │   ├── process.ts               # Process management
│   │   │   ├── search.ts                # Search functionality
│   │   │   ├── edit.ts                  # Text editing
│   │   │   └── analytics.ts             # Usage tracking
│   │   ├── utilities/
│   │   │   ├── logger.ts                # Logging utilities
│   │   │   ├── system-info.ts           # OS detection
│   │   │   ├── fuzzy-search.ts          # Fuzzy matching
│   │   │   ├── timeout.ts               # Timeout wrapper
│   │   │   └── validation.ts            # Path validation
│   │   ├── types/
│   │   │   ├── common.ts                # Shared interfaces
│   │   │   ├── filesystem.ts            # File operation types
│   │   │   ├── process.ts               # Process types
│   │   │   └── search.ts                # Search types
│   │   └── index.ts                     # Main export file
│   └── your-existing-code/
└── ...
```

## 🔧 Environment Setup

### Node.js Version Requirement
```json
{
  "engines": {
    "node": ">=18.0.0"   // Required for Desktop Commander compatibility
  }
}
```

### Environment Variables (Optional)
Create a `.env` file if you want configurable defaults:

```bash
# Desktop Commander Configuration
DC_DEFAULT_SHELL=/bin/bash
DC_FILE_READ_LIMIT=1000
DC_FILE_WRITE_LIMIT=50
DC_LOG_LEVEL=info
DC_TELEMETRY_ENABLED=false

# Optional: Custom paths
DC_CONFIG_PATH=./config/desktop-commander.json
DC_LOG_PATH=./logs/desktop-commander.log
```

### Package.json Scripts
Add these scripts for development:

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test:dc": "npm run build && node dist/test-desktop-commander.js",
    "lint": "eslint src/desktop-commander/**/*.ts"
  }
}
```

---

**Next Step**: Continue to `01-CONFIGURATION.md` to set up the configuration system.
