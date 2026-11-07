# state

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

One thing moving between states: an order from payment to delivery, a support ticket, a pull request, a connection, a subscription.
Each box is a state. Each line is a move from one state to another. The steps follow one concrete case through its states.

Pick `sequence` instead when the messages between parties are the point.

## Lines

| Line | Meaning |
|---|---|
| `box <id> as <name> [note: ..., color: ..., icon: ...]` | A state |
| `start -> <state>: <label>` | The move out of the start mark. `start` is a reserved end, not a box |
| `<state> -> finish: <label>` | The move into the end mark. `finish` is a reserved end, not a box |
| `<state> -> <state>: <label>` | A move. The same state on both ends draws a move back to itself |
| Lines before the first `step` | Paths the thing could take but does not in this case. Drawn dotted |
| `note <id>: <text>` | Rewrites the caption under a state from this step on |
| `act <id>: <action>` | Work done while in a state, with no move |
| `strip <title>: <field>, ...` and `set <field>: <value>` | Facts about the thing that change with the state |

## How to write it well

- Follow one case (one order, one ticket) and tag every move with its id, `[tag: #1042]`, so the reader sees the same thing moving.
- Write the alternative paths (cancel, fail, time out) before the first step. They show the whole machine without taking the reader down every branch.
- A state that no step reaches is drawn dotted on the side. Use that for error states the case never enters.
- Color states by outcome: `amber` for waiting, `green` for done, `rose` for failed or reversed.
- Give every final state a `-> finish` line, either in a step or among the dotted paths.

## Example

```dragon
state States of a support ticket

box open as Open [note: Waiting for an agent, color: amber, icon: clock]
box working as In progress [note: An agent is on it, color: blue, icon: user]
box solved as Solved [note: Fix confirmed, color: green, icon: check]
box closed as Closed [note: No reply, color: slate, icon: x]

open -> closed: No reply in 7 days
closed -> finish

step Open the ticket
  say A customer reports a problem, and the ticket starts at Open.
  start -> open: Report [tag: #318]

step Pick it up
  say An agent takes the ticket and starts working on it.
  open -> working: Assign [tag: #318]

step Ask for details
  say The agent needs a log file, waits for it, and stays In progress.
  working -> working: Ask for a log [tag: #318]
  note working: Waiting for the log

step Solve and close
  say The fix works, the customer confirms, and the ticket ends.
  working -> solved: Fix [tag: #318]
  solved -> finish: Close [tag: #318]
```
