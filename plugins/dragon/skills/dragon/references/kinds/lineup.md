# lineup

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Items that line up in lanes and move or reorder between them: a mempool and the blocks builders make, bids in an auction, a review queue, a kanban board, a release flow, sorting, picking a winner.
Each box is a lane. Each item is a chip. Steps rewrite which chips sit in which lane and in what order. There are no lines between boxes.
The default look is a board of pale vertical columns. `[shape: stations]` puts the lanes on one line as stops, and `[shape: layers]` stacks them as horizontal layers.

Pick `try` instead when the reader should add items and press buttons themselves.

## Declarations (before the first step)

| Line | Meaning |
|---|---|
| `box <id> as <name> [note: ..., color: ..., order: none, limit: <n>]` | A lane. On the board, lanes sit side by side from left to right in the order declared. `note` is a value chip under the name. `[order: none]` makes a pool with no order, whose cards carry no numbers. `[limit: <n>]` caps the lane: the count reads `2/3` and the board draws `n` ticks |
| `item <id>, <id>, ... [color: ..., label: ..., note: ...]` | Chips. One line can declare several chips with the same look. `label` puts up to 4 characters on a chip. `note` adds a row to the legend under the diagram |
| `role <name> [note: <note>]` | An actor shown above the lanes, lit in the steps that name it |
| `strip <title>: <field>, ...` | Optional. Values that change |

## Lines in a step

| Line | Meaning |
|---|---|
| `line <lane>: <chip>, <chip>, ...` | Sets the chips of a lane in this order. A chip that was in another lane slides over, and stays there too unless that lane is rewritten. A chip left out disappears. A lane holds up to 12 chips, and no more than its `limit` |
| `line <lane>:` | Empties the lane (nothing after the `:`) |
| `note <lane>: <text>` | Rewrites the value chip under the lane name. It stays until the next `note` on the same lane |
| `pick <lane>` | Lights up a lane and fades the others |
| `seal <lane>` | Covers a lane with a striped seal that hides its chips |
| `open <lane>` | Removes the seal |
| `stamp <lane>: <text>` | Lands a tilted stamp on the lane without touching its chips |
| `role <name>` | Lights up a declared role for this step |
| `set <field>: <value>` | Fills a strip field |

Lineup takes no icons and no `->` lines.

## Send-back

When a `line` moves a chip back to a lane declared earlier, the step is a send-back. The diagram draws a return line with a "Sent back" label, a back mark on the card, and a dashed trace in the lane the chip left.
Empty the lane it left with `line <lane>:` when nothing else stays there.

## Stations look

Write `[shape: stations]` on the head line (`lineup <title> [shape: stations]`) when chips flow through fixed stages, such as dev, review, staging and production.
The lanes become stops on one line from left to right, and the cards stack under each stop. Stretches a card passed forward in the step are colored, and a send-back runs under the line.
A stop with `[limit: <n>]` draws dashed slots for its free seats.
The stations look refuses `seal`, `open`, `pick` and `stamp`, because it does not draw them. On a phone-width frame the line runs down the left.

```dragon
lineup Ship a change to production [shape: stations]

role Operator [note: Checks on staging and ships]

box Dev
box Review [color: violet]
box Staging [color: amber, limit: 2]
box Live as Production [color: green, order: none]

item login, search [note: Change]

step Send them to review
  say Two changes go to review.
  line Review: login, search

step Check them on staging
  say Both approved changes go on Staging, which is now full with 2.
  line Staging: login, search
  line Review:

step Send it back if it fails
  say search fails on Staging, so it is sent back to Dev, and only login ships.
  role Operator
  line Dev: search
  line Live: login
  line Staging:
```

## Layers look

Write `[shape: layers]` on the head line (`lineup <title> [shape: layers]`) when one item goes down through layers, such as app, wallet, L2 and L1, or browser, CDN, API and database.
Each box becomes a horizontal band, stacked top to bottom in the order declared. The left of the band shows the layer's name, its `note` and its number. No arrows are drawn between layers.

| Line | Meaning in the layers look |
|---|---|
| `line <layer>: <chip>, ...` | The layer the chips are in now. The chips slide to that layer, the band they are in is drawn strongest, and the bands they have passed stay lit |
| `note <layer>: <text>` | The mark of the layer, such as what it did and how long it took. It stays until the next `note` on the same layer |

A layers lineup takes up to 8 layers. It refuses `[order: none]`, `role`, `seal`, `open`, `pick` and `stamp`, because the layers look does not draw them.
Give the chip a `note` to show it as a second line on the card.

```dragon
lineup A web request from the page to the store [shape: layers]

box browser as Page (browser) [note: Turns the save tap into a request, color: blue]
box api as Server (API) [note: Checks the login and the content, color: amber]
box db as Data store (DB) [note: Writes the row and keeps it, color: green]

item Request [color: blue, note: POST /notes]

step Tap save on the page
  say Tapping save makes the browser send the content as a request.
  line browser: Request
  note browser: Made the request

step The server checks it
  say The server checks the login and the form of the note.
  line api: Request
  note api: Checked in 80 ms

step Write it to the store
  say The checked request is written as a row of notes.
  line db: Request
  note db: Written in 30 ms
```

## How to write it well

- Give the chip the reader cares about its own color (`item mine [color: amber, note: Your transaction]`) and keep the others plain.
- Use `note` on lanes for the number that decides the outcome (a bid, a fee total), and `pick` to show the winner.
- Write `[limit: <n>]` instead of a `note` like `2/3` when a lane has a cap. The count and ticks follow the cards by themselves.
- Name the actor of each step with `role` when several actors take turns.

## Example

```dragon
lineup Which bid wins the slot

role Seller [note: Sells the ad slot]

box bids as Incoming bids [order: none]
box ranked as Ranked by price
box won as Winner [color: green]

item ann, ben, cara [note: A bidder]
item you [color: amber, note: Your bid]

step Bids arrive
  say Four bidders send a price for the ad slot. They arrive in no order.
  line bids: ann, you, ben, cara

step Rank by price
  say The bids are sorted from the highest price. Your bid comes second.
  line ranked: cara, you, ann, ben
  note ranked: top 1.20 USD

step The seller picks the top bid
  say The seller takes the highest bid, and cara wins the slot.
  role Seller
  line won: cara
  pick won
  stamp won: Sold
```
