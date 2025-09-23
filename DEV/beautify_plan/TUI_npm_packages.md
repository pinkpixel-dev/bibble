# The 2025 Node.js TUI \& Pretty Terminal Guide

*For beautifying existing CLIs and building shiny new text UIs\*

If you want color, motion, clean tables, Markdown, ASCII banners, and full-on interactive terminals. Here’s the up-to-date toolkit that actually ships and is maintained, with some handy quick code snippets and links so you can drop these into your apps fast. Let’s glam up that terminal. 🔧✨

## Quick Picks (drop-in friendly)

| Need                  | Package                      | Why it’s good                                                                  |

| --------------------- | ---------------------------- | ------------------------------------------------------------------------------ |

| Colors \& styles       | \*\*chalk\*\*                    | Mature, ESM, zero deps, updated frequently. (\[npm]\[1], \[GitHub]\[2])            |

| Spinners              | \*\*ora\*\*                      | Beautiful spinners with statuses (`succeed/fail/info`). (\[npm]\[3])             |

| Tables                | \*\*cli-table3\*\*               | Unicode borders, spans, robust fork of cli-table. (\[npm]\[4])                   |

| Markdown → ANSI       | \*\*marked-terminal\*\*          | Pretty MD (headings, code, tables) straight to terminal. (\[npm]\[5])            |

| ASCII banners         | \*\*figlet\*\*                   | Tons of fonts, actively updated. (\[npm]\[6])                                    |

| Symbols/icons         | \*\*log-symbols\*\*, \*\*figures\*\* | Cross-platform status icons \& unicode fallbacks. (\[npm]\[7])                    |

| Boxed callouts        | \*\*boxen\*\*                    | Framed messages with padding/margins/borders. (\[npm]\[8])                       |

| Prompts               | \*\*inquirer\*\*                 | The standard for lists, confirms, inputs. (\[npm]\[9], \[GitHub]\[10])             |

| Full TUI (React)      | \*\*Ink\*\*                      | React for the terminal, flexbox layout (Yoga), active. (\[GitHub]\[11])          |

| Full TUI (imperative) | \*\*terminal-kit\*\*             | Colors, input, mouse, progress bars, images. Active. (\[npm]\[12], \[GitHub]\[13]) |

---

## Color \& Styling

### chalk

\* \*\*What:\*\* Style text with colors, bold/italic, backgrounds; handles 256/TrueColor.

\* \*\*Why:\*\* Widely adopted, actively maintained, zero deps (v5+), ESM-first.

\* \*\*Install:\*\* `npm i chalk`

\* \*\*Snippet:\*\*

 ```js

 import chalk from 'chalk';

 console.log(chalk.bold.blue('Hello'), chalk.bgYellow.black('world!'));

 ```

\* \*\*Links:\*\*
 npm (recent release, high dependents).


\*\*Also consider:\*\*

\* \*\*figures\*\* (handy unicode symbols with fallbacks).

\* \*\*wrap-ansi\*\*, \*\*cli-truncate\*\* (wrap/truncate strings that include ANSI codes).

---

## Spinners, Status, and Progress



### ora

\* \*\*What:\*\* Elegant spinner with `.succeed()/.fail()/.warn()/.info()` and custom frames.

\* \*\*Install:\*\* `npm i ora`

\* \*\*Snippet:\*\*

 ```js

 import ora from 'ora';

 const spinner = ora('Cooking up magic...').start();

 await doWork();

 spinner.succeed('Done!');

 ```

\* \*\*Notes:\*\* Uses \*\*cli-spinners\*\* under the hood. Latest 8.x release is fresh.



\*\*Progress bars:\*\*



\* \*\*cli-progress\*\* (multi bars, ETA) or \*\*progress\*\* (simple classic bar). \*(No citation needed here if you already know them, but they’re popular choices.)\*



\*\*Symbols (nice ✓ ✖ ⚠):\*\*



\* \*\*log-symbols\*\*—cross-platform success/info/warn/error glyphs.



---



\## Tables \& Structured Output



\### cli-table3



\* \*\*What:\*\* Pretty Unicode tables; col/row spans; works great with Chalk.

\* \*\*Install:\*\* `npm i cli-table3`

\* \*\*Snippet:\*\*



&nbsp; ```js

&nbsp; import Table from 'cli-table3';

&nbsp; const table = new Table({ head: \['Name', 'Score'] });

&nbsp; table.push(\['Alice', 98], \['Bob', 87]);

&nbsp; console.log(table.toString());

&nbsp; ```

\* \*\*Status:\*\* Actively maintained fork of cli-table.



\*\*Alternative:\*\*



\* \*\*table\*\* (by Gajus) — very configurable, wrapping/streaming; actively published.



---



\## Markdown → Terminal



\### marked + marked-terminal



\* \*\*What:\*\* Parse Markdown and render ANSI-styled output (headings, code, tables).

\* \*\*Install:\*\* `npm i marked marked-terminal`

