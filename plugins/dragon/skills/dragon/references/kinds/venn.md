# venn

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

How two or three groups overlap and how many fall in each region: how the users of a wallet use send, swap and stake, which L2 chains addresses trade on, hobbies, what developers are good at.
Each group is a circle, the steps add one circle at a time and light the overlaps, and each region shows the count that is only in it.

Pick `chart` instead when the items do not overlap and only their sizes are compared, and `flow` when one case goes down a procedure past choices.

## Lines

| Line | Meaning |
|---|---|
| `venn <title>` | The first line. A set overlap diagram |
| `item <id> as <name> [color: ...]` | A set, written before the first `step`. Two sets sit left and right, three sit top left, top right and below. A diagram takes 2 or 3 sets, and the id cannot be `none` or hold a `&` |
| `set <id>: <count>` | The total of a set. Its circle appears in the step that first writes it, with the name and the total outside the circle. A later step can rewrite it |
| `set <id> & <id>: <count>` | The count in an overlap of two sets, or `set <id> & <id> & <id>: <count>` for all three. The region lights in that step and a count chip shows the overlap count |
| `set none: <count>` | The count in none of the sets, shown in a frame around the circles from that step on |

## How to write it well

- Write the counts as totals: `set a: 40` is everyone in `a`, and `set a & b: 12` is everyone in both, including those also in a third set. The regions show the counts that are only in them, worked out from these.
- An overlap larger than one of its sets is refused, and so is a set of counts that leaves a region below zero.
- A region shows no number until every count it needs is written, so write the overlap of all three in its own step after the pairs.
- Introduce one set per step with its total, and write its overlaps with the sets already shown in the same step.
- `box`, `group`, `act`, `strip` and `->` lines are refused. In other diagram kinds `venn` and `none` still read as ordinary box ids.
- Write counts as plain numbers (`8200`); the diagram shows them with thousands separators.

## Example

```dragon
venn People who run in the morning and at night

item morning as Run in the morning
item night as Run at night

step Morning
  say 30 people run in the morning.
  set morning: 30

step Night and both
  say 20 people run at night, and 5 of them also run in the morning.
  set night: 20
  set morning & night: 5

step Neither
  say 12 people run at neither time.
  set none: 12
```
