# Notation shared by every kind

This file covers the syntax every kind shares. The lines that only one kind takes are in that kind's file under `references/kinds/`.
Back to the workflow: [SKILL.md](../SKILL.md).

## The four rules

1. The first English word of a line decides what the line is. Only arrow lines start with a box id (`a -> b`).
2. A colon separates a key from its value. Attributes go in `[ ]` at the end of the line, separated by `,`.
3. Names and text with spaces go at the end of the line or before `[`. Wrap only attribute values that contain `,` or `]`, and names that contain `[`, in `"`.
4. The only nesting is `group ... end` (and `block ... end` in definitions). A step runs until the next `step`. Indentation is for reading, except that lines continuing a `say` must be indented deeper than `say`.

## Order of a file

| Part | Lines | Where |
|---|---|---|
| Head | `<kind> <title> [view: fixed]` | First line. Comments may come before it |
| Block definitions | `blocks 1`, `block +name ... end` | Right after the head, only when you add blocks ([blocks](blocks.md)) |
| Declarations | `box`, `group ... end`, `strip`, and the kind's own declarations | Before the first `step` |
| Steps | `step`, `say`, `code`, `source`, and what happens | From the first `step` to the end |

Lines starting with `//` and blank lines are not read.

## Head line

`<kind> <title>`. The kinds are `sequence`, `architecture`, `state`, `git`, `time`, `tree`, `lineup`, `try`, `pipe` and `flow`.

- Only `sequence`, `architecture` and `state` can leave out the title. Write a title anyway unless it is a short-form draft.
- `[view: fixed]` keeps the whole diagram still and moves only what is inside. `[view: follow]` moves the frame to where things happen and shows a small overview. Leave it out and dragon picks by text size.

## Boxes and groups

```text
box <id> as <name> [note: <caption>, color: <role>, icon: <icon>, link: <URL>]
group <id> as <name> [note: <note>, color: <role>, icon: <icon>]
  box ...
end
```

- An id has no spaces and none of `[ ] = :`. Keep ids short ASCII words (`api`, `srcPool`).
- Without `as <name>`, the id is the name.
- `group` is for `architecture` only. To add boxes to a group again later, open `group <id>` with the id only.
- `link` makes the box a link. Write a path starting with `/` or a URL starting with `http://` or `https://`.

## Lines

```text
<from> -> <to>: <label> [carry: coin, tag: <text>, side: below]
```

- The label is optional. A label may contain `,`; it ends at `[` or the end of the line.
- `carry` is what travels: an envelope when left out, `coin` for money, `none` for nothing.
- `tag` writes a short value on a tag that travels along the line.
- `side` is `above`, `below`, `left` or `right`. Write it only when the automatic label place overlaps something, for example `[side: below]` on replies in a sequence diagram.
- `git`, `tree`, `time` and `pipe` give `->` their own meaning. Read the kind file.

## Steps

```text
step <title>
  say <one or two sentences>
  code <command shown for this step>
  source <name> [url: <URL>]
  <lines and actions that happen in this step>
```

- Every step needs a body. Write `say` in every explanation diagram. Only `sequence`, `architecture` and `state` fall back to the line labels when `say` is missing.
- For a longer body, write `say` alone and continue on lines indented deeper.
- `code` shows one command or call for the step. At most one per step.
- `source` lists a reference for the step. A step can have several. They appear as links in the step list that screen readers read.
- `act <id>: <action>` shows work done inside a box without a line.
- `note <id>: <text>` rewrites the caption under a box from this step on.

## Strip

```text
strip <title>: <field>, <field>, <field>
```

Declare a strip before the first step to show values that change over the steps. Inside a step, `set <field>: <value>` fills a field and `set <field> [tag: <text>]` adds a tag to it.
A strip works in every kind except `pipe` and `try`.

## Attribute values

