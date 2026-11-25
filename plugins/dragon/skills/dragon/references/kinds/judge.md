# judge

Shared syntax: [notation](../notation.md). Workflow: [SKILL.md](../../SKILL.md).

## When to use

Cases checked against a set of rules, each case getting a pass or block verdict: which transfers a wallet blocks, which sign-up forms are refused, which refunds are accepted.
Cases are rows and rules are columns. The steps check the rules one column at a time with ✓ and ✕, and the last step gives every row its verdict.

Pick `flow` instead when one case walks a procedure that branches at yes/no choices, and `matrix` when items are placed by two measures rather than checked against rules.

The table is an HTML table, not an SVG picture, so its text is never shrunk to fit the frame. A table wider than the frame scrolls sideways inside it, and the case column stays on the left.

## Lines

| Line | Meaning |
|---|---|
| `judge <title>` | The first line. A judge table. The verdict words are `pass` and `block` on an English page, and the Japanese words for them on a Japanese page |
| `judge <title> [pass: <word>, block: <word>]` | The first line with your own verdict words, such as `[pass: allow, block: deny]`. There are only two verdicts |
| `rule <id> as <name> [value: <value>]` | A rule column, written before the first `case`. The header shows the rule number, the name, and the value under it |
| `case <name> [note: <note>]` | A case row. The note is shown under the name |
| `fail <rule id>: <value>` | Written under a case. That rule's cell is ✕ with the value under it. Every rule the case does not name is ✓ |
| `fail <rule id>: <value> [stop]` | The case cannot be checked past this rule. The cells of the later columns are "—" |

## How to write it well

- dragon does not compare values. Write `fail` only for the rules the case breaks, and write the value it had, such as `fail once: 35`.
- Keep the rule value short (`up to 30`), since it sits under the rule name in the header, and keep the case name short with the details in `note`.
- A blocked case lists the number and the name of each failed rule under its verdict, so give the rules names a reader can follow without the header.
- Use `[stop]` when the case cannot be read at all past a rule, such as a transaction whose chain cannot be read.
- A `fail` naming a rule no `rule` line declares, the same rule failed twice in one case, a `fail` before the first `case`, and a table with no `rule` or no `case` line are refused with the line number.
- The steps come from the rules, one per column and one for the verdicts, so a judge table takes no `step`, `box` or line.

## Example

```dragon
judge Which sign-ups to refuse

rule mail as Email [value: has @]
rule pw as Password [value: 8 or more]
rule age as Age [value: 13 or over]

case Ann [note: all filled in]
case Ben [note: short password]
  fail pw: 5
case Cal [note: typo in the email]
  fail mail: cal.example.com
  fail age: 11
```
