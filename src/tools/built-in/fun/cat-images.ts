/**
 * Random Cat Images Tool
 *
 * Fetches random cat images and renders them directly in the terminal
 * using Pixelpop. Pixelpop auto-detects terminal capabilities (Kitty/iTerm2
 * native, or ANSI fallback) and also supports animated GIF playback.
 * Failures are surfaced as errors so the user knows what went wrong.
 */

import { z } from 'zod';
import pixelPop from '@pinkpixel/pixelpop';
import { theme } from '../../../ui/theme.js';
import crypto from 'crypto';

// Tool schema
export const catImageSchema = z.object({
  count: z.number().min(1).max(5).optional().default(1).describe('Number of cat images to fetch (1-5)'),
  size: z.enum(['small', 'medium', 'large']).optional().default('medium').describe('Display size in terminal (maps to width)'),
  api: z.enum(['thecatapi', 'cataas', 'randomcat', 'auto']).optional().default('auto').describe('Choose a specific API or auto rotate for variety'),
  gifSeconds: z.number().min(1).max(120).optional().describe('If the image is a GIF, how many seconds to animate it')
});

export type CatImageParams = z.infer<typeof catImageSchema>;

/**
 * Cat image API response interfaces
 */
interface RandomCatResponse { file: string }
interface CatApiResponse { url: string }
interface TheCatApiResponse { id: string; url: string; width: number; height: number }

/**
 * Available cat APIs with fallback support
 */
type CatApiDef<T> = {
  key: 'randomcat' | 'thecatapi' | 'cataas';
  name: string;
  url: string;
  extractUrl: (data: T) => string | undefined;
  headers?: () => Record<string,string>;
};

const CAT_APIS: CatApiDef<any>[] = [
  {
    key: 'randomcat',
    name: 'Random Cat',
    url: 'https://aws.random.cat/meow',
    extractUrl: (data: RandomCatResponse) => data.file
  },
  {
    key: 'thecatapi',
    name: 'The Cat API',
    url: 'https://api.thecatapi.com/v1/images/search',
    extractUrl: (data: TheCatApiResponse[]) => data[0]?.url,
    headers: () => {
      const apiKey = process.env.THE_CAT_API_KEY || process.env.CAT_API_KEY;
      if (apiKey) return { 'x-api-key': String(apiKey) };
      return {} as Record<string,string>;
    }
  },
  {
    key: 'cataas',
    name: 'Cats as a Service',
    url: 'https://cataas.com/cat?json',
    extractUrl: (data: CatApiResponse) => `https://cataas.com${data.url}`
  }
];

/**
 * Fetch cat image with multiple API fallbacks
 */
async function timedFetchJson(url: string, options: { timeoutMs?: number; headers?: Record<string,string> } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
  try {
    const response = await fetch(url, { headers: options.headers, signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCatImageUrl(preferred: 'thecatapi' | 'cataas' | 'randomcat' | 'auto'): Promise<{ url: string; apiName: string }>{
  const ordered = preferred === 'auto'
    ? shuffleArray([...CAT_APIS])
    : CAT_APIS.filter(a => a.key === preferred);
  const errors: string[] = [];
  for (const api of ordered) {
    try {
  const headers = api.headers ? api.headers() : {};
  const json: unknown = await timedFetchJson(api.url, { headers });
  const imageUrl = api.extractUrl(json as any);
      if (!imageUrl) throw new Error('No URL in response');
      return { url: imageUrl, apiName: api.name };
    } catch (e) {
      errors.push(`${api.name}: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }
  throw new Error(`All cat APIs failed -> ${errors.join('; ')}`);
}

function shuffleArray<T>(arr: T[]): T[] {
  // Fisher–Yates using crypto for better randomness
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fetch random cat images
 */
export async function getRandomCatImages(params: CatImageParams): Promise<string> {
  const { count, size, api, gifSeconds } = params;
  // Adaptive width by terminal capability
  const width = getAdaptiveWidth(size);
  let output = theme.heading('🐱 Random Cat Images') + '\n\n';

  for (let i = 0; i < count; i++) {
    const { url, apiName } = await fetchCatImageUrl(api);
    const fetched = await fetchImageBuffer(url);
    const isGif = /gif/i.test(fetched.contentType || '') || /\.gif($|\?)/i.test(url);
    let rendered = '';

    if (isGif) {
      // For GIFs, play an animation for a short duration using Pixelpop
      // Balanced default frame rate for broad compatibility
      const stop = await pixelPop.gifBuffer(new Uint8Array(fetched.buffer), {
        width,
        maximumFrameRate: 24,
        preserveAspectRatio: true,
      });
      // Show the animation for a few seconds so users actually see it
      const seconds = typeof gifSeconds === 'number' ? gifSeconds : 6;
      await delay(seconds * 1000);
      stop();
      rendered = theme.dim('(animated GIF played)');
    } else {
      // Static image rendering via Pixelpop with terminal-aware strategies
      rendered = await pixelPop.buffer(new Uint8Array(fetched.buffer), {
        width,
        preserveAspectRatio: true,
      });
    }
    output += theme.subheading(`🐾 Cat ${i + 1}${count > 1 ? ` of ${count}` : ''}`) + '\n';
    if (rendered) output += rendered + '\n';
    output += theme.info(`🔗 ${url}`) + '\n';
    output += theme.secondary(`📦 Source: ${apiName}`) + '\n';
    if (i < count - 1) output += '\n' + theme.dim('─'.repeat(50)) + '\n\n';
  }

  output += '\n' + theme.dim('─'.repeat(50)) + '\n';
  output += theme.accent('🎉 Cat images fetched successfully!');
  output += '\n' + theme.info('Tip: Set THE_CAT_API_KEY for higher rate limits.');
  return output;
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; contentType?: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image fetch failed (${response.status})`);
  const contentType = response.headers.get('content-type') || undefined;
  const arrayBuf = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuf), contentType };
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function getAdaptiveWidth(size: 'small' | 'medium' | 'large' = 'medium'): `${number}%` {
  const env = process.env;
  const premium = (
    env.TERM_PROGRAM === 'iTerm.app' ||
    env.TERM === 'xterm-kitty' ||
    Boolean(env.KITTY_WINDOW_ID) ||
    env.TERM_PROGRAM === 'WezTerm' ||
    env.TERM_PROGRAM === 'konsole' ||
    Boolean(env.KONSOLE_VERSION)
  );

  if (premium) {
    if (size === 'small') return '85%';
    if (size === 'large') return '100%';
    return '90%';
  }
  // ANSI fallback environments
  if (size === 'small') return '60%';
  if (size === 'large') return '70%';
  return '65%';
}

/**
 * Tool definition for the built-in tool registry
 */
export const catImagesTool = {
  name: 'random-cat-images',
  description: '🐱 Fetch and display random cat images in your terminal using Pixelpop (with GIF animation support).',
  category: 'fun' as const,
  parameters: catImageSchema,
  execute: async (params: CatImageParams) => {
    const result = await getRandomCatImages(params);
    return {
      success: true,
      data: result,
      message: `Fetched ${params.count} random cat image${params.count > 1 ? 's' : ''}`
    };
  },
};
