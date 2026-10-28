# Writing dragon notation

A dragon diagram is written by people in dragon notation and kept by tools as JSON (the source).
The first English word of each line decides its kind, and under each `step` line you list what happens in that step, in order.
Examples that use every form are `oauth.en.dragon` (a sequence diagram), `ccip.en.dragon` (an architecture diagram), and `order.en.dragon` (a state diagram) in this directory.

The words of the notation are English only, and box names and step bodies can be written in any language.
The Japanese guide is `quick-start.md` in this directory.

## The smallest diagram

```dragon
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate]
box app as App [note: asks for sign-in, color: blue]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
```

## Rules

Every line follows these four rules.

1. The first English word of a line decides its kind. Only arrow lines start with a box id
2. A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`
3. Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`
4. The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`

## Line forms

Before the first `step` line, declare the diagram kind and title, regions, boxes, and the strip.

| Line | Form | Example |
|---|---|---|
| Kind and title | `sequence <title>`, `architecture <title>`, or `state <title>`. Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the line | `architecture Send tokens with CCIP [view: follow]` |
| Region | Open with a `group <id> as <name> [note: <note>]` line and close with an `end` line. The boxes on the `box` lines in between go inside the region | `group source as Source chain [note: e.g. Ethereum, color: blue]` |
| Box | `box <id> as <name> [note: <caption>]`. Without `as <name>`, the id is the name | `box OnRamp [note: checks and sends]` |
| Strip | `strip <title>: <field>, <field>` | `strip Message: ID, receiver, state` |

Inside a step, indent these lines in the order things happen.

| Line | Form | Example |
|---|---|---|
| Step title | `step <title>`. A step runs until the next `step` or the end of the file | `step Lock the tokens` |
| Step body | `say <body>`. To split it over two or more lines, write `say` alone and continue on lines indented further below it | `say OnRamp calls the Token Pool.` |
| Command for the step | `code <command>`. At most one per step | `code lockOrBurn()` |
| Line | `<id> -> <id>: <label>`. The label can be left out | `OnRamp -> sourcePool: lockOrBurn() [carry: coin]` |
| Action in a box | `act <id>: <action>` | `act OnRamp: check the contents` |
| New caption under a box | `note <id>: <text>` | `note sourcePool: −100 USDC` |
| Strip value | `set <field>: <value>` or `set <field> [tag: <tag>]` | `set state: SUCCESS` |

`fixed` keeps the whole diagram still and moves only what is inside; `follow` moves to where things are happening and shows the current place in a small overview in the corner.
Without a view, the view is `fixed` when the text of the whole diagram in the frame is 10.5px or larger, and `follow` when it is smaller.

Every step needs a body.
Screen readers read each step's title and body in step order.

When boxes of the same region are not next to each other, open the same `group <id>` again and write the rest of its boxes.
The second time, write only the id, and give the name and attributes only the first time.

In a state diagram (`state <title>`), each box is a state and each line is a move from one state to another.
Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark.
Lines written before the first `step` line are paths the diagram could take but does not this time, drawn dotted.

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

## Attributes

Inside the `[ ]` at the end of a line, list `<key>: <value>` pairs separated by `,` to set how it looks and what it carries.

| On | Key | Meaning |
|---|---|---|
| Kind and title | `view` | The view. `fixed` or `follow` |
| Region and box | `note` | The note of a region, or the caption under a box |
| Region and box | `color` | Colour role. One of `blue` / `amber` / `green` / `violet` / `rose` / `slate` / `coin` |
| Region and box | `icon` | Icon next to the name |
| Line | `carry` | What travels on the line. `coin` or `none`. Without it, an envelope travels |
| Line and strip value | `tag` | The text of a tag that travels on the line, or a tag on a strip field |
| Line | `side` | Which side of the line the label goes. `above` / `below` / `left` / `right`. Write it only when the automatic placement breaks |

Wrap a value that contains `,` or `]` in `"`, and write `"` and `\` inside it as `\"` and `\\`.
Lines starting with `//` and empty lines are not read.

## Errors

A line that cannot be read stops with an error that shows its line and column.
The caller chooses the language of the error (`parseNotation(text, { lang: "en" })` or `dragon export --lang en`), and Japanese is the default.
A line in the old form (such as one starting with `#` or `region`) stops with an error that shows the new form of that line.
A table from the old form to the new one is in the English version of the guide page in the sample site.

## Embedding in documents

In a README or an article, write the diagram in a fence whose language is `dragon`.
A document can embed any number of diagrams.

````markdown
```dragon
sequence Ask to sign in
...
```
````

## Going between the notation and JSON

The notation and JSON convert both ways.
Writing JSON back as notation uses a fixed layout, so the writer's line order and comment lines are not kept.
The JSON shape is defined in `src/schemas/diagram.schema.json`, and the `version` field holds the format version.
