# Adding blocks

Read this when no existing box, line or icon expresses what the explanation needs.
Back to the workflow: [SKILL.md](../SKILL.md). Shared syntax: [notation](notation.md).

A block you add is based on one of three existing blocks and changes only its shape and color role.
It keeps the placement, the motion and the diagram kinds of its base, and reads its colors from the palette, so it looks like every other block.

## Define a block at the head of the diagram

Write the definitions right after the head line: a `blocks 1` line, then one `block +<name>` ... `end` per block.

```text
blocks 1
block +<name>
  base box | edge | icon
  shape <basic shape>          or   shape path "<svg path>"
  color <role>
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
- A definition takes only `base`, `shape` and `color`, and every `block` needs `base` and a closing `end`.
- `shape` takes a basic shape name or a path, not both.
- A path takes only path syntax: the command letters `M L H V C S Q T A Z` (either case), numbers and separators, starting with `M`, at most 2000 characters. No URLs, code or SVG elements, so reading a definition someone else wrote runs nothing.
- Color roles are `blue`, `amber`, `green`, `violet`, `rose`, `slate`, `coin`.
- A block is written only where its base goes. A box block on an arrow, for example, is an error.

```dragon
architecture Move a token across a bridge

blocks 1
block +arch
  base box
  shape path "M 0 70 Q 50 0 100 70 Z"
  color violet
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
+arch cc as Bridge [note: holds the token]
box base as Base [note: receiving chain, icon: +seal]

step Send
  say Ethereum sends the token to the bridge, drawn as an arch.
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

| Block | Base | Shape | Color |
|---|---|---|---|
| `+bridge` | `box` | `path "M 0 70 Q 50 0 100 70 Z"` (an arch) | `violet` |
| `+relay` | `edge` | `dashed` | `amber` |
| `+key` | `icon` | `path "M -8 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 0 0 h 8 M 5 0 v 3"` | the color of its box |

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
  say Ethereum sends the token to the bridge, drawn as an arch.
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
4. Build the fork so its `dragon` knows the new block (`pnpm install`, then `pnpm build:packages`), run `dragon check` on both files with the fork's CLI (`node packages/dragon/dist/cli.js check <file>`), and fix every error. Then run `pnpm verify` as the repo's `CONTRIBUTING.md` asks.
5. Open the pull request with `gh pr create`. The title starts with `feat:`. Fill the template's headings: what the block shows and which diagrams need it, why no existing block works, and how you checked it.
6. Stop there. The maintainers review and merge. Never merge it yourself.

```sh
gh pr create --repo cardene777/dragon --title "feat: add the shared block +<name>" --body-file pr-body.md
```

If none of `box`, `edge` or `icon` can serve as the base (the explanation needs a new kind of part or a new kind of diagram), do not force it into a block.
Open an issue instead with `gh issue create --repo cardene777/dragon`, describing what the diagram must show and why the three bases cannot express it.
