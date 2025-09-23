# ⚡️ Terminal Glam Pack

## Install buffet

```bash
npm i chalk ora cli-table3 boxen log-symbols figures \
marked marked-terminal wrap-ansi cli-truncate supports-color \
supports-hyperlinks terminal-link gradient-string figlet cli-progress
```

> Small, composable libs you can sprinkle into existing code. No framework migration.

---

## 1) Colors & Themes (centerpiece)

**Best-in-class:** `chalk`

* Styles, 256/TrueColor, zero deps (v5+), ESM-friendly.

**Helpers:**

* `figures` (nice unicode glyphs ✓ → fallback on Windows),
* `wrap-ansi` / `cli-truncate` (wrap/truncate *with* ANSI safely),
* `supports-color` (respect `NO_COLOR`),
* `gradient-string` (headline/rainbow text—use sparingly).

### drop-in theme module

Create `src/ui/theme.ts` (or whatever path you use):

```ts
// src/ui/theme.ts
import chalk from 'chalk';
import supportsColor from 'supports-color';

const on = Boolean(supportsColor.stdout); // respect NO_COLOR/TTY
const c = new chalk.Instance({ level: on ? 3 : 0 }); // 3 = TrueColor

export const theme = {
  brand:  c.hex('#FF5FD1'),
  accent: c.hex('#7AE7FF'),
  ok:     c.green,
  warn:   c.yellow,
  err:    c.red,
  dim:    c.gray,
  code:   c.cyan,
  heading:(s: string) => c.bold.underline(s),
};

export const paint = {
  label: (k: string, v: string) => `${theme.dim(k)} ${v}`,
  key:   (k: string) => theme.accent.bold(k),
};
```

Use it everywhere instead of raw `chalk` calls so you can swap palettes later.

---

## 2) Headers, Banners, Callouts

**Banners:** `figlet` (big ASCII text) + `gradient-string` (optional)
**Boxes:** `boxen` (padding, margins, borders)

```ts
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { theme } from './theme';

export function splash(title = 'BIBBLE AGENT') {
  const banner = figlet.textSync(title, { font: 'Slant' });
  const pretty = gradient.pastel.multiline(banner);
  return boxen(pretty, { padding: 1, margin: 1, borderStyle: 'round' });
}
```

Call once on startup:

```ts
console.log(splash('CHAOSPHERE'));
```

---

## 3) Spinners, statuses, and logs

**Spinners:** `ora`
**Symbols:** `log-symbols` (✓ ✖ ⚠ ℹ)

```ts
// src/ui/status.ts
import ora from 'ora';
import symbols from 'log-symbols';
import { theme } from './theme';

export const withSpinner = async <T>(
  text: string,
  task: () => Promise<T>
) => {
  const s = ora(theme.dim(text)).start();
  try {
    const res = await task();
    s.stop();
    console.log(symbols.success, theme.ok('Done'), theme.dim(`– ${text}`));
    return res;
  } catch (err: any) {
    s.stop();
    console.error(symbols.error, theme.err(`Failed: ${err.message || err}`));
    throw err;
  }
};
```

Usage:

```ts
await withSpinner('Connecting to MCP servers', connectMcp);
```

---

## 4) Tables & pretty lists

**Tables:** `cli-table3` (unicode borders, spans, colors)

```ts
import Table from 'cli-table3';
import { theme } from './theme';

export function table(rows: Array<Record<string, any>>) {
  if (!rows.length) return theme.dim('No data.');
  const head = Object.keys(rows[0]);
  const t = new Table({ head: head.map(h => theme.heading(h)) });
  rows.forEach(r => t.push(head.map(h => String(r[h] ?? ''))));
  return t.toString();
}

// usage
console.log(table([
  { Tool: 'web-scout', Status: 'ready', Calls: 12 },
  { Tool: 'taskflow',  Status: 'ready', Calls: 5  },
]));
```

**Lists:** sometimes a clean list beats a table:

```ts
import { theme, paint } from './theme';
import figures from 'figures';

export function kvList(obj: Record<string,string|number>) {
  return Object.entries(obj)
    .map(([k,v]) => `${figures.pointer} ${paint.label(k+':', String(v))}`)
    .join('\n');
}
```

---

## 5) Markdown to terminal (help screens, model notes)

**Renderer:** `marked` + `marked-terminal`

* Renders headings, bold/italic, code blocks, tables → ANSI

