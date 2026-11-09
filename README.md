# dragon

> Animated diagrams that people and AI write in a plain notation.

[![license MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[日本語](README.ja.md)

dragon draws a diagram that plays step by step from a short text file.
It draws boxes, the lines between them, and what travels along those lines, and each step moves the story forward.
People and AI write a diagram in the same dragon notation, and the notation converts to and from a JSON source.
The same source plays on a web page and exports to MP4, GIF, HTML, and PNG.

The catalog, with every kind of diagram and an editor that plays what you type, is at <https://cardene777.github.io/dragon/>.

## The idea

dragon builds diagrams out of blocks.
Like Lego, it puts together blocks of set shapes, so every kind of diagram is assembled with the same look.

| Block | What it is | Examples |
|---|---|---|
| Core blocks | Blocks that two or more diagram kinds share | box (`box`), step (`step`), color, icon |
| Kind blocks | Blocks that only one diagram kind uses | the lifeline of a sequence diagram, the group of an architecture diagram (`group`) |
| Connector blocks | Blocks that join two blocks | the edge (`->`), the merge of a git graph |

A diagram is blocks put together.
A diagram kind decides only how its blocks are laid out and which ways of attaching it accepts.
Which blocks a diagram can use follows from how each block attaches.
Colors, text sizes, and spacing live in one table, and every block reads from it, so every diagram has the same look.

You can also add your own blocks in your own project.
Base one on a box, a line, or an icon, change its shape and color role, and write it as a definition made of data only ([Add your own blocks](https://github.com/cardene777/dragon/blob/main/packages/dragon/README.md#add-your-own-blocks)).
To add diagram kinds or more blocks to base on, send a pull request to this repository or work in a fork.

The other axis is to be as easy as mermaid to write, and to show the diagram right away.

- Short to write. The diagram kind and one `A -> B: name` line make a diagram, and the names on the lines become boxes
- One script line. Put one script line and the notation on a page, and it becomes a diagram that plays
- Fast for AI to write. AI writes the same notation as people and fixes the line and column that the parser's error messages point to. JSON stays as the source and converts to and from the notation
- Light and fast. A page loads only the blocks its diagrams use

The notation takes mermaid as its model but is its own form, and it is not compatible with mermaid.
It leaves out hard-to-read forms such as `-->|text|`, and lets the first English word of a line tell what the line is.

## Install

```sh
npm install @cardenelabs/dragon
```

## Write diagrams with AI

The dragon skill teaches an AI agent to write diagrams in the dragon notation, check them with `dragon check`, and fix them until they read.
In Claude Code, add this repository as a plugin marketplace and install the plugin.

```text
/plugin marketplace add cardene777/dragon
/plugin install dragon@dragon
```

For another AI agent, copy the skill directory `plugins/dragon/skills/dragon` of this repository to the place where that agent reads skills.
The agent starts from `SKILL.md` and reads only the reference file for the kind of diagram it draws.
The plugin version matches the npm version of `@cardenelabs/dragon`, and the skill checks the installed version with `dragon --version`.

## A first diagram

```dragon
sequence

browser -> app: GET /login
app -> browser: Return the sign-in page
```

The diagram kind and lines joining boxes with `->` are enough to make a diagram.
The names on the lines become boxes, and each line becomes one step, lit in the order written.
Write `box` and `step` lines when a box needs a shown name or a caption, or a step needs a title and a body.

```dragon
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate]
box app as App [note: asks for sign-in, color: blue]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
```

Paste it into the editor on the catalog to watch it play.
To show it on your own page, put one script line and the notation in a `<pre class="dragon">` block, and the block turns into a diagram that plays (see [Show it with one script line](packages/dragon/README.md#show-it-with-one-script-line)).
To draw it from code, parse it with `parseNotation` and pass the result to `mountDiagram` (see [Put it on a page](packages/dragon/README.md#put-it-on-a-page)).

## What it does

| Part | What it is |
|---|---|
| Source | JSON with a skeleton of kind, title and steps, and a field for each block name (`blocks`). It carries a format version, and older versions are converted when read |
| Notation | The dragon notation, where the first English word of each line decides its kind. It converts to and from JSON, and names and text can be in any language |
| Renderer | Draws the source on a page and plays it one step at a time |
| Diagram kinds | Sequence diagram, architecture diagram, state diagram, git graph, time diagram, tree diagram, lineup diagram, try diagram, pipe diagram, chart |
| Export | The `dragon export` command writes MP4, GIF, HTML, and PNG from the same source |

## Notation

Every line follows these four rules.

1. The first English word of a line decides its kind. Only arrow lines start with a box id
2. A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`
3. Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`
4. The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`

Every line form is in the [notation guide](packages/dragon/examples/quick-start.en.md), and a full example of each kind of diagram is in [`packages/dragon/examples`](packages/dragon/examples).

Sequence, architecture and state diagrams can leave out the title, the box declarations and the steps (the first example in A first diagram).
A diagram with no `box` line makes a box of each name on the lines in the order they appear, and points out box names that differ by one character while still drawing the diagram.
A diagram with no `step` line makes each line one step, and a step without `say` uses the line label as its body.

A pipe diagram (`pipe <title>`) follows one transaction step by step: the calls between contracts, the balances in tanks, and the stored values.
Changes stay provisional until the outermost call returns, and then they all become final.

| Line | What it writes |
|---|---|
| `hold <owner>: <amount> <token>, ...` | Balances, before the first step. `hold <contract>: <name> <value>` declares a stored value |
| `<caller> -> <callee>: <text>` | A call. `[value: <amount> ETH]` sends ETH with it, `[call: delegate]` and `[call: static]` set its kind, and `[fold]` folds its inner steps into one box |
| `move <token>: <amount> <from> -> <to>` | Moves a balance through the token's pipe |
| `write <party>: <name> <value>` | Rewrites a stored value |
| `check <party>: <left> <op> <right>` | A check. dragon compares numbers itself, and a check on other values fails only with `[fail]` |
| `return <party>: <value>` | Closes the innermost open call |
| `revert <party>: <reason>` | Fails the innermost open call and rolls back the changes inside it |
| `emit <party>: <name>(<arg>, ...)` | An event |
| `calc <party>: <in> -> <out>` | A conversion |

A time diagram (`time <title>`) can also show a schedule.
Write `task <id> as <name> <range> [color: <color>]` before the first step, and each task gets its own row with one thick bar over the ticks of the range, counted from 0 like `mark`.
The bar shows its first and last tick names, such as `Day 1–3`, and the part of the bar the needle has passed fills in. A time diagram with tasks needs no `row`.

A chart compares items step by step, as the shares of a donut or the amounts of bars.
Going to the next step moves the arcs and bars from the previous values to the new ones.

| Line | What it writes |
|---|---|
| `chart <title> [shape: donut]` | A donut. Each arc's angle is the item's share, and the legend shows the rounded percentages |
| `chart <title> [shape: bar]` | Horizontal bars. The largest value gets the longest bar, and each value shows at the end of its bar |
| `item <id> as <name> [color: <color>]` | An item, before the first step. A chart takes from 1 to 8 items |
| `set <id>: <value>` | The value of an item inside a step, a number of 0 or more without a unit. An item without `set` keeps its previous value |

## Documentation

| Read | For |
|---|---|
| [`packages/dragon/README.md`](packages/dragon/README.md) | Putting a diagram on a page, loading diagram kinds on demand, the notation for each kind, and exporting |
| [Notation guide](packages/dragon/examples/quick-start.en.md) | Every line form and attribute |
| [`CHANGELOG.md`](CHANGELOG.md) | What changed in each version, and how to rewrite diagrams written for older versions |

## Contributing

Issues and pull requests are welcome.
See [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to build, test, and send a change.

## License

MIT
