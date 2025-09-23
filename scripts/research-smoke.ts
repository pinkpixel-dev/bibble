import { research, type Engine, type SearchResult } from '../src/research/research-pipeline.js';
import { llm } from '../src/llm/adapter.js';
import { runMultiSearch } from '../src/tools/built-in/web/research/search-engine.js';

// Type-compatible wrapper for runMultiSearch
const searchProvider = async (query: string, args: {
  depth: number;
  engine?: Engine;
  engineOrder?: Engine[];
  lang?: string;
}): Promise<SearchResult[]> => {
  // Filter out meta-engines from engineOrder
  const validEngines = args.engineOrder?.filter((e): e is 'google' | 'bing' | 'brave' | 'ddg' => 
    e !== 'auto' && e !== 'custom'
  );
  
  return runMultiSearch(query, {
    ...args,
    engineOrder: validEngines
  });
};

async function main() {
  const result = await research('post-quantum migration timelines', llm, {
    depth: 8,
    engine: 'custom',
    engineOrder: ['google', 'bing', 'brave', 'ddg'],
    searchProvider,
    mode: 'summary',
    format: 'markdown',
    includeDomains: ['nist.gov', 'cisa.gov'],
    debug: true
  });

  console.log('Sources analyzed:', result.sourcesAnalyzed);
  console.log('First 600 chars of summary:\n');
  console.log(result.content.slice(0, 600));
  console.log('\nReferences:', result.references.map(ref => `${ref.id}. ${ref.title} (${ref.url})`).join('\n'));
}

main().catch(error => {
  console.error('Smoke test failed:', error);
  process.exit(1);
});
