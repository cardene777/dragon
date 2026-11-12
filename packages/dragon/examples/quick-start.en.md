# Writing dragon notation

A dragon diagram is written by people and AI in dragon notation and kept by tools as JSON (the source).
The first English word of each line decides its kind, and under each `step` line you list what happens in that step, in order.
Examples that use every form are `oauth.en.dragon` (a sequence diagram), `ccip.en.dragon` (an architecture diagram), `order.en.dragon` (a state diagram), and `rebase.en.dragon` (a git graph) in this directory.

The words of the notation are English only, and box names and step bodies can be written in any language.
The Japanese guide is `quick-start.md` in this directory.

## The smallest diagram

```dragon
sequence

browser -> app: GET /login
```

The diagram kind on the first line and a line joining boxes with `->` are enough to make a diagram.
Sequence, architecture and state diagrams can leave out the title on the first line, the box declarations, and the steps.
A diagram with no `box` line makes a box of each name on the lines, in the order the names appear.
When two box names differ by one character, it points this out as a possible typo and still draws the diagram.
A diagram with no `step` line makes each line one step, lit in the order written.
A step without `say` uses the line label as its body, and a line without a label uses the box names joined by an arrow.
A line outside the steps of a diagram that has steps, and a name that is not declared in a diagram with at least one `box` line, are errors.

Write the declarations and the steps when a box needs a shown name, a caption or a color, or a step needs a title and a body.

```dragon
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate]
box app as App [note: asks for sign-in, color: blue]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
```

## Rules

Every line follows these four rules.

