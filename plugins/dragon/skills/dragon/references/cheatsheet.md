# Cheatsheet

The smallest form of every kind and every part, on one page.
Read this page first, and plan the figures with it ([plan](plan.md)).
Open a kind's own file under `kinds/` only when a figure needs more than this page shows.
Shared syntax: [notation](notation.md). Workflow: [SKILL.md](../SKILL.md).

## Kinds

The first word of a diagram is its kind.

| Kind | Use it when the explanation is about | Details |
|---|---|---|
| `architecture` | The parts of a system, where they live (groups), and what flows between them | [architecture](kinds/architecture.md) |
| `sequence` | Messages between parties in time order: requests, API calls, sign-in, protocols | [sequence](kinds/sequence.md) |
| `state` | One thing moving between states: an order, a ticket, a connection | [state](kinds/state.md) |
| `flow` | A procedure that branches at yes/no choices: a login check, a review, a deploy gate | [flow](kinds/flow.md) |
| `judge` | Cases checked rule by rule with ✓ and ✕, each getting a pass or block verdict | [judge](kinds/judge.md) |
| `time` | When events happen on evenly spaced time: slots, epochs, waiting periods | [time](kinds/time.md) |
| `cycle` | Steps that go around again and again: a sprint, a review loop | [cycle](kinds/cycle.md) |
| `lineup` | Items that line up and move between lanes: queues, bids, stages | [lineup](kinds/lineup.md) |
| `cards` | Who holds which card and how much, as cards are made, deleted, moved and refused | [cards](kinds/cards.md) |
| `pipe` | One transaction through contracts: calls, balances, stored values, reverts | [pipe](kinds/pipe.md) |
| `git` | Commits, branches, merges, rebases, cherry-picks, moving refs | [git](kinds/git.md) |
| `tree` | Values that fold up into one root: Merkle trees and proofs | [tree](kinds/tree.md) |
| `er` | Rows of tables that point at each other by keys, and one value followed through them | [er](kinds/er.md) |
| `mind` | Ideas spread out from one topic, branch by branch | [mind](kinds/mind.md) |
| `chart` | The sizes of a few items, step by step: shares as a donut, amounts as bars | [chart](kinds/chart.md) |
| `sankey` | Where one amount goes and how much goes to each place | [sankey](kinds/sankey.md) |
| `matrix` | Items sorted into four areas by two measures | [matrix](kinds/matrix.md) |
| `venn` | How two or three groups overlap and how many fall in each region | [venn](kinds/venn.md) |
| `try` | A model the reader drives by typing values and pressing buttons | [try](kinds/try.md) |
| `checkout` | Purchase terms the reader changes, approves and pays for | [checkout](kinds/checkout.md) |

### architecture

```dragon
architecture Upload a photo

box app as Photo app
group cloud as Cloud [color: blue]
  box api as Upload API [note: checks the file]
  box store as Storage
end

step Upload
  say The app sends the photo, and the API checks it and stores it.
  app -> api: upload
  api -> store: save
```

### sequence

```dragon
sequence Sign in

box browser as Browser
box app as App server

step Ask
  say The browser sends the ID and the password, and the server answers.
  browser -> app: POST /login
  app -> browser: 200 OK
```

### state

```dragon
state A support ticket

box open as Open
box done as Done [color: green]

step Open it
  say A report opens the ticket.
  start -> open: Report

step Close it
  say The fix closes the ticket.
  open -> done: Fix
  done -> finish
```

### flow

`choice` is a yes/no diamond. A line written before the first `step` is a dotted path not taken.

```dragon
flow Check a password

box input as Input
choice pw as Password correct?
box done as Signed in [color: green]
box err as Show an error [color: rose]

pw -> err: No

step Enter
  say The user enters a password.
  start -> input
  input -> pw: Send

step Sign in
  say The password is correct, so the user is signed in.
  pw -> done: Yes
  done -> finish
```

### judge

`fail` names the rules a case breaks. Every other cell gets ✓. `[stop]` leaves the later columns unchecked.

```dragon
judge Which sign-ups to refuse

rule mail as Email [value: has @]
rule pw as Password [value: 8 or more]

case Ann [note: all filled in]
case Ben [note: short password]
  fail pw: 5
case Cal [note: no email]
  fail mail: empty [stop]
```