| Key | Values |
|---|---|
| `color` | `blue`, `amber`, `green`, `violet`, `rose`, `slate`, `coin` |
| `icon` | `app`, `block`, `bolt`, `box`, `branch`, `card`, `cart`, `chain`, `check`, `clock`, `cloud`, `code`, `db`, `doc`, `env`, `exe`, `flag`, `globe`, `idx`, `key`, `layers`, `lock`, `net`, `off`, `on`, `paint`, `pool`, `refresh`, `router`, `server`, `shield`, `sign`, `tree`, `truck`, `undo`, `user`, `x`, `yen`, a `+name` icon block, or `tabler:<name>` for a Tabler outline icon (for example `tabler:building-bridge-2`) |
| `carry` | `coin`, `none` |
| `side` | `above`, `below`, `left`, `right` |
| `view` | `fixed`, `follow` |

Pick colors by meaning and keep them consistent in one diagram: for example `slate` for people and clients, `blue` for your system, `green` for success, `rose` for failure, `amber` for waiting or money.
`lineup` takes no icons.
`tabler:<name>` works on box and group lines only, and the name must be one of the Tabler outline icons; `dragon check` names the closest one when it is not.

Wrap a value that contains `,` or `]` in `"`, and write `"` and `\` inside it as `\"` and `\\`.

## Which line works in which kind

| Line or attribute | Kinds |
|---|---|
| `step`, `say`, `code`, `source` | all |
| `gist` | `pipe` |
| `box` | all except `try` (which declares its own parts) |
| `note` | all except `pipe` and `try` |
| `act`, `link`, `carry`, `->` lines between boxes | `architecture`, `flow`, `git`, `sequence`, `state`, `time`, `tree` |
| `icon` | all except `lineup` and `try` |
| `color` on boxes | all except `pipe` and `try` |
| `strip` and `set` | `architecture`, `flow`, `git`, `lineup`, `sequence`, `state`, `time`, `tree` |
| `choice` | `flow` |
| `group ... end` | `architecture` |

## The short form

Only `sequence`, `architecture` and `state` take the short form.

- The head line may be the kind word alone. The title becomes the kind word.
- With no `box` line, each name on a line becomes a box, in the order it first appears.
- With no `step` line, each line becomes one step, lit in the order written.
- A step without `say` uses the line label as its body. A line without a label uses the box names joined by an arrow.
- Once you write one `box` or `step` line, the full rules apply again: every id must be declared, and every line must sit under a step.

```dragon
state

start -> draft: create
draft -> review: submit
review -> published: approve
published -> finish
```

When a short-form diagram has two names that differ by one character, `dragon check` prints a `warning` and still draws two boxes. Fix it when it is a typo.

## A complete example

```dragon
architecture Send orders to the warehouse

group shop as Shop [note: takes orders, color: blue, icon: cart]
  box intake as Intake [note: takes the order, icon: app]
end

group warehouse as Warehouse [note: ships the goods, color: green, icon: box]
  box shipping as Shipping [note: ships the goods, icon: truck]
end

strip Order: Number, State

step Take the order
  say Intake checks the cart and gives the order a number.
  code POST /orders
  act intake: check the cart
  set Number: #42
  set State: taken

step Pass to shipping
  say
    Intake passes two order numbers to shipping in one message.
    Shipping sends the goods in the order the numbers arrive.
  intake -> shipping: OK to ship [tag: "#42, #43"]
  note shipping: 2 orders waiting
  set State: shipping
```

## Errors and warnings

Every error names a line and a column, and the message says what to write instead.
Examples of what the parser says.

```text
A line cannot start with foo. Start a line with group / end / box / ... or <id> -> <id>
Write group, box, strip, branch, scale, period, row, point and zoom before the first step
No box named c is declared
Step "A" needs a body (a say line)
There is no icon named serverr. The closest is server
color is one of blue / amber / green / violet / rose / slate / coin
```

The old notation (lines starting with `#` or `region`, or a Japanese kind word) is not read. The error shows the new form of that line.
