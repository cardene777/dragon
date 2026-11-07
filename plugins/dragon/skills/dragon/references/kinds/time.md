# time

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

When events happen on evenly spaced time: block slots and epochs, a challenge or withdrawal period, retries with back-off, deadlines, a release schedule.
A needle moves along an axis of ticks. Marks appear on the ticks it passes.

Pick `sequence` instead when the order of messages matters more than how long things take.

## Declarations (before the first step)

| Line | Meaning |
|---|---|
| `scale <unit> <length> <count> [from: <first number>]` | The axis: `<count>` ticks of `<length>` each. Length is a number and a unit: `ms`, `s`, `min`, `h`, `d` (`scale slot 12s 64`) |
| `period <name> <ticks> [from: <first number>]` | Names a boundary every `<ticks>` ticks (`period epoch 32`) |
| `row <id> as <name> [color: <role>, empty: <ticks>]` | A row with one mark per tick. `empty` lists ticks that get empty marks, separated by spaces (`empty: 3 13 45`) |
| `point <id> at <tick>` | A flagged point below the axis |
| `zoom <range>` | Ticks shown as columns in a top band, one column per tick (`zoom 0-3`) |
| `box <id> as <name> [color: ..., icon: ...]` | A party in the zoom band, in the same order in every column |
| `strip <title>: <field>, <field> [meter: <ratio>]` | Values that change. `[meter: 2/3]` after a field makes it a meter that fills up to the ratio |

## Lines in a step

| Line | Meaning |
|---|---|
| `now -> <tick>` | Moves the needle to the tick at a fixed speed. Marks appear on the ticks it passes |
| `<box> -> <box> [at: <tick>, into: <tick>]` | A line in the zoom band, leaving the column `at` and arriving in the column `into` |
| `<point> -> <point>: <label>` | A line between two points below the axis |
| `note <point>: <text> [color: <role>]` | Writes or recolors the text of a point |
| `mark <row> <range> [color: <role>]` | Recolors the marks of a row in a range (`mark block 0-31 [color: green]`) |
| `span <range>: <text> [color: <role>]` | A bracket under the axis. `[shape: box]` turns it into a frame around the rows |
| `set <field>: <value>` | Fills a strip field. For a meter, write a percentage (`set Votes: 97%`) |

A range is `<from>-<to>` or one tick. Ticks count from 0, and `from:` only changes the numbers shown.

## How to write it well

- Choose the unit the reader thinks in (slot, day, hour) and only as many ticks as the story needs.
- Move the needle in each step where time passes, and `set` an elapsed-time field so the reader sees how long passed.
- Use `span` to name a period (`7 days to dispute`) and `mark` to show what became final or failed.
- Leave out `zoom` and boxes when the story is only about the axis and points.

## Example

```dragon
time Retry a failed webhook with back-off

scale min 1min 16
row attempt as Attempts [color: blue, empty: 2 4 5 6 8 9 10 11 12 13 14]
point first at 0
point last at 15

strip Delivery: Elapsed, Attempts, Result

step The first attempt fails
  say The webhook is sent at minute 0 and the receiver answers 500.
  now -> 0
  note first: Failed [color: rose]
  set Elapsed: 0 min
  set Attempts: 1
  set Result: retrying

step Back off and retry
  say Each retry waits twice as long as the one before, so the retries land on minutes 1, 3 and 7.
  now -> 7
  span 0-7: back-off grows [color: amber]
  set Elapsed: 7 min
  set Attempts: 4

step Delivered
  say The retry at minute 15 gets 200 OK, and the delivery stops retrying.
  now -> 15
  first -> last: delivered [carry: none]
  note last: Delivered [color: green]
  set Elapsed: 15 min
  set Attempts: 5
  set Result: delivered
```