1. The first English word of a line decides its kind. Only arrow lines start with a box id
2. A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`
3. Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`
4. The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`

## Line forms

Before the first `step` line, declare the diagram kind and title, regions, boxes, and the strip.

| Line | Form | Example |
|---|---|---|
| Kind and title | `sequence <title>`, `architecture <title>`, `state <title>`, `git <title>`, `time <title>`, `tree <title>`, `pipe <title>`, `flow <title>`, `cycle <title>`, `mind <title>`, `er <title>`, `matrix <title>`, `venn <title>`, `sankey <title>`, or `chart <title> [shape: donut]` (or `[shape: bar]`). Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the line | `architecture Send tokens with CCIP [view: follow]` |
| Region | Open with a `group <id> as <name> [note: <note>]` line and close with an `end` line. The boxes on the `box` lines in between go inside the region | `group source as Source chain [note: e.g. Ethereum, color: blue]` |
| Box | `box <id> as <name> [note: <caption>]`. Without `as <name>`, the id is the name | `box OnRamp [note: checks and sends]` |
| Choice | `choice <id> as <question>`. A diamond with the question inside, and each line out of it carries the answer as its label. Only in a flow diagram | `choice ok as Filled in?` |
| Strip | `strip <title>: <field>, <field>`. In a time diagram, `[meter: <ratio>]` after a field name makes that field a meter | `strip Message: ID, receiver, state` |
| Branch | `branch <branch> [note: <note>]`. Only in a git graph. Bands are stacked from the top in the order declared | `branch feature [note: Work branch]` |
| Scale | `scale <unit> <length> <count> [from: <first number>]`. Write the length as a number and a unit (`ms`, `s`, `min`, `h`, `d`); that many ticks are spaced evenly along the axis. Only in a time diagram | `scale slot 12s 64` |
| Period | `period <name> <ticks> [from: <first number>]`. Puts a name and a number at each period boundary | `period epoch 32` |
| Row | `row <id> [color: <color>, empty: <tick>]`. One mark per tick, and the ticks in `empty` get empty marks | `row block [color: blue, empty: 5]` |
| Task | `task <id> as <name> <range> [color: <color>]`. Each task gets its own row and one thick bar over the ticks of the range. The bar shows its first and last tick names with the scale name (`Day 1–3`, or `Day 14` for one tick), and the part the needle has passed fills in. A diagram with tasks needs no `row` | `task build as Build 3-8 [color: violet]` |
| Point | `point <id> at <tick>`. Puts a flag circle and its id below the axis | `point C0 at 0` |
| Zoom band | `zoom <range>`. Makes one column per tick in the top band, with the declared boxes in the same order in every column | `zoom 0-1` |

Inside a step, indent these lines in the order things happen.

| Line | Form | Example |
|---|---|---|
| Step title | `step <title>`. A step runs until the next `step` or the end of the file | `step Lock the tokens` |
| Step body | `say <body>`. To split it over two or more lines, write `say` alone and continue on lines indented further below it | `say OnRamp calls the Token Pool.` |
| Command for the step | `code <command>`. At most one per step | `code lockOrBurn()` |
| Source of the step | `source <name> [url: <URL>]`. A step can have any number, shown as links named by the source in the step list that screen readers read | `source How CCIP works [url: /diagrams/ccip]` |
| Line | `<id> -> <id>: <label>`. The label can be left out | `OnRamp -> sourcePool: lockOrBurn() [carry: coin]` |
| Action in a box | `act <id>: <action>` | `act OnRamp: check the contents` |
| New caption under a box | `note <id>: <text>` | `note sourcePool: −100 USDC` |
| Strip value | `set <field>: <value>` or `set <field> [tag: <tag>]` | `set state: SUCCESS` |
| Commit | `commit <id> on <branch> [hash: <hash>, note: <note>]`. Add `copy <source>` for a replayed commit or `merge <branch>` for a merge commit. Only in a git graph | `commit M on main merge fix [hash: 7d3a5e2]` |
| Cut a branch | `<branch> from <commit>`. HEAD moves to that branch | `feature from A` |
| Move a ref | `<branch or HEAD> -> <commit>`. In a git graph it moves only the ref and makes no commit | `HEAD -> M` |
| Delete a branch | `delete <branch>`. The ref leaves the diagram from that step on. The branch HEAD points at cannot be deleted. Only in a git graph | `delete feature` |
| Move the needle | `now -> <tick>`. The needle moves to that tick at a fixed speed, and the marks it passes appear as it goes. Only in a time diagram | `now -> 31` |
| Recolor marks | `mark <row> <range> [color: <color>]`. Changes the color of the marks in that range of the row | `mark block 0-31 [color: green]` |
| Span | `span <range>: <text>`. Puts a bracket under the axis, and `[shape: box]` turns it into a frame around the rows | `span 0-31: 1 epoch = 6.4 min` |
| Line in the zoom band | `<id> -> <id> [at: <tick>, into: <tick>]`. Leaves the box in the `at` column and arrives at the box in the `into` column | `proposer -> block [at: 0]` |
| Leaf | `leaf <id> [hash: <value>]`. Leaves line up from the left in written order. With a value, the box shows it and a card below the leaf shows the id. Only in a tree diagram | `leaf tx1 [hash: 3fa0]` |
| Parent | `node <id> of <child>, <child> [hash: <value>]`. Sits above the middle of its children, and the box that no parent takes becomes the root. Only in a tree diagram | `node root of 1to2, 3to4 [hash: e71c]` |
| Idea | `idea <id> as <name> of <parent> [color: <color>]`. Written in a step, and the idea without `of` is the topic in the middle. An idea of the topic is a branch and an idea of a branch is a leaf, three levels deep at most. Only in a mind map | `idea input as Input of app` |
| Axis | `axis <name> [from: <low end>, to: <high end>]`. Written exactly twice before the first `step`, the horizontal axis first and then the vertical one. Only in a two-axis matrix | `axis Effort [from: low, to: high]` |
| Placed item | `item <id> as <name>`. Written before the first `step`, and the items wait in the list left of the areas in the order written. Only in a two-axis matrix | `item login as Faster login` |
| Place in an area | `line <area>: <item>, <item>`. Written in a step, and the cards slide from the list into the area. Only in a two-axis matrix | `line now: login` |

`fixed` keeps the whole diagram still and moves only what is inside; `follow` moves to where things are happening and shows the current place in a small overview in the corner.
Without a view, the view is `fixed` when the text of the whole diagram in the frame is 10.5px or larger, and `follow` when it is smaller.

Every step needs a body.
Screen readers read each step's title, body and sources in step order.

When boxes of the same region are not next to each other, open the same `group <id>` again and write the rest of its boxes.
The second time, write only the id, and give the name and attributes only the first time.

In a state diagram (`state <title>`), each box is a state and each line is a move from one state to another.
Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark.
Lines written before the first `step` line are paths the diagram could take but does not this time, drawn dotted.

```dragon
state States of an order until it arrives