```ts
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

marked.setOptions({
  renderer: new TerminalRenderer({ reflowText: true })
});

export const printMd = (md: string) => console.log(marked(md));

// usage
printMd(`# Agent Help
- **/help** show commands
- \`/reset\` start a new run

| Key | Action |
| --- | ------ |
| Enter | send |
| Ctrl+C | quit |`);
```

---

## 6) Progress bars (long jobs, downloads)

**Bars:** `cli-progress`

```ts
import cliProgress from 'cli-progress';

export async function withProgress<T>(
  total: number,
  unit: string,
  work: (tick: (n?: number)=>void) => Promise<T>
) {
  const bar = new cliProgress.SingleBar({
    format: ` ${unit} {bar} {value}/{total} | ETA: {eta_formatted}`,
    hideCursor: true
  }, cliProgress.Presets.shades_classic);

  bar.start(total, 0);
  const res = await work((n=1)=>bar.increment(n));
  bar.stop();
  return res;
}

// usage: stream tokens, iterate files, etc.
```

---

## 7) Links & terminals that support them

**Detect & print hyperlinks:** `supports-hyperlinks` + `terminal-link`

```ts
import supportsHyperlinks from 'supports-hyperlinks';
import terminalLink from 'terminal-link';

export function link(label: string, url: string) {
  return supportsHyperlinks.stdout ? terminalLink(label, url) : `${label} <${url}>`;
}
```

---

## 8) Wrapping, truncation, width awareness

Don’t let ANSI styles break wrapping.

* Wrap: `wrap-ansi(str, width)`
* Truncate: `cli-truncate(str, width)`
* Width: `process.stdout.columns || 80`

```ts
import wrapAnsi from 'wrap-ansi';
const out = wrapAnsi(longStyledString, process.stdout.columns ?? 80, { trim: true });
console.log(out);
```

---

## 9) Two ready-made palettes (swap anytime)

```ts
// swap these into theme.ts when you wanna change the vibe
export const neon = { brand:'#FF5FD1', accent:'#7AE7FF', ok:'#00FF9C', warn:'#FFD166', err:'#FF4D4D' };
export const dusk = { brand:'#C792EA', accent:'#82AAFF', ok:'#AEEA00', warn:'#FFCB6B', err:'#EF5350' };
```

Pro tip: expose a `--theme neon|dusk` flag and load the palette at startup.

---

## 10) Polish checklist (ship it)

* **Respect NO\_COLOR** and non-TTY: disable spinners/bars when `!process.stdout.isTTY`.
* **Windows fallbacks:** use `figures` for symbols; avoid heavy Unicode borders if needed.
* **Consistent margins:** pick a standard `boxen` margin/padding and stick to it.
* **One logger path:** route *all* status messages through your `status.ts` helpers.
* **Sparingly use gradients/figlet:** tasteful, not circus. Banner once, then chill.
* **Lazy-load heavy bits** (figlet/fonts) if startup time matters.

---

## Minimal “before/after” glue

**Welcome screen**

```ts
console.log(splash('BIBBLE AGENT'));
console.log(kvList({ Model: 'Claude 3.7 Sonnet', MCP: 'connected', History: 'enabled' }));
```

**When calling a tool**

```ts
await withSpinner('Resolving web-scout.search', async () => {
  const res = await mcp.webScout.search({ q: 'site:nodejs.org streams' });
  console.log(table(res.items.slice(0,5).map(i => ({ Title: i.title, URL: i.url }))));
});
```

**On errors**

```ts
console.error(symbols.error, theme.err('Tool call failed.'));
```

**Markdown help**

```ts
printMd(`# Commands
- **/clear**: wipe screen
- **/save**: persist chat
- **/reset**: new conversation`);
```

---

## What to use when (cheat sheet)

| Task                 | Package(s)                             | Why                                                |
| -------------------- | -------------------------------------- | -------------------------------------------------- |
| Global color theming | `chalk`                                | Reliable, TrueColor, easy to wrap in theme helpers |
| Headline banners     | `figlet`, `gradient-string`, `boxen`   | Big entrance, boxed title                          |
| Live feedback        | `ora`, `log-symbols`                   | Spinner + ✓/✖ statuses                             |
| Data display         | `cli-table3`                           | Clean unicode tables with headers                  |
| Markdown help        | `marked`, `marked-terminal`            | Render README-style docs in terminal               |
| Long operations      | `cli-progress`                         | Progress bar with ETA                              |
| Pretty bullets/icons | `figures`, `log-symbols`               | Cross-platform glyphs                              |
| Safe wrapping        | `wrap-ansi`, `cli-truncate`            | No broken ANSI, fits terminal width                |
| Clickable links      | `supports-hyperlinks`, `terminal-link` | Clickable URLs where supported                     |

---