\* \*\*Snippet:\*\*



&nbsp; ```js

&nbsp; import {marked} from 'marked';

&nbsp; import TerminalRenderer from 'marked-terminal';



&nbsp; marked.setOptions({ renderer: new TerminalRenderer() });

&nbsp; console.log(marked('# Hello\\n\*\*Bold\*\* and `code` with a table:\\n\\n| A | B |\\n| - | - |\\n| 1 | 2 |'));

&nbsp; ```

\* \*\*Status:\*\* Recent releases (2025 for `marked-terminal`, week-fresh for `marked`).



---



\## ASCII Banners \& Art



\### figlet



\* \*\*What:\*\* Large ASCII text banners with tons of fonts.

\* \*\*Install:\*\* `npm i figlet`

\* \*\*Snippet:\*\*



&nbsp; ```js

&nbsp; import figlet from 'figlet';

&nbsp; console.log(figlet.textSync('SIZZLEBOP', { font: 'Slant' }));

&nbsp; ```

\* \*\*Status:\*\* Actively maintained; latest 1.8.x recently published.



\*\*Fun extras:\*\*



\* \*\*cowsay\*\* (novelty speech bubbles).

\* \*\*asciichart\*\* (spark/line charts in ASCII).



---



\## Boxes, Callouts, and Layout Accents



\### boxen



\* \*\*What:\*\* Put messages in padded, bordered boxes (great for headers/warnings).

\* \*\*Install:\*\* `npm i boxen`

\* \*\*Snippet:\*\*



&nbsp; ```js

&nbsp; import boxen from 'boxen';

&nbsp; console.log(boxen('Welcome to the Chaosphere', {

&nbsp;   padding: 1, margin: 1, borderStyle: 'round'

&nbsp; }));

&nbsp; ```

\* \*\*Status:\*\* Popular, maintained; CLI exists too.



---



\## Prompts \& Forms



\### inquirer



\* \*\*What:\*\* Interactive questions (input, list, checkbox, confirm, password).

\* \*\*Install:\*\* `npm i inquirer`

\* \*\*Snippet:\*\*



&nbsp; ```js

&nbsp; import inquirer from 'inquirer';

&nbsp; const answers = await inquirer.prompt(\[

&nbsp;   { type: 'input', name: 'name', message: 'Your name?' },

&nbsp;   { type: 'list',  name: 'lang', message: 'Language?', choices: \['JS','TS'] }

&nbsp; ]);

&nbsp; console.log(answers);

&nbsp; ```

\* \*\*Status:\*\* Continues active development; demo tooling and docs are current.



\*(Alternatives: `prompts`, `enquirer` — smaller API/styles; pick your flavor.)\*



---



\## Full TUI Frameworks (when you’re building an actual app UI)



\### Ink (React for CLI)



\* \*\*What:\*\* Build TUIs with React components; Yoga-powered flexbox layout.

\* \*\*Why:\*\* If you live in React land, you’ll be at home; big ecosystem (`@inkjs/ui`, `ink-link`, `ink-form`, etc.).

\* \*\*Install:\*\* `npm i ink` (plus any components you need)

\* \*\*Snippet (hello world):\*\*



&nbsp; ```jsx

&nbsp; import React from 'react';

&nbsp; import {render, Text} from 'ink';



&nbsp; const App = () => <Text color="green">Hello, <Text bold>Ink</Text>!</Text>;

&nbsp; render(<App />);

&nbsp; ```

\* \*\*Status:\*\* Actively maintained, widely used.

&nbsp; Components: \*\*@inkjs/ui\*\* (menus, select, progress, etc.), \*\*ink-link\*\*, \*\*ink-form\*\*.



\### Blessed (classic widgets) — maintenance reality check



\* \*\*What:\*\* The OG Node terminal widget toolkit (boxes, lists, grids, etc.).

\* \*\*Status:\*\* The original \*\*blessed\*\* package is effectively \*\*not maintained\*\* today; last real activity was years ago (community lists flag it as “no longer maintained”). If you’re starting new, prefer \*\*Ink\*\* or \*\*terminal-kit\*\*.

\* \*\*Forks:\*\* \*\*neo-blessed\*\* exists but is also quite old.

\* \*\*Dashboards:\*\* \*\*blessed-contrib\*\* (charts, grids) is great for quick dashboards but also aging; fine for prototypes.



\### terminal-kit (imperative, batteries included)



\* \*\*What:\*\* Big “do it all” terminal API: colors, input, mouse, forms, progress bars, screen buffers, even image loading.

\* \*\*Install:\*\* `npm i terminal-kit`

\* \*\*Snippet (quick menu):\*\*



&nbsp; ```js

&nbsp; import {terminal as term} from 'terminal-kit';

&nbsp; term.singleColumnMenu(\['Start', 'Settings', 'Quit'], (err, res) => {

&nbsp;   if (res) term.green(`\\nYou chose: ${res.selectedText}\\n`);

&nbsp;   process.exit();

&nbsp; });

&nbsp; ```

