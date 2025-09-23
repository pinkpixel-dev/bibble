## 🔧 Edit Tool Function
```typescript
// src/desktop-commander/tools/edit.ts
import { OperationResult } from '../types/filesystem.js';
import { EditBlockArgs, EditBlockResult } from '../types/edit.js';
import { validatePath } from '../utilities/validation.js';
import { editEngine } from '../utilities/edit-engine.js';
import { logger } from '../utilities/logger.js';

/**
 * Apply surgical text replacement to a file (exact match preferred, fuzzy fallback)
 * Equivalent to Desktop Commander's edit_block tool
 */
export async function editBlock(args: EditBlockArgs): Promise<OperationResult<EditBlockResult>> {
  try {
    const validPath = await validatePath(args.filePath);
    const expected = args.expectedReplacements ?? 1;

    const result = await editEngine.editFileBlock(
      validPath,
      args.oldString,
      args.newString,
      expected
    );

    // Guidance when zero replacements
    if (result.replacements === 0) {
      return {
        success: false,
        error: 'No matching text found. Consider providing 1-3 lines of exact context around the target region to improve matching.'
      };
    }

    // Log and return
    await logger.info('Edit block completed', {
      path: args.filePath,
      replacements: result.replacements,
      exact: result.exactMatchUsed,
      similarity: result.similarity,
      ms: result.executionMs
    });

    return { success: true, data: result };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error('Edit block failed', { path: args.filePath, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
```

## 💻 Usage Examples
```typescript
import { editBlock } from './desktop-commander/tools/edit.js';

// Minimal exact replacement
await editBlock({
  filePath: '/path/app.ts',
  oldString: 'console.log("old");',
  newString: 'console.log("new");'
});

// Contextual match (1-3 lines recommended)
await editBlock({
  filePath: '/path/App.tsx',
  oldString: `return (
  <div>Old</div>
);`,
  newString: `return (
  <div>New</div>
);`
});

// Multiple occurrences
await editBlock({
  filePath: '/path/styles.css',
  oldString: 'color: #000;',
  newString: 'color: #111;',
  expectedReplacements: 5
});

// Works across CRLF/LF line endings
await editBlock({
  filePath: '/path/index.html',
  oldString: '<h1>Title</h1>
<p>Old paragraph</p>',
  newString: '<h1>Title</h1>
<p>New paragraph</p>'
});
```

## 🧪 Test Ideas
- Exact single replacement
- Multiple exact replacements
- Fuzzy fallback success with high similarity (> 0.8)
- Fuzzy fallback failure with low similarity
- CRLF/LF normalization correctness
- Performance on large files (> 1MB)
- Idempotency: running same edit twice makes 1st replacement, then 0

---

**Next Step**: Continue to `07-ANALYTICS-TOOLS.md` (usage tracking and feedback hooks), or jump to `08-INTEGRATION.md` to wire everything into your app.
