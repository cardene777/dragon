# matrix

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Items sorted into four areas by two measures: tasks by urgency and importance, risks by likelihood and impact, tokens by volume and trust, chains by fees and speed.
Each axis is one measure, each area is one verdict, and each step places some items into their area.

Pick `chart` instead when the point is how big the items are next to each other, and `flow` when one case goes down a procedure past yes/no choices.

## Lines

| Line | Meaning |
|---|---|
| `matrix <title>` | The first line. A two-axis matrix |
| `axis <name> [from: <low end>, to: <high end>]` | An axis, before the first step. Write the horizontal axis first and then the vertical one; a matrix takes exactly two |
| `box <id> as <name> [note: <text>]` | An area. Write exactly four; they go top left, top right, bottom left and bottom right in the order written. `note` shows a small line under the name, and an area takes no other attribute |
| `item <id> as <name>` | An item to sort, before the first step. Items wait in the "Not placed yet" list left of the areas in the order written |
| `line <area>: <item>, <item>` | Places items into an area inside a step. The cards slide from the list into the area and the area lights up |

## How to write it well

- Order the four `box` lines by the axes: with the horizontal axis low to high from left to right and the vertical axis low to high from bottom to top, the first area is low on the horizontal axis and high on the vertical one.
- Name each area with what to do with its items (`Do it now`, `Plan ahead`), not with the two measures again, because the axes already show them.
- Put nothing in the first step so the reader sees every item waiting in the list, then fill one area per step.
- Keep each item name short, because a card is one line. Six to eight items over four areas read well, and two or three per area keep the areas even.
- A placed card stays in its area. Write it to another area in a later step to move it there.
- `as <name>` can be left out to show the id. `from` and `to` can be left out, and the axis then shows only its name.
- A matrix without exactly two axes or four areas is refused. So are a `line` that names an unknown area or item, the same item twice on one line, lines between boxes and `strip` lines.

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
