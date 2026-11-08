# Adding blocks

Read this when no existing box, line or icon expresses what the explanation needs.
Back to the workflow: [SKILL.md](../SKILL.md). Shared syntax: [notation](notation.md).

A block you add is based on one of three existing blocks and changes only its shape and color role, and for a box also its icon.
It keeps the placement, the motion and the diagram kinds of its base, and reads its colors from the palette, so it looks like every other block.

## Define a block at the head of the diagram

Write the definitions right after the head line: a `blocks 1` line, then one `block +<name>` ... `end` per block.

```text
blocks 1
block +<name>
  base box | edge | icon
  shape <basic shape>          or   shape path "<svg path>"
  color <role>
  icon <icon name>             box only: a hand-drawn icon or tabler:<name>
end
```

| Base (`base`) | Where you write it | Shape (`shape`) | Color (`color`) |
|---|---|---|---|
| `box` | `+<name>` in place of `box` on a box line | `round`, `circle`, `cylinder`, `diamond`, `hexagon`, or `path "..."` drawn in a 100 by 100 square | A color role |
| `edge` | `+<name>` in place of `->` on a line | `solid`, `dashed`, `dotted` (no path) | A color role |
| `icon` | `[icon: +<name>]` on a box line | `path "..."` drawn in a 20 by 20 square centered on (0, 0). Required | None. It takes the color of its box |

The parser enforces these rules.

- `blocks 1` comes first. A definition without the version line, or with another version, is refused.
- A name matches `^\+[a-z][a-z0-9-]*$`: a `+`, a lowercase letter, then lowercase letters, digits and `-`. The same name cannot be defined twice.
- A definition takes only `base`, `shape`, `color` and `icon`, and every `block` needs `base` and a closing `end`.
- Only a definition based on `box` takes `icon`. It takes the same names as `icon:` on a box line (a hand-drawn icon or `tabler:<name>`), not an added icon block (`+<name>`). An icon written on the box line wins over the definition's.
- `shape` takes a basic shape name or a path, not both.
- A path takes only path syntax: the command letters `M L H V C S Q T A Z` (either case), numbers and separators, starting with `M`, at most 2000 characters. No URLs, code or SVG elements, so reading a definition someone else wrote runs nothing.
- Color roles are `blue`, `amber`, `green`, `violet`, `rose`, `slate`, `coin`.
- A block is written only where its base goes. A box block on an arrow, for example, is an error.

```dragon
architecture Move a token across a bridge

blocks 1
block +span
  base box
  color violet
  icon tabler:building-arch
end
block +handover
  base edge
  shape dashed
  color amber
end
block +seal
  base icon
  shape path "M -8 -8 h 16 v 16 h -16 Z M -4 0 h 8"
end

box eth as Ethereum [note: sending chain, color: blue]
+span cc as Bridge [note: holds the token]
box base as Base [note: receiving chain, icon: +seal]

step Send
  say Ethereum sends the token to the bridge, drawn with an arch icon.
  eth -> cc: send

step Hand over
  say The bridge hands the token to Base over a dashed hand-over line.
  cc +handover base: hand over
```

## Other places to define blocks

| Where | Scope |
|---|---|
| The head of a diagram (above) | That diagram only |
| A file read by `<link rel="dragon-blocks" href="blocks.dragon">` on the page | Every `<pre class="dragon">` block on that page |
| Code: `readBlocks(text)` passed as the `blocks` option of `parseNotation` and `renderDiagram` | The diagrams you pass it to |

```ts
import { parseNotation, readBlocks, renderDiagram } from "@cardenelabs/dragon";

const read = readBlocks(definitionText); // or JSON shaped as { "format": 1, "blocks": [...] }
if (read.ok) {
  const parsed = parseNotation(notation, { blocks: read.blocks });
  if (parsed.ok) renderDiagram(parsed.diagram, { blocks: read.blocks });
}
```

## Shared blocks

The dragon repo keeps a shared block collection in `packages/dragon/blocks/<name>.dragon`, one definition per file (`blocks 1` and one `block`).
A shared block works as `+name` in any diagram without a definition.

| Block | Base | Shape | Color | Use it for |
|---|---|---|---|---|
| `+bridge` | `box` | the rounded box, with the icon `tabler:building-bridge-2` (a stone bridge) | `violet` | a bridge between two chains |
| `+wallet` | `box` | the rounded box, with the icon `tabler:wallet` (a wallet) | `blue` | a wallet that holds the key and signs transactions |
| `+contract` | `box` | the rounded box, with the icon `tabler:file-code` (a file of code) | `violet` | a smart contract deployed on a chain |
| `+oracle` | `box` | the rounded box, with the icon `tabler:broadcast` (a broadcast signal) | `amber` | an oracle that brings data from off chain onto a chain |
| `+validator` | `box` | the rounded box, with the icon `tabler:shield-check` (a shield with a check) | `amber` | a validator that checks blocks and votes on them |
| `+queue` | `box` | the rounded box, with the icon `tabler:list-numbers` (a numbered list) | `amber` | a queue that keeps messages or jobs in order |
| `+cache` | `box` | the rounded box, with the icon `tabler:server-bolt` (a server with a bolt) | `violet` | a cache that keeps copies of recent reads |
| `+gateway` | `box` | the rounded box, with the icon `tabler:door-enter` (a door with an arrow going in) | `amber` | the one way in that checks requests and routes them |
| `+relay` | `edge` | `dashed` | `amber` | a relayed hand-over |
| `+async` | `edge` | `dashed` | `violet` | a message sent without waiting for an answer |
| `+key` | `icon` | `path "M -8 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 0 0 h 8 M 5 0 v 3"` | the color of its box | a key on a box |

