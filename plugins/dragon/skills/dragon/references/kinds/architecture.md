# architecture

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

The parts of a system, where they live, and what flows between them: services in a cloud, contracts on two chains, a client and its backend, a data pipeline across teams.
Groups draw the places (a chain, a cloud, a device). Steps follow one message, request or token as it moves.

Pick `sequence` instead when the order of messages between a few parties is the point, and `pipe` when balances inside one transaction are the point.

## Lines

| Line | Meaning |
|---|---|
| `group <id> as <name> [note: ..., color: ..., icon: ...]` ... `end` | A place. The `box` lines in between sit inside it |
| `group <id>` ... `end` | Opens the same group again to add boxes later. Write the name and attributes only the first time |
| `box <id> as <name> [note: ..., icon: ...]` | A part. Boxes outside any group are allowed |
| `<from> -> <to>: <label>` | Something moving from one part to another, across groups too |
| `act <id>: <action>` | Work done inside a part |
| `note <id>: <text>` | Rewrites the caption under a part from this step on |
| `code <command>` | The call shown for the step |
| `strip <title>: <field>, ...` and `set <field>: <value>` | Fields of the message or state that change over the steps |

## How to write it well

- Give each group a `color` and each box an `icon` that names its role.
- Order groups in the direction things flow, and boxes inside a group in the order they are used.
- Lines can be written without a label when the step's `say` explains them.
- Show money or tokens with `[carry: coin]`, and amounts with `note <id>: -100 USDC`.
- When the whole diagram would make text too small, dragon switches to the `follow` view by itself. Write `[view: ...]` on the head line only to force one.

## Example

```dragon
architecture Upload a photo and make a thumbnail

group client as Phone [note: the user's device, color: slate, icon: user]
  box app as Photo app [note: picks the photo, icon: app]
end

group cloud as Cloud [note: our service, color: blue, icon: cloud]
  box api as Upload API [note: checks the file, icon: server]
  box store as Storage [note: keeps originals, icon: db]
  box worker as Thumbnail worker [note: resizes, icon: exe]
end

strip Photo: Size, Thumbnail

step Upload
  say The app sends the photo to the upload API, which checks its type and size.
  code PUT /photos/123
  app -> api: upload
  act api: check type and size
  set Size: 3.2 MB

step Store and queue
  say The API stores the original and asks the worker to make a thumbnail.
  api -> store: save original
  api -> worker: make thumbnail

step Make the thumbnail
  say The worker reads the original, resizes it, and stores the result next to it.
  store -> worker: original
  act worker: resize to 256 px
  worker -> store: thumbnail
  set Thumbnail: ready
```
