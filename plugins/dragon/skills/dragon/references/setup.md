# Setup and showing diagrams

Back to the workflow: [SKILL.md](../SKILL.md).

## Check what is installed

```sh
dragon --version
npx @cardenelabs/dragon --version
```

The plugin that ships this skill has the same version as the npm package. Its version is the `version` field of `.claude-plugin/plugin.json`, two directories above the skill directory.
Install or update when the command is missing, prints an older version, or does not know `dragon check`.

## Install

Install the package in the project and run the CLI through `npx`.

```sh
npm install @cardenelabs/dragon
npx dragon --version
```

- To match the plugin, install that exact version: `npm install @cardenelabs/dragon@<version from plugin.json>`.
- With pnpm or yarn, use `pnpm add @cardenelabs/dragon` or `yarn add @cardenelabs/dragon`, and run `pnpm exec dragon` or `yarn dragon`.
- Without a project, run one command at a time with `npx @cardenelabs/dragon <command>`.
- `dragon export` also needs `playwright-core` and a Chromium. Install them only when you export.

```sh
npm install -D playwright-core
npx playwright-core install chromium
```

## Check a diagram

```sh
npx dragon check docs/diagrams/login.dragon
npx dragon check README.md
npx dragon check --layout docs/diagrams/login.dragon
```

Fix every `error` line and re-run until none is left. The full contract is in step 5 of [SKILL.md](../SKILL.md).
`--layout` also draws the diagram and warns about layout breaks per step ([layout](layout.md)). It does not need Chromium.

## A page that runs scripts

Put one script line on the page and the notation in a `<pre class="dragon">` block. Nothing is built.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@<major>.<minor>/dist/cdn/dragon.js"></script>

<pre class="dragon">
sequence Ask to sign in

box browser as Browser
box app as App

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
</pre>
```

- Replace `<major>.<minor>` with the first two numbers of the installed version (`dragon --version`). Pinning up to the middle number takes later patch fixes but no notation change.
- Write `<` in the notation as `&lt;` inside HTML.
- The script draws every block once the page has loaded. A block with an error shows its error lines in its place (`<pre class="dragon-error">`).
- The text dragon adds (overview labels, error lines) follows the page: Japanese when `<html lang>` starts with `ja`, English otherwise. The text you wrote in the notation stays as written.
- To give every block on the page your own blocks, add `<link rel="dragon-blocks" href="blocks.dragon">` ([blocks](blocks.md)).

### Markdown on a docs site

A docs site that turns Markdown into HTML writes a ```` ```dragon ```` fence as `<pre><code class="language-dragon">`. The same script line draws those blocks too.
Add the script line once to the site's layout or head, then write diagrams as fences in the Markdown files.

```dragon
sequence Ask to sign in

browser -> app: GET /login
app -> browser: Return the sign-in page
```

Run `dragon check` on the Markdown file. It checks only the dragon fences and reports lines of the Markdown file.

## A GitHub README or any place without scripts

GitHub does not run scripts, so a fence there stays plain text. Show an exported image instead.

1. Keep the notation in a file, for example `docs/diagrams/login.dragon`.
2. Run `dragon check` on it.
3. Export an image next to it.
4. Embed the image and link the `.dragon` file so others can edit it.

```sh
npx dragon export docs/diagrams/login.dragon --out docs/diagrams --format gif
npx dragon export docs/diagrams/login.dragon --out docs/diagrams --format png
```

```markdown
![Sign-in flow](docs/diagrams/login.gif)

Source: [login.dragon](docs/diagrams/login.dragon)
```

| Option | Meaning |
|---|---|
| `--format <list>` | Formats separated by `,`: `mp4`, `gif`, `html`, `png` (default all four) |
| `--out <dir>` | Where to write (default the current directory) |
| `--palette <name>` | `clear`, `paper`, `night`, `arcade`, `sea` (default `paper`, `sea` for pipe) |
| `--theme <mode>` | `light` or `dark` |
| `--width <px>` | Frame width. It also picks the view |
| `--lang <lang>` | `ja` or `en` for the text dragon adds and the command messages (default `en`) |
| `--step <n>` | The step the PNG shows, counted from 1 (default the last step). A step the diagram does not have exits `2` |

- The GIF plays every step. The PNG is a still of the last step unless `--step` picks another.
- When text overlaps in a step, the export still finishes and prints each overlap to standard error. Shorten the labels or add `[side: ...]` and export again.
- Re-export after every change to the `.dragon` file.

## An app

```sh
npm install @cardenelabs/dragon
```

```ts
import "@cardenelabs/dragon/fonts";
import { mountDiagram, parseNotation, renderDiagram } from "@cardenelabs/dragon";

const parsed = parseNotation(text, { lang: "en" });
if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join("\n"));

// A player with controls
const player = mountDiagram(host, parsed.diagram, { lang: "en" });

// Or an SVG string that plays by itself
const { svg } = renderDiagram(parsed.diagram, { still: false });
```

- Import `@cardenelabs/dragon/fonts` once. Layout measures text with the bundled fonts, so without it text can overflow.
- `parseNotation` returns `{ ok: true, diagram }` or `{ ok: false, errors }`. Each error has `line`, `column` and `message`. A readable diagram with similar box names also has `notices` in the same shape.
- `renderDiagram(diagram, options)` returns `{ svg, ... }`. The SVG plays on a loop. `still: true` draws one picture of the last step with every label shown.
- `mountDiagram(host, diagram, options)` places a player and returns it (`next`, `prev`, `play`, `pause`, `destroy`). Options include `lang`, `palette`, `theme`, `colors`, `pausedAt`, `playOnce`, `still` and `onStep`.
- To load only the kinds a page uses, import from `@cardenelabs/dragon/light` and `await loadFor(text)` before `parseNotation`.
- To export from Node, use `exportDiagram` from `@cardenelabs/dragon/export`.
- Check the package README for options this file does not list.

## A file that opens offline

```sh
npx dragon embed page.html
```

It replaces the script line with the bundled script and writes `page.offline.html` (`--out <file>` picks the name). The file fetches nothing, and draws in the device's fonts.
