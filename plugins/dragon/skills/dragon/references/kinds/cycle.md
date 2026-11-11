# cycle

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

A flow that goes around the same steps again and again and starts the next round when it ends: an Ethereum slot, a sprint, a PDCA loop, restaking rewards.
Each box is a step on the ring, and the steps follow one or more rounds in order.

Pick `flow` instead when the procedure branches at choices and ends, and `state` when one thing moves back and forth between states.

## Lines

| Line | Meaning |
|---|---|
| `cycle <title>` | The first line. A cycle diagram |
| `box <id> as <name> [note: ..., color: ...]` | A step on the ring, written before the first `step`. The steps sit clockwise from the top in the order written. A ring takes 2 to 8 steps |
| `<id> -> <id> [tag: <text>]` | A line to the next step on the ring. In that step the chip runs along the arc, and the arc stays lit in the color of the receiving step |
| `strip <title>: <field>, <field>` | The strip title and field values, shown in the middle of the ring instead of under the diagram |
| `set <field>: <value>` | Changes a value in the middle of the ring. The first field shows large, and field names are not shown |

## How to write it well

- Write the steps in the order the flow goes around. Only a line to the next step on the ring is allowed, and a line from the last step to the first one starts the next round.
- Lines that skip a step, go backward, return to the same step, or carry a `: <label>` are refused. `act` and `group` lines are refused too.
- Put what moves on the chip with `tag`, and keep it short so it fits on the arc.
- Start with a step that has no line and sets the strip values, so the first round has a clear beginning.
- Write values that read on their own, because field names are not shown. Use the first field for the round (a slot number, a sprint number) and the rest for where in the round it is.
- A value that changes after it was first written shows in the color of that step's box while the step lasts.

## Example

```dragon
cycle The weekly review

box plan as Decide [note: start of week, color: blue]
box work as Do [note: every day, color: green]
box look as Look back [note: end of week, color: amber]

strip Week: round, day

step Decide
  say At the start of the week, decide what to do that week.
  set round: Week 1
  set day: Monday

step Do
  say Work on what was decided each day.
  plan -> work [tag: tasks]
  set day: Tuesday to Thursday

step Look back
  say At the end of the week, look back on what got done and what is left.
  work -> look [tag: progress]
  set day: Friday

step On to the next week
  say Take what is left back to deciding the next week.
  look -> plan [tag: left]
  set round: Week 2
  set day: Monday
```
