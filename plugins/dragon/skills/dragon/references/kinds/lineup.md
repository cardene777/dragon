# lineup

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Items that line up in lanes and move or reorder between them: a mempool and the blocks builders make, bids in an auction, a review queue, sorting, picking a winner.
Each box is a lane. Each item is a chip. Steps rewrite which chips sit in which lane and in what order. There are no lines between boxes.

Pick `try` instead when the reader should add items and press buttons themselves.

## Declarations (before the first step)

| Line | Meaning |
|---|---|
| `box <id> as <name> [note: ..., color: ..., order: none]` | A lane. Lanes stack top to bottom in the order declared. `[order: none]` makes a pool with no order, where chips sit on a grid |
| `item <id>, <id>, ... [color: ..., label: ..., note: ...]` | Chips. One line can declare several chips with the same look. `label` puts up to 4 characters on a chip. `note` adds a row to the legend under the diagram |
| `role <name> [note: <note>]` | An actor shown above the lanes, lit in the steps that name it |
| `strip <title>: <field>, ...` | Optional. Values that change |

## Lines in a step

| Line | Meaning |
|---|---|
| `line <lane>: <chip>, <chip>, ...` | Sets the chips of a lane in this order. A chip that was in another lane slides over, and stays there too unless that lane is rewritten. A chip left out disappears. A lane holds up to 12 chips |
| `note <lane>: <text>` | Rewrites the small text at the top right of a lane |
| `pick <lane>` | Lights up a lane and fades the others |
| `seal <lane>` | Covers a lane with a striped seal that hides its chips |
| `open <lane>` | Removes the seal |
| `stamp <lane>: <text>` | Lands a tilted stamp on the lane without touching its chips |
| `role <name>` | Lights up a declared role for this step |
| `set <field>: <value>` | Fills a strip field |

Lineup takes no icons and no `->` lines.

## How to write it well

- Give the chip the reader cares about its own color (`item mine [color: amber, note: Your transaction]`) and keep the others plain.
- Use `note` on lanes for the number that decides the outcome (a bid, a fee total), and `pick` to show the winner.
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
