\# Chalk TUI Colors Guide (Version 4.1.2)



\## Introduction



Chalk is a popular Node.js library for styling terminal string output with colors and styles. It supports advanced color models like RGB, hex, and ANSI 256, making it ideal for Text User Interface (TUI) development.



\## Installation



```bash

npm install chalk

```



\## Basic Usage



```js

import chalk from 'chalk';



console.log(chalk.blue('This is blue text.'));

```



\## Supported Color Models



\- Named colors (basic colors)

\- Hexadecimal (e.g., `#FFA500`)

\- RGB (e.g., `rgb(255, 136, 0)`)

\- ANSI 256 colors



```js

chalk.rgb(255, 136, 0).bold('Orange!');

chalk.hex('#FF8800').bold('Orange!');

chalk.bgAnsi256(194)('Honeydew');

```



\## Chaining Styles



You can chain multiple styles:



```js

chalk.blue.bgRed.bold('Styled Text');

```



\## Nesting Styles



```js

chalk.red('Hello', chalk.underline.bgBlue('world') + '!');

```



\## Using Templates



```js

const name = 'World';

console.log(`Hello ${chalk.green(name)}!`);

```



\## Detecting Color Support



You can override support levels:



```js

const customChalk = new chalk.Instance({level: 3}); // Force truecolor

console.log(customChalk.green('Always green!'));

```



\## Notable Changes and Breaking Changes from Version 4



\- \*\*ES Module Support\*\*: Version 5 and above are ESM-only, but version 4 supports CommonJS as shown here.

\- \*\*Color Support Detection\*\*: In recent versions, Chalk uses the `supports-color` library which automatically detects terminal capabilities. You can override this via `new chalk.Instance({level: N})`.

\- \*\*API Consistency\*\*: The core API remains consistent between v4 and v5; most breaking changes in later versions involve ESM-only modules.

\- \*\*Background Colors\*\*: Use `bgHex()`, `bgRgb()`, `bgAnsi256()` methods for background styling.

\- \*\*Support for Nested Styles\*\*: Fully supported in v4, allowing complex nested styles.



\## Additional Tips



\- For compatibility with older environments, stick to v4 if you're using CommonJS.

\- Use `chalk.level` to check detected color support at runtime.

\- Support for 24-bit color is available with `level: 3`.



---