### time

```dragon
time Retry with back-off

scale min 1min 8
row attempt as Attempts [color: blue]
point first at 0
point last at 3

step Fail
  say The first try fails at minute 0.
  now -> 0
  note first: Failed [color: rose]

step Retry
  say The retry waits three minutes and goes through.
  now -> 3
  span 0-3: wait [color: amber]
  note last: Delivered [color: green]
```

### cycle

```dragon
cycle The weekly review

box plan as Decide
box work as Do
box look as Look back

step Do
  say Work on what was decided.
  plan -> work

step Look back
  say Look back, and take what is left to the next plan.
  work -> look
  look -> plan
```

### lineup

```dragon
lineup A queue

box wait as Waiting
box done as Done [color: green]

item a, b

step Line up
  say Two jobs wait.
  line wait: a, b

step Serve
  say The first job is done.
  line wait: b
  line done: a
```

### cards

```dragon
cards Hand over a ticket

box ann as Ann
box ben as Ben

item t1 as Ticket #1 in ann [amount: 1 seat]

step Hand it over
  say Ann gives her ticket to Ben.
  ann -> t1: Give
  item t1 in ben
```

### pipe

```dragon
pipe Pay a shop

box alice as Alice
box shop as Shop
box usdc as USDC

hold alice: 100 USDC
hold shop: 0 USDC

step Pay
  say Alice asks USDC to send 30 to the shop.
  alice -> usdc: transfer shop 30
  move usdc: 30 alice -> shop
  return usdc: true
```

### git

```dragon
git Merge a feature

branch main
branch feature

step Work on a branch
  say feature is cut from A and gets commit B.
  commit A on main
  feature from A
  commit B on feature

step Merge
  say main takes feature with a merge commit.
  commit M on main merge feature
```

### tree

```dragon
tree Hash two files

step Hash
  say Each file is hashed into a leaf.
  leaf a [hash: 3fa0]
  leaf b [hash: 8b04]

step Join
  say The two leaves join into the root.
  node root of a, b [hash: 7a21]
```

### er

```dragon
er The customer of an order

table users as Customers
  field id: U-7 [key]
  field name: Tanaka

table orders as Orders
  field id: O-41 [key]
  field user_id: U-7 [ref: users.id]

step Follow the key
  say The order points at its customer by user_id.
  pick orders.id
  orders.user_id -> users.id [tag: U-7]
```

### mind

```dragon
mind Features of a budget app

step The topic
  say The app is the topic in the middle.
  idea app as Budget app

step Input
  say Ways to log money grow out of it.
  idea input as Input of app
  idea scan as Scan receipts of input
```

### chart

The head line needs a shape: `donut`, `bar`, `funnel`, `dots` or `line`.

```dragon
chart Share by OS [shape: bar]

item ios as iOS
item android as Android

step 2024
  say Android has the larger share.
  set ios: 40
  set android: 58
```

### sankey

```dragon
sankey Where the pocket money goes

box pay as Pocket money
box food as Food
box save as Savings

step Split it
  say Most goes to food, and the rest is saved.
  pay -> food: 70
  pay -> save: 30
```

### matrix

The four boxes fill the areas in the order written.

```dragon
matrix Sort tasks

axis Urgency [from: low, to: high]
axis Importance [from: low, to: high]

box plan as Schedule it
box now as Do it now
box drop as Drop it
box ask as Hand it off

item report as Report due tomorrow
item feed as Social feed

step Sort
  say The report is urgent and important. The feed is neither.
  line now: report
  line drop: feed
```

### venn

```dragon
venn Morning and night runners

item morning as Run in the morning
item night as Run at night

step Count
  say 30 run in the morning, 20 at night, and 5 at both times.
  set morning: 30
  set night: 20
  set morning & night: 5
```

### try

```dragon
try Add to a queue

queue Pending [order: Fee]
ask Payer, Fee [into: Pending]

item p1 [Fee: 4]

step Wait
  say One payment waits.
  line Pending: p1

step You add one
  say Your payment joins the line by its fee.
  ask you, 9
```

### checkout

