# Writing the notation

A dragon diagram is written by people in the notation and kept by tools as JSON (the source).
The notation is line based: each line is one line of the diagram, and under each step heading you list what happens in that step, in order.
Examples that use every form are `oauth.en.dragon` (a sequence diagram) and `ccip.en.dragon` (an architecture diagram) in this directory.

The notation can be written with English words or with Japanese words (`quick-start.md`).
The first line decides which: start with `sequence` or `architecture` for English words.
One file uses one language; a line with a word from the other language is an error.

## The smallest diagram

```dragon
sequence Ask to sign in

browser = User's browser "operated by the user" [color slate]
app = App "asks for sign-in" [color blue]

# Press sign in
> The user presses the app's sign-in button.
browser -> app : GET /login
```

## Line forms

Before the first step heading (`#`), declare the diagram kind and title, regions, boxes, and the strip.

| Line | Form | Example |
|---|---|---|
| Kind and title | `sequence <title>` or `architecture <title>` | `architecture Send tokens with CCIP` |
| View | `view fixed` or `view follow`. Without it, the view is chosen by the text size when the whole diagram fits the frame | `view follow` |
| Region | `region <id> = <name> "<note>"` | `region source = Source chain "e.g. Ethereum" [color blue]` |
| Box | `<id> = <name> "<caption>"` | `OnRamp = OnRamp "checks and sends" [region source]` |
| Strip | `strip <title> = <field>, <field>` | `strip Message = ID, receiver, state` |

Under a step heading, list these lines in the order things happen.

| Line | Form | Example |
|---|---|---|
| Step title | `# <title>` | `# Lock the tokens` |
| Step body | `> <body>`. It may span two or more lines | `> OnRamp calls the Token Pool.` |
| Command for the step | `` `<command>` ``. At most one line per step | `` `lockOrBurn()` `` |
| Line | `<id> -> <id> : <label>`. The label can be left out | `OnRamp -> sourcePool : lockOrBurn() [coin]` |
| Action in a box | `<id> : <action>` | `OnRamp : check the contents` |
| New caption under a box | `<id> "<text>"` | `sourcePool "−100 USDC"` |
| Strip value | `strip <field> = <value>` or `strip <field> [<tag>]` | `strip state = SUCCESS` |

`fixed` keeps the whole diagram still and moves only what is inside; `follow` moves to where things are happening and shows the current place in a small overview in the corner.
Without a view line, the view is `fixed` when the text of the whole diagram in the frame is 10.5px or larger, and `follow` when it is smaller.

Every step needs a body.
Screen readers read each step's title and body in step order.

An id may be spelled like a word (`region`, `strip`, `view`).
The line shape tells them apart: `region source = …` declares a region, `region = …` declares a box named `region`, and `strip -> app : …` is a line from the box `strip`.

## Quotes

Notes, captions, and new captions can be quoted with `"…"` or with `「…」`.
When a name or the text itself contains `"`, quote with `「…」`, as in `app = Say "hi"「greeting」`.

## `[...]` options

Put `[<key> <value>]` at the end of a line to set how it looks and what it carries.

| On | Option | Meaning |
|---|---|---|
| Region and box | `[color <color>]` | Colour role. One of `blue` / `amber` / `green` / `violet` / `rose` / `slate` / `coin` |
| Region and box | `[icon <icon>]` | Icon next to the name |
| Box | `[region <id>]` | The region the box sits in. Declare the region first |
| Line | `[tag <value>]` / `[coin]` / `[none]` | What travels on the line. Without it, an envelope travels |
| Line | `[label above]` / `below` / `left` / `right` | Which side of the line the label goes. Write it only when the automatic placement breaks |

Lines starting with `//` and empty lines are not read.
Spaces at the start of a line mean nothing.

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
Writing JSON back as notation uses a fixed layout, so the writer's line order and comments are not kept.
Write-back uses the language of the notation you were writing; the page and `printNotation(diagram, { lang: "en" })` take it as an option, and Japanese is the default.
The JSON shape is defined in `src/schemas/diagram.schema.json`, and the `version` field holds the format version.