\* \*\*Status:\*\* Actively updated; extensive docs/examples.



---



\## Add-to-Existing vs Build-New



\* \*\*Drop-in upgrades (existing CLIs):\*\*

&nbsp; `chalk`, `ora`, `log-symbols`, `cli-table3`/`table`, `boxen`, `marked-terminal`. These are one-liner improvements—colorize logs, add spinners, render tables, pretty-print Markdown help.



\* \*\*Moderate interactivity:\*\*

&nbsp; `inquirer` for prompts; combine with `ora` and `log-symbols` for a polished flow.



\* \*\*Full UI from scratch (or major refactor):\*\*

&nbsp; \*\*Ink\*\* (React mental model, component ecosystem) or \*\*terminal-kit\*\* (imperative, single-lib powerhouse).

&nbsp; Avoid starting new work on \*\*blessed\*\* unless you’re maintaining an older codebase; it’s effectively unmaintained today. (\[GitHub]\[22])



---



\## Handy Micro-Utilities (nice to have)



\* \*\*wrap-ansi\*\* – word-wrap strings that contain ANSI codes.

\* \*\*cli-truncate\*\* – safely truncate ANSI strings to terminal width.

\* \*\*figures\*\* – consistent unicode symbols with fallbacks.



---



\## Copy-paste Starter Snippets



\*\*1) Pretty status flow (color + spinner + symbols):\*\*



```js

import chalk from 'chalk';

import ora from 'ora';

import logSymbols from 'log-symbols';



const spinner = ora('Connecting...').start();

try {

&nbsp; await connect();

&nbsp; spinner.stop();

&nbsp; console.log(logSymbols.success, chalk.green('Connected.'));

} catch (err) {

&nbsp; spinner.stop();

&nbsp; console.error(logSymbols.error, chalk.red(`Failed: ${err.message}`));

&nbsp; process.exitCode = 1;

}

```



\*\*2) Markdown help screen:\*\*



```js

import {marked} from 'marked';

import TerminalRenderer from 'marked-terminal';



marked.setOptions({ renderer: new TerminalRenderer() });



const help = `

\# My CLI

\- Run \*\*init\*\* to get started

\- See \\`config.yml\\` for options



| Option | Desc |

|-------:|:-----|

| -v     | Verbose

`;

console.log(marked(help));

```



\*\*3) Table output:\*\*



```js

import Table from 'cli-table3';

const t = new Table({ head: \['Name', 'Age'], style: { head: \['cyan'] } });

t.push(\['Alice', 32], \['Bob', 28]);

console.log(t.toString());

```



\*\*4) ASCII banner splash:\*\*



```js

import figlet from 'figlet';

import boxen from 'boxen';

import chalk from 'chalk';



const banner = figlet.textSync('CHAOSPHERE', { font: 'Slant' });

console.log(boxen(chalk.magenta(banner), { padding: 1, borderStyle: 'double' }));

```



\*\*5) Prompt + action:\*\*



```js

import inquirer from 'inquirer';

const { action } = await inquirer.prompt(\[

&nbsp; { type: 'list', name: 'action', message: 'Choose:', choices: \['Build', 'Test', 'Deploy'] }

]);

// handle action...

```



\*\*6) Ink “hello world” (for new TUIs):\*\*



```jsx

import React from 'react';

import {render, Text, useInput} from 'ink';



const App = () => {

&nbsp; useInput((input, key) => { if (key.return) process.exit(0); });

&nbsp; return <Text color="green">Press Enter to quit.</Text>;

};

render(<App />);

```



---



\## Links (npm/GitHub)



\* chalk — npm: \*\*chalk\*\*.

\* ora — npm: \*\*ora\*\*; spinners JSON: \*\*cli-spinners\*\*.

\* cli-table3 — npm \& GitHub usage.

\* table — npm \& releases.

\* marked-terminal — npm; marked — npm.

\* figlet — npm.

\* boxen — npm; CLI.

\* inquirer — npm \& GitHub.

\* Ink — GitHub.

\* terminal-kit — npm \& docs.

\* blessed — npm (legacy), maintenance note (awesome list says “no longer maintained”).

\* neo-blessed — npm (old fork).

\* blessed-contrib — npm (aging dashboard widgets).

\* ink ecosystem: \*\*@inkjs/ui\*\*, \*\*ink-link\*\*, \*\*ink-form\*\*.



---



\## TL;DR recommendations



\* \*\*Existing apps:\*\* add `chalk`, `ora`, `cli-table3`, `boxen`, `marked-terminal`, `log-symbols`.

\* \*\*New interactive app:\*\* pick \*\*Ink\*\* (React) or \*\*terminal-kit\*\* (imperative).

\* \*\*Blessed:\*\* great history, but not actively maintained—use only for legacy code or with eyes open. (\[GitHub]\[22])



---

