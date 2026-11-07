# tree

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Values that fold up into their parents until one root remains: a Merkle tree, a Merkle proof, a hash tree of files, a tournament bracket.
Each box appears in the step that writes it. Leaves line up from the left, and each parent sits above the middle of its children.

## Lines

| Line | Where | Meaning |
|---|---|---|
| `leaf <id> [hash: <value>]` | In a step | A leaf. Leaves line up from the left in written order. With a value, the box shows the value and a card below shows the id |
| `node <id> of <child>, <child> [hash: <value>]` | In a step | A parent of the listed children. The box no parent takes becomes the root |
| `<child> -> <parent> [tag: <value>]` | In a step | A value climbing the tree line. The line keeps the color once passed |
| `box <id> as <name> [note: ...]` | Before the first step | Optional. A box outside the tree, such as the block header that stores the root |
| `strip <title>: <field>, ...` and `set <field>: <value>` | Strip before the first step, `set` in a step | Values of the proof as it is checked |
| `note <id>: <text>`, `act <id>: <action>` | In a step | Updates a box |

- A `hash` is 4 to 40 characters of `0-9` and `a-f`. Short 4-character values read best.
- Write every child before its parent.
- From the step where a value first climbs a tree line, only the boxes that send or receive values are drawn strongly. Use that to show which values a proof needs.

## How to write it well

- Build the tree in a few steps (leaves, each level, the root), then climb with the proof in later steps.
- In the proof steps, draw the value you have and the neighbour value you take, both with `[tag: ...]`. Climb one level per step in a deep tree.
- Keep a strip of the values used and the computed root, and end with the comparison.

## Example

```dragon
tree Prove a file is in the release

box manifest as Release manifest [note: root 9c1e, color: green, icon: doc]

strip Proof: File, Values used, Result

step Hash each file
  say Each of the four files is hashed. The hashes become the leaves.
  leaf app [hash: 3fa0]
  leaf lib [hash: 8b04]
  leaf docs [hash: c41d]
  leaf logo [hash: e5f8]

step Build up to the root
  say Neighbouring hashes are joined in pairs, and the last pair gives the root that the manifest stores.
  node src of app, lib [hash: 7a21]
  node assets of docs, logo [hash: b9e4]
  node root of src, assets [hash: 9c1e]

step Check docs with two values
  say To check docs, take its neighbour logo to get b9e4, then take src to reach the root.
  docs -> assets [tag: c41d]
  logo -> assets [tag: e5f8]
  assets -> root [tag: b9e4]
  src -> root [tag: 7a21]
  set File: docs
  set Values used: e5f8, 7a21

step Compare with the manifest
  say The computed root equals the one in the manifest, so docs is part of this release.
  manifest -> root: compare [tag: 9c1e]
  set Result: match
```
