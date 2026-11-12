# sankey

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Where one amount goes and how much goes to each place: how a token supply is allocated, how a fee is split, where a salary goes, how sales turn into costs and profit.
Each source and target is a bar, and the steps grow bands as wide as the amounts from a source to its targets.

Pick `chart` instead when the items do not flow from one to another and only their sizes are compared, and `venn` when the question is how groups overlap.

## Lines

| Line | Meaning |
|---|---|
| `sankey <title>` | The first line. A Sankey diagram |
| `box <id> as <name> [color: ...]` | A source or a target, written before the first `step`. Boxes no line goes into sit in the left column, and each target sits in a column to the right of its source. A box takes no `note`, `icon` or `link` |
| `<source> -> <target>: <amount>` | A band, written in a step. It grows from the source bar to the target bar in that step, and an amount chip crosses it. The number at the start of the label is the amount: `40%` reads as 40 and `1,200 yen` as 1200 |

## How to write it well

- Write every amount in one diagram in the same unit, and start each label with the number (`40%`, `1,200 yen`, `130k yen`). The text after the number is shown as written.
- A box with no source holds the sum of what leaves it, so name the first box with its total (`Take-home pay 300k yen`).
- A band takes the share of the source bar that its amount makes up, and the bands stack down the source bar in the order written. Write the larger shares first when the order does not matter.
- Give the first step no line and let `say` introduce the whole amount, then split it one or two bands per step.
- A label that does not start with a number, a line whose flow leads back to a box it came from, the same line written twice and a box sending out more than comes in are refused.
- A line takes no `tag`, `carry` or `side`, because the amount chip shows the line label. `group`, `strip`, `act`, `note` and `set` lines are refused. In other diagram kinds `sankey` still reads as an ordinary box id.
- `[color: ...]` on a box colors its bar and the bands going into it. Give each target its own color.

## Example

```dragon
sankey Where the pocket money goes

box pay as Pocket money 10,000 yen [color: slate]
box food as Food [color: amber]
box save as Savings [color: green]
box fun as Fun [color: rose]

step Get it
  say A month of pocket money is 10,000 yen.

step Food
  say Half of it, 5,000 yen, goes to food.
  pay -> food: 5,000 yen

step The rest
  say Save 3,000 yen and spend 2,000 yen on fun.
  pay -> save: 3,000 yen
  pay -> fun: 2,000 yen
```
