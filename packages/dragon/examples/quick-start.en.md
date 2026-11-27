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
4. The only nesting is `group … end` and the scene's `scene … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`

## Line forms

Before the first `step` line, declare the diagram kind and title, regions, boxes, and the strip.

| Line | Form | Example |
|---|---|---|
| Kind and title | `sequence <title>`, `architecture <title>`, `state <title>`, `git <title>`, `time <title>`, `tree <title>`, `pipe <title>`, `flow <title>`, `cycle <title>` (add `[shape: clock]` to set the steps on a clock dial, or `[shape: band]` to run them left to right on a band), `mind <title>`, `er <title>`, `matrix <title>` (add `[shape: scatter]` to plot by score), `venn <title>`, `sankey <title>` (add `[shape: rows]` to stack one bar per step, or `[shape: treemap]` to split one square of the whole by area), or `chart <title> [shape: donut]` (or `[shape: bar]`, `[shape: funnel]`, `[shape: dots]` or `[shape: line]`). Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the line | `architecture Send tokens with CCIP [view: follow]` |
| Region | Open with a `group <id> as <name> [note: <note>]` line and close with an `end` line. The boxes on the `box` lines in between go inside the region | `group source as Source chain [note: e.g. Ethereum, color: blue]` |
| Box | `box <id> as <name> [note: <caption>]`. Without `as <name>`, the id is the name | `box OnRamp [note: checks and sends]` |
| Choice | `choice <id> as <question>`. A diamond with the question inside, and each line out of it carries the answer as its label. Only in a flow diagram | `choice ok as Filled in?` |
| Strip | `strip <title>: <field>, <field>`. In a time diagram, `[meter: <ratio>]` after a field name makes that field a meter | `strip Message: ID, receiver, state` |
| Gauge | `gauge <id> as <name> [on: <box>, limit: <limit>, unit: <unit>, over: <text>]`. A bar for an amount with a limit. Only in a flow or a lineup diagram ([Gauges](#gauges)) | `gauge budget as Daily budget [on: vi, limit: 100, unit: USDC]` |
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
| Gauge value | `set <gauge>: <total>`. The value is the total at that step, and a step without it keeps the value | `set budget: 40` |
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

`fixed` keeps the whole diagram still and moves only what is inside. `follow` moves to where things are happening and shows the current place in a small overview in the corner.
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
A line `<caller> -> <callee>: <text>` is a call. `[value: <amount> ETH]` sends ETH with it, and `[call: delegate]` or `[call: static]` sets its kind. `[fold]` folds its inner steps into one box.
Inside a step, `move <token>: <amount> <from> -> <to>` moves a balance, and `write <party>: <name> <value>` rewrites a value. `check <party>: <left> <op> <right>` checks, and a check on values that are not numbers fails only with `[fail]`. `emit <party>: <name>(<arg>, ...)` emits an event, and `calc <party>: <in> -> <out>` converts.
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

`chart <title> [shape: funnel]` draws a funnel, where the count shrinks stage by stage. Declare the stages from the top with `item` and write each count with `set`.
A stage's bar appears in the step that sets it. The gap to the stage above stays as a pale bar with the number who left. The last step shows the share of the first stage that made it to the last one.
A value larger than the stage above is an error when the notation is read.

```dragon
chart People on the way to buying [shape: funnel]

item visit as Visited the shop [color: blue]
item view as Viewed a product [color: violet]
item buy as Bought [color: green]

step Visit
  say 10,000 people visited the shop site.
  set visit: 10000

step View a product
  say 4,200 people went on to a product page.
  set view: 4200

step Buy
  say 380 people bought.
  set buy: 380
```

`chart <title> [shape: dots]` counts with dots.
The box of the whole holds empty dots from before the first step. In the step that sets an item, that many dots move from the box to the item's cluster.
The diagram picks how many each dot stands for (1, 2 or 5 times a power of 10), so that the dots come to about 100. It shows that number at the top of the box beside the total.
Write the first line as `chart <title> [shape: dots, unit: <count>]` to choose it yourself. A step with more than 200 dots is an error when the notation is read.
Donuts, bars and dots take `set none: <count>` inside a step for the count in none of the items.
With dots those dots stay grey in the box, and a donut or a bar draws them as a grey arc or bar after the items. A funnel and a line chart refuse `set none`.

```dragon
chart Devices of 1,000 people [shape: dots]

item i as iPhone
item a as Android
item w as Windows
item m as Mac

step iPhone
  say 412 people use an iPhone most, which makes 41 dots.
  set i: 412

step Android
  say 287 people use Android, the second most after iPhone.
  set a: 287

step Windows
  say 158 people use a Windows computer.
  set w: 158

step Mac
  say 93 people use a Mac, which makes 9 dots.
  set m: 93

step None of them
  say The 50 people who use none of them stay grey in the box of the whole.
  set none: 50
```

`chart <title> [shape: line]` draws how amounts change over time as a line chart.
Each `item` is one line, and each `step` is one point on the time axis, labeled with the step title.
Going to the next step draws each line from the previous point to the new one and shows the step's value beside the point. A step without `set` keeps the previous value.
A line chart with a single step, an item that never gets a value, and `set none` are errors when the notation is read.

```dragon
chart A bakery's sales over one week (yen) [shape: line]

item shop as Counter [color: amber]
item online as Online [color: blue]

step Mon
  say The week starts with 42,000 yen at the counter and 12,000 yen online.
  set shop: 42000
  set online: 12000

step Tue
  say On a rainy Tuesday the counter drops to 38,000 yen, and online grows to 15,000 yen.
  set shop: 38000
  set online: 15000

step Wed
  say The counter comes back to 45,000 yen.
  set shop: 45000
```

A lineup diagram (`lineup <title>`) uses the board look by default. The boxes become pale vertical columns from left to right in the written order, and the chips stack in them as cards from the top.
Each column head shows the name and the number of cards. Write `[limit: <number>]` on a box to show the count as `2/3` and to put that many ticks under the head, filled for each card.
When a `line` in a step moves a chip back to an earlier column, it is a send-back. A return line and a "Sent back" label are drawn, and a dashed trace stays in the column it left. `line <lane>:` with nothing after the `:` empties that lane.
Add `[shape: stations]` to the first line for the stations look, which puts the boxes on one line as stops and stacks the cards under each stop. A stop with a limit shows its free seats as dashed slots.
The stations look does not draw `seal`, `open`, `pick`, or `stamp`, so it refuses them. On a phone-width frame, the board stacks its columns from the top and the stations line runs down.

```dragon
lineup Ship a change to production [shape: stations]

box Dev
box Review [color: violet]
box Staging [color: amber, limit: 2]
box Live as Production [color: green, order: none]

item login, search

step Send them to review
  say Two changes go to review.
  line Review: login, search

step Check them on staging
  say Both approved changes go on Staging, which is now full with 2.
  line Staging: login, search
  line Review:

step Send it back if it fails
  say search fails on Staging, so it is sent back to Dev, and only login ships.
  line Dev: search
  line Live: login
  line Staging:
```

Add `[shape: layers]` to the first line of a lineup diagram (`lineup <title>`) to stack the boxes as horizontal bands, top to bottom in the written order. It then draws one request or transaction going down through the layers.
The left of each band shows the layer's name, its `note`, and its number, and no arrows are drawn between layers. A layers lineup takes up to 8 layers.
Inside a step, `line <layer>: <chip>` is the layer the chip is in, drawing that band strongest and the bands it has passed lighter. `note <layer>: <text>` is the mark of that layer, such as what it did and how long it took.
The layers look does not draw `[order: none]`, `role`, `seal`, `open`, `pick`, or `stamp`, so it refuses them.

```dragon
lineup A save request on its way to the store [shape: layers]

box browser as Page [note: Turns the save tap into a request, color: blue]
box api as Server [note: Checks the login and the content, color: amber]
box db as Data store [note: Writes the row and keeps it, color: green]

item Request [color: blue, note: POST /notes]

step Tap save on the page
  say Tapping save makes the browser send the content as a request.
  line browser: Request
  note browser: Made the request

step Write it to the store
  say The server checks the request, and it steps down to the data store to be written.
  line db: Request
  note db: Written in 30 ms
```

Add `[shape: stairs]` instead to set the layers as stairs, each lower layer shifted right by the same width.
Write `[time: <length>]` on every box line, such as `box encode as Encode [time: 3min]`. A scale of the time spent so far then sits to the right of the stairs. `0s` is allowed for a layer that takes no time.
At each step, the needle of the scale moves to the time spent through the layer the chip went down to, with a card such as `1min 3s`. On a phone-width frame, the scale lies under the diagram.

```dragon
lineup Until a video can be watched [shape: stairs]

box upload as Upload [color: violet, time: 40s]
box encode as Encode [color: amber, time: 3min]
box viewer as Viewer's device [color: green, time: 3s]

item video [color: blue]

step Upload
  say The phone sends the video to storage.
  line upload: video

step Encode
  say Storage remakes the video in four qualities.
  line encode: video

step Play
  say The viewer's device starts playback.
  line viewer: video
```

In a flow diagram (`flow <title>`), write the steps of the procedure with `box` and each choice with `choice <id> as <question>`.
The boxes and choices that the steps pass through stack in one column, in the order the lines first reach them. A path that a choice sends elsewhere leaves to the right of the choice.
Each line out of a choice carries the answer as its label, and a choice has at most two ways out.
As in a state diagram, `start` and `finish` join the start and end marks. Lines written before the first `step` line are paths not taken this time and stay dotted.
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

Write the first line as `cycle <title> [shape: clock]` to set the steps on a clock dial.
Each step `box` takes its length as `[time: 25min]`, a number other than 0 and a unit (`ms`, `s`, `min`, `h` or `d`). The steps sit from 12 o'clock as arcs as long as they take.
In each step the hand points at the start of that step's arc and the chip rides the hand tip. `[shape: clock, turn: left]` turns the dial counterclockwise.

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

Write the first line as `cycle <title> [shape: band]` to run the steps left to right on a band, one band per round.
`[time: <length>]` on every step `box` puts a scale over the band that marks when each step starts. Write a length on every step or on none.
The chip of a line runs from chevron to chevron, and the line from the last step to the first one follows a return arrow down to the next band.

```dragon
cycle A year on the field [shape: band]

box sow as Sow [time: 60d, color: green]
box grow as Grow [time: 120d, color: blue]
box harvest as Harvest [time: 60d, color: amber]
box rest as Rest the soil [time: 120d, color: slate]

strip Field: year, season

step Sow
  say In spring the soil is tilled and seeds go into the field.
  set year: Year 1
  set season: Spring

step Grow
  say Once the shoots are up, they get water and grow all summer.
  sow -> grow [tag: shoots]
  set season: Summer

step Harvest
  say In autumn the ripe crop is harvested.
  grow -> harvest [tag: crop]
  set season: Autumn

step Rest the soil
  say After the harvest, compost goes on the field and the soil rests through winter.
  harvest -> rest [tag: compost]
  set season: Winter

step Into year 2
  say When spring comes, seeds go into the rested soil again.
  rest -> sow [tag: seeds]
  set year: Year 2
  set season: Spring

step Grow in year 2
  say In year 2 the shoots again grow through the summer.
  sow -> grow [tag: shoots]
  set season: Summer
```


In a mind map (`mind <title>`), write ideas with `idea` lines inside steps; an idea turns solid at its step and the line from its parent is drawn.
The idea without `of` is the topic in the middle, and there is only one. `idea <id> as <name> of <parent>` joined to the topic is a branch, joined to a branch is a leaf, and a fourth level is refused.
Branches go round clockwise from the upper left in the order written (up left, up right, down right and down left for four). Leaves sit in a column outside their branch.
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
`[key]` is the key mark (PK), and `field <name>: <value> [ref: <table>.<field>]` links it to a field of another table (FK). A line runs from the linking field to the field it points at.
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
The horizontal arrow runs below the areas from left to right, and the vertical arrow left of them from bottom to top. The axis name and both ends sit outside the axis.
Write exactly four areas with `box <id> as <name>`; they go top left, top right, bottom left and bottom right in the order written. Write the items to sort with `item <id> as <name>`; they wait in the list left of the areas in the order written.
`line <area>: <item>, <item>` inside a step places items into an area: the cards slide from the list into the area and the area lights up. A placed card stays until a later step places it in another area.
A matrix without exactly two axes or four areas, and a `line` that names an unknown area or item, are refused. Lines between boxes and `strip` are not allowed.
Give an item scores from 0 to 10 with `[x: <across>, y: <up>]` on its line. Then `line: <item>` inside a step places it without naming an area, into the area its scores fall in. A score of 5 or more counts as the large side, and `reverse: yes` on an axis line puts large values on the left or at the bottom.
Start with `matrix <title> [shape: scatter]` to plot each item as a dot at its scores, with a table of the items and their scores on the left. `[shape: scatter, table: none]` leaves the table out.

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

```dragon
matrix Plot the work by score [shape: scatter]

axis Effort [from: low, to: high]
axis Impact [from: low, to: high]

box now as Do now
box plan as Plan it
box spare as When free
box drop as Skip

item login as Faster login [x: 2, y: 8]
item pay as Add payments [x: 8, y: 7.5]
item word as Fix wording [x: 3, y: 3]

step Line up
  say Line up the work and its scores in the table on the left.

step Login
  say Plot the work with low effort and high impact.
  line: login

step Payments
  say Plot the work with high impact and high effort.
  line: pay

step Wording
  say Plot the work with low effort and low impact.
  line: word
```

In a set overlap diagram (`venn <title>`), write 2 or 3 sets with `item <id> as <name>` before the first `step` line.
`set <id>: <count>` inside a step writes the total of a set; its circle appears in that step, with the name and the total outside it.
`set <id> & <id>: <count>` writes the count in an overlap and lights its region in that step. Each region shows the count that is only in it, worked out from the totals and the overlaps.
`set none: <count>` shows the count in none of the sets in the frame outside the circles. An overlap larger than one of its sets is refused.
Add `[shape: dots]` to the first line to count with dots instead of circles. The dots move into a cluster for each set and each overlap. A dot in two or more sets is painted in slices of their colors. `[shape: dots, unit: <count>]` chooses how many each dot stands for.

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
A label that does not start with a number is refused. So are a line whose flow leads back to a box it came from, and a box sending out more than comes in.

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

Add `[shape: rows]` to the kind line to stack one full-width bar per step from the top.
Each row is split into the sections that the lines so far have cut. The sections that split off in that step and those of the last row show their name and amount.
What a box with no source has not handed out yet is a gray bar that reads like `16h left`. A name that does not fit its section is listed under the bar.

```dragon
sankey How a day is spent [shape: rows]

box day as One day [color: slate]
box sleep as Sleep [color: blue]
box awake as Awake [color: amber]
box work as Work [color: violet]
box free as Free time [color: rose]

step One day
  say A day has 24 hours.

step Sleep
  say Sleep 8 hours.
  day -> sleep: 8h

step Awake
  say The other 16 hours are awake time.
  day -> awake: 16h

step Split
  say Split the awake time into work and free time.
  awake -> work: 10h
  awake -> free: 6h
```

Add `[shape: treemap]` to the kind line to make the whole amount one square and cut it into areas by amount, step by step.
The part not split yet is cut across its longer side. Lines written in the same step from the same source carve out one strip that is divided in the order written.
When a target section is split again, its frame and name chip stay. What a box with no source has not handed out yet is a gray section that reads like `48GB left`.

```dragon
sankey Phone storage [shape: treemap]

box all as Storage [color: slate]
box photo as Photos [color: blue]
box app as Apps [color: green]
box game as Games [color: rose]
box work as Work [color: blue]

step Storage
  say The phone has 128GB of storage.

step Photos and apps
  say Photos use 48GB and apps use 32GB.
  all -> photo: 48GB
  all -> app: 32GB

step Inside the apps
  say Split the 32GB of apps into games and work.
  app -> game: 20GB
  app -> work: 12GB
```

In an owner card diagram (`cards <title>`), write the owner columns with `box <id> as <name>` before the first `step` line.
Write each card with `item <id> as <name> in <column>, <column>`, and every column in `in` gets its own copy.
An `item` line in a step makes a card, and `item <id> in <column>` on an existing card moves it to those columns.
`delete <card>` strikes a card through and keeps it, and `refuse <card or column>: <reason>` shows a refused panel and changes nothing.

```dragon
cards Pay with gift cards

box aki as Aki [note: Customer]
box shop as Shop [mark: Received]

item g1 as Gift card #1 in aki [amount: 5 USD, mark: shop]
item g2 as Gift card #2 in aki [amount: 5 USD, mark: shop]
item c1 as Coupon in aki [amount: 1 USD, total: none]

step Pay
  say Aki pays with gift card #1. It moves to the shop column and gets the shop's mark.
  aki -> g1: Pay
  item g1 in shop

step Refused
  say The coupon has expired, so it cannot be used.
  aki -> c1: Use
  refuse c1: Expired

step Throw away
  say The expired coupon is thrown away. It is not added to the total, so the total stays the same.
  delete c1
```

## Attributes

Inside the `[ ]` at the end of a line, list `<key>: <value>` pairs separated by `,` to set how it looks and what it carries.

| On | Key | Meaning |
|---|---|---|
| Kind and title | `view` | The view. `fixed` or `follow` |
| Kind and title | `shape` | The shape of a chart. `donut` or `bar`. Only in a chart, where it is required |
| Kind and title | `note` | How box notes show. `pop` shows them on cards that open on a click, and `under` under the names (see [Note cards](#note-cards)) |
| Kind and title | `scenes` | How scenes show. `stack` lines them up and plays them together, and `pick` follows the scene chosen with its name button (see [Scenes](#scenes)) |
| Region and box | `note` | The note of a region, or the caption under a box |
| Region and box | `color` | Colour role. One of `blue` / `amber` / `green` / `violet` / `rose` / `slate` / `coin` |
| Region and box | `icon` | Icon next to the name |
| Idea | `color` | The colour of an idea in a mind map, from the same roles as regions and boxes. On a branch, its lines and leaves take the colour, and a branch without one gets a colour no other branch has taken |
| Axis | `from`, `to` | The two ends of an axis in a two-axis matrix. `from` is the low end (left on the horizontal axis, bottom on the vertical one) and `to` the high end. Leave them out and no end text shows |
| Box | `example` | An example shown at the bottom of the box's note card. Only on a box with `note` in a diagram whose notes show on cards |
| Box | `link` | Where the box leads. The box becomes a link in the drawn diagram. A path that starts with `/`, a URL that starts with `http://` or `https://`, or a place on the page that starts with `#` |
| Source of a step | `url` | Where the source is. Takes the same forms as `link` |
| Line | `carry` | What travels on the line. `coin` or `none`. Without it, an envelope travels |
| Line and strip value | `tag` | The text of a tag that travels on the line, or a tag on a strip field |
| Line | `side` | Which side of the line the label goes. `above` / `below` / `left` / `right`. Write it only when the automatic placement breaks |
| Gauge | `on` | The box the gauge sits under. Without it, the gauge sits in the band at the top |
| Gauge | `limit` | The limit, a number above 0. Without it, the gauge draws no bar and shows only the value and the unit |
| Gauge | `unit` | The unit shown after the value |
| Gauge | `over` | The tag under the gauge in a step over the limit. The default is over the limit. Only a gauge with `limit` takes it |

Wrap a value that contains `,` or `]` in `"`, and write `"` and `\` inside it as `\"` and `\\`.
Lines starting with `//` and empty lines are not read.

## Note cards

In sequence, architecture, state, git, time, tree and flow diagrams, `[note: pop]` on the first line shows each box's `note` on a card instead of under its name.
Only a box with `note` gets a round i mark at its top right, and a long note no longer widens the box.
Clicking the box opens a card just below it with the box name and the whole `note`.
The card closes when you click outside it or its close icon, and when you move to another step.
A box in such a diagram also takes `example: <example>`, shown as a gray band at the bottom of the card.
`[note: under]` draws the note under the name, the same as writing nothing.
Another value of `note`, and `example` on a box without `note` or in a diagram without `[note: pop]`, are refused with the line named.
When the page is printed, every card is drawn open and listed below the diagram with its box name, not over the diagram.
On a Markdown page, a `note: pop` line at the top makes cards the default for every diagram on the page.

```dragon
sequence Take an order [note: pop]

box shop as Shop [note: Takes the order and checks the stock before it asks the warehouse to ship, example: Three orders on one day go to the warehouse together]
box store as Warehouse [note: Keeps the goods and ships them]

step Ask
  say The shop asks the warehouse to ship.
  shop -> store: ship
```

## Scenes

Flow and lineup diagrams can hold up to three scenes.
Write the boxes and the steps shared by all scenes once, then write each scene's own steps from the point where they split between `scene <name>` and `end`.
`stop <reason>` in a step stops that scene there and shows the reason.
Choose how the scenes show with `[scenes: stack]` or `[scenes: pick]` on the first line; without it, the diagram uses `stack`.
`stack` lines the scenes up top to bottom with each box at the same horizontal place in every scene, and moving on plays all scenes together.
Shared steps draw their lines in gray, a scene's own steps in the scene's color, and a tag reading "splits here" in the scene's color sits on the top edge of the box or lane where the scene splits off.
`pick` shows a button per scene name; pressing one goes back to that scene's first step and moves only that scene.
With `[note: pop]` on the first line too, a card opens just below the box clicked in that scene.
When the page is printed, both stack every scene and print the still of each of its steps in order, with the step number and `say` text.
A fourth `scene` and a `scenes` value other than `stack` and `pick` are refused with the line named.
So are `scene` in another kind of diagram, `stop` in a step outside a scene, and a `scene` not closed with `end`.

```dragon
flow Two scenes of a transfer [scenes: stack]

box ask as Ask to transfer
box look as Check the payee
box send as Send
box back as Send back

step Ask
  say A user asks to transfer money. Every scene shares the steps up to here.
  start -> ask

step Check
  say Checks whether the payee is registered. The scenes split from here.
  ask -> look: payee

scene Transfer goes through
  step Send
    say The payee is right, so the money is sent.
    look -> send: right
end

scene Wrong payee
  step Send back
    say The payee is wrong, so the transfer is sent back. This scene stops here.
    look -> back: wrong
    stop The payee is not registered
end
```

## Gauges

In a flow or a lineup diagram, `gauge <id> as <name> [on: <box>, limit: <limit>, unit: <unit>]` before the first `step` shows an amount with a limit as a bar.
In a step, `set <gauge>: <total>` moves the bar to that value, with text like 40 / 100 USDC above the bar.
The value is the total at that step. It is 0 before the first `set`, and a step without `set` keeps the value.
A smaller value than before shrinks the bar.
A step that changes the value shows a tag with the increase (`+40`) or the decrease (`−20`) to the right of the bar.
A gauge sits right under its `on` box, and gauges on the same box stack in the order declared.
A gauge without `on` sits in the band at the top of the diagram.
In a step over the limit, a dotted line marks the limit, and the part over it grows in red.
The value turns red, and an over the limit tag shows under the gauge. `[over: <text>]` changes the text of the tag.
A gauge without `limit` draws no bar and shows only the value and the unit.
An `on` that names an undeclared box is refused with the line named.
So is a `set` on an undeclared gauge, or a `set` whose value is below 0 or not a number.

```dragon
flow Stop payments at the daily budget

box agent as AI agent
box vi as VeriIntent
box signer as Signer

gauge budget as Daily budget [on: vi, limit: 100, unit: USDC, over: Stopped over the limit]

step Send the first
  say Send 40 USDC and use 40 percent of the budget.
  agent -> vi: 40 USDC
  vi -> signer: Ask to sign
  set budget: 40

step Stop at the second
  say The total of 120 USDC goes over the limit, so it stops without asking to sign.
  agent -> vi: 80 USDC
  set budget: 120
```

## Errors

A line that cannot be read stops with an error that shows its line and column.
The caller chooses the language of the error (`parseNotation(text, { lang: "ja" })` or `dragon export --lang ja`), and English is the default.
Notation written by AI can be fixed the same way: hand the error message to the AI and it fixes the line it points to.
Similar box names in a diagram without box declarations are not errors. The diagram is still drawn, and the notice goes into `notices` of the `parseNotation` result in the same shape as an error. The export command prints it to standard error.
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

## Writing in HTML

A report written as one HTML file can use the HTML form, where each notation line is one element.
The diagram is wrapped in `<dg-` and the diagram kind, and a declaration line becomes the element named after its block.
`step` becomes `<dg-step>`, `say` becomes `<dg-body>`, and a line inside a step becomes `<dg-edge>`.

```html
<dg-sequence title="Take an order">
  <dg-box id="shop">Shop</dg-box>
  <dg-box id="api">Order API</dg-box>

  <dg-step title="Place the order">
    <dg-body>The shop sends the order to the API.</dg-body>
    <dg-edge from="shop" to="api">Send the order</dg-edge>
  </dg-step>
</dg-sequence>
```

`dragon convert diagram.dragon` prints the HTML form of the notation, and `dragon convert diagram.html` prints the notation of the HTML form.
The rules for element and attribute names, and how a Markdown page becomes an HTML page, are in the "Write the diagram in HTML" section of [`packages/dragon/README.md`](../README.md).

## Going between the notation and JSON

The notation and JSON convert both ways.
Writing JSON back as notation uses a fixed layout, so the writer's line order and comment lines are not kept.
The JSON shape is defined in `src/schemas/diagram.schema.json`, and the `version` field holds the format version.

## Diagram kinds

Each kind of diagram adds its own lines to the line forms above. The sections follow the order of the diagram kinds in the README.

### Sequence diagram

Start with `sequence <title>` to draw a sequence diagram. Each box is a party with a lifeline, and each step sends messages between the parties in order.

- `box <id> as <name> [note: <caption>]` is a party. A diagram with no `box` line makes a party of each name on the lines
- `<from> -> <to>: <label>` is a message. The `carry` and `tag` attributes put what travels on the line
- A diagram with no `step` line makes each line one step

#### Pipe look of a sequence diagram

Add `[shape: pipe]` to the first line of a sequence diagram to draw it with the parts of the pipe diagram. Each lifeline becomes a pipe, and each box sits on top of its pipe.
In this look, `hold <owner>: <amount> <token>` lines before the first step put each owner's balance under its box. A sequence diagram without `[shape: pipe]` refuses `hold`.
A sequence diagram without the attribute keeps the current look.
With `@cardenelabs/dragon/light`, `loadFor` loads this look as a separate chunk, so a page that draws only the current look loads nothing more.

A line of a sequence diagram takes `[op: <number>]` in either look, the number of the operation that raised the line. The drawn line carries the step and the number in `data-op`, as in `0/3`. The page that shows the diagram can use it to link the line to a record or a line of code. Lines of other kinds of diagram refuse it.

```dragon
sequence Send USDC [shape: pipe]

box alice as Alice
box usdc as USDC
box bob as Bob

hold alice: 100 USDC
hold bob: 0 USDC

step Alice calls transfer
  say Alice calls transfer on USDC to send 10 to Bob.
  alice -> usdc: transfer(to: bob, amount: 10) [carry: none, op: 3]
  alice -> bob: 10 USDC [carry: coin, op: 4]

step USDC returns
  say USDC returns true.
  usdc -> alice: true [carry: none, op: 5]
```

### Architecture diagram

Start with `architecture <title>` to draw an architecture diagram. Boxes are the parts of a system, regions gather them, and each step moves something along the lines between them.

- `group <id> as <name> [note: <note>]` opens a region and `end` closes it. The boxes on the `box` lines in between go inside the region
- `box <id> as <name> [note: <caption>, icon: <icon>]` is a part
- `<from> -> <to>: <label> [tag: <text>]` moves a chip along the line in the step

### State diagram

Start with `state <title>` to draw a state diagram, which follows one thing moving between states step by step. Each box is a state, and each line is a move from one state to another.
Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark.
Lines written before the first `step` are paths the diagram could take but does not this time, drawn dotted.

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

### Git graph

Start with `git <title>` to draw a git graph, which follows commits stacking on branches until they are merged, step by step. Declare branches from the top on `branch <branch>` lines, and each branch gets its own band.
Inside a step, `commit <id> on <branch>` adds a commit to the tip of the branch, `copy <source>` makes a replayed commit, and `merge <branch>` makes a merge commit. `hash` and `note` put a hash and a short note beside the circle.
`<branch> from <commit>` cuts a branch at the commit after `from`, and `HEAD` moves to that branch. `<branch> -> <commit>` or `HEAD -> <commit>` moves a branch ref or `HEAD` without making a commit. A commit that no ref can reach any more turns into a dotted circle.
`delete <branch>` deletes a branch: its ref leaves the diagram from that step on, and its band stays. The branch `HEAD` points at cannot be deleted, so move `HEAD` to another branch first.

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

### Time diagram

Start with `time <title>` to draw a time diagram, which follows, step by step, which tick each event happens on along evenly spaced time. `scale <unit> <length> <count>` declares the ticks, and `period <name> <ticks>` declares the periods. `row <id>` declares a row of marks, and `point <id> at <tick>` a point below the axis. `zoom <range>` declares the ticks to zoom in on in the top band.
Inside a step, `now -> <tick>` moves the needle. The needle moves one tick at a fixed speed, and the marks of the ticks it passes appear as it goes. `mark <row> <range>` changes the color of marks, and `span <range>: <text>` puts a bracket under the axis or a frame around the rows.
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

To show how long tasks take, as in a schedule, write `task <id> as <name> <range> [color: <color>]` before the first step.
Each task gets its own row and is drawn as one thick bar over the ticks of the range. A range counts ticks from 0 like `mark`, as `0-2` or `13`.
The name sits to the left of the row. The first and last tick names with the scale name (such as `Day 1–3`) sit inside the bar. The part of the bar the needle has passed fills in.
A diagram with tasks needs no `row`, and tasks and rows keep the declared order from top to bottom.

```dragon
time Schedule up to the release

scale day 1d 14 [from: 1]

task design as Design 0-2 [color: blue]
task build as Build 3-8 [color: violet]
task test as Test 7-10 [color: amber]
task ship as Release 13 [color: green]

step Build and test
  say Start building on day 4, and start testing alongside it on day 8.
  now -> 10
```

### Tree diagram

Start with `tree <title>` to draw a tree diagram, which follows, step by step, how leaf values fold up into their parents until one root remains. Inside a step, `leaf <id> [hash: <value>]` writes a leaf, and `node <id> of <child>, <child> [hash: <value>]` writes a parent. Each box appears in the step that writes it.
Leaves line up from the left in written order, a parent sits above the middle of its children, and the box that no parent takes becomes the root.
A carrier on a line between a parent and a child runs along the tree line, and the tree line keeps that color once passed. From the step a carrier first runs on a tree line, only the boxes that send or receive carriers are drawn strongly.

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

### Lineup diagram

Start with `lineup <title>` to draw a lineup diagram, which follows chips in lanes step by step. The `shape` attribute on the first line picks one of these looks.

#### Board and stations looks of a lineup diagram

Start with `lineup <title>` to draw a lineup diagram, which follows chips in lanes step by step.
By default it uses the board look, and `[shape: stations]` on the first line switches to the stations look.

- The board puts the boxes side by side as pale vertical columns in the order declared, and stacks the chips in each column as cards from the top. The column head shows the name and the number of cards
- `[limit: <number>]` on a box shows the count as `2/3`. The board puts that many ticks under the head and fills one for each card, and the stations look draws a dashed slot for each free seat
- A box with `[order: none]` shows a "No order" pill under its name, and its cards carry no numbers. `note <lane>: <text>` in a step shows a value chip under the name until the next `note` on the same lane
- When a `line` moves a chip back to an earlier lane, it is a send-back. A return line and a "Sent back" label are drawn, the card gets a back mark, and a dashed trace stays in the lane it left
- `line <lane>:` with nothing after the `:` empties that lane
- The stations look puts the boxes on one line as stops and stacks the cards under each stop. It refuses `seal`, `open`, `pick`, and `stamp`, because it does not draw them

On a phone-width frame, the board stacks its columns from the top with two cards to a row, and the stations line runs down the left.

```dragon
lineup Ship a change to production [shape: stations]

box Dev
box Review [color: violet]
box Staging [color: amber, limit: 2]
box Live as Production [color: green, order: none]

item login, search

step Send them to review
  say Two changes go to review.
  line Review: login, search

step Check them on staging
  say Both approved changes go on Staging, which is now full with 2.
  line Staging: login, search
  line Review:

step Send it back if it fails
  say search fails on Staging, so it is sent back to Dev, and only login ships.
  line Dev: search
  line Live: login
  line Staging:
```

#### Layers look of a lineup diagram

Start with `lineup <title>` to draw a lineup diagram, which follows chips in lanes step by step.
Add `[shape: layers]` to the first line to stack the boxes as horizontal layers instead, for one request or transaction going down through them.

- The boxes stack from the top in the order declared. The left of each band shows the layer's name, its `note`, and its number. A layers lineup takes up to 8 layers and draws no arrows between them
- `line <layer>: <chip>` inside a step is the layer the chip is in. The band the chip is in is drawn strongest, and the bands it has passed stay lit
- `note <layer>: <text>` is the mark of the layer, such as what it did and how long it took. It stays until the next `note` on the same layer
- A chip with `note` shows it as a second line on its card
- The layers look refuses `[order: none]`, `role`, `seal`, `open`, `pick`, and `stamp`, because it does not draw them

On a narrow frame, the mark and the card move under the name and description of each layer.

```dragon
lineup An L2 transaction until it is final [shape: layers]

box wallet as Wallet [note: Signs with the private key, color: violet]
box l2 as L2 (rollup) [note: Bundles transactions into one, color: amber]
box l1 as L1 (Ethereum) [note: Waits until it cannot be undone, color: green]

item Transaction [color: blue, note: Swap 100 USDC]

step The wallet signs
  say The wallet signs the transaction with the owner's key.
  line wallet: Transaction
  note wallet: Signed in 1 s

step The L2 bundles it
  say The L2 bundles it with other transactions and answers within seconds.
  line l2: Transaction
  note l2: Bundled in 2 s

step L1 makes it final
  say Once the L1 block is final, the transaction can no longer be undone.
  line l1: Transaction
  note l1: Final in 13 min
```

#### Stairs look of a lineup diagram

Add `[shape: stairs]` to the first line instead to set the layers of the layers look as stairs, each lower layer shifted right by the same width.
It takes the same `box`, `item`, `line`, and `note` lines as the layers look, and refuses the same lines.

- `box <id> as <name> [time: <length>]` is the time spent in that layer, as a number and a unit (`ms`, `s`, `min`, `h`, `d`). Write `time` on every box or on none. A layer that takes no time can be written as `0s`
- With `time`, a scale of the time spent so far sits to the right of the stairs. Its numbers start at 0 and go up in round steps (1, 2, or 5 times a power of 10), in the largest unit written on the boxes
- At each step, the needle of the scale moves to the time spent through the layer the chip went down to, including that layer. A card such as `1min 3s` shows that time
- The chip walks no line between layers

On a phone-width frame, the stairs fill the width and the scale lies horizontally under the diagram.

```dragon
lineup Until a video can be watched [shape: stairs]

box upload as Upload [note: Sends the video to storage, color: violet, time: 40s]
box encode as Encode [note: Remakes it for each quality, color: amber, time: 3min]
box viewer as Viewer's device [note: Plays the video, color: green, time: 3s]

item video [color: blue, note: Trip video]

step Upload
  say The phone sends the video to storage.
  line upload: video

step Encode
  say Storage remakes the video in four qualities.
  line encode: video

step Play
  say The viewer's device starts playback.
  line viewer: video
```

### Try diagram

Start with `try <title>` to draw a try diagram, which readers move themselves by typing values and pressing buttons. Write the part lines before the first step, from top to bottom, and the parts are stacked in that order.

- `route <name>: <node> - <node> - ..., ... [from: <node>, to: <node>]` is a network. It carries a sent chip from `from` to `to` along the shortest path
- `queue <name> [order: <field>, accept: <name>]` is a waiting line. It sorts chips from the highest value of the `order` field. With `accept`, the input strip sends only chips with those names into the queue, and the send button cannot be pressed for any other name. Wrap two or more names as `accept: "<name>, <name>"`. When the first field has a `choose` line, the names in `accept` come from its choices
- `chain <name> [edit: <field>]` is a chain of blocks. Each block holds the previous block's `hash` as `prev`, and with `edit` the reader can change that field of a chip inside a block
- `log <name> [all: <field> = <value>, yes: <mark>, no: <mark>]` is a log. It lists the chips a button gathers as numbered records, and unlike a chain a record has no `prev` or `hash`. With `all`, a record shows the `yes` mark when that field of every chip in it has the value, and the `no` mark when even one differs
- `ask <field>, <field>, ... [into: <queue or field>, via: <route>]` is the input strip. The first field's value becomes the chip's name. When `into` names a field, a sent chip enters the queue whose name matches that field's value. Give that field a `choose` line and place a queue named after each choice
- `choose <field>: <value>, <value>, ...` gives that field choices. The reader picks one from the choices in the written order instead of typing. The first field takes choices too, and changing that field of a chip inside a block picks from the same choices
- `press <name> [from: <queue>, into: <chain or log>, take: <count>, at: <part>]` is a button. It moves the top `take` chips of the queue into a new block or a new record. Write two or more queues as `from: "<queue>, <queue>"`, and it gathers the top `take` chips of each, in the written order, into one block or record. It cannot be pressed while any of those queues holds fewer than `take`. With `at` it sits on that part, and without it in the input strip
- `side <part>, <part>, ...` puts route, queue, chain, and log parts on one row, left to right in the written order, when the frame is wide. A queue takes only the width its chips need and the rest goes to the route, chain, and log. When the row would shrink the text below a readable size, the parts stack as without the line
- `check <node>: <field> <op> <value> [no: <error>, retry, into: <log>]` is a gate on a node of the shortest path of the route that `ask` sends through (`via`). A sent chip checks the gates of each node it reaches in the written order, and stops at that node on the first gate whose condition does not hold. A stopped chip enters no queue. The `into` log, which has no `all`, gains one record with the chip, the node, the `no` error and whether it can be retried. The op is `>=`, `<=`, `>`, `<`, `==` or `!=`. When the value is a number, the field is compared as a number and a field that is not a number does not pass. A value that is not a number is compared as text with `==` and `!=`. Records of a gate with `retry` are marked retryable, and those of a gate without it are marked fix and resend

Declare chips with `item <name> [<field>: <value>]`. Inside a step, `line` writes a queue's contents or a block, and `ask <value>, ...`, `press <name>`, and `item <name> [<field>: <value>]` write the author's example (send, build, change).
The player stops at the first step and waits for the reader, and adds one step and plays it each time the reader sends, presses, or changes a value. Images, videos, and print draw the author's example steps.

```dragon
try How a transaction gets into a block

route Network: You - node-1 - Builder, You - node-2 - node-3 - Builder [from: You, to: Builder]
queue Mempool [order: Fee]
chain Chain [edit: Amount]
ask Sender, To, Amount, Fee [into: Mempool, via: Network]
choose To: Bob, Carol, Dave, Erin
press Build [from: Mempool, into: Chain, take: 2]

item tx1 [To: Carol, Amount: 3, Fee: 7]
item tx2 [To: Dave, Amount: 5, Fee: 5]
item tx3 [To: Erin, Amount: 2, Fee: 4]

step Transactions wait in line
  say Transactions in the mempool line up from the highest fee.
  line Chain: tx1
  line Mempool: tx2, tx3

step You send one
  say Your transaction crosses the network to the builder.
  ask You, Bob, 5, 12

step The builder makes a block
  say The two highest fees go into block 2, which holds block 1's hash as prev.
  press Build
```

### Pipe diagram

Start with `pipe <title>` to draw a pipe diagram, which follows one transaction step by step: the calls between contracts, the balances, and the stored values.
Declare the parties with `box`. Whether each party is a sender, a contract, a token contract, or an account comes from the lines, so it is not written.

- `hold <owner>: <amount> <token>, <amount> <token>` declares balances before the first step, and `hold <contract>: <name> <value>` declares a stored value. Name a token by its declared party, as in `box usdc as USDC`. `ETH` needs no declaration. Wrap names that read as amounts and names that contain `[` in `"`
- `<caller> -> <callee>: <text>` is a call. `[value: <amount> ETH]` sends ETH with it. `[call: delegate]` borrows the callee's code and writes to the caller's values, and `[call: static]` cannot write. `[fold]` folds the call's inner steps into one box that opens when pressed
- `return <party>: <value>` closes the innermost open call, and `revert <party>: <reason>` fails it and rolls back only the changes inside it
- `move <token>: <amount> <from> -> <to>` moves a balance through the token's pipe, and `write <party>: <name> <value>` rewrites a value plate
- `mint <token>: <amount> -> <to>` fills only the receiver's tank, and `burn <token>: <amount> <holder>` drains only the holder's tank, so no zero address party is drawn
- For NFTs and ERC-1155, write the token ID after `#` and the count before it. Examples are `move art: #1 alice -> bob`, `move items: 2 #1 alice -> bob`, `mint art: #3 -> alice`, and `hold alice: 5 #1 ITEMS`. Without a count it is one, and each ID gets its own tank. A `#` with no ID after it is refused
- `check <party>: <left> <op> <right>` is a check with `>=`, `<=`, `==`, `!=`, `>`, or `<`. Numbers are compared by dragon itself, and a check on other values fails only with `[fail]`
- `emit <party>: <name>(<arg>, ...)` is an event, and `calc <party>: <in> -> <out>` is a conversion
- `layout <shape>` before the first step chooses how to place the token boxes and tanks. `top` and `bottom` put the token boxes above or below the row of people. `ledger`, `mesh` and `bus` set the tanks in one row per token. `auto` tries `top` and `bottom` and the box orders (up to 4 token boxes), and picks the one with the fewest crossing lines. The places come only from the `box` and `hold` lines, so changing who calls or the arguments moves no box or tank. People and boxes outside the calls are drawn faint. A diagram without token boxes keeps no space above the people for boxes and card wallets. So in a diagram that shows a call card, the people and tanks sit lower by the card's height
- `route <person> -> <contract>`, one pair per line after the `layout` line, names a call path that `layout top` and `layout bottom` keep open (`route bob -> usdc`). Without route lines, the placement keeps open only the calls from people that appear in the steps. To keep the boxes and tanks in the same places across a set of diagrams, list every pair the set uses
- `gist <key point>` is the key point of the step, shown in a note after the step's arrows under the figure. A pipe diagram does not show the step body under the figure, so write here a point the body alone would carry. A step takes at most one, and other kinds of diagram cannot take it
- `box <token> as <name> [note: <text>]` sets the text under a token box's name. A token box without it shows `balanceOf`. Only a box whose name is a unit on a `hold` line takes it, and a `note` on a person or contract box stops with an error

Tank levels are drawn to scale for each token. Changes stay provisional (hatched) until the outermost call returns, and then they all turn final (green). Changes that a `revert` rolls back are marked in red.

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

### Chart

Start with `chart <title>` to draw a chart, which compares items step by step. Write the shape on the first line.
`chart <title> [shape: donut]` draws the share of each item as the angle of an arc. `chart <title> [shape: bar]` draws the amount of each item as the length of a horizontal bar.

- `item <id> as <name> [color: <color>]` declares an item before the first step. A donut lays the arcs clockwise from 12 o'clock in the order declared and shows the names and rounded percentages in its legend. A bar chart stacks the bars from the top with each name on the left. An item without `color` gets a color in the order declared, and a chart takes from 1 to 8 items
- `set <id>: <value>` inside a step is the value of the item, a number of 0 or more written without a unit. An item without `set` keeps its previous value, and an item with no value yet shows no arc or bar

Going to the next step moves the arcs and bars from the previous values to the new ones. The largest value over all steps gets the longest bar, and each value shows at the end of its bar.
The shape stays the same through the steps, and a chart takes no `box`, `group`, `strip`, or line.

`chart <title> [shape: funnel]` draws a funnel, where the count shrinks stage by stage. Declare the stages from the top with `item` and write each count with `set`.
A stage's bar appears in the step that sets it, left-aligned and as long as its value compared with the first stage. The gap to the stage above stays as a pale bar with the number who left, and the rate kept from the stage above shows beside the count.
The last step adds a row with the share of the first stage that made it to the last one. A value larger than the stage above, and a stage that never gets a value, are errors when the notation is read.

```dragon
chart People on the way to buying [shape: funnel]

item visit as Visited the shop [color: blue]
item view as Viewed a product [color: violet]
item buy as Bought [color: green]

step Visit
  say 10,000 people visited the shop site.
  set visit: 10000

step View a product
  say 4,200 people went on to a product page.
  set view: 4200

step Buy
  say 380 people bought.
  set buy: 380
```

`chart <title> [shape: dots]` counts with dots.
The box of the whole holds empty dots from before the first step. In the step that sets an item, that many dots move from the box to the item's cluster.
The diagram picks how many each dot stands for (1, 2 or 5 times a power of 10), so that the dots come to about 100. It shows that number at the top of the box beside the total.
Write the first line as `chart <title> [shape: dots, unit: <count>]` to choose it yourself. A step with more than 200 dots is an error when the notation is read.
Donuts, bars and dots take `set none: <count>` inside a step for the count in none of the items.
With dots those dots stay grey in the box, and a donut or a bar draws them as a grey arc or bar after the items. A funnel and a line chart refuse `set none`.

```dragon
chart Devices of 1,000 people [shape: dots]

item i as iPhone
item a as Android
item w as Windows
item m as Mac

step iPhone
  say 412 people use an iPhone most, which makes 41 dots.
  set i: 412

step Android
  say 287 people use Android, the second most after iPhone.
  set a: 287

step Windows
  say 158 people use a Windows computer.
  set w: 158

step Mac
  say 93 people use a Mac, which makes 9 dots.
  set m: 93

step None of them
  say The 50 people who use none of them stay grey in the box of the whole.
  set none: 50
```

`chart <title> [shape: line]` draws how amounts change over time as a line chart.
Each `item` is one line in its own color, with its name in the legend at the top. Each `step` is one point on the time axis, labeled with the step title.
`set <id>: <value>` gives the item's value at that step, and a step without `set` keeps the previous value.
The value axis runs from 0 up to the largest value rounded up to a step of 1, 2, 2.5 or 5 times a power of 10.
Going to the next step draws each line from the previous point to the new one and shows the step's value beside the point.
A line chart needs at least two steps, and an item that never gets a value and `set none` are errors when the notation is read.

```dragon
chart A bakery's sales over one week (yen) [shape: line]

item shop as Counter [color: amber]
item online as Online [color: blue]

step Mon
  say The week starts with 42,000 yen at the counter and 12,000 yen online.
  set shop: 42000
  set online: 12000

step Tue
  say On a rainy Tuesday the counter drops to 38,000 yen, and online grows to 15,000 yen.
  set shop: 38000
  set online: 15000

step Wed
  say The counter comes back to 45,000 yen.
  set shop: 45000
```

```dragon
chart Support requests by channel [shape: bar]

item mail as Email [color: blue]
item chat as Chat [color: green]
item phone as Phone [color: amber]

step April
  say Most requests come by email.
  set mail: 120
  set phone: 64

step May
  say Chat opens, and phone requests drop.
  set mail: 104
  set chat: 38
  set phone: 58
```

### Flow diagram

Start with `flow <title>` to draw a flow diagram, which follows a procedure from top to bottom and branches at choices.
The boxes and choices that the steps pass through stack in one column, in the order the lines first reach them. A path that a choice sends elsewhere leaves to the right of the choice.

- `box <id> as <name>` is a step of the procedure
- `choice <id> as <question>` is a choice, drawn as a diamond with the question inside. A long question wraps onto two lines after a particle or a space. Each line out of a choice carries the answer as its label, and a choice has at most two ways out
- Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark
- Lines written before the first `step` are paths not taken this time and stay dotted. A box that no line in a step reaches gets a dotted border and a muted name
- The line that moves in a step turns blue and a dot runs along it until it arrives. A passed line stays dark, and a choice the dot reached is filled with light amber. A line without `carry` or `tag` runs this dot instead of an envelope

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

### Cycle diagram

Start with `cycle <title>` to draw a cycle diagram, which follows a flow that goes around the same steps again and again.
The steps sit on a ring clockwise from the top in the order written, and arc arrows join each step to the next.

- `box <id> as <name>` is a step on the ring, written before the first `step`. A cycle diagram takes 2 to 8 steps
- `<id> -> <id> [tag: <text>]` inside a step is a line to the next step on the ring. In that step the chip runs along the arc to the next step, and the arc and its arrowhead stay lit in the color of the receiving step
- A line from the last step to the first one is also a line to the next step, and it starts the next round. A line that skips a step, goes backward, returns to the same step or carries a `: <label>` is refused, and so are `act` and `group` lines
- The step number sits beside the box of the step the chip reached. A step without a line puts its number beside the box the step before ended at
- `strip <title>: <field>, <field>` puts the strip title and the field values in the middle of the ring. `set <field>: <value>` in a step changes a value. The first field shows large and the others smaller, and field names are not shown. A value that changes after it was first written shows in the color of that step's box while the step lasts

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

`cycle <title> [shape: clock]` draws the steps on a clock dial instead of a ring.

- Each `box` takes the length of its step, such as `[time: 25min]`. A length is a number other than 0 and a unit (`ms`, `s`, `min`, `h` or `d`), and every step needs one. The steps sit clockwise from 12 o'clock as arcs as long as they take
- Numbers around the dial count from 0 at round steps, in the largest unit written. One hand points at the start of the arc of the step the diagram is at, and the chip of a line rides the tip of the hand
- The arcs entered in the current round stay lit in their step colors until the hand passes 12 o'clock again
- `[shape: clock, turn: left]` turns the dial counterclockwise. `turn` can be written only with `[shape: clock]`
- At a phone width the step numbers sit outside the dial in place of the names, and a list of numbers, names and lengths sits below the dial

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

`cycle <title> [shape: band]` unrolls the ring into a band and runs the steps left to right.

- The steps sit in the order written as chevrons of equal width. Each name sits below its chevron and the step numbers sit above
- `[time: <length>]` on every `box` puts a scale over the band that marks when each step starts. The marks count from 0 in the largest unit that writes every mark as a whole number or with one decimal. Write a length on every step or on none
- Each round gets its own band, stacked top to bottom. A round that has not started yet stays faint, and the head of each band shows the strip title and the field values of that round
- The chip of a line runs along the middle of the band from chevron to chevron, and the chevron it reaches stays lit. The line from the last step to the first one follows a return arrow from the right end down to the left end of the next band
- `turn` cannot be written with `[shape: band]`
- At a phone width the chevrons shrink with the step numbers inside, and a list of numbers, names and lengths sits below the bands

```dragon
cycle A year on the field [shape: band]

box sow as Sow [time: 60d, color: green]
box grow as Grow [time: 120d, color: blue]
box harvest as Harvest [time: 60d, color: amber]
box rest as Rest the soil [time: 120d, color: slate]

strip Field: year, season

step Sow
  say In spring the soil is tilled and seeds go into the field.
  set year: Year 1
  set season: Spring

step Grow
  say Once the shoots are up, they get water and grow all summer.
  sow -> grow [tag: shoots]
  set season: Summer

step Harvest
  say In autumn the ripe crop is harvested.
  grow -> harvest [tag: crop]
  set season: Autumn

step Rest the soil
  say After the harvest, compost goes on the field and the soil rests through winter.
  harvest -> rest [tag: compost]
  set season: Winter

step Into year 2
  say When spring comes, seeds go into the rested soil again.
  rest -> sow [tag: seeds]
  set year: Year 2
  set season: Spring

step Grow in year 2
  say In year 2 the shoots again grow through the summer.
  sow -> grow [tag: shoots]
  set season: Summer
```

### Mind map

Start with `mind <title>` to draw a mind map, which spreads ideas out from one topic in the middle, branch by branch.
Branches go round clockwise from the upper left in the order written (up left, up right, down right and down left for four). The leaves of a branch sit in a column outside it.

- `idea <id> as <name>` inside a step is the topic in the middle. A mind map has exactly one idea without `of`, and a second one or none at all is refused
- `idea <id> as <name> of <parent>` inside a step is an idea joined to its parent. An idea of the topic is a branch, and an idea of a branch is a leaf. Ideas go three levels deep, and a fourth level or a parent that has not been written yet is refused
- `as <name>` can be left out, and the id is then shown as the name. Wrap a name that contains the word `of` in `"`
- `[color: <color>]` gives an idea its own color. A branch without a color gets the next color no other branch has taken, and leaves take their branch's color
- Ideas and lines start faint and turn solid at the step that writes them. The line from the parent is drawn from the parent's side, and the step number sits beside the first idea of that step
- `box`, `strip`, lines between boxes and `act` lines are refused in a mind map

```dragon
mind Getting a study meetup ready

step Put the topic
  say Put what to get ready in the middle.
  idea meetup as Study meetup

step Talk branch
  say Put the talk on a branch and list its parts as leaves.
  idea talk as The talk of meetup [color: blue]
  idea intro as First five minutes of talk
  idea demo as Live demo of talk

step Venue branch
  say Do the same for the venue.
  idea room as Venue of meetup
  idea seats as Number of seats of room
  idea screen as Screen to project on of room
```

### Table relation diagram

Start with `er <title>` to draw a table relation diagram, which follows step by step which row of which table one value goes through.
The tables sit left to right in one row in the order written, and a line joins each field that holds a link to the field it points at.

- `table <id> as <name>` is a table, written before the first `step`. The `field <name>: <value>` lines up to the next `table` line are its fields. A table relation diagram takes 1 to 6 tables, and `[color: <color>]` sets a table color
- `[key]` on a field is the key mark (PK), and `field <name>: <value> [ref: <table>.<field>]` links it to a field of another table (FK). The linking field is the many side and gets a three-pronged end, and the field it points at is the one side and gets a bar end. A link to a missing table or field is refused
- `pick <table>.<field>` inside a step lights that row and the table frame, and the frame keeps a thin color in later steps
- `<table>.<field> -> <table>.<field> [tag: <value>]` runs a value chip along the line between linked fields, and the chip stops halfway. A line between fields that are not linked, or one with a `: <label>`, is refused
- `set <table>.<field>: <value>` rewrites the value of a field from that step on. `note <table>.<field>: <text>` shows a formula card under the table from that step on, and cards on the same table stack downward
- The step number sits at the right of the header of the table that step picks a row from

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

### Two-axis matrix

Start with `matrix <title>` to draw a two-axis matrix, which sorts items into four areas by two measures, step by step.
The horizontal axis runs below the areas from left to right, and the vertical axis left of them from bottom to top. The items wait in a list left of the areas until a step places them.

- `axis <name> [from: <low end>, to: <high end>]` is an axis, written before the first `step`. Write the horizontal axis first and then the vertical one; the name and both ends show outside the arrow. A matrix without exactly two axes is refused
- `box <id> as <name>` is an area. Write exactly four; they go top left, top right, bottom left and bottom right in the order written, with the name at the top left. A matrix without exactly four areas is refused
- `item <id> as <name>` is an item to sort, written before the first `step`. Items wait in the "Not placed yet" list in the order written
- `line <area>: <item>, <item>` inside a step places items into an area. The cards slide from the list into the area and the area lights up in that step. A placed card stays until a later step places it in another area. An unknown area or item, or the same item twice on one line, is refused
- `as <name>` can be left out, and the id is then shown as the name. Lines between boxes and `strip` lines are refused in a two-axis matrix
- `item <id> as <name> [x: <across>, y: <up>]` gives an item scores from 0 to 10, with at most one decimal place. `line: <item>` inside a step then places it without naming an area, into the area its scores fall in. A score of 5 or more counts as the large side. A `line <area>: <item>` for a scored item is read only when the area matches its scores. Scores outside 0 to 10, or only one of the two, are refused
- Add `reverse: yes` to an axis line, as in `axis <name> [from: <low end>, to: <high end>, reverse: yes]`. That axis then puts large values on the left or at the bottom, with its arrow pointing that way
- Start with `matrix <title> [shape: scatter]` to plot each item as a dot at its scores instead of moving a card. The ruled axes show 0 to 10, and a table of the items and their scores sits left of the plot. The step that plots an item draws lines from both axes to the dot with its scores. That step also lights the area it lands in. Items with the same scores share one dot. `[shape: scatter, table: none]` leaves the table out, and a narrow frame stacks the table above the plot
- When a score chip on an axis would touch the name of a point shown at that step, the chip moves off the axis for that step. It moves to the left of the vertical axis or below the horizontal one, with its edge on the axis line. The names of the points stay where they are, and the chips keep their size

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

```dragon
matrix Plot the work by score [shape: scatter]

axis Effort [from: low, to: high]
axis Impact [from: low, to: high]

box now as Do now
box plan as Plan it
box spare as When free
box drop as Skip

item login as Faster login [x: 2, y: 8]
item pay as Add payments [x: 8, y: 7.5]
item word as Fix wording [x: 3, y: 3]

step Line up
  say Line up the work and its scores in the table on the left.

step Login
  say Plot the work with low effort and high impact.
  line: login

step Payments
  say Plot the work with high impact and high effort.
  line: pay

step Wording
  say Plot the work with low effort and low impact.
  line: word
```

### Set overlap diagram

Start with `venn <title>` to draw a set overlap diagram, which overlaps two or three sets as circles and counts how many fall in each region step by step.
Two sets sit left and right, and three sets sit top left, top right and below.

- `item <id> as <name>` is a set, written before the first `step`. A set overlap diagram takes 2 or 3 sets, and `[color: <color>]` sets a circle color
- `set <id>: <count>` inside a step writes the total of a set. Its circle appears in the step that first writes it, and the name and the total sit outside the circle
- `set <id> & <id>: <count>` writes the count in an overlap, and lights its region with a count chip in that step. An overlap larger than one of its sets is refused
- Each region shows the count that is only in it, worked out from the totals and the overlaps. A region shows nothing until every count it needs is written
- `set none: <count>` writes the count in none of the sets, and shows it in a frame around the circles from that step on. In other diagram kinds `none` still reads as an ordinary box id
- Add `[shape: dots]` to the first line to count with dots instead of circles. The dots move into a cluster for each set and each overlap. A dot in two or more sets is painted in slices of their colors. `[shape: dots, unit: <count>]` chooses how many each dot stands for.
- The step number sits beside the name of the circle that appears in that step, or under the count of the region that step lights

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

### Sankey diagram

Start with `sankey <title>` to draw a Sankey diagram, which follows step by step where one amount goes and how much, with bands as wide as the amounts.
Boxes no line goes into sit in the left column, and each target sits in a column to the right of its source.

- `box <id> as <name>` declares a source or a target before the first `step`. `[color: <color>]` sets the color of its bar and of the bands going into it, and a box takes no `note`, `icon` or `link`
- `<source> -> <target>: <amount>` inside a step grows a band from the source bar to the target bar in that step, and an amount chip crosses it. The number at the start of the label is the amount: `40%` reads as 40 and `1,200 yen` as 1200
- A band takes the share of the source bar that its amount makes up, and the bands stack down the source bar in the order written. A target's bar fills in as each band reaches it
- A box with no source holds the sum of what leaves it, and a target holds the sum of what comes in. Write every amount in one diagram in the same unit
- A label that does not start with a number is refused. So are a line whose flow leads back to a box it came from, and a box sending out more than comes in
- A line takes no `tag`, `carry` or `side`, because the amount chip shows the line label. `group`, `strip`, `act`, `note` and `set` lines are refused
- The step number sits to the right of the first target that step reaches

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

Write `sankey <title> [shape: rows]` to stack one full-width bar per step from the top instead of drawing bands.

- Boxes, steps and lines are written as in the band look, and there is one row per step. Each row is split into the sections that the lines so far have cut. A section is as wide as its share of the total of the boxes with no source
- Each line cuts its target section out of the source section, from the left and in the order written. What a box with no source has not handed out yet is a gray bar that reads like `16h left`
- Sections that split off in that step and the sections of the last row show their name and amount. Sections carried over from the step before are faint bars with no text
- The band coming down from the row above and the amount chip are drawn only for the sections that split off in that step
- When two amount chips of one step would overlap, as in a narrow frame such as a phone, the later chip stops one chip higher. The gap above that row grows by one chip. Chips keep their size and stay above their own section
- When a name does not fit in its section, the section shows only the amount and the name is listed under that row's bar with a color mark. At phone width the bars still span the full width

```dragon
sankey How a day is spent [shape: rows]

box day as One day [color: slate]
box sleep as Sleep [color: blue]
box awake as Awake [color: amber]
box work as Work [color: violet]
box free as Free time [color: rose]

step One day
  say A day has 24 hours.

step Sleep
  say Sleep 8 hours.
  day -> sleep: 8h

step Awake
  say The other 16 hours are awake time.
  day -> awake: 16h

step Split
  say Split the awake time into work and free time.
  awake -> work: 10h
  awake -> free: 6h
```

Write `sankey <title> [shape: treemap]` to make the whole amount one square and split it into areas by amount, step by step.

- Boxes, steps and lines are written as in the band look. The boxes with no source make up the whole square, and each step draws a cut that carves out its target sections. A section's area is its share of the total of the boxes with no source
- The part not split yet is cut across its longer side by the share of the amount. Lines written in the same step from the same source carve out one strip as large as their total. The strip is divided in the order the lines are written
- What a box with no source has not handed out yet is a gray section that reads like `48GB left`
- When a target section is split again, its frame and name chip stay, and the inside below the chip is divided into the child sections
- Sections show their name and amount, and no amount chip is drawn. When a name does not fit in its section, the section shows only the amount and the name is listed under the square with a color mark

```dragon
sankey Phone storage [shape: treemap]

box all as Storage [color: slate]
box photo as Photos [color: blue]
box app as Apps [color: green]
box game as Games [color: rose]
box work as Work [color: blue]

step Storage
  say The phone has 128GB of storage.

step Photos and apps
  say Photos use 48GB and apps use 32GB.
  all -> photo: 48GB
  all -> app: 32GB

step Inside the apps
  say Split the 32GB of apps into games and work.
  app -> game: 20GB
  app -> work: 12GB
```

### Owner card diagram

Start with `cards <title>` to draw an owner card diagram. It stacks cards in a column per owner and follows cards being made, deleted, moved and refused, step by step.
Columns sit from left to right in the order of their `box` lines, and each column stacks its cards from the top in the order made.

- `box <id> as <name>` declares an owner column before the first `step`. `[note: <caption>]` is the caption next to the name, and `[mark: <word>]` is the mark word shown in that column. A box takes no `color`, `icon` or `link`
- `item <id> as <name> in <column>, <column> [amount: <amount>]` declares a card, and every column in `in` gets its own copy. Write an amount as a number and a unit, like `1000 USDC`, and wrap an amount with `,` in `"`
- A `[total: none]` card shows its amount but stays out of the column total. A diagram with no card that adds to a total draws no total band. `[mark: <column>]` picks a column to show the mark in, and that column needs a `mark` word. Only card lines can repeat `mark`
- Cards written before the first `step` are there from the start. An `item` line in a step makes a card in that step, with a green edge and a New tag
- `item <id> in <column>` on an existing card in a step moves it to those columns. A move line takes no name and no attributes
- `delete <card>` strikes a card through and keeps it, and the card leaves the column total. A deleted card stays struck through in later steps
- `refuse <card or column>: <reason>` shows a refused panel with the reason and changes nothing. The panel goes under the cards of the calling column, the card's first column, or the refused column
- A `<column> -> <card>: <name>` line is a call from the column head to the card. A line takes no `tag`, `carry` or `side`. `group`, `strip`, `act`, `note` and `set` lines are refused
- The band under the columns shows each column's total, unit by unit. A total that changed in a step keeps its old amount struck through

```dragon
cards Send 100 USDC with notes

box alice as Alice [note: Sender]
box bob as Bob [note: Receiver]
box usdc as USDC ledger [mark: Signed]

item n1 as Note #1 in alice, usdc [amount: 1000 USDC, mark: usdc]
item n2 as Note #2 in bob, usdc [amount: 200 USDC, mark: usdc]

step Alice sends 100 to Bob
  say Note #1 is spent and replaced by two new notes.
  alice -> n1: Send 100
  delete n1
  item n3 as Note #3 in alice, usdc [amount: 900 USDC, mark: usdc]
  item n4 as Note #4 in bob, usdc [amount: 100 USDC, mark: usdc]

step Bob tries to send 500
  say His note is too small, so nothing changes.
  bob -> n2: Send 500
  refuse n2: Not enough balance
```

### Checkout diagram

Start with `checkout <title>` to draw a checkout diagram, a purchase model the reader can change. Its blocks for parties, order flow, product, delivery, budget, approval, payment, order, and scenarios are described in [`src/checkout/README.md`](https://github.com/cardene777/dragon/blob/main/packages/dragon/src/checkout/README.md). The examples are the `examples/purchase-*.en.dragon` files.

### Judge table

Start with `judge <title>` to draw a judge table.
Cases go in rows and rules go in columns.
Each step checks one rule column with ✓ and ✕, and the last step shows the verdict of each row.
The table is an HTML table, so its text never shrinks.
A table wider than its frame scrolls sideways and keeps the case column on the left.

- `rule <id> as <name> [value: <value>, note: <description>]` is a column rule. Write the rules before the first `case`. The heading shows the rule number, name, and value. The note is not drawn in the heading but listed below the table with the rule number and name
- `case <name> [note: <note>]` is a row case, listed from the top in the order written. The note appears under the case name
- `fail <rule>: <failed value>` under a case names a rule that the case fails. Only those cells get ✕ and the failed value, and the other cells get ✓
- dragon does not compare values. It shows only the failures you write
- A case with a failed rule gets the verdict `block`, and a case with none gets `pass`. The ✕ cells show which rules stopped it
- `[stop]` on a `fail` line leaves the later columns of that case unchecked, shown as "—"
- `[note: pop]` on the first line moves the notes of rules and cases into cards. A round i mark sits right after the name of each rule heading and case that has `note`. Clicking that cell opens a card with the whole note just below it. A rule or case line with `note` also takes `[example: <example>]`, shown as a gray band at the bottom of the card. The card closes when you click outside it or its close icon, move to another step, or scroll the table sideways, and printing lists every card below the table
- `[pass: <word>, block: <word>]` on the first line replaces the verdict words. Without it, English pages show `pass` and `block`, and Japanese pages show their own words
- Playing checks one rule column per step, and the last step shows the verdicts. Printing fills every cell and verdict
- Exported pictures (PNG, GIF, mp4, SVG) put each case name and note on a band above its ✓ and ✕ row and fit in 728px. A wider table splits its rule columns into stacked tables, with the verdict column in the last one
- The reader refuses a `fail` for an undeclared rule, a rule failed twice in one case, a `fail` before the first `case`, and a table without rules or cases. Each error names its line

```dragon
judge Which transfers to block

rule chain as Chain [value: USDC on 31337]
rule to as Recipient [value: 0x2222…]
rule once as Per transfer [value: up to 30]

case 20 USDC to 0x2222… [note: first of the day]
case 35 USDC to 0x9999… [note: wrong recipient and amount]
  fail to: 0x9999
  fail once: 35
case Unreadable Tx [note: unknown action]
  fail chain: ? [stop]
```