box awaiting as Awaiting payment [note: Waits for funds, color: amber, icon: clock]
box shipped as Shipped [note: With the carrier, color: violet, icon: truck]
box delivered as Delivered [note: Handed over, color: green, icon: check]
box cancelled as Cancelled [note: Payment returned, color: rose, icon: x]

awaiting -> cancelled: Cancel
cancelled -> finish

step Place the order
  say Confirming the order starts it at Awaiting payment.
  start -> awaiting: Place order [tag: #1042]

step Ship
  say Once the payment clears, the goods go out and the order moves to Shipped.
  awaiting -> shipped: Ship [tag: #1042]

step Arrive
  say The goods arrive, the order moves to Delivered, and it closes.
  shipped -> delivered: Receive [tag: #1042]
  delivered -> finish: Close the order [tag: #1042]
```

In a git graph (`git <title>`), each branch declared on a `branch` line gets its own band, and steps add commits to them. Boxes are optional.
A commit with `copy <source>` is a replayed copy of the source commit and does not move the branch ref. A commit with `merge <branch>` has two parents: the target and the tip of that branch.
A line that moves a ref makes no commit, and moving `HEAD` detaches it from its branch. A commit that no ref can reach any more turns into a dotted circle.

```dragon
git Merge fix with a merge commit and replay feature

branch main [note: Target]
branch feature [note: Work branch]
branch fix [note: Fix branch]

step Cut branches
  say Cut fix and feature from A on main, and add a commit to each.
  commit A on main [hash: 3fa0c19, note: First shape]
  fix from A
  commit F on fix [hash: 9b2e4d1, note: Fix a typo]
  feature from A
  commit C on feature [hash: c41d0e5, note: Add search]

step Merge commit
  say Merge fix into main with merge commit M. M has two parents, A and F.
  commit M on main merge fix [hash: 7d3a5e2, note: Merge fix]

step Replay
  say Move HEAD to M to detach it, and copy C onto M as C'.
  HEAD -> M
  commit C' on main copy C [hash: a90c6b4, note: Add search]

step Fast-forward
  say Move feature to C', and move main up to C' too. The old C can no longer be reached from any branch.
  feature -> C'
  main -> C'
```

In a time diagram (`time <title>`), the ticks declared with `scale` are spaced evenly along the axis, and `now` inside a step moves the needle.
The needle moves one tick at a fixed speed, so no seconds are written. The ticks chosen with `zoom` become columns in the top band, and `[at: <tick>]` on a line picks the column.
`[meter: <ratio>]` on a strip field makes a meter that fills with the needle up to the ratio written with `set`.

```dragon
time How a block becomes final

scale slot 12s 64
period epoch 32
row block [color: blue, empty: 5]
point C0 at 0
point C1 at 32
zoom 0-1

box proposer [color: blue, icon: user]
box block [color: blue, icon: box]

strip Finality: Elapsed, Votes this epoch [meter: 2/3]

step Propose blocks
  say In each slot one proposer is chosen and proposes one block. The top band zooms in on the first 2 slots.
  proposer -> block [at: 0]
  proposer -> block [at: 1]
  now -> 1
  set Elapsed: 24 s

step Collect one epoch of votes
  say 32 slots make one epoch. A block mark appears on each slot the needle passes, and a slot whose proposer did not answer gets an empty mark.
  note C0: Proposed [color: blue]
  span 0-31: 1 epoch = 6.4 min [color: slate]
  now -> 31
  set Elapsed: 6 min 24 s
  set Votes this epoch: 97%

step Move to the next epoch
  say Votes for C0 passed 2/3 of the total, so C0 is justified. In the next epoch, votes gather on C1.
  note C0: Justified [color: violet]
  note C1: Proposed [color: blue]
  now -> 63
  set Elapsed: 12 min 48 s
  set Votes this epoch: 97%

step C0 becomes final
  say Once C1 is justified too, the earlier of the two justified in a row, C0, becomes final. A final block cannot be undone.
  C0 -> C1: over 2/3 [carry: none]
  note C1: Justified [color: violet]
  note C0: Final [color: green]
  mark block 0-31 [color: green]
  span 0-31: Final, cannot be undone [shape: box, color: rose]
```

In a tree diagram (`tree <title>`), `leaf` writes a leaf and `node` writes a parent inside a step, and each box appears in the step that writes it.
Leaves line up from the left in written order, a parent sits above the middle of its children, and the box that no parent takes becomes the root.
A carrier on a line between a parent and a child runs along the tree line, and the tree line keeps that color once passed.

```dragon
tree Proving a transaction is included

step Hash each transaction
  say Compute a value from each of the 4 transactions. These values become the leaves.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  leaf tx3 [hash: c41d]
  leaf tx4 [hash: e5f8]

step Pair them up
  say Join neighbouring values two at a time and hash again. Two parents appear.
  node 1to2 of tx1, tx2 [hash: 7a21]
  node 3to4 of tx3, tx4 [hash: b9e4]

step The root appears
  say Joining the last two gives one root that sums up every transaction.
  node root of 1to2, 3to4 [hash: e71c]

step Climb from tx3 to the root
  say Take the neighbouring value at each level and climb. The root comes out without reading tx1 or tx2.
  tx3 -> 3to4 [tag: c41d]
  tx4 -> 3to4 [tag: e5f8]
  3to4 -> root [tag: b9e4]
  1to2 -> root [tag: 7a21]
```

In a try diagram (`try <title>`), stack part lines before the first step so readers can type values and press buttons.
`route` is a network, `queue` a waiting line, `chain` a chain of blocks, `ask` the input strip, and `press` a button, and chips are written as `item <name> [<field>: <value>]`.
Inside a step, `line` writes the contents, and `ask`, `press`, and `item` write the author's example steps. The player stops at the first step and adds one step each time the reader presses.

```dragon
try Into a block

route Net: You - node-1 - Builder [from: You, to: Builder]
queue Mempool [order: Fee]
chain Chain [edit: Amount]
ask Sender, Amount, Fee [into: Mempool, via: Net]
press Build [from: Mempool, into: Chain, take: 2]

item tx1 [Amount: 3, Fee: 7]
item tx2 [Amount: 5, Fee: 5]

step Waiting in line
  say Transactions line up in the mempool from the highest fee.
  line Mempool: tx1, tx2

step Build a block
  say The two highest fees go into block 1.
  press Build
```

In a pipe diagram (`pipe <title>`), declare balances with `hold <owner>: <amount> <token>, ...` and stored values with `hold <contract>: <name> <value>` before the first step.
A line `<caller> -> <callee>: <text>` is a call: `[value: <amount> ETH]` sends ETH with it, `[call: delegate]` or `[call: static]` sets its kind, and `[fold]` folds its inner steps into one box.
Inside a step, `move <token>: <amount> <from> -> <to>` moves a balance, `write <party>: <name> <value>` rewrites a value, `check <party>: <left> <op> <right>` checks (a check on values that are not numbers fails only with `[fail]`), `emit <party>: <name>(<arg>, ...)` emits an event, and `calc <party>: <in> -> <out>` converts.
`return <party>: <value>` closes the innermost open call and `revert <party>: <reason>` fails it. Changes stay provisional until the outermost call returns.
The step body does not show under a pipe diagram, so write a key point with `gist <key point>`, at most one per step. It shows in a note after the step's arrows.

```dragon
pipe Swap 1 ETH for USDC

box alice as Alice
box ex as Exchange
box old as OldPool
box pool as Pool
box usdc as USDC

hold alice: 1 ETH, 0 USDC
hold ex: 0 ETH
hold pool: 5000 USDC
hold ex: "swaps[alice]" 0

step Alice asks Exchange with 1 ETH attached
  say ETH attached to a call moves into the callee's tank as the call is made.
  alice -> ex: swap [value: 1 ETH]

step The old pool is closed
  say The check fails, and every change up to it rolls back.
  ex -> old: swap
  check old: open == true [fail]
  revert old: closed

step Read the pool price
  say A call that cannot write reads only the price.
  ex -> pool: price [call: static]
  return pool: 3200

step Hand the swap to the pool
  say The inner steps fold into one box, which opens when pressed.
  ex -> pool: swap [fold]

step Work out the amount to pay
  say Work out how much USDC 1 ETH is worth at the current price.
  calc pool: 1 ETH -> 3200 USDC

step USDC moves to Alice
  say USDC takes the amount from the pool's balance and adds it to Alice's.
  pool -> usdc: transfer
  move usdc: 3200 pool -> alice
  emit usdc: Transfer(pool, alice, 3200)
  return usdc: true

step The pool returns the amount it paid
  say Even after the inner call returns, the changes stay provisional.
  return pool: 3200 USDC

step The swap ends
  say Exchange writes its record and returns, and every change becomes final here.
  gist Every change becomes final when the outermost call returns
  write ex: "swaps[alice]" 1
  emit ex: Swapped(alice, 3200)
  return ex: 3200 USDC
```

A chart (`chart <title> [shape: donut]` or `chart <title> [shape: bar]`) compares items step by step. A donut draws each item's share as the angle of an arc, and a bar chart draws each item's amount as the length of a bar.
Declare the items with `item <id> as <name> [color: <color>]` before the first step, from 1 to 8 of them.
Inside a step, `set <id>: <value>` writes the value of an item, a number of 0 or more without a unit. An item without `set` keeps its previous value, and the arcs and bars move from the previous values to the new ones.

```dragon
chart Smartphone OS share [shape: donut]

item ios as iOS [color: blue]
item android as Android [color: green]
item other as Other [color: slate]

step 2018
  say iOS holds 70 percent.
  set ios: 70
  set android: 29
  set other: 1

step 2024
  say Android grows to almost 40 percent.
  set ios: 60
  set android: 39
```

In a flow diagram (`flow <title>`), write the steps of the procedure with `box` and each choice with `choice <id> as <question>`.
The boxes and choices that the steps pass through stack in one column in the order the lines first reach them, and a path that a choice sends elsewhere leaves to the right of the choice.
Each line out of a choice carries the answer as its label, and a choice has at most two ways out.
As in a state diagram, `start` and `finish` join the start and end marks, and lines written before the first `step` line are paths not taken this time and stay dotted.
A box that no line in a step reaches gets a dotted border and a muted name.
The line that moves in a step turns blue and a dot runs along it.
A line without `carry` or `tag` runs this dot instead of an envelope.
A long question wraps onto two lines after a particle or a space.

```dragon
flow Taking an application

box form as Receive the form
choice ok as Filled in?
box send as Accept [color: green]
box back as Ask for a fix [color: rose]

ok -> back: No

step Receive
  say An application arrives and the procedure starts.
  start -> form

step Check
  say A choice decides whether it is filled in. The no path leaves to the right as a dotted line.
  form -> ok: Check

step Accept
  say It is filled in, so the yes path goes down and the application is accepted.
  ok -> send: Yes
  send -> finish
```

In a cycle diagram (`cycle <title>`), write the steps on the ring with `box` before the first `step` line.
The steps sit on the ring clockwise from the top in the order written, and arc arrows join each step to the next. A ring takes 2 to 8 steps.
A `<id> -> <id> [tag: <text>]` line inside a step is a line to the next step on the ring. In that step the chip runs along the arc, and the arc it ran stays lit.
A line from the last step to the first one starts the next round. Lines that skip a step, go backward or carry a label are refused.
`strip <title>: <field>, <field>` goes in the middle of the ring instead of under the diagram, and `set <field>: <value>` in a step changes a value. Field names are not shown, and the first field shows large.

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

In a mind map (`mind <title>`), write ideas with `idea` lines inside steps; an idea turns solid at its step and the line from its parent is drawn.
The idea without `of` is the topic in the middle, and there is only one. `idea <id> as <name> of <parent>` joined to the topic is a branch, joined to a branch is a leaf, and a fourth level is refused.
Branches go round clockwise from the upper left in the order written (up left, up right, down right and down left for four), and leaves sit in a column outside their branch.
`[color: <color>]` on a branch passes its colour to its lines and leaves. `box`, `strip` and lines between boxes are refused.

```dragon
mind Features for a budget app

step Put the title
  say Put in the middle a budget app that makes it easy to keep tracking money every month.
  idea app as Budget app

step Input branch
  say Think of features that cut the effort of logging.
  idea input as Input of app [color: blue]
  idea receipt as Scan receipts of input
  idea bank as Import bank records of input

step Alerts branch
  say Think of alerts that catch overspending early.
  idea alert as Alerts of app
  idea over as About to pass the budget of alert
  idea payday as Day before a direct debit of alert
```

In a table relation diagram (`er <title>`), write each table with `table <id> as <name>` before the first `step` line, and its fields under it with `field <name>: <value>` lines.
The tables sit left to right in one row in the order written. A diagram takes 1 to 6 tables.
`[key]` is the key mark (PK), and `field <name>: <value> [ref: <table>.<field>]` links it to a field of another table (FK); a line runs from the linking field to the field it points at.
`pick <table>.<field>` inside a step lights the row and its table, and `<table>.<field> -> <table>.<field> [tag: <value>]` runs a value chip along the line between linked fields. A line between fields that are not linked is refused.
`set <table>.<field>: <value>` rewrites the value of a field, and `note <table>.<field>: <text>` shows a formula card under the table.

```dragon
er Look up the customer of an order

table users as Customers
  field id: U-7 [key]
  field name: Tanaka
  field orders: 2

table orders as Orders
  field id: O-41 [key]
  field user_id: U-7 [ref: users.id]
  field amount: $12

step Look up the order
  say Look up the row of order O-41.
  pick orders.id

step Follow the customer
  say Follow the user_id along the link and look up Tanaka, customer U-7.
  orders.user_id -> users.id [tag: U-7]
  pick users.id

step Count the order
  say Add one to the orders Tanaka has.
  note users.orders: 2 + 1 = 3
  set users.orders: 3
  pick users.orders
```

In a two-axis matrix (`matrix <title>`), write `axis <name> [from: <low end>, to: <high end>]` twice before the first `step` line, the horizontal axis first and then the vertical one.
The horizontal arrow runs below the areas from left to right and the vertical arrow left of them from bottom to top, with the axis name and both ends outside the axis.
Write exactly four areas with `box <id> as <name>`; they go top left, top right, bottom left and bottom right in the order written. Write the items to sort with `item <id> as <name>`; they wait in the list left of the areas in the order written.
`line <area>: <item>, <item>` inside a step places items into an area: the cards slide from the list into the area and the area lights up. A placed card stays until a later step places it in another area.
A matrix without exactly two axes or four areas, and a `line` that names an unknown area or item, are refused. Lines between boxes and `strip` are not allowed.

```dragon
matrix Sort the work by effort and impact

axis Effort [from: low, to: high]
axis Impact [from: low, to: high]

box now as Do now
box plan as Plan it
box spare as When free
box drop as Skip

item login as Faster login
item pay as Add payments
item word as Fix wording

step Line up
  say Line up the work on the left.

step Do now
  say Low effort and high impact goes first.
  line now: login

step The rest
  say Sort the rest by effort and impact.
  line plan: pay
  line spare: word
```

In a set overlap diagram (`venn <title>`), write 2 or 3 sets with `item <id> as <name>` before the first `step` line.
`set <id>: <count>` inside a step writes the total of a set; its circle appears in that step, with the name and the total outside it.
`set <id> & <id>: <count>` writes the count in an overlap and lights its region in that step. Each region shows the count that is only in it, worked out from the totals and the overlaps.
`set none: <count>` shows the count in none of the sets in the frame outside the circles. An overlap larger than one of its sets is refused.

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

In a Sankey diagram (`sankey <title>`), write the sources and targets with `box <id> as <name>` before the first `step` line.
`<source> -> <target>: <amount>` inside a step grows a band from the source bar to the target bar in that step, and an amount chip crosses it.
The number at the start of the label is the amount (`40%` reads as 40, `1,200 yen` as 1200), and the band takes that share of the source bar.
A label that does not start with a number, a line whose flow leads back to a box it came from, and a box sending out more than comes in are refused.

```dragon
sankey Where the pocket money goes

box pay as Pocket money 10,000 yen [color: slate]
box food as Food [color: amber]
box save as Savings [color: green]
box fun as Fun [color: rose]

step Get it
  say A month of pocket money is 10,000 yen.

step Food
  say Half of it, 5,000 yen, goes to food.
  pay -> food: 5,000 yen

step The rest
  say Save 3,000 yen and spend 2,000 yen on fun.
  pay -> save: 3,000 yen
  pay -> fun: 2,000 yen
```

## Attributes

Inside the `[ ]` at the end of a line, list `<key>: <value>` pairs separated by `,` to set how it looks and what it carries.

| On | Key | Meaning |
|---|---|---|
| Kind and title | `view` | The view. `fixed` or `follow` |
| Kind and title | `shape` | The shape of a chart. `donut` or `bar`. Only in a chart, where it is required |
| Region and box | `note` | The note of a region, or the caption under a box |
| Region and box | `color` | Colour role. One of `blue` / `amber` / `green` / `violet` / `rose` / `slate` / `coin` |
| Region and box | `icon` | Icon next to the name |
| Idea | `color` | The colour of an idea in a mind map, from the same roles as regions and boxes. On a branch, its lines and leaves take the colour, and a branch without one gets a colour no other branch has taken |
| Axis | `from`, `to` | The two ends of an axis in a two-axis matrix. `from` is the low end (left on the horizontal axis, bottom on the vertical one) and `to` the high end. Leave them out and no end text shows |
| Box | `link` | Where the box leads. The box becomes a link in the drawn diagram. A path that starts with `/` or a URL that starts with `http://` or `https://` |
| Source of a step | `url` | Where the source is. Takes the same forms as `link` |
| Line | `carry` | What travels on the line. `coin` or `none`. Without it, an envelope travels |
| Line and strip value | `tag` | The text of a tag that travels on the line, or a tag on a strip field |
| Line | `side` | Which side of the line the label goes. `above` / `below` / `left` / `right`. Write it only when the automatic placement breaks |

Wrap a value that contains `,` or `]` in `"`, and write `"` and `\` inside it as `\"` and `\\`.
Lines starting with `//` and empty lines are not read.

## Errors

A line that cannot be read stops with an error that shows its line and column.
The caller chooses the language of the error (`parseNotation(text, { lang: "ja" })` or `dragon export --lang ja`), and English is the default.
Notation written by AI can be fixed the same way: hand the error message to the AI and it fixes the line it points to.
Similar box names in a diagram without box declarations are not errors. The diagram is still drawn, and the notice goes into `notices` of the `parseNotation` result in the same shape as an error, and the export command prints it to standard error.
A line in the old form (such as one starting with `#` or `region`) stops with an error that shows the new form of that line.
A table from the old form to the new one is in the English version of the guide page in the sample site.

## Embedding in documents

In a README or an article, write the diagram in a fence whose language is `dragon`.
A document can embed any number of diagrams.

````markdown
```dragon
sequence Ask to sign in
...
```
````

## Going between the notation and JSON

The notation and JSON convert both ways.
Writing JSON back as notation uses a fixed layout, so the writer's line order and comment lines are not kept.
The JSON shape is defined in `src/schemas/diagram.schema.json`, and the `version` field holds the format version.
