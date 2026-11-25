# Plan the figures

A plan lists the questions a topic answers and the 2 to 4 figures that answer each question.
Write it before the first figure, so the figures fit the topic instead of the kind you used last time.
Smallest forms: [cheatsheet](cheatsheet.md). Workflow: [SKILL.md](../SKILL.md).

## Steps

1. Write down who reads the result and what they should be able to do after reading it.
2. Split the topic into the questions that reader asks. Most topics have 2 to 5 questions, and each question becomes one section of the page.
3. Give each question a type from the table below. A question can have two types, such as how it works and how much.
4. For each question, pick 2 to 4 figures from the rows of its types. Pick figures that look at the question from different sides: the parts, one case going through them, the cases that pass and the cases that stop, the amount.
5. Write the plan in the form below, then write the figures one at a time and check each one before the next.

When the user asks for one diagram, the plan is one question with one figure.

## Question types

| Type | The question asks | Figures | Parts |
|---|---|---|---|
| How it works | Which parts there are, where they sit, and what goes between them | `architecture` with groups for the parts; `sequence` for the messages between them; `state` for the states of one thing; `tree` or `er` for how pieces fold up or point at each other | `[note: pop]` cards, so long explanations stay off the boxes |
| Pass or block | Which cases go through, which are stopped, and by which rule | `judge` for the cases checked rule by rule; `flow` for the checks one case passes on its way | `[stop]` on a `fail` for a case that cannot be read further; `stop` in a scene for the case that is stopped |
| Difference | What changes between two or three cases, or between options | `flow` or `lineup` with one `scene` per case when the cases share the start and then split; `matrix` to sort options by two measures; `venn` for groups that overlap | `scene` with `[scenes: stack]` to show the cases together, or `[scenes: pick]` to follow one at a time |
| One case step by step | How one case goes from start to end, or how it falls on time | `flow` for a procedure with choices; `sequence` for messages in time order; `time` for timing on a scale; `lineup` or `cards` for items moving between places or owners; `pipe` for one transaction through contracts; `git` for commits; `cycle` for steps that come round again | `gauge` for an amount that builds up on the way; `[note: pop]` cards |
| Amount | How much, how it splits, and how close it is to a limit | `chart` for sizes side by side or over time; `sankey` for where one amount goes; `flow` or `lineup` with a `gauge` for an amount against a limit | `gauge` with `limit` and `over` |
| Try it | What happens when the reader changes the inputs | `try` for a model with inputs and buttons; `checkout` for purchase terms | |

When two kinds fit, follow what moves: messages between parties (`sequence`), things flowing between places (`architecture`), one thing changing state (`state`), money and values inside one transaction (`pipe`), how big items are next to each other (`chart`), one case going down a procedure past choices (`flow`), the same steps coming round again (`cycle`), ideas growing out of one topic (`mind`), one value looked up across tables by keys (`er`), items sorted by two measures (`matrix`), how many fall in two or three overlapping groups (`venn`), how one amount splits into where it goes (`sankey`), who holds which card as cards change hands (`cards`).

When no row fits a question, do not drop the question.
Combine kinds and parts (a `flow` with scenes and a gauge, a `judge` next to the `flow` it summarizes), or add your own block ([blocks](blocks.md)).

## Write the plan

Write one line per figure: its kind, its parts, and what the reader should see in it.

```text
Reader: <who reads it>, who wants to <what they will do after reading>

Q1 <question> (<type>)
  1. <kind> [<parts>]: <what the reader sees>
  2. <kind>: <what the reader sees>
Q2 <question> (<type>, <type>)
  1. ...
```

Check the plan before you write any figure.

- Every question has 2 to 4 figures, unless the user asked for one diagram.
- No two figures of a question show the same thing in the same way.
- The kinds are not all the same, unless every question really asks the same type.

## Worked examples

Two topics, two different plans. Each page passes `dragon check` and `dragon check --layout` with nothing printed.

[Library loans](example-library-loans.md) answers how lending works, which loans are refused, and what a late return changes.

```text
Reader: a new member, who wants to borrow books without surprises

Q1 How does borrowing a book work? (how it works)
  1. architecture [note: pop]: the member, the desk, the catalog and the shelves
  2. sequence: one loan, from asking at the desk to taking the book home
Q2 Which loans does the desk refuse? (pass or block)
  1. judge: four loan requests checked against the three rules
  2. flow: the checks one request passes, in order
Q3 What changes when a book comes back late? (difference, amount)
  1. flow [scene, scene]: an on-time return and a late return, one above the other
  2. flow [gauge]: the late fee growing day by day up to its cap
```

[Support desk](example-support-desk.md) answers how a ticket moves, how fast replies must go out, and which tickets come first.

```text
Reader: a new support agent, who wants to know what to answer first

Q1 How does a ticket move? (one case step by step)
  1. state: the states a ticket goes through
  2. time: the reply deadline on the first day
Q2 Which tickets come first? (difference)
  1. matrix: tickets sorted by urgency and by how many users they touch
  2. chart: how the week's tickets split by area
```
