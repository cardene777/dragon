# @cardenelabs/dragon

Animated diagrams that people write in a plain notation and AI writes as JSON.

[日本語](https://github.com/cardene777/dragon/blob/main/packages/dragon/README.ja.md)

dragon draws a diagram that plays step by step from a short text file.
The catalog, with every kind of diagram and an editor that plays what you type, is at <https://cardene777.github.io/dragon/>.

## Install

```sh
npm install @cardenelabs/dragon
```

The package has four parts.

| Part | What it is |
|---|---|
| Source | JSON with a skeleton of kind, title and steps, and a field for each block name (`blocks`) (see below). It carries a format version, and older versions are converted when read |
| Notation | The dragon notation, where the first English word of each line decides its kind (the section below). It converts to and from JSON, and names and text can be in any language ([notation guide](https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md)) |
| Renderer | Draws the source on a page and plays it one step at a time. It draws sequence, architecture, state, git, time, and tree diagrams |
| Export | The `dragon export` command writes MP4, GIF, HTML, and PNG from the same source |

## A first diagram

```dragon
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate]
box app as App [note: asks for sign-in, color: blue]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
```

Paste it into the editor on the catalog to watch it play, or put it on your own page as the next section shows.

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
It exports the same functions as the default entry, but leaves out the renderers for `git`, `lineup`, `state`, `time`, and `tree` and loads them when you await `loadKind`.
After that, the same functions as the default entry draw the same diagram without waiting.

```ts
import { loadKind, mountDiagram, parseNotation } from "@cardenelabs/dragon/light";

const parsed = parseNotation(text);
if (parsed.ok) {
  await loadKind(parsed.diagram.kind);
  mountDiagram(host, parsed.diagram);
}
```

Drawing a kind that has not been loaded stops with an error that names the kind.
If loading fails, `loadKind` rejects, and the next call loads it again.
`sequence` and `architecture` are there from the start, so they draw without calling `loadKind`.
Mixing it with the default entry on one page puts every kind's renderer on the page.

## Notation

Every line follows these four rules.

1. The first English word of a line decides its kind. Only arrow lines start with a box id
2. A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`
3. Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`
4. The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`

The words that start a line are `sequence` `architecture` `state` `git` `time` `tree` `group` `end` `box` `branch` `scale` `period` `row` `point` `zoom` `strip` `step` `say` `code` `source` `commit` `mark` `span` `leaf` `node` `act` `note` `set`, and a line is written as `id -> id`.
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
| `--palette <name>` | Colors (`clear` / `paper` / `night`, default `paper`) |
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
