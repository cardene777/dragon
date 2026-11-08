# @cardenelabs/dragon

Animated diagrams that people and AI write in a plain notation.

[日本語](https://github.com/cardene777/dragon/blob/main/packages/dragon/README.ja.md)

dragon draws a diagram that plays step by step from a short text file.
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

The package has four parts.

| Part | What it is |
|---|---|
| Source | JSON with a skeleton of kind, title and steps, and a field for each block name (`blocks`) (see below). It carries a format version, and older versions are converted when read |
| Notation | The dragon notation, where the first English word of each line decides its kind (the section below). It converts to and from JSON, and names and text can be in any language ([notation guide](https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md)) |
| Renderer | Draws the source on a page and plays it one step at a time. It draws sequence, architecture, state, git, time, tree, lineup, and try diagrams |
| Export | The `dragon export` command writes MP4, GIF, HTML, and PNG from the same source |

## Write diagrams with AI

The dragon skill teaches an AI agent to write diagrams in the dragon notation, check them with `dragon check`, and fix them until they read.
In Claude Code, add the GitHub repository cardene777/dragon as a plugin marketplace and install the plugin.

```text
/plugin marketplace add cardene777/dragon
/plugin install dragon@dragon
```

For another AI agent, copy the skill directory `plugins/dragon/skills/dragon` in the GitHub repository cardene777/dragon to the place where that agent reads skills.
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

Paste it into the editor on the catalog to watch it play, or put it on your own page as the next section shows.

## Show it with one script line

On any HTML page, put one script line and the notation in a `<pre class="dragon">` block, and the block turns into a diagram that plays.
Nothing needs to be installed or built.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@0.66/dist/cdn/dragon.js"></script>

<pre class="dragon">
sequence Ask to sign in

box browser as User's browser
box app as App

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
</pre>
```

The script loads from jsDelivr with the version pinned up to the middle number (`@0.57`), so fixes in later patch versions reach the page and a version that changes the notation does not.
It loads the renderers for `sequence` and `architecture` first, and the renderer of any other kind only when a block on the page uses it.
It adds a `<link>` for the CSS of the two bundled fonts from jsDelivr to the page once.
It draws every block on the page when the page has loaded, and does not watch for blocks added later.
Indentation that every line of a block shares is removed before reading, and `<` in the notation is written as `&lt;`.
A block with an error in its notation is not drawn, and its error lines are shown in its place (`<pre class="dragon-error">`).
The text in the diagram and the error lines are in Japanese when the page's `lang` starts with `ja`, and in English otherwise.

To make a file that opens without the network, pass the page to `dragon embed`.
It replaces the script line with the bundled script, which holds every diagram kind, and writes `page.offline.html` next to the page (`--out <file>` picks the file).
The file fetches nothing from outside, and draws in the device's fonts because the bundled fonts are not embedded.

```sh
dragon embed page.html
```

## Put it on a page

Import the font entry `@cardenelabs/dragon/fonts` once on the page, and pass the source read from the notation to `mountDiagram`.

```ts
import "@cardenelabs/dragon/fonts";
import { mountDiagram, parseNotation } from "@cardenelabs/dragon";

const source = await (await fetch("login.dragon")).text();
const parsed = parseNotation(source);
if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\n"));

const host = document.getElementById("figure");
if (host === null) throw new Error("#figure not found");
const player = mountDiagram(host, parsed.diagram);
```

The font entry only loads the CSS for the two bundled fonts (Noto Sans JP and JetBrains Mono) and exports nothing.
Diagrams are laid out with character widths measured from the bundled fonts, so without it they are drawn in the device's fonts and text can overflow its labels.
A bundler (such as Vite) carries the CSS and font files to the page.
The entry does not read Node's built-in modules, so it also works with bundlers such as Next.js Turbopack.
The text the player shows, such as the names read aloud for its buttons and the overview label, is in English.
For Japanese, pass `{ lang: "ja" }` to `mountDiagram` as the third argument, and to `parseNotation` for its error messages.
`migrateFile`, which moves a source file to the current format version, comes from the Node-only entry `@cardenelabs/dragon/node`.

Use the `player` returned by `mountDiagram` to move through the steps (`next`, `prev`, `play`, `pause`, `destroy`).
The third argument takes settings (`PlayerOptions`), such as the palette and a function called when the step changes.
To place a diagram stopped on a still of one step, pass the step number (from 0) as `pausedAt`, and to play it once and stop on the last step, pass `playOnce: true`.
`still: true` stops on the last step, shows every step's line labels and box actions as strongly as the last step's, and does not move, so readers who do not play the diagram still see the whole flow in one picture.
`renderDiagram` also takes `still`.
Without any of these, the diagram plays every step on a loop from the moment it is placed.

A pipe diagram placed in a frame narrower than 600px starts fitted to the frame width, so its box names come out small.
Pass `zoom: "readable"` to start zoomed in so box names are readable (10.5px or larger on screen), with the frame grown to the zoomed diagram's height and panning sideways.
Moving through the steps pans the diagram to the parties in each step, and the zoom-out button returns it to the fitted view.
The setting works only for pipe diagrams in frames narrower than 600px; wider frames and other kinds draw as before.

Choose colors by name with `palette`, and pass color variable names and values in `colors` to override only those colors for the current `theme`.
The keys are the names the palette has (`bg`, `surf`, `ink`, `line`, `c-green`, `t-green`, and so on; the type is `ColorName`), and the colors you leave out keep the palette's values.
The placed diagram, the overview shown while following, and the buttons and step bar all use the same colors, and `renderDiagram` takes the same `colors`.

```ts
mountDiagram(host, parsed.diagram, {
  palette: "night",
  colors: { bg: "#0a0f0a", surf: "#101810", ink: "#39ff14", line: "#1f9a0b", "c-green": "#39ff14" },
});
```

A name the palette does not have, or a value that cannot be read as a color (one that contains `;`, `"`, `<`, and so on), is refused with that name and nothing is drawn.

## Load diagram kinds on demand

To keep what a page loads first small, import from `@cardenelabs/dragon/light`.
It exports the same functions as the default entry, but leaves out the renderers for `git`, `lineup`, `pipe`, `state`, `time`, `tree`, and `try`, and the blocks that only those kinds use.
Await `loadFor` with the notation or JSON you are about to read, and it loads only that kind's renderer and the blocks that diagram uses.
A diagram read from notation with `parseNotation` skips the schema check when it is drawn, so a page that draws notation never loads the check. When you pass JSON, `loadFor` also loads the schema check, and reading or drawing JSON before that stops with an error that tells you to await `loadFor`.
After that, the same functions as the default entry read, draw, and print the same diagram without waiting.

```ts
import { loadFor, mountDiagram, parseNotation } from "@cardenelabs/dragon/light";

await loadFor(text);
const parsed = parseNotation(text);
if (parsed.ok) mountDiagram(host, parsed.diagram);
```

To load a kind ahead of time, await `loadKind` with the kind's name.
It loads the kind's renderer, every block of that kind, and the schema check.
To read a diagram's title and kind without drawing it, await `loadReadings`, which loads only the blocks and leaves the renderer out.
`diagramKind` returns the kind of a notation or JSON before you read it, and `definesBlocks` tells whether a notation has block definitions, which need `loadReadings` or `loadFor` before you read it.
Drawing a kind that has not been loaded stops with an error that names the kind, and reading a line of a block that has not been loaded stops with an error that names the block.
If loading fails, `loadFor` and `loadKind` reject, and the next call loads it again.
`sequence` and `architecture` and their blocks are there from the start, so their notation reads and draws without loading anything.
Mixing it with the default entry on one page puts every kind's renderer on the page.

## Add your own blocks

You can add your own blocks in your own project by basing one on a box, a line, or an icon and changing its shape and color role.
A block keeps the placement, the motion, and the diagram kinds of the block it is based on, and reads its colors from the palette table, so it looks like every other block.

Write definitions after a `blocks 1` line, each from `block +<name>` to `end`.
Start the name with `+`.
If dragon later adds a block of the same name, your diagrams keep their meaning.

```text
architecture Across the bridge

blocks 1
block +bridge
  base box
  shape path "M 0 70 Q 50 0 100 70 Z"
  color violet
end
block +wire
  base edge
  shape dashed
  color amber
end

box eth as Ethereum
+bridge cc as CCIP
box base as Base

step Send
  say The token goes to the bridge.
  eth -> cc: send

step Hand over
  say The bridge hands the token over.
  cc +wire base: hand over
```

| Base (`base`) | How to write it | Shape (`shape`) | Color (`color`) |
|---|---|---|---|
| `box` | Write `+<name>` in place of `box` on a box line | `round` / `circle` / `cylinder` / `diamond` / `hexagon`, or `path "…"` drawn in a 100 by 100 square | A color role |
| `edge` | Write `+<name>` in place of `->` on a line | `solid` / `dashed` / `dotted` | A color role |
| `icon` | Write `[icon: +<name>]` on a box line | `path "…"` drawn in a 20 by 20 square centered on (0, 0) | The color of its box |

A definition based on `box` can also give its boxes an icon with a line such as `icon key` or `icon tabler:building-bridge-2`.
It takes the same names as `icon:` on a box line, and an icon written on the box line wins over the definition's.

A definition is data only, and a path takes only path syntax (commands, numbers, and separators).
It cannot hold URLs, code, or SVG elements, so reading a definition someone else wrote runs nothing.
A definition without the version line (`blocks 1`), or with an unknown version, is refused.

Definitions are read in three places.

- At the head of a diagram, for that diagram only
- In a file the page reads with `<link rel="dragon-blocks" href="bridge.dragon">`, for every notation block on the page
- In code, read with `readBlocks` and passed as the `blocks` option of `parseNotation` and `renderDiagram`

```ts
import { parseNotation, readBlocks, renderDiagram } from "@cardenelabs/dragon";

// Pass notation text, or JSON shaped as { "format": 1, "blocks": [...] }
const read = readBlocks(definition);
if (read.ok) {
  const parsed = parseNotation(notation, { blocks: read.blocks });
  if (parsed.ok) renderDiagram(parsed.diagram, { blocks: read.blocks });
}
```

To add diagram kinds or more blocks to base on, send a pull request to this repo or work in a fork.

## Notation

Every line follows these four rules.

1. The first English word of a line decides its kind. Only arrow lines start with a box id
2. A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`
3. Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`
4. The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`

The words that start a line are `sequence` `architecture` `state` `git` `time` `tree` `group` `end` `box` `branch` `scale` `period` `row` `point` `zoom` `strip` `step` `say` `code` `source` `commit` `mark` `span` `leaf` `node` `act` `note` `set`, and a line is written as `id -> id`.
Sequence, architecture and state diagrams can leave out the title on the first line, the box declarations, the steps and the step bodies.
A diagram with no `box` line makes a box of each name on the lines in the order they appear, and points out box names that differ by one character while still drawing the diagram.
A diagram with no `step` line makes each line one step, and a step without `say` uses the line label as its body.
A destination in the `link` attribute of a box line makes that box a link in the drawn diagram.
A `source <name> [url: <URL>]` line inside a step is a source of that step; a step can have any number, and they are listed as links in the step list that screen readers read.
A destination or source URL is a path that starts with `/`, or a URL that starts with `http://` or `https://`.

```dragon
architecture Send orders to the warehouse

group shop as Shop [note: takes orders, color: blue, icon: cart]
  box intake as Intake [note: takes the order, icon: app]
end

group warehouse as Warehouse [note: ships the goods, color: green, icon: box]
  box shipping as Shipping [note: ships the goods, icon: truck]
end

step Pass to shipping
  say
    Intake bundles two order numbers and passes them to shipping.
    Shipping sends the goods in the order the numbers arrive.
  intake -> shipping: OK to ship [tag: "#42, #43"]
```

`parseNotation` turns the notation into the source JSON, and `printNotation` turns the source JSON back into the notation.
`printNotation` leaves out declarations and steps when a diagram allows it, and writes everything when you pass `{ short: false }`.
Error messages are in the language you pass, as in `parseNotation(text, { lang: "ja" })`, and are in English when you pass none.
The old form of the notation (starting with `時系列図` or `構成図`) is not read, and stops with an error that shows the new form of that line.
The table from the old form to the new one is in [`CHANGELOG.md`](https://github.com/cardene777/dragon/blob/main/CHANGELOG.md).

### State diagram

Starting with `state` makes a state diagram that follows one thing moving between states step by step. Each box is a state, and each line is a move from one state to another.
Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark.
Lines written before the first `step` are paths the diagram could take but does not this time, drawn dotted.

```dragon
state States of an order until it arrives

box awaiting as Awaiting payment [note: Waits for funds, color: amber, icon: clock]
box shipped as Shipped [note: With the carrier, color: violet, icon: truck]
box delivered as Delivered [note: Handed over, color: green, icon: check]
box cancelled as Cancelled [note: Payment returned, color: rose, icon: x]

awaiting -> cancelled: Cancel
cancelled -> finish

step Place the order
  say Confirming the order starts it at Awaiting payment.
  start -> awaiting: Place order [tag: #1042]

step Ship
  say Once the payment clears, the goods go out and the order moves to Shipped.
  awaiting -> shipped: Ship [tag: #1042]

step Arrive
  say The goods arrive, the order moves to Delivered, and it closes.
  shipped -> delivered: Receive [tag: #1042]
  delivered -> finish: Close the order [tag: #1042]
```

### Git graph

Starting with `git` makes a git graph that follows commits stacking on branches until they are merged, step by step. Declare branches on `branch` lines from the top, and each branch gets its own band.
Inside a step, `commit <id> on <branch>` adds a commit to the tip of the branch, `copy <source>` makes a replayed commit, and `merge <branch>` makes a merge commit. `hash` and `note` put a hash and a short note beside the circle.
`<branch> from <commit>` cuts a branch, and `<ref> -> <commit>` moves a branch ref or `HEAD` without making a commit. A commit that no ref can reach any more turns into a dotted circle.

```dragon
git Merge fix with a merge commit and replay feature

branch main [note: Target]
branch feature [note: Work branch]
branch fix [note: Fix branch]

step Cut branches
  say Cut fix and feature from A on main, and add a commit to each.
  commit A on main [hash: 3fa0c19, note: First shape]
  fix from A
  commit F on fix [hash: 9b2e4d1, note: Fix a typo]
  feature from A
  commit C on feature [hash: c41d0e5, note: Add search]

step Merge commit
  say Merge fix into main with merge commit M. M has two parents, A and F.
  commit M on main merge fix [hash: 7d3a5e2, note: Merge fix]

step Replay
  say Move HEAD to M to detach it, and copy C onto M as C'.
  HEAD -> M
  commit C' on main copy C [hash: a90c6b4, note: Add search]

step Fast-forward
  say Move feature to C', and move main up to C' too. The old C can no longer be reached from any branch.
  feature -> C'
  main -> C'
```

### Time diagram

Starting with `time` makes a time diagram that follows, step by step, which tick each event happens on along evenly spaced time. `scale <unit> <length> <count>` declares the ticks, `period` the periods, `row` a row of marks, `point` a point below the axis, and `zoom <range>` the ticks to zoom in on in the top band.
Inside a step, `now -> <tick>` moves the needle. The needle moves one tick at a fixed speed, and the marks of the ticks it passes appear as it goes. `mark` changes the color of marks, and `span` puts a bracket under the axis or a frame around the rows.
`[meter: <ratio>]` on a strip field makes a meter that fills with the needle up to the ratio written with `set`.

```dragon
time How a block becomes final

scale slot 12s 64
period epoch 32
row block [color: blue, empty: 5]
point C0 at 0
point C1 at 32
zoom 0-1

box proposer [color: blue, icon: user]
box block [color: blue, icon: box]

strip Finality: Elapsed, Votes this epoch [meter: 2/3]

step Propose blocks
  say In each slot one proposer is chosen and proposes one block. The top band zooms in on the first 2 slots.
  proposer -> block [at: 0]
  proposer -> block [at: 1]
  now -> 1
  set Elapsed: 24 s

step Collect one epoch of votes
  say 32 slots make one epoch. A block mark appears on each slot the needle passes, and a slot whose proposer did not answer gets an empty mark.
  note C0: Proposed [color: blue]
  span 0-31: 1 epoch = 6.4 min [color: slate]
  now -> 31
  set Elapsed: 6 min 24 s
  set Votes this epoch: 97%

step Move to the next epoch
  say Votes for C0 passed 2/3 of the total, so C0 is justified. In the next epoch, votes gather on C1.
  note C0: Justified [color: violet]
  note C1: Proposed [color: blue]
  now -> 63
  set Elapsed: 12 min 48 s
  set Votes this epoch: 97%

step C0 becomes final
  say Once C1 is justified too, the earlier of the two justified in a row, C0, becomes final. A final block cannot be undone.
  C0 -> C1: over 2/3 [carry: none]
  note C1: Justified [color: violet]
  note C0: Final [color: green]
  mark block 0-31 [color: green]
  span 0-31: Final, cannot be undone [shape: box, color: rose]
```

### Tree diagram

Starting with `tree` makes a tree diagram that follows, step by step, how leaf values fold up into their parents until one root remains. Inside a step, `leaf <id> [hash: <value>]` writes a leaf and `node <id> of <child>, <child> [hash: <value>]` writes a parent, and each box appears in the step that writes it.
Leaves line up from the left in written order, a parent sits above the middle of its children, and the box that no parent takes becomes the root.
A carrier on a line between a parent and a child runs along the tree line, and the tree line keeps that color once passed. From the step a carrier first runs on a tree line, only the boxes that send or receive carriers are drawn strongly.

```dragon
tree Proving a transaction is included

step Hash each transaction
  say Compute a value from each of the 4 transactions. These values become the leaves.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  leaf tx3 [hash: c41d]
  leaf tx4 [hash: e5f8]

step Pair them up
  say Join neighbouring values two at a time and hash again. Two parents appear.
  node 1to2 of tx1, tx2 [hash: 7a21]
  node 3to4 of tx3, tx4 [hash: b9e4]

step The root appears
  say Joining the last two gives one root that sums up every transaction.
  node root of 1to2, 3to4 [hash: e71c]

step Climb from tx3 to the root
  say Take the neighbouring value at each level and climb. The root comes out without reading tx1 or tx2.
  tx3 -> 3to4 [tag: c41d]
  tx4 -> 3to4 [tag: e5f8]
  3to4 -> root [tag: b9e4]
  1to2 -> root [tag: 7a21]
```

### Try diagram

Start with `try` to draw a try diagram, which readers move themselves by typing values and pressing buttons. Write the part lines before the first step, from top to bottom, and the parts are stacked in that order.

- `route <name>: <node> - <node> - ..., ... [from: <node>, to: <node>]` is a network. It carries a sent chip from `from` to `to` along the shortest path
- `queue <name> [order: <field>, accept: <name>]` is a waiting line. It sorts chips from the highest value of the `order` field. With `accept`, the input strip sends only chips with those names into the queue, and the send button cannot be pressed for any other name. Wrap two or more names as `accept: "<name>, <name>"`. When the first field has a `choose` line, the names in `accept` come from its choices
- `chain <name> [edit: <field>]` is a chain of blocks. Each block holds the previous block's `hash` as `prev`, and with `edit` the reader can change that field of a chip inside a block
- `log <name> [all: <field> = <value>, yes: <mark>, no: <mark>]` is a log. It lists the chips a button gathers as numbered records, and unlike a chain a record has no `prev` or `hash`. With `all`, a record shows the `yes` mark when that field of every chip in it has the value, and the `no` mark when even one differs
- `ask <field>, <field>, ... [into: <queue or field>, via: <route>]` is the input strip. The first field's value becomes the chip's name. When `into` names a field, a sent chip enters the queue whose name matches that field's value. Give that field a `choose` line and place a queue named after each choice
- `choose <field>: <value>, <value>, ...` gives that field choices. The reader picks one from the choices in the written order instead of typing. The first field takes choices too, and changing that field of a chip inside a block picks from the same choices
- `press <name> [from: <queue>, into: <chain or log>, take: <count>, at: <part>]` is a button. It moves the top `take` chips of the queue into a new block or a new record. Write two or more queues as `from: "<queue>, <queue>"` and it gathers the top `take` chips of each, in the written order, into one block or record, and cannot be pressed while any of those queues holds fewer than `take`. With `at` it sits on that part, and without it in the input strip
- `side <part>, <part>, ...` puts route, queue, chain, and log parts on one row, left to right in the written order, when the frame is wide. A queue takes only the width its chips need and the rest goes to the route and chain. When the row would shrink the text below a readable size, the parts stack as without the line
- `check <node>: <field> <op> <value> [no: <error>, retry, into: <log>]` is a gate on a node of the shortest path of the route that `ask` sends through (`via`). A sent chip checks the gates of each node it reaches in the written order, and stops at that node on the first gate whose condition does not hold. A stopped chip enters no queue, and the `into` log, which has no `all`, gains one record with the chip, the node, the `no` error and whether it can be retried. The op is `>=`, `<=`, `>`, `<`, `==` or `!=`. When the value is a number, the field is compared as a number and a field that is not a number does not pass. A value that is not a number is compared as text with `==` and `!=`. Records of a gate with `retry` are marked retryable, and those of a gate without it are marked fix and resend

Declare chips with `item <name> [<field>: <value>]`. Inside a step, `line` writes a queue's contents or a block, and `ask <value>, ...`, `press <name>`, and `item <name> [<field>: <value>]` write the author's example (send, build, change).
The player stops at the first step and waits for the reader, and adds one step and plays it each time the reader sends, presses, or changes a value. Images, videos, and print draw the author's example steps.

```dragon
try How a transaction gets into a block

route Network: You - node-1 - Builder, You - node-2 - node-3 - Builder [from: You, to: Builder]
queue Mempool [order: Fee]
chain Chain [edit: Amount]
ask Sender, To, Amount, Fee [into: Mempool, via: Network]
choose To: Bob, Carol, Dave, Erin
press Build [from: Mempool, into: Chain, take: 2]

item tx1 [To: Carol, Amount: 3, Fee: 7]
item tx2 [To: Dave, Amount: 5, Fee: 5]
item tx3 [To: Erin, Amount: 2, Fee: 4]

step Transactions wait in line
  say Transactions in the mempool line up from the highest fee.
  line Chain: tx1
  line Mempool: tx2, tx3

step You send one
  say Your transaction crosses the network to the builder.
  ask You, Bob, 5, 12

step The builder makes a block
  say The two highest fees go into block 2, which holds block 1's hash as prev.
  press Build
```

### Pipe diagram

Start with `pipe` to draw a pipe diagram, which follows one transaction step by step: the calls between contracts, the balances, and the stored values.
Declare the parties with `box`. Whether each party is a sender, a contract, a token contract, or an account comes from the lines, so it is not written.

- `hold <owner>: <amount> <token>, <amount> <token>` declares balances before the first step, and `hold <contract>: <name> <value>` declares a stored value. Name a token by its declared party, as in `box usdc as USDC`. `ETH` needs no declaration. Wrap names that read as amounts and names that contain `[` in `"`
- `<caller> -> <callee>: <text>` is a call. `[value: <amount> ETH]` sends ETH with it, `[call: delegate]` borrows the callee's code and writes to the caller's values, `[call: static]` cannot write, and `[fold]` folds the call's inner steps into one box that opens when pressed
- `return <party>: <value>` closes the innermost open call, and `revert <party>: <reason>` fails it and rolls back only the changes inside it
- `move <token>: <amount> <from> -> <to>` moves a balance through the token's pipe, and `write <party>: <name> <value>` rewrites a value plate
- `check <party>: <left> <op> <right>` is a check with `>=`, `<=`, `==`, `!=`, `>`, or `<`. dragon compares numbers itself, and a check on other values fails only with `[fail]`
- `emit <party>: <name>(<arg>, ...)` is an event, and `calc <party>: <in> -> <out>` is a conversion
- `gist <key point>` is the key point of the step, shown in a note after the step's arrows under the figure. A pipe diagram does not show the step body under the figure, so write here a point the body alone would carry. A step takes at most one, and other kinds of diagram cannot take it

Tank levels are drawn to scale for each token. Changes stay provisional (hatched) until the outermost call returns, and then they all turn final (green). Changes that a `revert` rolls back are marked in red.

```dragon
pipe Swap 1 ETH for USDC

box alice as Alice
box ex as Exchange
box old as OldPool
box pool as Pool
box usdc as USDC

hold alice: 1 ETH, 0 USDC
hold ex: 0 ETH
hold pool: 5000 USDC
hold ex: "swaps[alice]" 0

step Alice asks Exchange with 1 ETH attached
  say ETH attached to a call moves into the callee's tank as the call is made.
  alice -> ex: swap [value: 1 ETH]

step The old pool is closed
  say The check fails, and every change up to it rolls back.
  ex -> old: swap
  check old: open == true [fail]
  revert old: closed

step Read the pool price
  say A call that cannot write reads only the price.
  ex -> pool: price [call: static]
  return pool: 3200

step Hand the swap to the pool
  say The inner steps fold into one box, which opens when pressed.
  ex -> pool: swap [fold]

step Work out the amount to pay
  say Work out how much USDC 1 ETH is worth at the current price.
  calc pool: 1 ETH -> 3200 USDC

step USDC moves to Alice
  say USDC takes the amount from the pool's balance and adds it to Alice's.
  pool -> usdc: transfer
  move usdc: 3200 pool -> alice
  emit usdc: Transfer(pool, alice, 3200)
  return usdc: true

step The pool returns the amount it paid
  say Even after the inner call returns, the changes stay provisional.
  return pool: 3200 USDC

step The swap ends
  say Exchange writes its record and returns, and every change becomes final here.
  gist Every change becomes final when the outermost call returns
  write ex: "swaps[alice]" 1
  emit ex: Swapped(alice, 3200)
  return ex: 3200 USDC
```

## Source JSON

The source JSON has a skeleton of the format version (`version`), the diagram kind (`kind`), the title (`title`) and the steps (`steps`), and lists the blocks placed on the diagram under a field for each block name (`blocks`).
Boxes go in `blocks.box`, groups in `blocks.group`, and the strip in `blocks.strip`.
Git graph branches go in `blocks.branch`, the paths a state diagram does not take in `blocks.path`, lineup chips in `blocks.item`, and lineup roles in `blocks.role`.
A time diagram's scale, period, rows, points and zoom range go in `blocks.scale`, `blocks.period`, `blocks.row`, `blocks.point` and `blocks.zoom`.
What happens in a step (lines and actions inside a box) goes in each step's `events`.

```json
{
  "version": 2,
  "kind": "sequence",
  "title": "Send and receive",
  "blocks": {
    "box": [
      { "id": "a", "name": "Sender" },
      { "id": "b", "name": "Receiver" }
    ]
  },
  "steps": [
    {
      "title": "Send",
      "body": "The sender sends to the receiver.",
      "events": [{ "type": "edge", "from": "a", "to": "b", "carry": { "kind": "envelope" } }]
    }
  ]
}
```

Version 1 sources (with `boxes` or `regions` at the top) can still be read.
`readDiagram` moves a version 1 source to the version 2 shape, returns it, and notes the move in `warnings`.
To rewrite the source file itself, use `migrateFile` from `@cardenelabs/dragon/node`.
The mapping between version 1 and version 2 fields is in [`CHANGELOG.md`](https://github.com/cardene777/dragon/blob/main/CHANGELOG.md).

## Export

Export uses a headless Chromium and captures the same drawing as the page one frame at a time, with the clock stopped.
The captured frames are packed into MP4 and GIF inside the same Chromium, so ffmpeg is not needed.
Install `playwright-core`, which runs Chromium, only when you use export.

```sh
pnpm add -D playwright-core
pnpm exec playwright-core install chromium
```

Pass the source JSON (`.json`) or the notation (`.dragon`) and it writes four files with the same name.

```sh
dragon export ccip.json --out out
```

| Option | Meaning |
|---|---|
| `--out <dir>` | Where to write. Created if missing (default: the current dir) |
| `--width <px>` | Frame width. Picks the view (`fixed` / `follow`) and sets the window width for `follow` |
| `--palette <name>` | Colors (`clear` / `paper` / `night` / `arcade` / `sea`, default `paper`, and `sea` for the pipe diagram). `arcade` also cuts the top-right and bottom-left corners of boxes |
| `--theme <mode>` | `light` or `dark` |
| `--lang <lang>` | Language of the text in the diagram (overview labels, the names read in HTML, and the message when it cannot draw) and of the command's usage and error messages (`ja` or `en`). Defaults to `en` for both notation files and source JSON |
| `--fps <n>` | Frames per second of the MP4 (default 30) |
| `--gif-fps <n>` | Frames per second of the GIF (default 10) |
| `--format <formats>` | The formats to write, separated by `,` (default `mp4,gif,html,png`) |

The PNG is a still of the last step in the `fixed` view.
When text overlaps in some step, the export still finishes and prints each overlap on its own line to standard error, with the step and the text (with `--lang en`, for example `Step 5: Step number 1 and step number 5 overlap`). The exit code stays 0.
The HTML is a single file with fonts cut down to the characters the diagram draws, and it fetches nothing from outside.
To call it from Node, use `exportDiagram` from `@cardenelabs/dragon/export`.

## License

MIT
