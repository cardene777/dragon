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
| `cycle <title> [shape: clock]` | The clock look. The steps sit on a clock dial clockwise from 12 o'clock as arcs as long as they take, and one hand turns from step to step |
| `box <id> as <name> [time: 25min]` | The length of a step, a number other than 0 and a unit (`ms`, `s`, `min`, `h` or `d`). The clock look needs one on every step, the band look takes one on every step or on none, and `time` is refused in the ring look |
| `cycle <title> [shape: clock, turn: left]` | Turns the dial counterclockwise. `turn` is refused without `[shape: clock]` |
| `cycle <title> [shape: band]` | The band look. The steps run left to right as chevrons of equal width, one band per round stacked top to bottom, and the line from the last step to the first one follows a return arrow to the next band |

## How to write it well

- Write the steps in the order the flow goes around. Only a line to the next step on the ring is allowed, and a line from the last step to the first one starts the next round.
- Lines that skip a step, go backward, return to the same step, or carry a `: <label>` are refused. `act` and `group` lines are refused too.
- Put what moves on the chip with `tag`, and keep it short so it fits on the arc.
- Start with a step that has no line and sets the strip values, so the first round has a clear beginning.
- Write values that read on their own, because field names are not shown. Use the first field for the round (a slot number, a sprint number) and the rest for where in the round it is.
- A value that changes after it was first written shows in the color of that step's box while the step lasts.
- Pick `[shape: clock]` when how long each step takes matters, such as a timetable of focus and rest or the phases of a slot. The arcs are as long as the steps, so a step that takes most of the round fills most of the dial.
- In the clock look the chip rides the tip of the hand, and the arcs entered in the round stay lit until the hand passes 12 o'clock. The numbers around the dial use the largest unit written, so write lengths in units that read well together.
- Pick `[shape: band]` when the rounds should stay readable one under another, such as the seasons of each year on a field. Each band's head shows that round's strip values, so write the round in the first field. With lengths on every step, the scale over each band marks when each step starts.

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

The clock look:

```dragon
cycle Focus and rest schedule [shape: clock]

box focus as Focus [time: 25min, color: blue]
box short as Short rest [time: 5min, color: green]
box review as Look back [time: 10min, color: amber]
box long as Long rest [time: 20min, color: rose]

strip Schedule: round, focused

step Start focusing
  say Notifications go off and the work at hand gets 25 minutes of focus.
  set round: Round 1
  set focused: 0 min

step Short rest
  say After 25 minutes the work stops for a 5 minute stretch.
  focus -> short [tag: 25 min]
  set focused: 25 min

step Look back
  say After the rest, 10 minutes go into writing down what moved and what got stuck.
  short -> review

step Long rest
  say With the notes written, a long 20 minute rest clears the head.
  review -> long [tag: notes]

step On to the next round
  say The rest ends and the second round of focus begins.
  long -> focus
  set round: Round 2
```
