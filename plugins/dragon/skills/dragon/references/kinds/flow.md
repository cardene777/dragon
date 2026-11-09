# flow

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

A procedure that branches at choices: a login check, an application review, a deploy gate, a support triage.
Each box is a step of the procedure, and each choice is a question with at most two answers. The steps follow one concrete case down the main path.

Pick `state` instead when one thing moves back and forth between states and loops are the point.

## Lines

| Line | Meaning |
|---|---|
| `box <id> as <name> [note: ..., color: ..., icon: ...]` | A step of the procedure |
| `choice <id> as <question>` | A choice, drawn as a diamond with the question inside. Only in `flow` |
| `<choice> -> <box or choice>: <answer>` | A way out of a choice. Every line out of a choice needs a label (the answer), and a choice has at most two ways out |
| `<box> -> <box or choice>: <label>` | A move along the procedure. The label can be left out |
| `start -> <id>` | The line out of the start mark. `start` is a reserved end, not a box |
| `<id> -> finish` | The line into the end mark. `finish` is a reserved end, not a box |
| Lines before the first `step` | Paths not taken in this case. Drawn dotted, and they leave to the right of the choice |
| Both answers of a choice in the same step | Every path runs. The two lines start at the same moment, the line written first goes straight down, and the line written after it branches to the side |

## How to write it well

- Put the main path in the steps, in order. The boxes and choices the steps reach stack top to bottom in the order the lines first reach them.
- Write the other answer of each choice (no, fail, retry later) before the first step. A box that no line in a step reaches is drawn on the right with a dotted border and a muted name.
- To show every path rather than one concrete case, write both answers of a choice in the same step, with the answer that continues the procedure first. Nothing needs to go before the first step then.
- Do not draw a line back up the main path. It stops reading at that line. Write a retry as a box on the side instead.
- Keep each question short. A long question wraps onto two lines after a particle, a comma or a space when that makes the diamond narrower, and a short one stays on one line. The diamond still grows with the longer line.
- Leave `carry` and `tag` off the lines. In a flow diagram such a line runs the step mark, a dot on the blue moving line, instead of an envelope. The dot vanishes when it arrives, a passed line stays dark, and a choice the dot reached is filled with light amber.
- Write `carry: coin` or `tag` only when a thing really moves. It runs as itself, with no dot on that line. `carry: none` draws only the line and runs nothing.
- Color the ends by outcome: `green` for done, `rose` for failed or refused.

## Example

```dragon
flow Login check

box input as Input
choice pw as Password correct?
choice otp as 2FA correct?
box done as Signed in [color: green]
box err as Show an error [color: rose]

pw -> err: No
otp -> err: No

step Enter
  say The user enters an ID and a password.
  start -> input

step Check the password
  say The server checks the password.
  input -> pw: Send

step Check the 2FA code
  say The password matched, so the 2FA code is checked.
  pw -> otp: Yes

step Sign in
  say The code matches too, and the user is signed in. The no paths stay dotted.
  otp -> done: Yes
  done -> finish
```
