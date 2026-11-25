---
layout: guide
note: pop
---

# Borrowing books from the library

How a member borrows a book, which loans the desk refuses, and what a late return changes.

## Borrow

### How does borrowing a book work?

> The desk looks the member up, checks the catalog, and hands over the book from the shelves.

The parts and what goes between them. Click a box with an i mark to read what it does.

```dragon
architecture The parts of a loan [note: pop]

box member as Member [note: Holds a library card and asks for a book]
group library as Library [color: blue]
  box desk as Desk [note: Checks the card and records the loan, example: Ann borrows two novels]
  box catalog as Catalog [note: Knows which books are in and who has the others]
  box shelves as Shelves [note: Hold the books that are in]
end

step Ask at the desk
  say The member shows the card and names the book.
  member -> desk: card and title

step Look it up
  say The desk asks the catalog whether the book is in.
  desk -> catalog: is it in?
  catalog -> desk: in, shelf B3

step Hand it over
  say The desk takes the book from the shelves and records the loan.
  shelves -> desk: the book
  desk -> member: the book, due in 14 days
```

One loan, message by message, from asking to taking the book home.

```dragon
sequence One loan

box member as Member
box desk as Desk
box catalog as Catalog

step Ask
  say The member asks for a book and shows the card.
  member -> desk: borrow "Dune"

step Check
  say The desk checks that the card is valid and the book is in.
  desk -> catalog: check card and book
  catalog -> desk: both fine

step Record and hand over
  say The desk records the loan with a due date and hands over the book.
  desk -> catalog: record the loan
  desk -> member: the book, due in 14 days
```

<details>
<summary>Who knows that a book is out?</summary>

The catalog. The desk records every loan there.

</details>

### Which loans does the desk refuse?

> A loan goes through only when the card is valid, the member has fewer than five books, and nothing is overdue.

Four requests checked rule by rule. A request that breaks a rule is blocked.

```dragon
judge Which loans to refuse

rule card as Card [value: valid]
rule count as Books out [value: under 5]
rule late as Overdue [value: none]

case Ann [note: two books out]
case Ben [note: card expired]
  fail card: expired [stop]
case Cal [note: five books out]
  fail count: 5
case Dee [note: one book late]
  fail late: 1 book
```

The same checks as one procedure that a request walks through.

```dragon
flow The checks at the desk

box ask as Ask for a book
choice card as Card valid?
choice count as Under 5 books?
choice late as Nothing overdue?
box lend as Lend the book [color: green]
box refuse as Refuse [color: rose]

card -> refuse: No
count -> refuse: No
late -> refuse: No

step Ask
  say A member asks for a book.
  start -> ask
  ask -> card: card

step Check the count
  say The card is valid, so the desk counts the books out.
  card -> count: Yes

step Check overdue books
  say Fewer than five are out, so the desk looks for overdue books.
  count -> late: Yes

step Lend
  say Nothing is overdue, so the book is lent. The refused paths stay dotted.
  late -> lend: Yes
  lend -> finish
```

## Return

### What changes when a book comes back late?

> A late book is still taken back, but it adds a fee for each day until the fee reaches its cap.

An on-time return and a late return share the first steps and then split.

```dragon
flow On time or late [scenes: stack]

box back as Bring the book back
choice date as Back by the due date?
box shelf as Back on the shelf
box fee as Add a late fee [color: amber]

step Bring it back
  say The member brings the book to the desk. Both scenes share this step.
  start -> back
  back -> date: book

scene On time
  step Shelve it
    say The book is back by the due date, so it goes straight back on the shelf.
    date -> shelf: Yes
end

scene Late
  step Charge a fee
    say The book is three days late, so the desk adds a fee before shelving it.
    date -> fee: No
    stop A fee is added
end
```

The fee grows each day and stops at the cap.

```dragon
flow The late fee by day

box d1 as 1 day late
box d3 as 3 days late
box d5 as 5 days late
box d10 as 10 days late [color: amber]

gauge fee as Late fee [limit: 5, unit: USD]

step One day
  say The first late day adds 1 USD.
  start -> d1
  set fee: 1

step Three days
  say Each further day adds 1 USD, so three late days make 3 USD.
  d1 -> d3: 2 more days
  set fee: 3

step Five days
  say Five late days make 5 USD, which is the cap.
  d3 -> d5: 2 more days
  set fee: 5

step Ten days
  say The fee stays at 5 USD however late the book is.
  d5 -> d10: 5 more days
```

<details>
<summary>How much is the fee for a book ten days late?</summary>

5 USD. The fee stops at the cap.

</details>