```dragon
checkout acp as "Approve a purchase" [version: 1, note: "Change the delivery, then approve the latest quote."]
party buyer as "You" [role: buyer, note: "Purchase decision", icon: user]
party agent as "Agent" [role: agent, note: "Connect information", icon: agent]
party seller as "Merchant" [role: seller, note: "Terms and orders", icon: shop]
party processor as "Payment provider" [role: payment, note: "Process payment", icon: card]
flow orders as "Order flow" [buyer: buyer, agent: agent, seller: seller, payment: processor, wire: horizontal, carry: message]
product shoes as "Running shoes" [price: 18000, min: 1, max: 3, initial: 1, unit: items, merchant: "Example shop", art: shoe]
delivery shipping as "Delivery" [initial: standard]
option standard as "Standard" [for: shipping, fee: 1000, note: "Lower delivery fee", icon: truck]
option pickup as "Pickup" [for: shipping, fee: 0, note: "No delivery", icon: bag]
budget spending as "Budget" [min: 15000, max: 60000, step: 500, initial: 20000]
total quote as "Merchant total" [product: shoes, delivery: shipping, rule: price * quantity + fee]
approval consent as "Approve latest terms" [total: quote, invalidates: "quantity, delivery"]
payment delegated as "Payment for this purchase" [approval: consent, limit: approved-total]
order result as "Order" [payment: delegated, policy: once]
scenario normal as "Normal purchase" [outcome: normal]
scenario declined as "Payment declined" [outcome: decline]
scenario missing as "Lost response" [outcome: lost]
```

## Parts

Parts go inside a diagram of a kind above.

| Part | What it adds | Kinds that take it |
|---|---|---|
| Note card `[note: pop]` | Long box notes move to a card that opens on a click, so the boxes stay small | `sequence`, `architecture`, `state`, `git`, `time`, `tree`, `flow`, and `lineup` where only gauges get cards |
| Scene `scene ... end` | Up to three cases that share the first steps and then split, shown together or one at a time | `flow`, `lineup` |
| Judge table | Cases checked rule by rule, each getting a verdict | The `judge` kind above |
| Gauge `gauge` and `set` | An amount against a limit, as a bar that moves step by step | `flow`, `lineup` |
| Your own block | A box, line or icon that no kind has | Any kind ([blocks](blocks.md)) |

### Note cards

`[note: pop]` on the first line. `example:` on a box adds a gray band at the bottom of its card.

```dragon
architecture Take an order [note: pop]

box shop as Shop [note: Takes the order and checks the stock before it asks the warehouse, example: Three orders go out together]
box store as Warehouse [note: Keeps the goods and ships them]

step Ask
  say The shop asks the warehouse to ship.
  shop -> store: ship
```

### Scenes

Write the shared steps once, then each case's own steps between `scene <name>` and `end`.
`stop <reason>` ends a scene. `[scenes: stack]` shows the scenes together, and `[scenes: pick]` follows the one picked.

```dragon
flow Two outcomes of a transfer [scenes: stack]

box ask as Ask to transfer
box look as Check the payee
box send as Send
box back as Send back

step Ask
  say A user asks to transfer money. Both scenes share this step.
  start -> ask
  ask -> look: payee

scene Payee is right
  step Send
    say The payee is registered, so the money is sent.
    look -> send: right
end

scene Payee is wrong
  step Send back
    say The payee is not registered, so the transfer is sent back.
    look -> back: wrong
    stop The payee is not registered
end
```

### Gauges

`gauge` before the first `step`, under its `on` box. `set <gauge>: <total>` in a step moves the bar.
`set <gauge>: <confirmed> [hold: <held>]` paints the held amount in a pale shade after the confirmed one and lists both under the bar. A `set` without `hold` clears it.
With `[note: pop]` on the first line of a flow or a lineup diagram, clicking a gauge opens a card that lists each step's change and value, up to the step on screen.
A total over `limit` grows in red and shows the `over` text.

```dragon
flow Stop at the daily budget

box agent as Agent
box check as Budget check
box pay as Payment

gauge budget as Daily budget [on: check, limit: 100, unit: USD, over: Stopped]

step Pay 60
  say The first payment uses 60 of the 100 budget.
  agent -> check: 60 USD
  check -> pay: Pay
  set budget: 60

step Stop at 120
  say The next payment would make 120, so it stops.
  agent -> check: 60 USD
  set budget: 120
```
