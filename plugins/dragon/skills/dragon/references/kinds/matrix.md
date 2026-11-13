# matrix

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Items sorted into four areas by two measures: tasks by urgency and importance, risks by likelihood and impact, tokens by volume and trust, chains by fees and speed.
Each axis is one measure, each area is one verdict, and each step places some items into their area.
`[shape: scatter]` plots each item as a dot at its scores from 0 to 10, such as features scored by effort and impact, so that the reader sees where in an area an item sits and how close two items are.

Pick `chart` instead when the point is how big the items are next to each other, and `flow` when one case goes down a procedure past yes/no choices.

## Lines

| Line | Meaning |
|---|---|
| `matrix <title>` | The first line. A two-axis matrix |
| `matrix <title> [shape: scatter]` | The first line. Rules both axes from 0 to 10, plots each scored item as a dot at its scores and lists the items with their scores in a table on the left |
| `matrix <title> [shape: scatter, table: none]` | The first line. The same look without the table |
| `axis <name> [from: <low end>, to: <high end>]` | An axis, before the first step. Write the horizontal axis first and then the vertical one; a matrix takes exactly two |
| `axis <name> [from: <low end>, to: <high end>, reverse: yes]` | An axis that puts large values on the left or at the bottom, with its arrow pointing that way |
| `box <id> as <name> [note: <text>]` | An area. Write exactly four; they go top left, top right, bottom left and bottom right in the order written. `note` shows a small line under the name, and an area takes no other attribute |
| `item <id> as <name>` | An item to sort, before the first step. Items wait in the "Not placed yet" list left of the areas in the order written |
| `item <id> as <name> [x: <across>, y: <up>]` | An item with scores from 0 to 10, at most one decimal place. Write both scores |
| `line <area>: <item>, <item>` | Places items into an area inside a step. The cards slide from the list into the area and the area lights up |
| `line: <item>, <item>` | Places scored items inside a step without naming an area. Each goes to the area its scores fall in, counting 5 or more as the large side on each axis |

## How to write it well

- Order the four `box` lines by the axes: with the horizontal axis low to high from left to right and the vertical axis low to high from bottom to top, the first area is low on the horizontal axis and high on the vertical one.
- Name each area with what to do with its items (`Do it now`, `Plan ahead`), not with the two measures again, because the axes already show them.
- Put nothing in the first step so the reader sees every item waiting in the list, then fill one area per step.
- Keep each item name short, because a card is one line. Six to eight items over four areas read well, and two or three per area keep the areas even.
- A placed card stays in its area. Write it to another area in a later step to move it there.
- `as <name>` can be left out to show the id. `from` and `to` can be left out, and the axis then shows only its name.
- Use `[shape: scatter]` when the scores themselves matter. Plot one item per step so that each step's guide lines and score chips point at one dot, and keep the table unless the plot needs the width.
- Items with the same scores share one dot, with their names stacked beside it.
- A matrix without exactly two axes or four areas is refused. So are a `line` that names an unknown area or item, the same item twice on one line, lines between boxes and `strip` lines.
- A score outside 0 to 10 or with two or more decimal places, only one of `x` and `y`, `line: <item>` for an item without scores, and `line <area>: <item>` with an area that does not match the item's scores are refused. So is `table` without `[shape: scatter]`.

## Example

```dragon
matrix Sort this week's tasks by urgency and importance

axis Urgency [from: low, to: high]
axis Importance [from: low, to: high]

box plan as Schedule it
box now as Do it now
box drop as Drop it
box ask as Hand it off

item report as Report due tomorrow
item trouble as Client bug
item study as Exam study
item call as Urgent call
item feed as Idle social feed

step Line up
  say Line up this week's tasks on the left. None of them sits in an area yet.

step Do it now
  say Tasks that are urgent and important get done today, before anything else.
  line now: report, trouble

step Schedule it
  say Important tasks that are not urgent get a date now so they do not slip.
  line plan: study

step Hand it off and drop
  say Urgent tasks of low importance go to someone else, and the rest is dropped.
  line ask: call
  line drop: feed
```

A scatter look with scores:

```dragon
matrix Plot the next features by effort and impact [shape: scatter]

axis Effort [from: small, to: large]
axis Impact [from: small, to: large]

box now as Do it now
box plan as Plan it
box spare as When free
box drop as Skip it

item search as Faster search [x: 2, y: 8.5]
item pay as Add payments [x: 8, y: 7]
item legacy as Rebuild old UI [x: 9, y: 1.5]

step Line up
  say Line up the next features and their scores in the table on the left.

step Search
  say A feature with small effort and large impact gets built this week.
  line: search

step Payments
  say A feature with large impact and large effort gets a date in the plan.
  line: pay

step Old screens
  say A feature with large effort and small impact is not built for now.
  line: legacy
```
