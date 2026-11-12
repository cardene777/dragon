# chart

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Comparing the size of a few items and how it changes: market shares by year, requests by channel by month, the split of a budget, votes per option.
`[shape: donut]` draws each item's share of the step's total as the angle of an arc. `[shape: bar]` draws each item's amount as the length of a horizontal bar.
`[shape: funnel]` draws stages whose count shrinks from the top, such as visitors on the way to a purchase or new users on the way to their first action.
Use a donut when the parts make up one whole, bars when the amounts matter on their own, and a funnel when each item is a stage that the one below it comes out of.

## Lines

| Line | Where | Meaning |
|---|---|---|
| `chart <title> [shape: donut]`, `chart <title> [shape: bar]` or `chart <title> [shape: funnel]` | First line | The kind, the title and the shape. The shape is required and stays the same through the steps |
| `item <id> as <name> [color: <color>]` | Before the first step | An item. Arcs go clockwise from 12 o'clock and bars stack from the top, in the order declared. Without `color`, items get colors in that order. From 1 to 8 items |
| `set <id>: <value>` | In a step | The value of an item, a number of 0 or more without a unit. An item without `set` keeps its previous value |

- A chart takes only `item`, `step`, `say`, `code`, `source` and `set` lines. It takes no `box`, `group`, `strip` or line.
- A donut shows the step title in the middle of the ring and rounded percentages in the legend. Bars show each value at the end of the bar, and the largest value over all steps gets the longest bar.
- Going to the next step moves the arcs and bars from the previous values to the new ones. An item with no value yet shows no arc or bar.
- A funnel stacks the stages from the top in the order declared. A stage's bar appears in the step that sets it, left-aligned and as long as its value compared with the first stage. The gap to the stage above stays as a pale bar with the number who left, and the rate kept from the stage above shows beside the count. The last step adds a row with the share of the first stage that made it to the last one. A funnel does not draw the step title in the figure; the player shows it.
- In a funnel, a value larger than the stage above and a stage that never gets a value are errors when the notation is read. Declare the stages in the order they shrink, and give each stage its own step so that the bars appear one by one.
- In `item` and `set`, the id is the same in both lines. Write numbers without commas or units (`1200`, not `1,200` or `1200 yen`), and put the unit in the title or the `say` line.

## How to write it well

- Keep it to the few items that tell the story. Merge the small ones into one item such as `other`.
- Give each step one point in `say`, such as which item grew or which gap closed.
- Keep the step titles of a donut short, about 7 Japanese characters or 14 Latin letters. The title sits inside the ring without wrapping, so a longer one runs over the arcs, and `dragon check --layout` reports it as `title-outside-ring`.
- Write every value in the first step, then only the values that change in later steps.

## Example

```dragon
chart Smartphone OS share [shape: donut]

item ios as iOS [color: blue]
item android as Android [color: green]
item other as Other [color: slate]

step 2018
  say iOS holds 70 percent and Android just under 30.
  set ios: 70
  set android: 29
  set other: 1

step 2024
  say Android grows to almost 40 percent, and the gap narrows.
  set ios: 60
  set android: 39
```

```dragon
chart People on the way to buying [shape: funnel]

item visit as Visited the shop [color: blue]
item view as Viewed a product [color: violet]
item buy as Bought [color: green]

step Visit
  say 10,000 people visited the shop site.
  set visit: 10000

step View a product
  say 4,200 people went on to a product page, and 5,800 left without seeing one.
  set view: 4200

step Buy
  say 380 people bought.
  set buy: 380

step Look back
  say Of the 10,000 visitors, 3.8% bought in the end.
```

```dragon
chart Support requests by channel [shape: bar]

item mail as Email [color: blue]
item chat as Chat [color: green]
item phone as Phone [color: amber]

step April
  say Most requests come by email.
  set mail: 120
  set phone: 64

step May
  say Chat opens, and phone requests drop.
  set mail: 104
  set chat: 38
  set phone: 58
```
