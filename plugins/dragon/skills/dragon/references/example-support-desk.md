---
layout: guide
---

# Answering support tickets

How a ticket moves, how fast the first reply must go out, and which tickets come first.

## Tickets

### How does a ticket move?

> A ticket opens, waits for an agent, gets worked on, and ends solved or closed.

The states a ticket goes through. The dotted path is the one this ticket does not take.

```dragon
state States of a ticket

box open as Open [color: amber]
box working as In progress [color: blue]
box solved as Solved [color: green]
box closed as Closed [color: slate]

open -> closed: No reply in 7 days

step Open
  say A user reports a problem, and the ticket starts at Open.
  start -> open: Report

step Pick it up
  say An agent takes the ticket and starts working on it.
  open -> working: Assign

step Solve
  say The fix works and the user confirms it, so the ticket ends solved.
  working -> solved: Fix
  solved -> finish
```

The first reply has to go out within four hours of the report.

```dragon
time The first reply

scale h 1h 8
row hours as Hours [color: blue]
point report at 0
point reply at 3

step Report
  say The ticket comes in at hour 0, and the four-hour clock starts.
  now -> 0
  note report: Reported

step Reply
  say The agent replies at hour 3, one hour before the deadline.
  now -> 3
  span 0-3: waiting [color: amber]
  note reply: First reply [color: green]
```

### Which tickets come first?

> Tickets that are urgent and touch many users come first.

This week's tickets sorted by urgency and by how many users they touch.

```dragon
matrix Sort this week's tickets

axis Urgency [from: low, to: high]
axis Users touched [from: few, to: many]

box plan as Plan a fix
box now as Answer now
box later as Answer later
box quick as Answer today

item down as Sign-in is down
item slow as Slow search
item typo as Typo on a page
item card as One card declined

step Line up
  say Four tickets came in this week. None is sorted yet.

step Answer now
  say Sign-in being down is urgent and touches every user, so it comes first.
  line now: down

step The rest
  say A declined card is urgent for one user, slow search touches many but can wait, and a typo can wait.
  line quick: card
  line plan: slow
  line later: typo
```

Where this week's tickets came from.

```dragon
chart Tickets by area [shape: bar]

item signin as Sign-in [color: rose]
item pay as Payments [color: amber]
item search as Search [color: blue]

step This week
  say Sign-in brought the most tickets this week.
  set signin: 42
  set pay: 18
  set search: 11
```

<details>
<summary>A ticket touches one user but is urgent. Where does it go?</summary>

Answer today. It is urgent, but it touches only one user.

</details>