- A definition at the head of the diagram (or in a page link or the `blocks` option) with the same name wins over the shared one.
- The parsed source JSON copies every shared definition the diagram used into its `define` field, so the JSON draws the same anywhere.
- Check the collection before you define a block: if a shared block fits, use it instead.
- The shared collection reaches you through the installed package. If `dragon check` says `The block +bridge is not defined`, the installed version is older than the collection: update it ([setup](setup.md)) or copy the definition to the head of the diagram.

```dragon
architecture Hand a token over a bridge

box eth as Ethereum [note: sending chain]
+bridge cc as Bridge [note: shared box]
box base as Base [note: receiving chain, icon: +key]

step Send
  say Ethereum sends the token to the bridge, drawn with a stone bridge icon.
  eth -> cc: send

step Hand over
  say The bridge hands the token to Base over a dashed relay line.
  cc +relay base: hand over
```

## Offer a reusable block to the dragon repo

When the block you defined would help other diagrams (a common concept, not a one-off picture), offer to contribute it. Ask the user first; do it only if they agree.

1. Fork or branch the dragon repo (`cardene777/dragon`). Check that `packages/dragon/blocks/` has no block of the same name.
2. Add exactly one definition file, `packages/dragon/blocks/<name>.dragon`: a `//` comment that says what the block is, `blocks 1`, and one `block +<name>` ... `end`. The file name is the block name without `+`.
3. Add exactly one example diagram, `packages/dragon/blocks/examples/<name>.dragon`, that uses the block without defining it.
4. Check both files with the installed `dragon` and fix every error. The installed `dragon` does not know the new block yet, so check the definition file on its own and pass it to the example with `--blocks`. You do not need to build the fork for this.

   ```sh
   dragon check packages/dragon/blocks/<name>.dragon
   dragon check --blocks packages/dragon/blocks/<name>.dragon packages/dragon/blocks/examples/<name>.dragon
   ```

   Add `--layout` to the second command to check the example's layout too ([layout](layout.md)).

5. Run `pnpm install` and then `pnpm verify` in the fork, as the repo's `CONTRIBUTING.md` asks. If you cannot run `pnpm verify` (for example, `pnpm install` cannot reach npm), say so in the PR body under how you checked it, with the error it printed. Do not claim it passed.
6. Open the pull request with `gh pr create`. The title starts with `feat:`. Fill the template's headings: what the block shows and which diagrams need it, why no existing block works, and how you checked it.
7. Stop there. The maintainers review and merge. Never merge it yourself.

```sh
gh pr create --repo cardene777/dragon --title "feat: add the shared block +<name>" --body-file pr-body.md
```

If none of `box`, `edge` or `icon` can serve as the base (the explanation needs a new kind of part or a new kind of diagram), do not force it into a block.
Ask for a new kind of diagram instead (next section).

## Ask for a new kind of diagram

Do this only after you tried. The explanation is written in the closest kind, `dragon check` and `dragon check --layout` pass, and the user saw the exported picture and decided it is not enough.
Ask the user first; open the issue only if they agree.

1. Write the issue body in a file. Put in what the diagram must show (the parts, what moves, and in how many steps), the notation you tried in a ```` ```dragon ```` fence, and what it could not draw with the reason the closest kind and your own blocks cannot express it.
2. Open the issue with `gh issue create`. The title starts with `feat:`.
3. Stop there. The maintainers decide whether and how to add the kind.

```sh
gh issue create --repo cardene777/dragon --title "feat: a new kind of diagram for <what it shows>" --body-file issue-body.md
```

## Report a layout break dragon draws

`dragon check --layout` can report a break that no notation fix clears, because it comes from how dragon draws: a slot or a step number that does not follow the shape of a block, or a reply drawn right next to its request ([layout](layout.md)).
Offer to report it to the dragon repo. Ask the user first; do it only if they agree.

1. Keep the smallest diagram that shows the break, and run `dragon check --layout --json` on it.
2. Export the step the break shows at: `dragon export <file> --format png --step <n>`.
3. Open an issue with `gh issue create --repo cardene777/dragon`. Write the warning line, the `layout` object from the JSON, the dragon version (`dragon --version`), and the diagram in a ```` ```dragon ```` fence. Attach the PNG when you have one.
4. Stop there. The maintainers fix how dragon draws.

```sh
gh issue create --repo cardene777/dragon --title "fix: the slot sticks out of the +bridge shape" --body-file issue-body.md
```
