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
| Diagram kinds | Sequence diagram, architecture diagram, state diagram, git graph, time diagram, tree diagram, lineup diagram, try diagram, pipe diagram, chart, flow diagram, cycle diagram, mind map, table relation diagram, two-axis matrix, set overlap diagram |
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
| `chart <title> [shape: funnel]` | A funnel. Each stage's bar appears in the step that sets it, the gap to the stage above stays as a pale bar with the number who left, and the last step shows the share that made it to the last stage |
| `item <id> as <name> [color: <color>]` | An item, before the first step. A chart takes from 1 to 8 items |
| `set <id>: <value>` | The value of an item inside a step, a number of 0 or more without a unit. An item without `set` keeps its previous value |

A lineup diagram can also stack its boxes as layers, for one request or transaction going down through them.
Write `lineup <title> [shape: layers]`, and the boxes become horizontal bands from top to bottom in the order declared, with each layer's name, `note`, and number on the left.
Inside a step, `line <layer>: <chip>` is the layer the chip is in, and `note <layer>: <text>` is the mark of that layer, such as what it did and how long it took. A layers lineup takes up to 8 layers and draws no arrows between them.

A flow diagram (`flow <title>`) follows a procedure from top to bottom.
The boxes and choices on the main path stack in one column, and a path that a choice sends elsewhere leaves to the right of the choice.
The line that moves in a step turns blue and a dot runs along it, a passed line stays dark, and a choice the dot reached is filled with light amber.
A line without `carry` or `tag` runs this dot instead of an envelope.

| Line | What it writes |
|---|---|
| `box <id> as <name>` | A step of the procedure |
| `choice <id> as <question>` | A choice, drawn as a diamond with the question inside. A long question wraps onto two lines. Each line out of it carries the answer as its label, and it has at most two ways out |
| `<id> -> <id>: <answer>` | A line. A line written before the first step stays as a dotted path not taken this time, and a box that no line in a step reaches gets a dotted border and a muted name |
| `start -> <id>`, `<id> -> finish` | The lines out of the start mark and into the finish mark |

A cycle diagram (`cycle <title>`) follows a flow that goes around the same steps again and again.
The steps sit on a ring clockwise from the top in the order written, and arc arrows join each step to the next.
In a step the chip runs along the arc to the next step, and the arc it ran stays lit in the color of the receiving step.
The strip goes in the middle of the ring instead of under the diagram.

| Line | What it writes |
|---|---|
| `box <id> as <name>` | A step on the ring, before the first step. A cycle diagram takes 2 to 8 steps |
| `<id> -> <id> [tag: <text>]` | A line to the next step on the ring and the chip that runs along its arc. A line from the last step to the first one starts the next round. A line that skips a step, goes backward or carries a label is refused |
| `strip <title>: <field>, <field>` | The strip title and field values in the middle of the ring. `set <field>: <value>` in a step changes a value. The first field shows large, and field names are not shown |

A mind map (`mind <title>`) spreads ideas out from one topic in the middle, branch by branch.
Branches go round clockwise from the upper left in the order written (up left, up right, down right and down left for four), and leaves sit in a column outside their branch.
An idea fades in at its step, and the line from its parent is drawn from the parent's side.
A branch's color flows to its lines and leaves.

| Line | What it writes |
|---|---|
| `idea <id> as <name>` | The topic in the middle, written in a step. A mind map has exactly one idea without `of` |
| `idea <id> as <name> of <parent>` | An idea joined to its parent, written in a step. Ideas go three levels deep: the topic, branches and leaves. A parent that has not been written yet is refused |
| `idea <id> as <name> of <parent> [color: <color>]` | A branch with its own color. A branch without a color gets the next unused one, and leaves take their branch's color |

A table relation diagram (`er <title>`) follows step by step which row of which table one value goes through.
The tables sit left to right in one row in the order written, and a line joins each field that holds a link to the field it points at.
In a step a value chip runs along that line, the row it reaches lights up, and a value can be rewritten.

| Line | What it writes |
|---|---|
| `table <id> as <name>` | A table, before the first step. A table relation diagram takes 1 to 6 tables |
| `field <name>: <value> [ref: <table>.<field>]` | A field of the table above it. `[key]` is the key mark (PK), and `ref` links it to a field of another table (FK). The linking field is the many side and the field it points at is the one side |
| `pick <table>.<field>` | Lights that row and its table in a step |
| `<table>.<field> -> <table>.<field> [tag: <value>]` | Runs a value chip along the line between linked fields. A line between fields that are not linked is refused |
| `set <table>.<field>: <value>`, `note <table>.<field>: <text>` | Rewrites the value of a field, or shows a formula card under its table, from that step on |

A two-axis matrix (`matrix <title>`) sorts items into four areas by two measures, step by step.
The horizontal axis runs below the areas and the vertical axis left of them, and the items wait in a list left of the areas until a step places them.
A placed card slides from the list into its area, and the area lights up in that step.

| Line | What it writes |
|---|---|
| `axis <name> [from: <low end>, to: <high end>]` | An axis, before the first step. Write the horizontal axis first and then the vertical one; a matrix takes exactly two |
| `box <id> as <name>` | An area. Write exactly four; they go top left, top right, bottom left and bottom right in the order written |
| `item <id> as <name>` | An item to sort, before the first step. Items wait in the list in the order written |
| `line <area>: <item>, <item>` | Places items into an area in a step. A placed item stays there until a later step places it elsewhere. An unknown area or item is refused |

A set overlap diagram (`venn <title>`) overlaps two or three sets as circles and counts how many fall in each region.
A circle appears in the step that first writes its count, a written overlap lights its region in that step, and each region shows the count that is only in it, worked out from the totals and the overlaps.

| Line | What it writes |
|---|---|
| `item <id> as <name>` | A set, before the first step. A set overlap diagram takes 2 or 3 sets |
| `set <id>: <count>` | The total of a set. Its circle appears in that step, with the name and the total outside it |
| `set <id> & <id>: <count>` | The count in an overlap. Its region lights in that step. An overlap larger than one of its sets is refused |
| `set none: <count>` | The count in none of the sets, shown in the frame outside the circles |

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
