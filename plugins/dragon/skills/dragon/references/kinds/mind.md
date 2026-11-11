# mind

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Ideas that spread out from one topic, branch by branch: the features of an app, a trip plan, what a proposal needs, a brainstorm.
The topic sits in the middle, each branch is one way of looking at it, and each leaf is one idea on that branch.

Pick `tree` instead when values fold up into one root, and `architecture` when things flow between the parts.

## Lines

| Line | Meaning |
|---|---|
| `mind <title>` | The first line. A mind map |
| `idea <id> as <name>` | The topic in the middle, written inside a step. A mind map has exactly one idea without `of` |
| `idea <id> as <name> of <parent>` | An idea joined to its parent, written inside a step. An idea of the topic is a branch, and an idea of a branch is a leaf |
| `idea <id> as <name> of <parent> [color: <color>]` | A branch with its own color. Its lines and leaves take the color |

## How to write it well

- Put the topic alone in the first step, then grow one branch per step with its leaves, so the reader follows one way of looking at a time.
- Ideas go three levels deep: the topic, branches and leaves. A fourth level and a parent that has not been written yet are refused.
- Branches go round clockwise from the upper left in the order written (up left, up right, down right and down left for four). Four branches fill the map evenly; two to six read well.
- Keep two to four leaves on a branch and keep each name short, because a leaf is one line in a rounded card.
- A branch without a color gets the next color no other branch has taken, so write `color` only on the branch that should stand out.
- `as <name>` can be left out to show the id. Wrap a name that contains the word `of` in `"`.
- `box`, `strip`, lines between boxes and `act` lines are refused.

## Example

```dragon
mind Features for a budget app

step Put the title
  say Put in the middle a budget app that makes it easy to keep tracking money every month.
  idea app as Budget app

step Input branch
  say Think of features that cut the effort of logging.
  idea input as Input of app
  idea receipt as Scan receipts of input
  idea bank as Import bank records of input

step Summary branch
  say Think of features that show where the money went.
  idea sum as Summary of app [color: rose]
  idea category as Pie chart by category of sum
  idea month as Compare with last month of sum

step Alerts branch
  say Think of alerts that catch overspending early.
  idea alert as Alerts of app
  idea over as About to pass the budget of alert
  idea payday as Day before a direct debit of alert

step Sharing branch
  say Think of features for keeping one budget with the family.
  idea share as Sharing of app
  idea family as Shared family book of share
  idea split as Split shared costs of share
```
